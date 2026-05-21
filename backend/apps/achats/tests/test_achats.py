"""Tests Sprint 2 — Achats & Trésorerie."""
from datetime import date
from decimal import Decimal

import pytest

from apps.achats.models import (
    Fournisseur, FactureAchat, CompteBancaire, MouvementTresorerie,
)


@pytest.fixture
def fournisseur(db):
    return Fournisseur.objects.create(nom="Ciments CI", categorie="materiaux")


class TestNumerotation:
    def test_code_fournisseur_auto(self, fournisseur):
        assert fournisseur.code.startswith("FOU-")

    def test_numero_facture_auto(self, db, fournisseur):
        fa = FactureAchat.objects.create(
            fournisseur=fournisseur, libelle="Test", date=date.today(),
            montant_ht=Decimal("1000"),
        )
        assert fa.numero.startswith("FA-")


class TestTotauxFactureAchat:
    def test_tva_et_ttc(self, db, fournisseur):
        fa = FactureAchat.objects.create(
            fournisseur=fournisseur, libelle="Ciment", date=date.today(),
            montant_ht=Decimal("1000000"), taux_tva=Decimal("18"),
        )
        assert fa.montant_tva == Decimal("180000.00")
        assert fa.total_ttc == Decimal("1180000.00")
        assert fa.solde_restant == Decimal("1180000.00")


class TestCompteSolde:
    def test_solde_actuel_avec_mouvements(self, db):
        compte = CompteBancaire.objects.create(nom="Caisse", solde_initial=Decimal("5000000"))
        MouvementTresorerie.objects.create(
            compte=compte, date=date.today(), sens="entree",
            montant=Decimal("200000"), libelle="Apport",
        )
        MouvementTresorerie.objects.create(
            compte=compte, date=date.today(), sens="sortie",
            montant=Decimal("1180000"), libelle="Achat",
        )
        assert compte.solde_actuel == Decimal("4020000")


class TestDecaissementSurFacture:
    def test_paiement_total_passe_facture_a_payee(self, db, fournisseur):
        compte = CompteBancaire.objects.create(nom="SGBCI", solde_initial=Decimal("10000000"))
        fa = FactureAchat.objects.create(
            fournisseur=fournisseur, libelle="Ciment", date=date.today(),
            montant_ht=Decimal("1000000"), taux_tva=Decimal("18"), statut="validee",
        )
        MouvementTresorerie.objects.create(
            compte=compte, date=date.today(), sens="sortie",
            montant=fa.total_ttc, libelle="Règlement", facture_achat=fa,
        )
        fa.refresh_from_db()
        assert fa.montant_paye == Decimal("1180000.00")
        assert fa.statut == "payee"
        assert fa.solde_restant == Decimal("0.00")

    def test_paiement_partiel_reste_du(self, db, fournisseur):
        compte = CompteBancaire.objects.create(nom="SGBCI", solde_initial=Decimal("10000000"))
        fa = FactureAchat.objects.create(
            fournisseur=fournisseur, libelle="Ciment", date=date.today(),
            montant_ht=Decimal("1000000"), taux_tva=Decimal("18"), statut="validee",
        )
        MouvementTresorerie.objects.create(
            compte=compte, date=date.today(), sens="sortie",
            montant=Decimal("180000"), libelle="Acompte", facture_achat=fa,
        )
        fa.refresh_from_db()
        assert fa.montant_paye == Decimal("180000")
        assert fa.statut == "validee"


class TestTresorerieKpisAPI:
    def test_kpis_endpoint(self, db, auth_client):
        compte = CompteBancaire.objects.create(nom="Caisse", solde_initial=Decimal("1000000"))
        MouvementTresorerie.objects.create(
            compte=compte, date=date.today(), sens="sortie",
            montant=Decimal("300000"), libelle="Achat",
        )
        resp = auth_client.get("/api/achats/tresorerie/kpis/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["solde_total"] == 700000.0
        assert data["sorties_mois"] == 300000.0
        assert data["flux_net_mois"] == -300000.0
