from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Role
from .permissions import IsAdmin
from .serializers import (
    MeSerializer,
    PasswordChangeSelfSerializer,
    UserCreateSerializer,
    UserListSerializer,
    UserUpdateSerializer,
)

User = get_user_model()


class MeView(APIView):
    """GET /api/auth/me/ — profil de l'utilisateur courant + matrice de modules."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class MePasswordView(APIView):
    """POST /api/auth/me/password/ — l'utilisateur change son propre MDP."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSelfSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe modifié."})


class RolesView(APIView):
    """GET /api/auth/roles/ — référentiel des rôles disponibles (pour les selects UI)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response([
            {"value": value, "label": label}
            for value, label in Role.choices
        ])


class UserViewSet(viewsets.ModelViewSet):
    """CRUD utilisateurs — réservé aux ADMIN.

    - GET    /api/auth/users/                liste
    - POST   /api/auth/users/                création (MDP temporaire renvoyé)
    - GET    /api/auth/users/{id}/           détail
    - PATCH  /api/auth/users/{id}/           modification (rôle, email, actif)
    - POST   /api/auth/users/{id}/reset_password/   reset MDP
    """
    queryset = User.objects.select_related("profile").order_by("username")
    permission_classes = [IsAdmin]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ("update", "partial_update"):
            return UserUpdateSerializer
        return UserListSerializer

    def perform_destroy(self, user):
        """Pas de suppression hard — on désactive uniquement.

        Évite d'orpheliner des FK historiques (présences signées, factures
        créées par cet user, etc.). L'admin peut réactiver plus tard.
        """
        if user == self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Vous ne pouvez pas désactiver votre propre compte.")
        user.is_active = False
        user.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"], url_path="reset_password")
    def reset_password(self, request, pk=None):
        """Génère un nouveau MDP temporaire pour l'utilisateur cible."""
        user = self.get_object()
        temp_password = get_random_string(length=12)
        user.set_password(temp_password)
        user.save(update_fields=["password"])
        return Response(
            {"temp_password": temp_password, "username": user.username},
            status=status.HTTP_200_OK,
        )
