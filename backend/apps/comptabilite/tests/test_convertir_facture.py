"""
Tests pour l'action POST /api/comptabilite/devis/{id}/convertir-facture/.
Sprint 2 CRM — Devis → Facture en 1 clic.
"""
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.crm.models import Client
from apps.comptabilite.models import Devis, LigneDevis, Facture, LigneFacture


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client_crm(db):
    return Client.objects.create(code="CLI-CV", nom="Client Conversion", telephone="0700001111")


@pytest.fixture
def devis_accepte(db, client_crm):
    d = Devis.objects.create(
        client=client_crm,
        statut="accepte",
        date_validite=timezone.now().date() + timedelta(days=30),
    )
    LigneDevis.objects.create(
        devis=d, designation="Terrassement", quantite=Decimal("10"),
        prix_unitaire=Decimal("5000"), remise_pct=Decimal("0"), taux_tva=Decimal("18"),
    )
    LigneDevis.objects.create(
        devis=d, designation="Maçonnerie", quantite=Decimal("5"),
        prix_unitaire=Decimal("8000"), remise_pct=Decimal("10"), taux_tva=Decimal("18"),
    )
    LigneDevis.objects.create(
        devis=d, designation="Frais divers", quantite=Decimal("1"),
        prix_unitaire=Decimal("2000"), remise_pct=Decimal("0"), taux_tva=Decimal("9"),
    )
    return d


@pytest.fixture
def devis_brouillon(db, client_crm):
    return Devis.objects.create(client=client_crm, statut="brouillon")


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestConvertirFacture:

    def test_conversion_cree_facture_et_lignes(self, auth_client, devis_accepte):
        url = f"/api/comptabilite/devis/{devis_accepte.id}/convertir-facture/"
        resp = auth_client.post(url)

        assert resp.status_code == 201
        body = resp.json()
        assert "facture_id" in body
        assert "numero_local" in body
        assert "redirect_url" in body
        assert body["redirect_url"] == f"/comptabilite/factures/{body['facture_id']}"

        facture = Facture.objects.get(id=body["facture_id"])
        assert facture.client_id == devis_accepte.client_id
        assert facture.statut == "brouillon"
        assert facture.devis_id == devis_accepte.id
        assert facture.notes == f"Générée depuis devis {devis_accepte.numero}"
        # Échéance = J+30
        delta = (facture.date_echeance - timezone.now().date()).days
        assert delta == 30

        # 3 lignes copiées avec les bons champs
        lignes = list(facture.lignes.order_by("created_at"))
        assert len(lignes) == 3

        l1 = lignes[0]
        assert l1.designation == "Terrassement"
        assert l1.quantite == Decimal("10.000")
        assert l1.prix_unitaire == Decimal("5000.00")
        assert l1.remise_pct == Decimal("0.00")
        assert l1.taux_tva == "TVA"  # 18% → TVA

        l3 = lignes[2]
        assert l3.taux_tva == "TVAB"  # 9% → TVAB

        # devis.facture_liee est renseigné (reverse OneToOne)
        devis_accepte.refresh_from_db()
        assert devis_accepte.facture_liee.id == facture.id

    def test_conversion_devis_non_accepte_retourne_400(self, auth_client, devis_brouillon):
        url = f"/api/comptabilite/devis/{devis_brouillon.id}/convertir-facture/"
        resp = auth_client.post(url)

        assert resp.status_code == 400
        assert "accept" in resp.json()["detail"].lower()
        # Aucune facture créée
        assert not Facture.objects.filter(devis=devis_brouillon).exists()

    def test_conversion_double_retourne_400(self, auth_client, devis_accepte):
        url = f"/api/comptabilite/devis/{devis_accepte.id}/convertir-facture/"

        # Première conversion → 201
        r1 = auth_client.post(url)
        assert r1.status_code == 201
        numero_facture = r1.json()["numero_local"]

        # Deuxième conversion → 400 mentionnant le numéro
        r2 = auth_client.post(url)
        assert r2.status_code == 400
        detail = r2.json()["detail"]
        assert numero_facture in detail
        assert "déjà" in detail.lower() or "deja" in detail.lower()

        # Toujours une seule facture liée
        assert Facture.objects.filter(devis=devis_accepte).count() == 1

    def test_conversion_devis_inexistant_retourne_404(self, auth_client):
        resp = auth_client.post("/api/comptabilite/devis/999999/convertir-facture/")
        assert resp.status_code == 404

    def test_conversion_atomique(self, auth_client, devis_accepte):
        """
        Si la création d'une LigneFacture échoue, ni la facture ni les lignes
        partielles ne doivent rester en base (rollback complet).
        """
        nb_factures_avant = Facture.objects.count()
        nb_lignes_avant = LigneFacture.objects.count()

        # On fait planter le 2e LigneFacture.objects.create
        original_create = LigneFacture.objects.create
        compteur = {"n": 0}

        def create_qui_plante(*args, **kwargs):
            compteur["n"] += 1
            if compteur["n"] == 2:
                raise RuntimeError("Erreur simulée création ligne")
            return original_create(*args, **kwargs)

        with patch.object(LigneFacture.objects, "create", side_effect=create_qui_plante):
            with pytest.raises(RuntimeError):
                url = f"/api/comptabilite/devis/{devis_accepte.id}/convertir-facture/"
                auth_client.post(url)

        # Rollback : rien n'a été persisté
        assert Facture.objects.count() == nb_factures_avant
        assert LigneFacture.objects.count() == nb_lignes_avant
        devis_accepte.refresh_from_db()
        with pytest.raises(Facture.DoesNotExist):
            _ = devis_accepte.facture_liee
