from datetime import date, timedelta
from io import BytesIO

from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Prefetch
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import (
    Projet, IntervenantProjet, TacheProjet, AffectationTache, RealisationTache,
    PhotoChantier,
)
from .serializers import (
    ProjetSerializer, IntervenantProjetSerializer,
    TacheProjetSerializer, AffectationTacheSerializer, RealisationTacheSerializer,
    ProjetGanttSerializer, PhotoChantierSerializer,
)


THUMBNAIL_MAX = (320, 320)


def _generer_thumbnail(image_field):
    """Génère un JPEG miniature 320×320 à partir d'une ImageField. Retourne un ContentFile."""
    from PIL import Image

    with Image.open(image_field) as img:
        img = img.convert("RGB")
        img.thumbnail(THUMBNAIL_MAX)
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=80)
    return ContentFile(buf.getvalue())


class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.filter(is_deleted=False).select_related("client", "chef_projet")
    serializer_class = ProjetSerializer
    filterset_fields = ["type_projet", "statut", "client"]
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

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="photos",
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def photos(self, request, pk=None):
        """Liste ou ajout d'une photo géolocalisée sur un projet."""
        projet = self.get_object()

        if request.method == "GET":
            qs = projet.photos.filter(is_deleted=False)
            type_photo = request.query_params.get("type_photo")
            if type_photo:
                qs = qs.filter(type_photo=type_photo)
            since = request.query_params.get("since")
            if since:
                try:
                    qs = qs.filter(prise_le__date__gte=date.fromisoformat(since))
                except ValueError:
                    return Response({"detail": "Paramètre 'since' invalide."}, status=400)
            ser = PhotoChantierSerializer(qs, many=True, context={"request": request})
            return Response(ser.data)

        # POST — création photo
        data = request.data.copy()
        data["projet"] = projet.id
        ser = PhotoChantierSerializer(data=data, context={"request": request})
        ser.is_valid(raise_exception=True)
        photo = ser.save(prise_par=request.user)

        # Thumbnail générée à partir de l'image source
        try:
            thumb = _generer_thumbnail(photo.image)
            photo.thumbnail.save(f"thumb_{photo.image.name.split('/')[-1]}", thumb, save=True)
        except Exception:  # noqa: BLE001 — l'absence de thumb n'est pas bloquante
            pass

        out = PhotoChantierSerializer(photo, context={"request": request}).data
        return Response(out, status=status.HTTP_201_CREATED)


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
    queryset = RealisationTache.objects.select_related("affectation__tache", "affectation__employe")
    serializer_class = RealisationTacheSerializer
    filterset_fields = ["affectation", "date"]

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
