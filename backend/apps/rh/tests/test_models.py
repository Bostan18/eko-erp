import pytest
from decimal import Decimal
from django.utils import timezone
from apps.rh.models import Employe, PresenceJournaliere


@pytest.fixture
def employe_journalier(db):
    return Employe.objects.create(
        code="EMP-001", nom="Koné", prenom="Moussa",
        type_contrat="journalier", taux_journalier=Decimal("5000"),
        statut="actif",
    )


@pytest.fixture
def employe_cdi(db):
    return Employe.objects.create(
        code="EMP-002", nom="Diallo", prenom="Fatou",
        type_contrat="cdi", salaire_mensuel=Decimal("150000"),
        statut="actif",
    )


class TestEmploye:
    def test_nom_complet(self, employe_journalier):
        assert employe_journalier.nom_complet == "Koné Moussa"

    def test_soft_delete_flag(self, employe_journalier):
        employe_journalier.is_deleted = True
        employe_journalier.save()
        assert Employe.objects.filter(is_deleted=False, code="EMP-001").count() == 0

    def test_actif_par_defaut(self, employe_journalier):
        assert employe_journalier.statut == "actif"

    def test_code_unique(self, employe_journalier, db):
        with pytest.raises(Exception):
            Employe.objects.create(
                code="EMP-001", nom="Autre", prenom="Test",
                type_contrat="journalier", taux_journalier=Decimal("3000"),
            )


class TestPresenceJournaliere:
    def test_montant_du_present(self, employe_journalier):
        p = PresenceJournaliere.objects.create(
            employe=employe_journalier,
            date=timezone.now().date(),
            present=True,
            heures_travaillees=Decimal("8"),
        )
        assert p.montant_du == Decimal("5000")

    def test_montant_du_absent(self, employe_journalier):
        p = PresenceJournaliere.objects.create(
            employe=employe_journalier,
            date=timezone.now().date(),
            present=False,
        )
        assert p.montant_du == Decimal("0")

    def test_cdi_sans_taux_montant_nul(self, employe_cdi):
        # CDI n'a pas de taux_journalier → montant_du reste à 0
        p = PresenceJournaliere.objects.create(
            employe=employe_cdi,
            date=timezone.now().date(),
            present=True,
        )
        assert p.montant_du == Decimal("0")

    def test_unicite_employe_date(self, employe_journalier):
        today = timezone.now().date()
        PresenceJournaliere.objects.create(
            employe=employe_journalier, date=today, present=True,
        )
        with pytest.raises(Exception):
            PresenceJournaliere.objects.create(
                employe=employe_journalier, date=today, present=False,
            )
