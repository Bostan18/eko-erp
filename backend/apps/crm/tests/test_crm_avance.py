"""Tests Sprint 4 — CRM avancé (opportunités, contrats, devis typés)."""
from datetime import date
from decimal import Decimal

import pytest

from apps.crm.models import Client, Opportunite, Contrat


@pytest.fixture
def client_crm(db):
    return Client.objects.create(code="CLI-S4", nom="Client S4")


class TestOpportunite:
    def test_valeur_ponderee(self, client_crm):
        o = Opportunite.objects.create(
            titre="Chantier", client=client_crm, phase="negociation",
            probabilite=70, valeur_estimee=Decimal("10000000"),
        )
        assert o.valeur_ponderee == Decimal("7000000.00")
        assert o.est_ouverte is True

    def test_phase_terminale_fermee(self, client_crm):
        o = Opportunite.objects.create(
            titre="Perdu", client=client_crm, phase="perdue", probabilite=0,
        )
        assert o.est_ouverte is False

    def test_pipeline_filtre_par_phase(self, db, auth_client, client_crm):
        Opportunite.objects.create(titre="A", client=client_crm, phase="proposition")
        Opportunite.objects.create(titre="B", client=client_crm, phase="gagnee")
        resp = auth_client.get("/api/crm/opportunites/?phase=proposition")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["titre"] == "A"


class TestContrat:
    def test_numero_auto(self, client_crm):
        c = Contrat.objects.create(
            client=client_crm, objet="Entretien", type_contrat="maintenance",
            date_debut=date.today(),
        )
        assert c.numero.startswith("CTR-")

    def test_numeros_sequentiels(self, client_crm):
        c1 = Contrat.objects.create(client=client_crm, objet="A", date_debut=date.today())
        c2 = Contrat.objects.create(client=client_crm, objet="B", date_debut=date.today())
        assert c1.numero != c2.numero


class TestDevisLigneTypee:
    def test_ligne_devis_porte_un_centre(self, db, auth_client, client_crm):
        from apps.core.models import CentreCout
        from apps.comptabilite.models import Devis, LigneDevis
        btp = CentreCout.objects.create(code="btp-t", nom="BTP")
        devis = Devis.objects.create(client=client_crm)
        ligne = LigneDevis.objects.create(
            devis=devis, designation="Terrassement", centre_cout=btp,
            quantite=Decimal("1"), prix_unitaire=Decimal("100000"),
        )
        resp = auth_client.get(f"/api/comptabilite/lignes-devis/?devis={devis.id}")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert results[0]["centre_cout_display"] == "BTP"
