import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from apps.crm.models import Client
from apps.comptabilite.models import Facture, LigneFacture, Paiement


@pytest.fixture
def client_crm(db):
    return Client.objects.create(code="CLI-TEST", nom="EKO Client Test", telephone="0700000000")


@pytest.fixture
def facture(db, client_crm):
    f = Facture.objects.create(
        client=client_crm,
        date_echeance=timezone.now().date() + timedelta(days=30),
    )
    LigneFacture.objects.create(
        facture=f, designation="Prestation BTP",
        quantite=Decimal("2"), prix_unitaire=Decimal("50000"),
        taux_tva="TVA",
    )
    return f


class TestFacture:
    def test_total_ht(self, facture):
        assert facture.total_ht == Decimal("100000")

    def test_total_tva_18(self, facture):
        assert facture.total_tva == Decimal("18000")

    def test_total_ttc(self, facture):
        assert facture.total_ttc == Decimal("118000")

    def test_solde_restant_initial(self, facture):
        assert facture.solde_restant == Decimal("118000")

    def test_statut_par_defaut(self, facture):
        assert facture.statut == "brouillon"


class TestPaiement:
    def test_paiement_partiel_met_a_jour_montant(self, facture):
        Paiement.objects.create(
            facture=facture, montant=Decimal("50000"),
            mode="virement", date=timezone.now().date(),
        )
        facture.refresh_from_db()
        assert facture.montant_paye == Decimal("50000")
        assert facture.solde_restant == Decimal("68000")
        assert facture.statut == "brouillon"

    def test_paiement_total_marque_payee(self, facture):
        Paiement.objects.create(
            facture=facture, montant=Decimal("118000"),
            mode="especes", date=timezone.now().date(),
        )
        facture.refresh_from_db()
        assert facture.statut == "payee"
        assert facture.solde_restant == Decimal("0")

    def test_paiements_cumulatifs(self, facture):
        Paiement.objects.create(
            facture=facture, montant=Decimal("60000"),
            mode="virement", date=timezone.now().date(),
        )
        Paiement.objects.create(
            facture=facture, montant=Decimal("58000"),
            mode="especes", date=timezone.now().date(),
        )
        facture.refresh_from_db()
        assert facture.statut == "payee"
