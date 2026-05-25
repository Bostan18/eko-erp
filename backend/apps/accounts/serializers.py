from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Profile, Role
from .permissions import modules_for_role

User = get_user_model()


class EmployeMiniSerializer(serializers.Serializer):
    """Représentation minimale d'un employé lié — sans dépendance circulaire."""
    code      = serializers.CharField()
    nom       = serializers.CharField()
    prenom    = serializers.CharField()
    poste     = serializers.CharField()
    nom_complet = serializers.CharField()


class MeSerializer(serializers.ModelSerializer):
    """Réponse de GET /api/auth/me/ — profil complet pour le frontend."""
    role          = serializers.CharField(source="profile.role")
    role_display  = serializers.CharField(source="profile.get_role_display")
    modules       = serializers.SerializerMethodField()
    employe       = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "is_active", "is_superuser",
            "role", "role_display", "modules", "employe",
        )

    def get_modules(self, user):
        if user.is_superuser:
            from .permissions import ALL_MODULES
            return list(ALL_MODULES)
        role = getattr(getattr(user, "profile", None), "role", None)
        return modules_for_role(role) if role else []

    def get_employe(self, user):
        emp = getattr(user, "employe", None)
        if emp is None or getattr(emp, "is_deleted", False):
            return None
        return EmployeMiniSerializer({
            "code":        emp.code,
            "nom":         emp.nom,
            "prenom":      emp.prenom,
            "poste":       emp.poste,
            "nom_complet": emp.nom_complet,
        }).data


class UserListSerializer(serializers.ModelSerializer):
    """Pour la table d'admin Utilisateurs (lecture)."""
    role         = serializers.CharField(source="profile.role", read_only=True)
    role_display = serializers.CharField(source="profile.get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "username", "email", "first_name", "last_name",
            "is_active", "last_login", "date_joined",
            "role", "role_display",
        )


class UserCreateSerializer(serializers.ModelSerializer):
    """Création d'un compte — ADMIN définit username/email + rôle.

    Le mot de passe est généré côté serveur (renvoyé une seule fois dans la
    réponse) pour éviter qu'un admin le choisisse à la place de l'utilisateur.
    """
    role = serializers.ChoiceField(choices=Role.choices, write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "is_active", "role")

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà pris.")
        return value

    def create(self, validated_data):
        from django.utils.crypto import get_random_string
        role = validated_data.pop("role")
        # MDP temporaire : 12 caractères alphanumériques mixed-case
        temp_password = get_random_string(length=12)
        user = User.objects.create(**validated_data)
        user.set_password(temp_password)
        user.save()
        # Le signal a créé le Profile (rôle LECTURE) — on applique le rôle voulu
        profile = user.profile
        profile.role = role
        profile.save(update_fields=["role", "updated_at"])
        # Exposé via to_representation pour ne s'afficher qu'à la création
        user._temp_password = temp_password
        return user

    def to_representation(self, user):
        data = UserListSerializer(user).data
        if getattr(user, "_temp_password", None):
            data["temp_password"] = user._temp_password
        return data


class UserUpdateSerializer(serializers.ModelSerializer):
    """Mise à jour : rôle, activation, email, nom — pas le password (action dédiée)."""
    role = serializers.ChoiceField(choices=Role.choices, required=False)

    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "is_active", "role")

    def update(self, user, validated_data):
        role = validated_data.pop("role", None)
        for field, value in validated_data.items():
            setattr(user, field, value)
        user.save()
        if role is not None:
            profile = user.profile
            profile.role = role
            profile.save(update_fields=["role", "updated_at"])
        return user

    def to_representation(self, user):
        return UserListSerializer(user).data


class PasswordChangeSelfSerializer(serializers.Serializer):
    """Pour /api/auth/me/password/ — l'utilisateur change son propre MDP."""
    ancien    = serializers.CharField(write_only=True)
    nouveau   = serializers.CharField(write_only=True)

    def validate_ancien(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value

    def validate_nouveau(self, value):
        validate_password(value, user=self.context["request"].user)
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["nouveau"])
        user.save(update_fields=["password"])
        return user
