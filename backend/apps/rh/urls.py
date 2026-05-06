from rest_framework.routers import DefaultRouter
from .views import EmployeViewSet, PresenceJournaliereViewSet

router = DefaultRouter()
router.register("employes", EmployeViewSet)
router.register("presences", PresenceJournaliereViewSet)

urlpatterns = router.urls
