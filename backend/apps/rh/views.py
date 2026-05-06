from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Employe, PresenceJournaliere
from .serializers import EmployeSerializer, PresenceJournaliereSerializer


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
