"""Tests Sprint 5 — Opérations terrain (sites, référentiel tâches, logs)."""
from datetime import date
from decimal import Decimal

import pytest

from apps.operations.models import Site, TacheCatalogue
from apps.projets.models import Projet, TacheProjet, AffectationTache, RealisationTache
from apps.rh.models import Employe, PresenceJournaliere


@pytest.fixture
def projet(db):
    return Projet.objects.create(code="PRJ-S5", nom="Chantier S5", type_projet="btp")


@pytest.fixture
def employe_journalier(db):
    return Employe.objects.create(
        code="EMP-S5", nom="Diomandé", prenom="Issa",
        type_contrat="journalier", taux_journalier=Decimal("3000"),
    )


# ── Site ─────────────────────────────────────────────────────────────────────

class TestSite:
    def test_code_auto_genere(self, projet):
        s = Site.objects.create(nom="Zone A", projet=projet, type_site="chantier")
        assert s.code.startswith("SIT-")
        assert s.code == "SIT-001"

    def test_codes_sequentiels(self, projet):
        s1 = Site.objects.create(nom="A", projet=projet)
        s2 = Site.objects.create(nom="B", projet=projet)
        assert s1.code != s2.code

    def test_api_list_filter(self, db, auth_client, projet):
        Site.objects.create(nom="Chantier", projet=projet, type_site="chantier")
        Site.objects.create(nom="Pépi", type_site="pepiniere")
        resp = auth_client.get("/api/operations/sites/?type_site=pepiniere")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["nom"] == "Pépi"


# ── TacheCatalogue ───────────────────────────────────────────────────────────

class TestTacheCatalogue:
    def test_code_auto_genere(self, db):
        t = TacheCatalogue.objects.create(
            libelle="Repiquage plant", type_objectif="unite",
            unite_label="plants", tarif_reference=Decimal("50"),
        )
        assert t.code.startswith("TAC-")

    def test_api_list(self, db, auth_client):
        TacheCatalogue.objects.create(libelle="Bêchage", type_objectif="surface", unite_label="m²")
        resp = auth_client.get("/api/operations/taches-catalogue/")
        assert resp.status_code == 200
        data = resp.json()
        results = data.get("results", data)
        assert len(results) == 1
        assert results[0]["libelle"] == "Bêchage"


# ── Extensions FK existantes ─────────────────────────────────────────────────

class TestExtensionsFK:
    def test_presence_avec_site(self, db, employe_journalier, projet):
        site = Site.objects.create(nom="Zone B", projet=projet)
        p = PresenceJournaliere.objects.create(
            employe=employe_journalier, date=date(2026, 5, 22), site=site,
        )
        assert p.site == site
        # le montant_du auto-calculé tient toujours
        assert p.montant_du == Decimal("3000.00")

    def test_tacheprojet_lie_catalogue(self, projet, db):
        cat = TacheCatalogue.objects.create(libelle="Plantation", unite_label="plants")
        t = TacheProjet.objects.create(
            projet=projet, nom="Plantation zone A",
            tache_catalogue=cat, type_objectif="unite", tarif_unitaire=Decimal("75"),
        )
        assert t.tache_catalogue == cat

    def test_realisation_avec_site(self, projet, employe_journalier, db):
        tache = TacheProjet.objects.create(
            projet=projet, nom="Désherbage", type_objectif="surface",
            unite_label="m²", tarif_unitaire=Decimal("100"),
        )
        site = Site.objects.create(nom="Parcelle 1", projet=projet)
        aff = AffectationTache.objects.create(
            tache=tache, employe=employe_journalier, date_affectation=date(2026, 5, 22),
        )
        rea = RealisationTache.objects.create(
            affectation=aff, date=date(2026, 5, 22),
            quantite_realisee=Decimal("50"), site=site,
        )
        assert rea.site == site
        assert rea.montant_calcule == Decimal("5000.00")


# ── Endpoint saisie_log ──────────────────────────────────────────────────────

class TestSaisieLog:
    def test_cree_affectation_et_realisation(self, db, auth_client, projet, employe_journalier):
        tache = TacheProjet.objects.create(
            projet=projet, nom="Préparation sol", type_objectif="surface",
            unite_label="m²", tarif_unitaire=Decimal("200"),
        )
        site = Site.objects.create(nom="Parcelle B", projet=projet)
        resp = auth_client.post("/api/projets/realisations/saisie_log/", {
            "tache": tache.id,
            "employe": employe_journalier.id,
            "date": "2026-05-22",
            "quantite": "10",
            "site": site.id,
            "notes": "matinée",
        }, format="json")
        assert resp.status_code == 201, resp.content
        body = resp.json()
        assert Decimal(body["montant_calcule"]) == Decimal("2000.00")
        assert body["site"] == site.id
        # idempotent : appel #2 met à jour la même réalisation
        resp2 = auth_client.post("/api/projets/realisations/saisie_log/", {
            "tache": tache.id, "employe": employe_journalier.id,
            "date": "2026-05-22", "quantite": "15",
        }, format="json")
        assert resp2.status_code == 201
        assert RealisationTache.objects.filter(affectation__tache=tache).count() == 1
        assert RealisationTache.objects.get(affectation__tache=tache).quantite_realisee == Decimal("15")

    def test_400_si_champs_manquants(self, db, auth_client):
        resp = auth_client.post("/api/projets/realisations/saisie_log/", {"date": "2026-05-22"}, format="json")
        assert resp.status_code == 400
