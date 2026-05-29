from datetime import date, timedelta
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Projet, IntervenantProjet, TacheProjet, AffectationTache, RealisationTache
from .serializers import (
    ProjetSerializer, IntervenantProjetSerializer,
    TacheProjetSerializer, AffectationTacheSerializer, RealisationTacheSerializer,
    ProjetGanttSerializer,
)


class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.filter(is_deleted=False).select_related("client", "chef_projet", "centre_cout")
    serializer_class = ProjetSerializer
    filterset_fields = ["type_projet", "statut", "client", "centre_cout"]
    search_fields = ["code", "nom", "localisation"]

    @action(detail=False, methods=["get"])
    def gantt(self, request):
        """Vue Gantt agrégée — projets + tâches sur une période donnée."""
        today = date.today()

        # ── Période ───────────────────────────────────────────────────────────
        debut_str = request.query_params.get("date_debut")
        fin_str = request.query_params.get("date_fin")
        try:
            debut = date.fromisoformat(debut_str) if debut_str else today
            fin = date.fromisoformat(fin_str) if fin_str else today + timedelta(days=90)
        except ValueError:
            return Response(
                {"detail": "Dates invalides (format attendu : YYYY-MM-DD)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if fin < debut:
            return Response(
                {"detail": "date_fin doit être >= date_debut."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Filtrage ──────────────────────────────────────────────────────────
        statuts_param = request.query_params.get("statut")
        if statuts_param:
            statuts = [s.strip() for s in statuts_param.split(",") if s.strip()]
        else:
            statuts = ["planifie", "en_cours", "suspendu", "termine"]  # tout sauf annule

        # 1 seule requête SQL + prefetch des tâches non supprimées
        taches_qs = TacheProjet.objects.filter(is_deleted=False).prefetch_related(
            "affectations__realisations"
        )
        projets = (
            Projet.objects.filter(is_deleted=False, statut__in=statuts)
            .select_related("client", "chef_projet")
            .prefetch_related(Prefetch("taches", queryset=taches_qs))
            # Chevauchement avec la période : (date_debut <= fin) ET (date_fin >= debut)
            .filter(date_debut__lte=fin)
            .filter(date_fin_prevue__gte=debut)
        )

        chef_id = request.query_params.get("chef_chantier")
        if chef_id:
            projets = projets.filter(chef_projet_id=chef_id)

        projets = projets.order_by("date_debut", "code")

        return Response({
            "periode": {
                "debut": debut.isoformat(),
                "fin": fin.isoformat(),
                "jours": (fin - debut).days + 1,
            },
            "projets": ProjetGanttSerializer(projets, many=True).data,
        })


class IntervenantProjetViewSet(viewsets.ModelViewSet):
    queryset = IntervenantProjet.objects.select_related("projet", "employe")
    serializer_class = IntervenantProjetSerializer
    filterset_fields = ["projet", "employe"]


class TacheProjetViewSet(viewsets.ModelViewSet):
    queryset = TacheProjet.objects.filter(is_deleted=False).select_related("projet").prefetch_related(
        "affectations__employe", "affectations__realisations"
    )
    serializer_class = TacheProjetSerializer
    filterset_fields = ["projet", "statut", "type_objectif"]
    search_fields = ["nom", "description"]

    @action(detail=True, methods=["get"])
    def tableau_pointage(self, request, pk=None):
        """Retourne la feuille de pointage hebdomadaire d'une tâche."""
        tache = self.get_object()
        from datetime import date, timedelta

        semaine = request.query_params.get("semaine")
        if semaine:
            lundi = date.fromisoformat(semaine)
        else:
            today = date.today()
            lundi = today - timedelta(days=today.weekday())

        jours = [lundi + timedelta(days=i) for i in range(7)]

        affectations = AffectationTache.objects.filter(
            tache=tache
        ).select_related("employe").prefetch_related("realisations")

        lignes = []
        for aff in affectations:
            realisations_by_date = {r.date: r for r in aff.realisations.all()}
            jours_data = []
            for jour in jours:
                r = realisations_by_date.get(jour)
                jours_data.append({
                    "date": str(jour),
                    "realisation_id": r.id if r else None,
                    "quantite": str(r.quantite_realisee) if r else "",
                    "montant": str(r.montant_calcule) if r else "0",
                    "notes": r.notes if r else "",
                })
            lignes.append({
                "affectation_id": aff.id,
                "employe_id": aff.employe_id,
                "employe_nom": aff.employe.nom_complet,
                "objectif_individuel": str(aff.objectif_individuel),
                "total_realise": str(aff.total_realise),
                "total_montant": str(aff.total_montant),
                "progression_pct": aff.progression_pct,
                "jours": jours_data,
            })

        return Response({
            "tache_id": tache.id,
            "tache_nom": tache.nom,
            "unite_label": tache.unite_label,
            "tarif_unitaire": str(tache.tarif_unitaire),
            "semaine_debut": str(lundi),
            "lignes": lignes,
        })


class AffectationTacheViewSet(viewsets.ModelViewSet):
    queryset = AffectationTache.objects.select_related("tache", "employe").prefetch_related("realisations")
    serializer_class = AffectationTacheSerializer
    filterset_fields = ["tache", "employe"]


class RealisationTacheViewSet(viewsets.ModelViewSet):
    queryset = RealisationTache.objects.select_related(
        "affectation__tache", "affectation__employe", "site",
    )
    serializer_class = RealisationTacheSerializer
    filterset_fields = ["affectation", "date", "site", "affectation__tache", "affectation__employe"]

    @action(detail=False, methods=["post"])
    def saisie_log(self, request):
        """Log de travail à la tâche : crée/récupère l'affectation puis la réalisation."""
        tache_id  = request.data.get("tache")
        employe_id = request.data.get("employe")
        date_val  = request.data.get("date")
        quantite  = request.data.get("quantite")
        site_id   = request.data.get("site") or None
        notes     = request.data.get("notes", "")

        if not all([tache_id, employe_id, date_val, quantite is not None]):
            return Response(
                {"detail": "tache, employe, date et quantite sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            quantite = Decimal(str(quantite))
        except (InvalidOperation, TypeError):
            return Response({"detail": "quantite invalide."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            try:
                tache = TacheProjet.objects.get(pk=tache_id, is_deleted=False)
            except TacheProjet.DoesNotExist:
                return Response({"detail": "Tâche introuvable."}, status=status.HTTP_404_NOT_FOUND)

            aff, _ = AffectationTache.objects.get_or_create(
                tache=tache, employe_id=employe_id, date_affectation=date_val,
                defaults={"objectif_individuel": 0},
            )
            rea, _ = RealisationTache.objects.update_or_create(
                affectation=aff, date=date_val,
                defaults={
                    "quantite_realisee": quantite,
                    "site_id": site_id,
                    "notes": notes,
                },
            )
            rea.save()

        return Response(RealisationTacheSerializer(rea).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def saisie_multiple(self, request):
        """Saisie en masse des réalisations pour une tâche/semaine."""
        lignes = request.data.get("lignes", [])
        if not lignes:
            return Response({"error": "lignes requis"}, status=status.HTTP_400_BAD_REQUEST)

        resultats = []
        erreurs = []

        with transaction.atomic():
            for item in lignes:
                aff_id = item.get("affectation_id")
                date_val = item.get("date")
                quantite = item.get("quantite")

                if not all([aff_id, date_val, quantite is not None]):
                    erreurs.append(f"Données incomplètes : {item}")
                    continue

                try:
                    aff = AffectationTache.objects.get(pk=aff_id)
                    if str(quantite) == "":
                        RealisationTache.objects.filter(affectation=aff, date=date_val).delete()
                        continue
                    obj, _ = RealisationTache.objects.update_or_create(
                        affectation=aff,
                        date=date_val,
                        defaults={
                            "quantite_realisee": quantite,
                            "notes": item.get("notes", ""),
                        },
                    )
                    obj.save()
                    resultats.append(RealisationTacheSerializer(obj).data)
                except AffectationTache.DoesNotExist:
                    erreurs.append(f"Affectation {aff_id} introuvable")

        if erreurs:
            return Response({"resultats": resultats, "erreurs": erreurs}, status=status.HTTP_207_MULTI_STATUS)
        return Response(resultats, status=status.HTTP_200_OK)
