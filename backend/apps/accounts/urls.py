from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MePasswordView, MeView, RolesView, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")

urlpatterns = [
    path("me/",           MeView.as_view(),         name="auth-me"),
    path("me/password/",  MePasswordView.as_view(), name="auth-me-password"),
    path("roles/",        RolesView.as_view(),      name="auth-roles"),
    path("",              include(router.urls)),
]
