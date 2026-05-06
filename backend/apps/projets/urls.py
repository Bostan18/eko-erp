from rest_framework.routers import DefaultRouter
from .views import ProjetViewSet, IntervenantProjetViewSet

router = DefaultRouter()
router.register("projets", ProjetViewSet)
router.register("intervenants", IntervenantProjetViewSet)

urlpatterns = router.urls
