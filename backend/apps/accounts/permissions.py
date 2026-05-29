"""Matrice rôle → modules + classes de permission DRF.

Source de vérité unique pour décider quel rôle peut accéder à quel module.
Le frontend récupère cette matrice via GET /api/auth/me/ (champ `modules`).
"""
from rest_framework.permissions import BasePermission

from .models import Role


# IDs de modules — alignés avec frontend/src/components/layout/modules.js
ALL_MODULES = [
    "dashboard",
    "compta",
    "achats",
    "rh",
    "projets",
    "operations",
    "parc",
    "stocks",
    "crm",
    "reporting",
    "documents",
    "parametres",
]

# Sentinelle wildcard : ADMIN accède à tout, y compris modules futurs
WILDCARD = "*"

MODULE_ACCESS = {
    Role.ADMIN:         [WILDCARD],
    Role.DIRECTION:     ALL_MODULES,  # lecture partout, restrictions d'action gérées plus tard
    Role.COMPTABLE:     ["dashboard", "compta", "achats", "crm", "reporting", "documents", "parametres"],
    Role.RH:            ["dashboard", "rh", "documents", "reporting"],
    Role.CHEF_CHANTIER: ["dashboard", "projets", "operations", "parc", "stocks", "documents"],
    Role.LECTURE:       ["dashboard"],
}


def modules_for_role(role):
    """Retourne la liste effective des modules accessibles (wildcard résolu)."""
    perms = MODULE_ACCESS.get(role, [])
    if WILDCARD in perms:
        return list(ALL_MODULES)
    return list(perms)


def user_can_access(user, module_id):
    """Vrai si l'utilisateur a accès au module donné."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    role = getattr(getattr(user, "profile", None), "role", None)
    if role is None:
        return False
    perms = MODULE_ACCESS.get(role, [])
    return WILDCARD in perms or module_id in perms


class IsAdmin(BasePermission):
    """Réservé aux ADMIN (ou superuser Django)."""
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return getattr(getattr(user, "profile", None), "role", None) == Role.ADMIN
