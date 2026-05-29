from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, DevisViewSet, OpportuniteViewSet, ContratViewSet

router = DefaultRouter()
router.register("clients", ClientViewSet)
router.register("devis", DevisViewSet)
router.register("opportunites", OpportuniteViewSet)
router.register("contrats", ContratViewSet)

urlpatterns = router.urls
