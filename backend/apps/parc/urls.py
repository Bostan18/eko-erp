from rest_framework.routers import DefaultRouter
from .views import EnginViewSet, MaintenanceViewSet, ContratLocationViewSet

router = DefaultRouter()
router.register("engins",       EnginViewSet)
router.register("maintenances", MaintenanceViewSet)
router.register("locations",    ContratLocationViewSet)

urlpatterns = router.urls
