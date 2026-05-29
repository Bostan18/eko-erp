from rest_framework.routers import DefaultRouter
from .views import (
    DevisViewSet, LigneDevisViewSet,
    FactureViewSet, LigneFactureViewSet,
    PaiementViewSet, ChargeViewSet,
    StickerAchatViewSet, StickerMouvementViewSet,
)

router = DefaultRouter()
router.register("devis",               DevisViewSet)
router.register("lignes-devis",        LigneDevisViewSet)
router.register("factures",            FactureViewSet)
router.register("lignes",              LigneFactureViewSet)
router.register("paiements",           PaiementViewSet)
router.register("charges",             ChargeViewSet)
router.register("stickers-achats",     StickerAchatViewSet)
router.register("stickers-mouvements", StickerMouvementViewSet)

urlpatterns = router.urls
