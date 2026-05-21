from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import (
    Devis, LigneDevis, Facture, LigneFacture, Paiement, Charge,
    StickerAchat, StickerMouvement,
)
from .serializers import (
    DevisSerializer, LigneDevisSerializer,
    FactureSerializer, LigneFactureSerializer,
    PaiementSerializer, ChargeSerializer,
    StickerAchatSerializer, StickerMouvementSerializer,
)
from .exports import facture_excel, charges_excel
from .utils.pdf_generator import generer_facture_pdf
from .services.fne_service import FNEService, FNEError

_TVA_MAP = {
    Decimal("18"): "TVA",
    Decimal("9"):  "TVAB",
    Decimal("0"):  "TVAC",
    Decimal("27"): "TVAD",
}


# ── Devis ─────────────────────────────────────────────────────────────────────

class DevisViewSet(viewsets.ModelViewSet):
    queryset         = Devis.objects.select_related("client", "projet")
    serializer_class = DevisSerializer
    filterset_fields = ["statut", "client", "projet"]
    search_fields    = ["numero", "client__nom"]

    @action(detail=True, methods=["post"], url_path="convertir-facture")
    def convertir_facture(self, request, pk=None):
        """Convertit un devis accepté en facture brouillon (transaction atomique)."""
        devis = self.get_object()

        if devis.statut != "accepte":
            return Response(
                {"detail": "Seuls les devis acceptés peuvent être convertis en facture."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        facture_existante = Facture.objects.filter(devis=devis).first()
        if facture_existante is not None:
            return Response(
                {"detail": f"Ce devis a déjà été converti. Voir facture {facture_existante.numero_local}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.core.models import EntrepriseConfig
        config = EntrepriseConfig.get()

        with transaction.atomic():
            facture = Facture.objects.create(
                client         = devis.client,
                devis          = devis,
                projet         = devis.projet,
                statut         = "brouillon",
                date_echeance  = timezone.now().date() + timedelta(days=30),
                mode_reglement = "transfer",
                template_fne   = config.template_fne_defaut,
                notes          = f"Générée depuis devis {devis.numero}",
            )

            for ligne in devis.lignes.all():
                LigneFacture.objects.create(
                    facture       = facture,
                    designation   = ligne.designation,
                    quantite      = ligne.quantite,
                    prix_unitaire = ligne.prix_unitaire,
                    remise_pct    = ligne.remise_pct,
                    taux_tva      = _TVA_MAP.get(ligne.taux_tva, "TVA"),
                )

        return Response(
            {
                "facture_id":   facture.id,
                "numero_local": facture.numero_local,
                "redirect_url": f"/comptabilite/factures/{facture.id}",
            },
            status=status.HTTP_201_CREATED,
        )


class LigneDevisViewSet(viewsets.ModelViewSet):
    queryset         = LigneDevis.objects.select_related("devis")
    serializer_class = LigneDevisSerializer
    filterset_fields = ["devis"]


# ── Facture ───────────────────────────────────────────────────────────────────

class FactureViewSet(viewsets.ModelViewSet):
    queryset         = Facture.objects.select_related("client", "projet", "devis", "centre_cout")
    serializer_class = FactureSerializer
    filterset_fields = ["statut", "client", "projet", "type_facture", "centre_cout"]
    search_fields    = ["numero_local", "fne_reference", "client__nom"]

    # ── Verrouillage : une facture certifiée FNE est figée ────────────────────
    def perform_update(self, serializer):
        if self.get_object().est_verrouillee:
            raise ValidationError(
                "Facture certifiée FNE — verrouillée, aucune modification n'est autorisée."
            )
        serializer.save()

    def perform_destroy(self, instance):
        if instance.est_verrouillee:
            raise ValidationError(
                "Facture certifiée FNE — verrouillée, suppression interdite."
            )
        instance.delete()

    @action(detail=False, methods=["get"])
    def en_retard(self, request):
        factures = self.get_queryset().filter(
            date_echeance__lt=timezone.now().date(),
            statut__in=["brouillon", "certifiee"],
        )
        return Response(self.get_serializer(factures, many=True).data)

    @action(detail=True, methods=["post"])
    def certifier(self, request, pk=None):
        """Certifie la facture (API FNE DGI si activée, sinon mode simulation)."""
        facture = self.get_object()
        if facture.statut != "brouillon":
            return Response(
                {"detail": "Seules les factures en brouillon peuvent être certifiées."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not facture.lignes.exists():
            return Response(
                {"detail": "Impossible de certifier une facture sans lignes."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if StickerMouvement.solde_actuel() <= 0:
            return Response(
                {"detail": "Solde de stickers FNE épuisé. Rechargez le stock avant de certifier."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            fne = FNEService()
            simulation = fne.mode_simulation()
            fne.certifier_facture(facture)
            facture.refresh_from_db()
            data = self.get_serializer(facture).data
            data["simulation"] = simulation
            return Response(data)
        except FNEError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=["post"])
    def avoir(self, request, pk=None):
        """Émet un avoir (API FNE DGI si activée, sinon mode simulation)."""
        facture_origine = self.get_object()
        if not facture_origine.fne_reference:
            return Response(
                {"detail": "La facture d'origine doit être certifiée FNE."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if StickerMouvement.solde_actuel() <= 0:
            return Response(
                {"detail": "Solde de stickers FNE épuisé. Rechargez le stock avant d'émettre un avoir."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            fne = FNEService()
            simulation = fne.mode_simulation()
            with transaction.atomic():
                avoir = Facture.objects.create(
                    client          = facture_origine.client,
                    projet          = facture_origine.projet,
                    centre_cout     = facture_origine.centre_cout,
                    facture_origine = facture_origine,
                    type_facture    = "avoir",
                    date_echeance  = timezone.now().date(),
                    mode_reglement = facture_origine.mode_reglement,
                    template_fne   = facture_origine.template_fne,
                    notes          = f"Avoir sur {facture_origine.numero_local}",
                )
                for ligne in facture_origine.lignes.all():
                    LigneFacture.objects.create(
                        facture       = avoir,
                        designation   = ligne.designation,
                        quantite      = ligne.quantite,
                        prix_unitaire = ligne.prix_unitaire,
                        remise_pct    = ligne.remise_pct,
                        taux_tva      = ligne.taux_tva,
                        fne_item_id   = ligne.fne_item_id,
                    )
                fne.emettre_avoir(avoir, facture_origine)
            avoir.refresh_from_db()
        except FNEError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        data = self.get_serializer(avoir).data
        data["simulation"] = simulation
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """Génère et retourne le PDF FNE de la facture."""
        facture = self.get_object()
        buf = generer_facture_pdf(facture)
        response = HttpResponse(buf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="facture_{facture.numero_local}.pdf"'
        return response

    @action(detail=True, methods=["get"])
    def export_excel(self, request, pk=None):
        facture = self.get_object()
        buffer = facture_excel(facture)
        response = HttpResponse(
            buffer,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="facture_{facture.numero_local}.xlsx"'
        return response


class LigneFactureViewSet(viewsets.ModelViewSet):
    queryset         = LigneFacture.objects.select_related("facture")
    serializer_class = LigneFactureSerializer
    filterset_fields = ["facture"]

    @staticmethod
    def _verifier_verrou(facture):
        if facture and facture.est_verrouillee:
            raise ValidationError(
                "Facture certifiée FNE — verrouillée, ses lignes ne sont plus modifiables."
            )

    def perform_create(self, serializer):
        self._verifier_verrou(serializer.validated_data.get("facture"))
        serializer.save()

    def perform_update(self, serializer):
        self._verifier_verrou(self.get_object().facture)
        serializer.save()

    def perform_destroy(self, instance):
        self._verifier_verrou(instance.facture)
        instance.delete()


class PaiementViewSet(viewsets.ModelViewSet):
    queryset         = Paiement.objects.select_related("facture")
    serializer_class = PaiementSerializer
    filterset_fields = ["facture", "mode"]
    search_fields    = ["facture__numero_local", "reference"]


class ChargeViewSet(viewsets.ModelViewSet):
    queryset         = Charge.objects.filter(is_deleted=False).select_related("projet", "centre_cout")
    serializer_class = ChargeSerializer
    filterset_fields = ["categorie", "projet", "centre_cout"]
    search_fields    = ["libelle", "fournisseur", "reference"]

    @action(detail=False, methods=["get"])
    def export_excel(self, request):
        qs    = self.filter_queryset(self.get_queryset())
        mois  = request.query_params.get("mois", "")
        annee = request.query_params.get("annee", "")
        if mois and annee:
            qs    = qs.filter(date__month=mois, date__year=annee)
            titre = f"Charges — {mois}/{annee}"
        else:
            titre = "Charges — Export complet"
        buffer = charges_excel(qs, titre)
        response = HttpResponse(
            buffer,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="charges.xlsx"'
        return response


# ── Stickers FNE ────────────────────────────────────────────────────────────────

class StickerAchatViewSet(viewsets.ModelViewSet):
    queryset         = StickerAchat.objects.all()
    serializer_class = StickerAchatSerializer
    search_fields    = ["reference"]

    @action(detail=False, methods=["get"])
    def solde(self, request):
        """Solde courant + cumuls achetés / consommés."""
        achetes   = StickerMouvement.objects.filter(type_mouvement="achat") \
                        .aggregate(s=Sum("quantite"))["s"] or 0
        consommes = StickerMouvement.objects.filter(type_mouvement="consommation") \
                        .aggregate(s=Sum("quantite"))["s"] or 0
        return Response({
            "solde":           StickerMouvement.solde_actuel(),
            "total_achete":    achetes,
            "total_consomme":  abs(consommes),
            "mode_simulation": FNEService().mode_simulation(),
        })


class StickerMouvementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = StickerMouvement.objects.select_related("facture", "achat")
    serializer_class = StickerMouvementSerializer
    filterset_fields = ["type_mouvement", "facture"]
