import pytest
from decimal import Decimal
from datetime import date
from apps.projets.models import Projet, TacheProjet, AffectationTache, RealisationTache
from apps.rh.models import Employe


@pytest.fixture
def projet(db):
    return Projet.objects.create(code="PRJ-001", nom="Test projet", type_projet="btp")


@pytest.fixture
def employe(db):
    return Employe.objects.create(
        code="EMP-001", nom="Koné", prenom="Seydou",
        type_contrat="journalier", taux_journalier=Decimal("5000"),
    )


@pytest.fixture
def tache(projet):
    return TacheProjet.objects.create(
        projet=projet,
        nom="Coulage fondation",
        type_objectif="volume",
        unite_label="m³",
        objectif_cible=Decimal("50"),
        tarif_unitaire=Decimal("10000"),
    )


@pytest.fixture
def affectation(tache, employe):
    return AffectationTache.objects.create(
        tache=tache,
        employe=employe,
        date_affectation=date(2026, 5, 5),
        objectif_individuel=Decimal("25"),
    )


@pytest.mark.django_db
def test_realisation_calcule_montant(affectation):
    """montant_calcule est auto-calculé = quantite × tarif_unitaire."""
    r = RealisationTache.objects.create(
        affectation=affectation,
        date=date(2026, 5, 5),
        quantite_realisee=Decimal("5"),
    )
    assert r.montant_calcule == Decimal("50000")


@pytest.mark.django_db
def test_affectation_progression_pct(affectation):
    """progression_pct = total_realise / objectif_individuel × 100."""
    RealisationTache.objects.create(
        affectation=affectation, date=date(2026, 5, 5), quantite_realisee=Decimal("10"),
    )
    RealisationTache.objects.create(
        affectation=affectation, date=date(2026, 5, 6), quantite_realisee=Decimal("5"),
    )
    affectation.refresh_from_db()
    assert affectation.progression_pct == 60.0


@pytest.mark.django_db
def test_tache_total_realise_multiple_affectations(tache, employe, projet):
    """total_realise agrège les réalisations de toutes les affectations."""
    employe2 = Employe.objects.create(
        code="EMP-002", nom="Diallo", prenom="Ibrahim",
        type_contrat="journalier", taux_journalier=Decimal("5000"),
    )
    aff1 = AffectationTache.objects.create(
        tache=tache, employe=employe, date_affectation=date(2026, 5, 5), objectif_individuel=25,
    )
    aff2 = AffectationTache.objects.create(
        tache=tache, employe=employe2, date_affectation=date(2026, 5, 5), objectif_individuel=25,
    )
    RealisationTache.objects.create(affectation=aff1, date=date(2026, 5, 5), quantite_realisee=Decimal("12"))
    RealisationTache.objects.create(affectation=aff2, date=date(2026, 5, 5), quantite_realisee=Decimal("18"))
    assert tache.total_realise == Decimal("30")
    assert tache.progression_pct == 60.0
