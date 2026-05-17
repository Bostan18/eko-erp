from rest_framework.routers import DefaultRouter
from .views import (
    EmployeViewSet, PresenceJournaliereViewSet,
    BulletinPaieViewSet, MissionMooViewSet,
)

router = DefaultRouter()
router.register("employes", EmployeViewSet)
router.register("presences", PresenceJournaliereViewSet)
router.register("bulletins", BulletinPaieViewSet)
router.register("missions-moo", MissionMooViewSet)

urlpatterns = router.urls
