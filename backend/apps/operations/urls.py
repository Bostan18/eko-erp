from rest_framework.routers import DefaultRouter
from .views import SiteViewSet, TacheCatalogueViewSet

router = DefaultRouter()
router.register("sites", SiteViewSet)
router.register("taches-catalogue", TacheCatalogueViewSet)

urlpatterns = router.urls
