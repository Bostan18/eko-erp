from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet, MouvementStockViewSet

router = DefaultRouter()
router.register("articles", ArticleViewSet)
router.register("mouvements", MouvementStockViewSet)

urlpatterns = router.urls
