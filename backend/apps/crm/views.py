from rest_framework import viewsets
from .models import Client, Devis
from .serializers import ClientSerializer, DevisSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.filter(is_deleted=False)
    serializer_class = ClientSerializer
    filterset_fields = ["type_client", "secteur", "statut"]
    search_fields = ["nom", "code", "email", "telephone"]

class DevisViewSet(viewsets.ModelViewSet):
    queryset = Devis.objects.filter(is_deleted=False).select_related("client")
    serializer_class = DevisSerializer
    filterset_fields = ["statut", "client"]
