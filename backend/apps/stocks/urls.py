from rest_framework.routers import DefaultRouter
from .views import (
    ArticleViewSet, MouvementStockViewSet,
    LotBiologiqueViewSet, TraceurRFIDViewSet, DechetViewSet,
)

router = DefaultRouter()
router.register("articles",         ArticleViewSet)
router.register("mouvements",       MouvementStockViewSet)
router.register("lots-biologiques", LotBiologiqueViewSet)
router.register("traceurs-rfid",    TraceurRFIDViewSet)
router.register("dechets",          DechetViewSet)

urlpatterns = router.urls
