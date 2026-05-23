"""Tests Sprint 8 — RH avancé (congés, compétences, certifications, contrats)."""
from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.rh.models import (
    Employe, Conge, Competence, CompetenceEmploye, Certification, HistoriqueContrat,
)


@pytest.fixture
def employe(db):
    return Employe.objects.create(
        code="EMP-S8", nom="Koné", prenom="Adama",
        type_contrat="cdi", poste="Chef chantier",
        salaire_mensuel=Decimal("450000"),
    )


# ── Conge ────────────────────────────────────────────────────────────────────

class TestConge:
    def test_nb_jours(self, employe):
        c = Conge.objects.create(
            employe=employe, type_conge="conges_payes",
            date_debut=date(2026, 6, 1), date_fin=date(2026, 6, 10),
        )
        assert c.nb_jours == 10

    def test_workflow_approuver(self, db, auth_client, employe):
        c = Conge.objects.create(
            employe=employe, date_debut=date.today(),
            date_fin=date.today() + timedelta(days=5),
        )
        resp = auth_client.post(f"/api/rh/conges/{c.id}/approuver/", {"approuve_par": "RH"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["statut"] == "approuve"
        assert resp.json()["approuve_par"] == "RH"

    def test_workflow_refuser(self, db, auth_client, employe):
        c = Conge.objects.create(
            employe=employe, date_debut=date.today(),
            date_fin=date.today() + timedelta(days=2),
        )
        resp = auth_client.post(f"/api/rh/conges/{c.id}/refuser/", {"approuve_par": "RH"}, format="json")
        assert resp.status_code == 200
        assert resp.json()["statut"] == "refuse"

    def test_400_si_deja_approuve(self, db, auth_client, employe):
        c = Conge.objects.create(
            employe=employe, date_debut=date.today(), date_fin=date.today(),
            statut="approuve",
        )
        resp = auth_client.post(f"/api/rh/conges/{c.id}/refuser/")
        assert resp.status_code == 400


# ── Competence ───────────────────────────────────────────────────────────────

class TestCompetence:
    def test_unique_employe_competence(self, employe):
        c = Competence.objects.create(code="SKL-MAC", libelle="Maçonnerie", categorie="technique")
        CompetenceEmploye.objects.create(employe=employe, competence=c, niveau=3)
        with pytest.raises(Exception):
            CompetenceEmploye.objects.create(employe=employe, competence=c, niveau=4)

    def test_filter_par_categorie(self, db, auth_client):
        Competence.objects.create(code="SKL-A", libelle="A", categorie="technique")
        Competence.objects.create(code="SKL-B", libelle="B", categorie="conduite_engin")
        resp = auth_client.get("/api/rh/competences/?categorie=conduite_engin")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["code"] == "SKL-B"


# ── Certification ────────────────────────────────────────────────────────────

class TestCertification:
    def test_statut_sans_expiration(self, employe):
        c = Certification.objects.create(
            employe=employe, libelle="CAP maçon",
            date_obtention=date(2015, 6, 1),
        )
        assert c.statut == "sans_expiration"

    def test_statut_valide(self, employe):
        c = Certification.objects.create(
            employe=employe, libelle="Permis CACES",
            date_obtention=date(2024, 1, 1),
            date_expiration=date.today() + timedelta(days=180),
        )
        assert c.statut == "valide"

    def test_statut_bientot_expiree(self, employe):
        c = Certification.objects.create(
            employe=employe, libelle="Visite médicale",
            date_obtention=date(2024, 1, 1),
            date_expiration=date.today() + timedelta(days=30),
        )
        assert c.statut == "bientot_expiree"

    def test_statut_expiree(self, employe):
        c = Certification.objects.create(
            employe=employe, libelle="Habilitation électrique",
            date_obtention=date(2020, 1, 1),
            date_expiration=date(2025, 1, 1),
        )
        assert c.statut == "expiree"


# ── HistoriqueContrat ────────────────────────────────────────────────────────

class TestHistoriqueContrat:
    def test_est_en_cours_si_date_fin_nulle(self, employe):
        h = HistoriqueContrat.objects.create(
            employe=employe, type_contrat="cdi", poste="Ouvrier",
            date_debut=date(2024, 1, 1), salaire_mensuel=Decimal("300000"),
        )
        assert h.est_en_cours is True

    def test_filter_par_employe(self, db, auth_client, employe):
        HistoriqueContrat.objects.create(
            employe=employe, type_contrat="journalier",
            date_debut=date(2023, 1, 1), date_fin=date(2023, 12, 31),
            taux_journalier=Decimal("3000"),
        )
        HistoriqueContrat.objects.create(
            employe=employe, type_contrat="cdi",
            date_debut=date(2024, 1, 1), salaire_mensuel=Decimal("400000"),
        )
        resp = auth_client.get(f"/api/rh/historique-contrats/?employe={employe.id}")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 2
