import pytest
from decimal import Decimal
from django.utils import timezone
from apps.stocks.models import Article, MouvementStock


@pytest.fixture
def article(db):
    return Article.objects.create(
        code="ART-001", nom="Ciment Portland",
        categorie="materiau", unite="sac",
        stock_actuel=Decimal("100"),
        seuil_minimum=Decimal("20"),
        prix_unitaire=Decimal("6500"),
    )


class TestArticle:
    def test_en_alerte_faux(self, article):
        assert article.en_alerte is False

    def test_en_alerte_vrai(self, article):
        article.stock_actuel = Decimal("15")
        article.save()
        assert article.en_alerte is True

    def test_en_alerte_egal_seuil(self, article):
        article.stock_actuel = Decimal("20")
        article.save()
        assert article.en_alerte is True  # lte = ≤


class TestMouvementStock:
    def test_entree_augmente_stock(self, article):
        stock_avant = article.stock_actuel
        MouvementStock.objects.create(
            article=article, type_mouvement="entree",
            quantite=Decimal("50"), date=timezone.now().date(),
        )
        article.refresh_from_db()
        assert article.stock_actuel == stock_avant + Decimal("50")

    def test_sortie_diminue_stock(self, article):
        stock_avant = article.stock_actuel
        MouvementStock.objects.create(
            article=article, type_mouvement="sortie",
            quantite=Decimal("30"), date=timezone.now().date(),
        )
        article.refresh_from_db()
        assert article.stock_actuel == stock_avant - Decimal("30")

    def test_alerte_apres_sortie(self, article):
        MouvementStock.objects.create(
            article=article, type_mouvement="sortie",
            quantite=Decimal("85"), date=timezone.now().date(),
        )
        article.refresh_from_db()
        assert article.en_alerte is True
