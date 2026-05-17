from datetime import date as date_cls, timedelta
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Employe, PresenceJournaliere, BulletinPaie, MissionMoo
from .serializers import (
    EmployeSerializer, PresenceJournaliereSerializer,
    BulletinPaieSerializer, MissionMooSerializer,
)
from .exports import paie_excel


class EmployeViewSet(viewsets.ModelViewSet):
    queryset = Employe.objects.filter(is_deleted=False)
    serializer_class = EmployeSerializer
    filterset_fields = ["type_contrat", "statut"]
    search_fields = ["nom", "prenom", "code", "poste"]


class PresenceJournaliereViewSet(viewsets.ModelViewSet):
    queryset = PresenceJournaliere.objects.select_related("employe")
    serializer_class = PresenceJournaliereSerializer
    filterset_fields = ["employe", "date", "present"]
    search_fields = ["employe__nom", "employe__prenom", "projet_ref"]

    @action(detail=False, methods=["get"])
    def feuille_journee(self, request):
        """Retourne tous les journaliers actifs avec leur présence pour une date."""
        date = request.query_params.get("date", str(timezone.now().date()))
        journaliers = Employe.objects.filter(
            type_contrat="journalier", statut="actif", is_deleted=False
        ).order_by("nom", "prenom")
        presences = {
            p.employe_id: p
            for p in PresenceJournaliere.objects.filter(date=date)
        }
        result = []
        for emp in journaliers:
            p = presences.get(emp.id)
            result.append({
                "employe_id": emp.id,
                "employe_code": emp.code,
                "employe_nom": emp.nom_complet,
                "taux_journalier": str(emp.taux_journalier or 0),
                "presence_id": p.id if p else None,
                "present": p.present if p else None,
                "heures_travaillees": str(p.heures_travaillees) if p else "8.0",
                "montant_du": str(p.montant_du) if p else "0",
                "projet_ref": p.projet_ref if p else "",
                "notes": p.notes if p else "",
            })
        return Response({"date": date, "presences": result})

    @action(detail=False, methods=["post"])
    def saisie_journee(self, request):
        """Saisie en masse des présences pour une journée."""
        date = request.data.get("date")
        presences_data = request.data.get("presences", [])
        if not date:
            return Response({"error": "date requis"}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for p in presences_data:
            obj, _ = PresenceJournaliere.objects.update_or_create(
                employe_id=p["employe_id"],
                date=date,
                defaults={
                    "present": p.get("present", True),
                    "heures_travaillees": p.get("heures_travaillees", 8),
                    "projet_ref": p.get("projet_ref", ""),
                    "notes": p.get("notes", ""),
                },
            )
            results.append(PresenceJournaliereSerializer(obj).data)

        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def feuille_semaine(self, request):
        """Retourne tous les journaliers actifs avec leurs présences pour une semaine."""
        semaine = request.query_params.get("semaine")
        if semaine:
            lundi = timezone.datetime.strptime(semaine, "%Y-%m-%d").date()
        else:
            today = timezone.now().date()
            lundi = today - timedelta(days=today.weekday())

        jours = [lundi + timedelta(days=i) for i in range(7)]

        journaliers = Employe.objects.filter(
            type_contrat="journalier", statut="actif", is_deleted=False
        ).order_by("nom", "prenom")

        presences = PresenceJournaliere.objects.filter(
            employe__type_contrat="journalier",
            date__range=[jours[0], jours[-1]],
        ).select_related("employe")

        presences_map = {}
        for p in presences:
            presences_map[(p.employe_id, str(p.date))] = p

        lignes = []
        for emp in journaliers:
            jours_data = []
            total_montant = 0
            for jour in jours:
                p = presences_map.get((emp.id, str(jour)))
                montant = float(p.montant_du) if p else 0
                total_montant += montant
                jours_data.append({
                    "date": str(jour),
                    "presence_id": p.id if p else None,
                    "present": p.present if p else None,
                    "heures_travaillees": str(p.heures_travaillees) if p else "8.0",
                    "montant_du": str(p.montant_du) if p else "0",
                    "projet_ref": p.projet_ref if p else "",
                    "notes": p.notes if p else "",
                })
            lignes.append({
                "employe_id": emp.id,
                "employe_code": emp.code,
                "employe_nom": emp.nom_complet,
                "taux_journalier": str(emp.taux_journalier or 0),
                "total_montant": str(total_montant),
                "jours": jours_data,
            })

        return Response({
            "semaine_debut": str(lundi),
            "jours": [str(j) for j in jours],
            "lignes": lignes,
        })

    @action(detail=False, methods=["post"])
    def saisie_semaine(self, request):
        """Saisie en masse des présences pour une semaine."""
        lignes = request.data.get("lignes", [])
        if not lignes:
            return Response({"error": "lignes requis"}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for ligne in lignes:
            employe_id = ligne.get("employe_id")
            for jour in ligne.get("jours", []):
                date = jour.get("date")
                present = jour.get("present")
                if date is None or present is None:
                    continue
                obj, _ = PresenceJournaliere.objects.update_or_create(
                    employe_id=employe_id,
                    date=date,
                    defaults={
                        "present": present,
                        "heures_travaillees": jour.get("heures_travaillees", 8),
                        "projet_ref": jour.get("projet_ref", ""),
                        "notes": jour.get("notes", ""),
                    },
                )
                results.append(PresenceJournaliereSerializer(obj).data)

        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def marquer_payees(self, request):
        """Marque un lot de présences comme payées (paye_le = aujourd'hui par défaut)."""
        ids = request.data.get("ids", [])
        date_paiement = request.data.get("paye_le") or str(timezone.now().date())
        if not ids:
            return Response({"error": "ids requis"}, status=status.HTTP_400_BAD_REQUEST)
        nb = PresenceJournaliere.objects.filter(id__in=ids).update(paye_le=date_paiement)
        return Response({"updated": nb, "paye_le": date_paiement})

    @action(detail=False, methods=["get"])
    def restant_a_payer(self, request):
        """Récap par employé journalier : total dû, total payé, restant à payer."""
        presences = PresenceJournaliere.objects.filter(
            employe__type_contrat="journalier",
            present=True,
        ).select_related("employe")

        recap = {}
        for p in presences:
            key = p.employe_id
            if key not in recap:
                recap[key] = {
                    "employe_id": p.employe_id,
                    "employe_code": p.employe.code,
                    "employe_nom": p.employe.nom_complet,
                    "total_du": 0.0,
                    "total_paye": 0.0,
                    "restant": 0.0,
                    "jours_non_payes": 0,
                }
            montant = float(p.montant_du)
            recap[key]["total_du"] += montant
            if p.paye_le:
                recap[key]["total_paye"] += montant
            else:
                recap[key]["restant"] += montant
                recap[key]["jours_non_payes"] += 1

        return Response(list(recap.values()))

    @action(detail=False, methods=["get"])
    def export_paie(self, request):
        """Export Excel de la feuille de paie pour un mois donné."""
        mois  = int(request.query_params.get("mois",  timezone.now().month))
        annee = int(request.query_params.get("annee", timezone.now().year))

        employes = Employe.objects.filter(statut="actif", is_deleted=False).order_by("type_contrat", "nom")
        presences = PresenceJournaliere.objects.filter(
            date__month=mois, date__year=annee
        ).select_related("employe")

        presences_par_employe = {}
        for p in presences:
            presences_par_employe.setdefault(p.employe_id, []).append(p)

        buffer = paie_excel(employes, presences_par_employe, mois, annee)
        response = HttpResponse(
            buffer,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="paie_{mois}_{annee}.xlsx"'
        return response


class BulletinPaieViewSet(viewsets.ModelViewSet):
    queryset = BulletinPaie.objects.select_related("employe").all()
    serializer_class = BulletinPaieSerializer
    filterset_fields = ["employe", "mois", "statut"]
    search_fields = ["employe__nom", "employe__prenom", "employe__code"]

    @action(detail=False, methods=["post"])
    def generer(self, request):
        """Génère les bulletins du mois pour tous les CDI actifs. Idempotent : ne recrée pas
        si le bulletin (employe, mois) existe déjà.

        Body: { "mois": "2026-05" } ou { "mois": "2026-05-01" }
        """
        mois_str = request.data.get("mois")
        if not mois_str:
            return Response({"error": "mois requis (format YYYY-MM ou YYYY-MM-DD)"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if len(mois_str) == 7:  # YYYY-MM
                mois_str = f"{mois_str}-01"
            mois = date_cls.fromisoformat(mois_str)
            mois = mois.replace(day=1)
        except ValueError:
            return Response({"error": "Format mois invalide"}, status=status.HTTP_400_BAD_REQUEST)

        cdi_actifs = Employe.objects.filter(
            type_contrat="cdi", statut="actif", is_deleted=False
        )

        crees = []
        ignores = []
        for emp in cdi_actifs:
            brut = emp.salaire_mensuel or 0
            obj, created = BulletinPaie.objects.get_or_create(
                employe=emp, mois=mois,
                defaults={"brut": brut, "net": brut, "statut": "genere"},
            )
            (crees if created else ignores).append(obj.id)

        return Response({
            "mois": str(mois),
            "crees": len(crees),
            "ignores_existants": len(ignores),
        })

    @action(detail=True, methods=["post"])
    def marquer_paye(self, request, pk=None):
        """Marque un bulletin comme payé (paye_le = aujourd'hui par défaut)."""
        bulletin = self.get_object()
        bulletin.statut = "paye"
        bulletin.paye_le = request.data.get("paye_le") or timezone.now().date()
        bulletin.save()
        return Response(BulletinPaieSerializer(bulletin).data)


class MissionMooViewSet(viewsets.ModelViewSet):
    queryset = MissionMoo.objects.select_related("employe", "projet").all()
    serializer_class = MissionMooSerializer
    filterset_fields = ["employe", "projet"]
    search_fields = ["employe__nom", "employe__prenom", "description"]

    @action(detail=True, methods=["post"])
    def marquer_payee(self, request, pk=None):
        """Marque une mission MOO comme payée."""
        mission = self.get_object()
        mission.paye_le = request.data.get("paye_le") or timezone.now().date()
        mission.save()
        return Response(MissionMooSerializer(mission).data)
