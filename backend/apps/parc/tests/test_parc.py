"""Tests Sprint 6 — Parc machines (engins, maintenance, locations)."""
from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.parc.models import Engin, Maintenance, ContratLocation
from apps.crm.models import Client


@pytest.fixture
def engin(db):
    return Engin.objects.create(
        nom="Pelleteuse Caterpillar 320",
        type_engin="pelleteuse",
        marque="Caterpillar", modele="320",
        prix_achat=Decimal("85000000"),
        tarif_location_jour=Decimal("250000"),
        duree_vie_estimee_h=Decimal("12000"),
        heures_compteur=Decimal("3500"),
        heures_revision=Decimal("4000"),
    )


@pytest.fixture
def client_crm(db):
    return Client.objects.create(code="CLI-PARC", nom="Client Location")


# ── Engin ────────────────────────────────────────────────────────────────────

class TestEngin:
    def test_code_auto_genere(self, engin):
        assert engin.code.startswith("ENG-")
        assert engin.code == "ENG-001"

    def test_codes_sequentiels(self, db):
        e1 = Engin.objects.create(nom="A", type_engin="autre")
        e2 = Engin.objects.create(nom="B", type_engin="autre")
        assert e1.code != e2.code

    def test_usure_pct(self, engin):
        # 3500 / 12000 = 29.16…
        assert engin.usure_pct == Decimal("29.2")

    def test_usure_plafonnee_a_100(self, db):
        e = Engin.objects.create(
            nom="Vieil engin", type_engin="autre",
            heures_compteur=Decimal("15000"), duree_vie_estimee_h=Decimal("10000"),
        )
        assert e.usure_pct == Decimal("100")

    def test_alerte_maintenance_si_proche(self, db):
        e = Engin.objects.create(
            nom="Proche", type_engin="autre",
            heures_compteur=Decimal("970"), heures_revision=Decimal("1000"),
        )
        assert e.heures_avant_revision == Decimal("30.0")
        assert e.en_alerte_maintenance is True

    def test_pas_d_alerte_si_loin(self, engin):
        # 3500 vs seuil 4000 → 500h restantes
        assert engin.en_alerte_maintenance is False

    def test_kpis(self, db, auth_client):
        Engin.objects.create(nom="A", type_engin="autre", statut="disponible", prix_achat=Decimal("1000000"))
        Engin.objects.create(nom="B", type_engin="autre", statut="en_chantier", prix_achat=Decimal("2000000"))
        Engin.objects.create(nom="C", type_engin="autre", statut="en_maintenance", prix_achat=Decimal("500000"))
        resp = auth_client.get("/api/parc/engins/kpis/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert data["disponibles"] == 1
        assert data["en_chantier"] == 1
        assert data["en_maintenance"] == 1
        assert data["valeur_parc"] == 3500000.0


# ── Maintenance ──────────────────────────────────────────────────────────────

class TestMaintenance:
    def test_maintenance_met_a_jour_seuil_engin(self, engin):
        # On a une révision à 4000h, on passe à 4500h
        Maintenance.objects.create(
            engin=engin, type_maintenance="revision",
            date_intervention=date.today(),
            heures_compteur_intervention=Decimal("4000"),
            description="Révision 4000h",
            prochaine_revision_heures=Decimal("4500"),
            cout=Decimal("500000"),
        )
        engin.refresh_from_db()
        assert engin.heures_revision == Decimal("4500")

    def test_corrective_ne_met_pas_a_jour_seuil(self, engin):
        seuil_initial = engin.heures_revision
        Maintenance.objects.create(
            engin=engin, type_maintenance="corrective",
            date_intervention=date.today(),
            heures_compteur_intervention=Decimal("3600"),
            description="Réparation flexible hydraulique",
            prochaine_revision_heures=Decimal("9999"),  # ignoré
            cout=Decimal("80000"),
        )
        engin.refresh_from_db()
        assert engin.heures_revision == seuil_initial


# ── ContratLocation ──────────────────────────────────────────────────────────

class TestContratLocation:
    def test_numero_auto_avec_annee(self, engin, client_crm):
        c = ContratLocation.objects.create(
            engin=engin, client=client_crm,
            date_debut=date.today(),
            date_fin_prevue=date.today() + timedelta(days=10),
        )
        assert c.numero.startswith("LOC-")
        assert str(date.today().year) in c.numero

    def test_tarif_jour_repris_de_engin(self, engin, client_crm):
        c = ContratLocation.objects.create(
            engin=engin, client=client_crm,
            date_debut=date.today(),
            date_fin_prevue=date.today() + timedelta(days=5),
        )
        assert c.tarif_jour == Decimal("250000")

    def test_montant_facturable(self, engin, client_crm):
        c = ContratLocation.objects.create(
            engin=engin, client=client_crm,
            date_debut=date(2026, 5, 1),
            date_fin_prevue=date(2026, 5, 10),  # 10 jours inclus
            tarif_jour=Decimal("100000"),
        )
        assert c.nb_jours == 10
        assert c.montant_facturable == Decimal("1000000")

    def test_est_externe(self, engin, client_crm):
        externe = ContratLocation.objects.create(
            engin=engin, client=client_crm,
            date_debut=date.today(), date_fin_prevue=date.today(),
        )
        assert externe.est_externe is True

    def test_filter_par_statut(self, db, auth_client, engin, client_crm):
        ContratLocation.objects.create(
            engin=engin, client=client_crm, statut="en_cours",
            date_debut=date.today(), date_fin_prevue=date.today(),
        )
        ContratLocation.objects.create(
            engin=engin, client=client_crm, statut="termine",
            date_debut=date.today(), date_fin_prevue=date.today(),
        )
        resp = auth_client.get("/api/parc/locations/?statut=termine")
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 1
