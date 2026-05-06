import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestKpisEndpoint:
    def test_non_authentifie(self, api_client):
        response = api_client.get("/api/reporting/kpis/")
        assert response.status_code == 401

    def test_authentifie_retourne_200(self, auth_client):
        response = auth_client.get("/api/reporting/kpis/")
        assert response.status_code == 200

    def test_structure_response(self, auth_client):
        data = auth_client.get("/api/reporting/kpis/").data
        assert "rh"      in data
        assert "projets" in data
        assert "crm"     in data
        assert "stocks"  in data
        assert "finance" in data

    def test_rh_champs(self, auth_client):
        rh = auth_client.get("/api/reporting/kpis/").data["rh"]
        assert "employes_actifs"       in rh
        assert "presences_aujourd_hui" in rh
        assert "masse_salariale_mois"  in rh

    def test_finance_champs(self, auth_client):
        finance = auth_client.get("/api/reporting/kpis/").data["finance"]
        assert "ca_facture"         in finance
        assert "ca_encaisse"        in finance
        assert "charges_mois"       in finance
        assert "marge_mois"         in finance
        assert "factures_en_retard" in finance

    def test_valeurs_numeriques(self, auth_client):
        data = auth_client.get("/api/reporting/kpis/").data
        assert isinstance(data["rh"]["employes_actifs"], int)
        assert isinstance(data["stocks"]["alertes"], int)
        assert isinstance(data["finance"]["ca_facture"], float)
