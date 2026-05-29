"""Tests Sprint 9 — Bilan Carbone & ESG."""
from datetime import date
from decimal import Decimal

import pytest

from apps.stocks.models import Article, LotBiologique, Dechet
from apps.parc.models import Engin
from apps.rh.models import Employe, Certification
from apps.reporting.models import Rapport
from apps.reporting.services.co2 import (
    co2_sequestre_lot, co2_emis_engin, score_esg,
    SEQUESTRATION_KG_PAR_PLANT_PAR_AN, FACTEUR_DIESEL_KG_CO2_PAR_L,
)


# ── Service de calcul ────────────────────────────────────────────────────────

class TestServiceCO2:
    def test_sequestration_lot_actif(self, db):
        art = Article.objects.create(code="ART-CO2", nom="Anacardier", categorie="intrant")
        lot = LotBiologique.objects.create(
            article=art, espece="Anacardier",
            date_semis=date(2025, 1, 1),
            quantite_initiale=Decimal("1000"),
            quantite_actuelle=Decimal("800"),
        )
        # 800 × 20 = 16000 kg
        assert co2_sequestre_lot(lot) == Decimal("16000")

    def test_lot_perdu_pas_de_sequestration(self, db):
        art = Article.objects.create(code="ART-CO2L", nom="Perdu", categorie="intrant")
        lot = LotBiologique.objects.create(
            article=art, espece="Perdu",
            date_semis=date(2025, 1, 1),
            quantite_initiale=Decimal("100"),
            quantite_actuelle=Decimal("0"),
            etat_sante="perdu",
        )
        assert co2_sequestre_lot(lot) == Decimal("0")

    def test_emission_engin_pelleteuse(self, db):
        e = Engin.objects.create(
            nom="Pell", type_engin="pelleteuse",
            heures_compteur=Decimal("100"),
        )
        # 100h × 15 L/h × 2.64 kg/L = 3960 kg
        assert co2_emis_engin(e) == Decimal("3960.00")

    def test_score_esg_moyenne(self):
        assert score_esg(Decimal("80"), Decimal("60"), Decimal("70")) == Decimal("70.0")


# ── Endpoint bilan_carbone ───────────────────────────────────────────────────

class TestBilanCarbone:
    def test_agreges(self, db, auth_client):
        art = Article.objects.create(code="ART-BC", nom="Hévéa", categorie="intrant")
        LotBiologique.objects.create(
            article=art, espece="Hévéa",
            date_semis=date(2025, 1, 1),
            quantite_initiale=Decimal("500"),
            quantite_actuelle=Decimal("500"),
        )
        Engin.objects.create(nom="Camion", type_engin="camion_benne", heures_compteur=Decimal("200"))

        resp = auth_client.get("/api/reporting/bilan-carbone/")
        assert resp.status_code == 200
        data = resp.json()
        # 500 × 20 = 10000
        assert data["co2_sequestre_kg"] == 10000.0
        # 200 × 10 × 2.64 = 5280
        assert data["co2_emis_kg"] == 5280.0
        assert data["solde_net_kg"] == 4720.0
        assert data["nb_lots"] == 1
        assert data["nb_engins"] == 1
        assert any(e["espece"] == "Hévéa" for e in data["par_espece"])


# ── Endpoint esg ─────────────────────────────────────────────────────────────

class TestESG:
    def test_score_global_present(self, db, auth_client):
        # crée quelques données pour avoir tous les axes peuplés
        Employe.objects.create(
            code="EMP-ESG1", nom="A", prenom="X",
            type_contrat="cdi", salaire_mensuel=Decimal("300000"),
        )
        Dechet.objects.create(
            type_dechet="organique", quantite=Decimal("100"), unite="kg",
            date=date.today(), mode_traitement="compost",
        )
        resp = auth_client.get("/api/reporting/esg/")
        assert resp.status_code == 200
        data = resp.json()
        assert "score_global" in data
        assert 0 <= data["score_global"] <= 100
        assert "environnement" in data
        assert "social" in data
        assert "gouvernance" in data
        # Avec 100% dechets valorisés → env taux_valorisation = 100
        assert data["environnement"]["taux_valorisation_dechets"] == 100.0
        # 1 CDI sur 1 actif → 100%
        assert data["social"]["pct_cdi"] == 100.0


# ── Rapport ──────────────────────────────────────────────────────────────────

class TestRapport:
    def test_creation_et_pdf(self, db, auth_client):
        resp = auth_client.post("/api/reporting/rapports/", {
            "titre": "Bilan T1 2026",
            "type_rapport": "bilan_carbone",
            "periode_debut": "2026-01-01",
            "periode_fin": "2026-03-31",
            "genere_par": "RSE",
        }, format="json")
        assert resp.status_code == 201, resp.content
        rid = resp.json()["id"]

        pdf_resp = auth_client.get(f"/api/reporting/rapports/{rid}/pdf/")
        assert pdf_resp.status_code == 200
        assert pdf_resp["Content-Type"] == "application/pdf"
        assert pdf_resp.content[:4] == b"%PDF"

    def test_pdf_esg(self, db, auth_client):
        r = Rapport.objects.create(
            titre="ESG 2026", type_rapport="esg",
            periode_debut=date(2026, 1, 1), periode_fin=date(2026, 12, 31),
        )
        resp = auth_client.get(f"/api/reporting/rapports/{r.id}/pdf/")
        assert resp.status_code == 200
        assert resp.content[:4] == b"%PDF"
