"""
Tests Sprint 2 — Devis, Facture FNE, PDF.
"""
import io
import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock
from django.utils import timezone
from datetime import timedelta

from apps.crm.models import Client
from apps.comptabilite.models import Devis, LigneDevis, Facture, LigneFacture
from apps.comptabilite.services.fne_service import FNEService


@pytest.fixture
def client_crm(db):
    return Client.objects.create(code="CLI-S2", nom="Test Client Sprint2", telephone="0700000001")


@pytest.fixture
def devis(db, client_crm):
    d = Devis.objects.create(
        client=client_crm,
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
    return d


@pytest.fixture
def facture(db, client_crm):
    f = Facture.objects.create(
        client=client_crm,
        date_echeance=timezone.now().date() + timedelta(days=30),
    )
    LigneFacture.objects.create(
        facture=f, designation="Prestation BTP",
        quantite=Decimal("2"), prix_unitaire=Decimal("50000"),
        remise_pct=Decimal("0"), taux_tva="TVA",
    )
    return f


# ── Test 1 : calcul TTC devis ────────────────────────────────────────────────

class TestDevisCalculTTC:
    def test_numerotation_auto(self, devis):
        assert devis.numero.startswith("DEV-")
        parts = devis.numero.split("-")
        assert len(parts) == 3
        assert parts[2].isdigit()

    def test_ligne_total_ht_sans_remise(self, devis):
        l1 = devis.lignes.get(designation="Terrassement")
        assert l1.total_ht == Decimal("50000")

    def test_ligne_total_ht_avec_remise(self, devis):
        l2 = devis.lignes.get(designation="Maçonnerie")
        assert l2.total_ht == Decimal("36000")

    def test_total_ht(self, devis):
        assert devis.total_ht == Decimal("86000")

    def test_total_tva_18pct(self, devis):
        assert devis.total_tva == Decimal("15480")

    def test_total_ttc(self, devis):
        assert devis.total_ttc == Decimal("101480")

    def test_remise_globale(self, db, client_crm):
        d = Devis.objects.create(
            client=client_crm,
            date_validite=timezone.now().date() + timedelta(days=30),
            remise_globale_pct=Decimal("5"),
        )
        LigneDevis.objects.create(
            devis=d, designation="Travaux", quantite=Decimal("1"),
            prix_unitaire=Decimal("100000"), remise_pct=Decimal("0"), taux_tva=Decimal("18"),
        )
        assert d.total_ht == Decimal("95000")


# ── Test 2 : conversion devis → facture ──────────────────────────────────────

class TestConversionDevisFacture:
    def test_lignes_copiees(self, devis):
        devis.statut = "accepte"
        devis.save()

        nb_lignes_devis = devis.lignes.count()

        facture = Facture.objects.create(
            client=devis.client,
            devis=devis,
            projet=devis.projet,
            date_echeance=timezone.now().date() + timedelta(days=30),
        )
        for ligne in devis.lignes.all():
            LigneFacture.objects.create(
                facture=facture,
                designation=ligne.designation,
                quantite=ligne.quantite,
                prix_unitaire=ligne.prix_unitaire,
                remise_pct=ligne.remise_pct,
                taux_tva="TVA",
            )

        assert facture.lignes.count() == nb_lignes_devis
        assert facture.devis == devis
        assert facture.client == devis.client

    def test_numerotation_facture_auto(self, facture):
        assert facture.numero_local.startswith("FAC-")

    def test_total_ht_facture(self, facture):
        assert facture.total_ht == Decimal("100000")

    def test_total_tva_18(self, facture):
        assert facture.total_tva == Decimal("18000")

    def test_total_ttc(self, facture):
        assert facture.total_ttc == Decimal("118000")


# ── Test 3 : FNEService (mock) ───────────────────────────────────────────────

class TestFNEServiceMock:
    def test_certifier_stocke_reference(self, db, facture):
        mock_response = {
            "reference":       "CI2401234520251",
            "token":           "https://fne.ci/verify/CI2401234520251",
            "balance_sticker": 12345,
            "invoice":         {"id": "inv-001", "items": [{"id": "item-1"}]},
        }

        with patch("apps.comptabilite.services.fne_service.requests.post") as mock_post:
            mock_token = MagicMock()
            mock_token.ok = True
            mock_token.json.return_value = {"access_token": "tok123", "expires_in": 3600}

            mock_sign = MagicMock()
            mock_sign.ok = True
            mock_sign.json.return_value = mock_response

            mock_post.side_effect = [mock_token, mock_sign]

            FNEService._token_cache.clear()
            svc = FNEService()
            svc.certifier_facture(facture)

        facture.refresh_from_db()
        assert facture.fne_reference    == "CI2401234520251"
        assert facture.fne_token        == "https://fne.ci/verify/CI2401234520251"
        assert facture.fne_balance_sticker == 12345
        assert facture.fne_invoice_id   == "inv-001"
        assert facture.statut           == "certifiee"
        assert facture.fne_certifiee_at is not None


# ── Test 4 : PDF contient fne_reference ──────────────────────────────────────

class TestPDFGenere:
    def test_pdf_genere_avec_fne_reference(self, facture):
        facture.fne_reference = "CI2401234520251"
        facture.fne_certifiee_at = timezone.now()
        facture.save()

        from apps.comptabilite.utils.pdf_generator import generer_facture_pdf
        buf = generer_facture_pdf(facture)

        assert isinstance(buf, io.BytesIO)
        content = buf.read()
        assert content[:4] == b'%PDF'
        assert len(content) > 2000

    def test_pdf_genere_sans_fne(self, facture):
        from apps.comptabilite.utils.pdf_generator import generer_facture_pdf
        buf = generer_facture_pdf(facture)
        content = buf.read()
        assert len(content) > 1000
