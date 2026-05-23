"""Tests Sprint 7 — Stocks métier (lots biologiques, RFID, déchets)."""
from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.stocks.models import Article, LotBiologique, TraceurRFID, Dechet
from apps.operations.models import Site
from apps.projets.models import Projet


@pytest.fixture
def intrant(db):
    return Article.objects.create(
        code="ART-S7", nom="Plant Anacardier", categorie="intrant",
        unite="u", prix_unitaire=Decimal("200"),
    )


@pytest.fixture
def materiau(db):
    return Article.objects.create(
        code="MAT-S7", nom="Engin compacteur", categorie="equipement",
        unite="u", prix_unitaire=Decimal("8000000"),
    )


@pytest.fixture
def site(db):
    return Site.objects.create(nom="Pépinière A", type_site="pepiniere")


# ── LotBiologique ────────────────────────────────────────────────────────────

class TestLotBiologique:
    def test_code_auto_et_qte_actuelle(self, intrant):
        lot = LotBiologique.objects.create(
            article=intrant, espece="Anacardier",
            date_semis=date(2026, 2, 1),
            quantite_initiale=Decimal("1000"),
            quantite_actuelle=Decimal("1000"),
        )
        assert lot.code.startswith("LOT-")
        assert lot.taux_survie == Decimal("100.0")
        assert lot.phase == "semis"

    def test_phase_repiquage_et_production(self, intrant):
        lot = LotBiologique.objects.create(
            article=intrant, espece="Hévéa",
            date_semis=date(2025, 6, 1),
            date_repiquage=date(2025, 9, 1),
            quantite_initiale=Decimal("500"),
            quantite_actuelle=Decimal("500"),
        )
        # repiquage il y a > 90 jours → production
        assert lot.phase == "production"

    def test_en_alerte_si_taux_survie_bas(self, intrant):
        lot = LotBiologique.objects.create(
            article=intrant, espece="Tomate",
            date_semis=date(2026, 5, 1),
            quantite_initiale=Decimal("1000"),
            quantite_actuelle=Decimal("600"),
        )
        assert lot.taux_survie == Decimal("60.0")
        assert lot.en_alerte is True

    def test_en_alerte_si_etat_critique(self, intrant):
        lot = LotBiologique.objects.create(
            article=intrant, espece="Mil",
            date_semis=date(2026, 5, 1),
            quantite_initiale=Decimal("100"),
            quantite_actuelle=Decimal("100"),
            etat_sante="critique",
        )
        assert lot.en_alerte is True

    def test_kpis_sante(self, db, auth_client, intrant):
        LotBiologique.objects.create(
            article=intrant, espece="A", date_semis=date(2026, 5, 1),
            quantite_initiale=Decimal("100"), quantite_actuelle=Decimal("80"),
        )
        LotBiologique.objects.create(
            article=intrant, espece="B", date_semis=date(2026, 5, 1),
            quantite_initiale=Decimal("100"), quantite_actuelle=Decimal("50"),
        )
        resp = auth_client.get("/api/stocks/lots-biologiques/kpis_sante/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert data["taux_survie_moyen"] == 65.0  # (80+50)/(100+100)
        assert data["en_alerte"] == 1  # B (50%) en alerte


# ── TraceurRFID ──────────────────────────────────────────────────────────────

class TestTraceurRFID:
    def test_tag_unique(self, materiau, site):
        TraceurRFID.objects.create(
            tag_uid="RFID-001", article=materiau, site=site,
            date_pose=date(2026, 1, 15),
        )
        with pytest.raises(Exception):
            TraceurRFID.objects.create(
                tag_uid="RFID-001", article=materiau,
                date_pose=date(2026, 2, 1),
            )

    def test_est_disponible(self, materiau):
        t = TraceurRFID.objects.create(
            tag_uid="RFID-AVAIL", article=materiau, statut="en_stock",
            date_pose=date(2026, 1, 1),
        )
        assert t.est_disponible is True
        t.statut = "sorti"; t.save()
        assert t.est_disponible is False

    def test_filter_par_statut(self, db, auth_client, materiau):
        TraceurRFID.objects.create(tag_uid="A", article=materiau, statut="en_stock", date_pose=date.today())
        TraceurRFID.objects.create(tag_uid="B", article=materiau, statut="sorti", date_pose=date.today())
        resp = auth_client.get("/api/stocks/traceurs-rfid/?statut=sorti")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["tag_uid"] == "B"


# ── Dechet ───────────────────────────────────────────────────────────────────

class TestDechet:
    def test_est_valorise_auto_calcule(self, db):
        d1 = Dechet.objects.create(
            type_dechet="organique", quantite=Decimal("50"), unite="kg",
            date=date.today(), mode_traitement="compost",
        )
        d2 = Dechet.objects.create(
            type_dechet="gravats", quantite=Decimal("2"), unite="tonne",
            date=date.today(), mode_traitement="decharge",
        )
        assert d1.est_valorise is True
        assert d2.est_valorise is False

    def test_synthese_taux_valorisation(self, db, auth_client):
        Dechet.objects.create(
            type_dechet="organique", quantite=Decimal("100"), unite="kg",
            date=date.today(), mode_traitement="compost",
        )
        Dechet.objects.create(
            type_dechet="metal", quantite=Decimal("50"), unite="kg",
            date=date.today(), mode_traitement="recyclage",
        )
        Dechet.objects.create(
            type_dechet="gravats", quantite=Decimal("100"), unite="kg",
            date=date.today(), mode_traitement="decharge",
        )
        resp = auth_client.get("/api/stocks/dechets/synthese/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_quantite"] == 250.0
        assert data["valorise_quantite"] == 150.0
        assert data["taux_valorisation"] == 60.0
        assert len(data["par_type"]) == 3
