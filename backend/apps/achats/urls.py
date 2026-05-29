from rest_framework.routers import DefaultRouter
from .views import (
    FournisseurViewSet, FactureAchatViewSet,
    CompteBancaireViewSet, MouvementTresorerieViewSet,
)

router = DefaultRouter()
router.register("fournisseurs",   FournisseurViewSet)
router.register("factures",       FactureAchatViewSet)
router.register("comptes",        CompteBancaireViewSet)
router.register("tresorerie",     MouvementTresorerieViewSet)

urlpatterns = router.urls
