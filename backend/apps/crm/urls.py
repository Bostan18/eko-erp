from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, DevisViewSet

router = DefaultRouter()
router.register("clients", ClientViewSet)
router.register("devis", DevisViewSet)

urlpatterns = router.urls
