"""
Tests EntrepriseConfig singleton et garde FNE.
"""
import pytest
from apps.core.models import EntrepriseConfig


class TestEntrepriseConfigSingleton:
    def test_get_returns_same_object(self, db):
        config1 = EntrepriseConfig.get()
        config2 = EntrepriseConfig.get()
        assert config1.pk == config2.pk == 1

    def test_default_fne_inactif(self, db):
        config = EntrepriseConfig.get()
        assert config.fne_actif is False

    def test_default_prefixes(self, db):
        config = EntrepriseConfig.get()
        assert config.prefixe_devis   == "DEV"
        assert config.prefixe_facture == "FAC"

    def test_update_persiste(self, db):
        config = EntrepriseConfig.get()
        config.raison_sociale = "EKO SARL TEST"
        config.save()
        config_relu = EntrepriseConfig.get()
        assert config_relu.raison_sociale == "EKO SARL TEST"


class TestFNECertificationSimulation:
    """FNE inactive → la certification bascule en mode simulation (S1),
    à condition qu'il reste des stickers."""

    def _facture(self):
        from apps.crm.models import Client
        from apps.comptabilite.models import Facture, LigneFacture
        from decimal import Decimal
        client = Client.objects.create(code="CLI-FNE", nom="Test FNE", telephone="0700000002")
        facture = Facture.objects.create(client=client)
        LigneFacture.objects.create(
            facture=facture, designation="Test", quantite=Decimal("1"),
            prix_unitaire=Decimal("10000"), taux_tva="TVA",
        )
        return facture

    def test_certifier_sans_stickers_retourne_400(self, db, auth_client):
        facture = self._facture()
        assert not EntrepriseConfig.get().fne_actif

        resp = auth_client.post(f"/api/comptabilite/factures/{facture.pk}/certifier/")
        assert resp.status_code == 400
        assert "sticker" in resp.json()["detail"].lower()

    def test_certifier_en_simulation_si_stickers_dispo(self, db, auth_client):
        from apps.comptabilite.models import StickerAchat
        from datetime import date
        StickerAchat.objects.create(date=date.today(), quantite=10, montant=0)

        facture = self._facture()
        assert not EntrepriseConfig.get().fne_actif

        resp = auth_client.post(f"/api/comptabilite/factures/{facture.pk}/certifier/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["simulation"] is True
        assert data["statut"] == "certifiee"
        assert data["fne_reference"]
