from rest_framework import viewsets
from .models import Client, Devis, Opportunite, Contrat
from .serializers import (
    ClientSerializer, DevisSerializer, OpportuniteSerializer, ContratSerializer,
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.filter(is_deleted=False)
    serializer_class = ClientSerializer
    filterset_fields = ["type_client", "secteur", "statut"]
    search_fields = ["nom", "code", "email", "telephone"]

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.filter(is_deleted=False).select_related("client")
    serializer_class = DevisSerializer
    filterset_fields = ["statut", "client"]


class OpportuniteViewSet(viewsets.ModelViewSet):
    queryset = Opportunite.objects.select_related("client", "centre_cout")
    serializer_class = OpportuniteSerializer
    filterset_fields = ["phase", "client", "centre_cout"]
    search_fields = ["titre", "client__nom"]


class ContratViewSet(viewsets.ModelViewSet):
    queryset = Contrat.objects.filter(is_deleted=False).select_related("client", "centre_cout")
    serializer_class = ContratSerializer
    filterset_fields = ["statut", "type_contrat", "client", "centre_cout"]
    search_fields = ["numero", "objet", "client__nom"]
