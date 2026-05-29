from rest_framework import serializers
from .models import Rapport


class RapportSerializer(serializers.ModelSerializer):
    type_rapport_display = serializers.CharField(source="get_type_rapport_display", read_only=True)

    class Meta:
        model = Rapport
        fields = [
            "id", "titre", "type_rapport", "type_rapport_display",
            "periode_debut", "periode_fin", "genere_par", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
