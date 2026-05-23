from rest_framework import viewsets

from .models import Site, TacheCatalogue
from .serializers import SiteSerializer, TacheCatalogueSerializer


class SiteViewSet(viewsets.ModelViewSet):
    queryset         = Site.objects.filter(is_deleted=False).select_related("projet", "responsable")
    serializer_class = SiteSerializer
    filterset_fields = ["type_site", "projet", "responsable", "actif"]
    search_fields    = ["code", "nom", "localisation"]


class TacheCatalogueViewSet(viewsets.ModelViewSet):
    queryset         = TacheCatalogue.objects.filter(is_deleted=False).select_related("activite")
    serializer_class = TacheCatalogueSerializer
    filterset_fields = ["type_objectif", "activite", "actif"]
    search_fields    = ["code", "libelle"]
