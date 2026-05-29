from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, filters
from .models import EntrepriseConfig, Document, CentreCout
from .serializers import EntrepriseConfigSerializer, DocumentSerializer, CentreCoutSerializer


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.filter(is_deleted=False)
    serializer_class = DocumentSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["id_doc", "titre", "entite_id", "notes"]


class CentreCoutViewSet(viewsets.ModelViewSet):
    queryset = CentreCout.objects.all()
    serializer_class = CentreCoutSerializer
    filterset_fields = ["actif"]


class EntrepriseConfigView(APIView):
    """Singleton — GET retourne la config, PUT met à jour."""

    def get(self, request):
        config = EntrepriseConfig.get()
        return Response(EntrepriseConfigSerializer(config).data)

    def put(self, request):
        config = EntrepriseConfig.get()
        serializer = EntrepriseConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        return self.put(request)


class TestFNEView(APIView):
    """Teste la connexion à l'API FNE avec les credentials de la config."""

    def post(self, request):
        from apps.comptabilite.services.fne_service import FNEService, FNEError
        config = EntrepriseConfig.get()
        if not config.fne_client_id or not config.fne_client_secret:
            return Response(
                {"ok": False, "message": "Client ID et Client Secret sont requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            svc = FNEService()
            result = svc.tester_connexion()
            return Response(result)
        except FNEError as e:
            return Response({"ok": False, "message": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({"ok": False, "message": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
