from rest_framework import viewsets
from .models import Projet, IntervenantProjet
from .serializers import ProjetSerializer, IntervenantProjetSerializer


class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.filter(is_deleted=False).select_related("client", "chef_projet")
    serializer_class = ProjetSerializer
    filterset_fields = ["type_projet", "statut", "client"]
    search_fields = ["code", "nom", "localisation"]


class IntervenantProjetViewSet(viewsets.ModelViewSet):
    queryset = IntervenantProjet.objects.select_related("projet", "employe")
    serializer_class = IntervenantProjetSerializer
    filterset_fields = ["projet", "employe"]
