from rest_framework.routers import DefaultRouter
from .views import FactureViewSet, LigneFactureViewSet, PaiementViewSet, ChargeViewSet

router = DefaultRouter()
router.register("factures", FactureViewSet)
router.register("lignes", LigneFactureViewSet)
router.register("paiements", PaiementViewSet)
router.register("charges", ChargeViewSet)

urlpatterns = router.urls
