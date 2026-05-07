from rest_framework.routers import DefaultRouter
from .views import (
    ProjetViewSet, IntervenantProjetViewSet,
    TacheProjetViewSet, AffectationTacheViewSet, RealisationTacheViewSet,
)

router = DefaultRouter()
router.register("projets", ProjetViewSet)
router.register("intervenants", IntervenantProjetViewSet)
router.register("taches", TacheProjetViewSet)
router.register("affectations", AffectationTacheViewSet)
router.register("realisations", RealisationTacheViewSet)

urlpatterns = router.urls
