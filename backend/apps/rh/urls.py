from rest_framework.routers import DefaultRouter
from .views import (
    EmployeViewSet, PresenceJournaliereViewSet,
    BulletinPaieViewSet, MissionMooViewSet,
    CongeViewSet, CompetenceViewSet, CompetenceEmployeViewSet,
    CertificationViewSet, HistoriqueContratViewSet,
)

router = DefaultRouter()
router.register("employes", EmployeViewSet)
router.register("presences", PresenceJournaliereViewSet)
router.register("bulletins", BulletinPaieViewSet)
router.register("missions-moo", MissionMooViewSet)
router.register("conges", CongeViewSet)
router.register("competences", CompetenceViewSet)
router.register("competences-employes", CompetenceEmployeViewSet)
router.register("certifications", CertificationViewSet)
router.register("historique-contrats", HistoriqueContratViewSet)

urlpatterns = router.urls
