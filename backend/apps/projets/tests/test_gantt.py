"""
Tests pour l'endpoint GET /api/projets/projets/gantt/ (Sprint 4 — calendrier).
"""
from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.crm.models import Client
from apps.rh.models import Employe
from apps.projets.models import Projet, TacheProjet


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client_eko(db):
    return Client.objects.create(code="CLI-G1", nom="Mairie Yopougon", telephone="0700000010")


@pytest.fixture
def chef(db):
    return Employe.objects.create(
        code="EMP-CHEF", nom="Diabaté", prenom="Mamadou",
        type_contrat="cdi", taux_journalier=Decimal("0"),
    )


@pytest.fixture
def projets(db, client_eko, chef):
    today = date.today()
    p_btp = Projet.objects.create(
        code="PRJ-G1", nom="École Yopougon", type_projet="btp", statut="en_cours",
        client=client_eko, chef_projet=chef,
        date_debut=today - timedelta(days=30),
        date_fin_prevue=today + timedelta(days=60),
    )
    p_agri = Projet.objects.create(
        code="PRJ-G2", nom="Plantation cacao", type_projet="agriculture", statut="planifie",
        client=client_eko,
        date_debut=today + timedelta(days=10),
        date_fin_prevue=today + timedelta(days=80),
    )
    p_termine = Projet.objects.create(
        code="PRJ-G3", nom="Espaces verts Cocody", type_projet="espaces_verts", statut="termine",
        date_debut=today - timedelta(days=120),
        date_fin_prevue=today - timedelta(days=20),
        date_fin_reelle=today - timedelta(days=18),
    )
    p_annule = Projet.objects.create(
        code="PRJ-G4", nom="Annulé", type_projet="location", statut="annule",
        date_debut=today, date_fin_prevue=today + timedelta(days=30),
    )
    # Tâches sur le projet BTP
    TacheProjet.objects.create(
        projet=p_btp, nom="Terrassement",
        date_debut=p_btp.date_debut, date_fin_prevue=p_btp.date_debut + timedelta(days=20),
        statut="terminee",
    )
    TacheProjet.objects.create(
        projet=p_btp, nom="Fondations",
        date_debut=p_btp.date_debut + timedelta(days=21),
        date_fin_prevue=p_btp.date_debut + timedelta(days=60),
        statut="en_cours",
    )
    return {"btp": p_btp, "agri": p_agri, "termine": p_termine, "annule": p_annule}


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestGanttEndpoint:

    def test_gantt_retourne_periode_par_defaut(self, auth_client, projets):
        resp = auth_client.get("/api/projets/projets/gantt/")
        assert resp.status_code == 200
        body = resp.json()

        assert "periode" in body
        assert "projets" in body
        today = date.today()
        assert body["periode"]["debut"] == today.isoformat()
        assert body["periode"]["fin"] == (today + timedelta(days=90)).isoformat()
        assert body["periode"]["jours"] == 91

        # Annulé exclu par défaut
        codes = {p["code"] for p in body["projets"]}
        assert "PRJ-G4" not in codes

        # BTP & agriculture présents (chevauchent la période)
        assert "PRJ-G1" in codes
        assert "PRJ-G2" in codes

    def test_gantt_filtre_par_statut(self, auth_client, projets):
        resp = auth_client.get("/api/projets/projets/gantt/?statut=en_cours")
        assert resp.status_code == 200
        codes = {p["code"] for p in resp.json()["projets"]}
        assert codes == {"PRJ-G1"}

        # Filtre combiné
        resp2 = auth_client.get("/api/projets/projets/gantt/?statut=en_cours,planifie")
        codes2 = {p["code"] for p in resp2.json()["projets"]}
        assert codes2 == {"PRJ-G1", "PRJ-G2"}

    def test_gantt_filtre_par_chef_chantier(self, auth_client, projets, chef):
        # Élargir la période pour ne pas exclure par dates
        today = date.today()
        params = (
            f"?date_debut={(today - timedelta(days=200)).isoformat()}"
            f"&date_fin={(today + timedelta(days=200)).isoformat()}"
            f"&chef_chantier={chef.id}"
        )
        resp = auth_client.get(f"/api/projets/projets/gantt/{params}")
        assert resp.status_code == 200
        codes = {p["code"] for p in resp.json()["projets"]}
        # Seul PRJ-G1 a un chef_projet renseigné
        assert codes == {"PRJ-G1"}

    def test_gantt_calcule_retard_correctement(self, auth_client, projets, client_eko):
        today = date.today()
        # Projet en cours dont la date_fin_prevue est passée → en retard
        en_retard = Projet.objects.create(
            code="PRJ-LATE", nom="Retard", type_projet="btp", statut="en_cours",
            client=client_eko,
            date_debut=today - timedelta(days=60),
            date_fin_prevue=today - timedelta(days=5),
        )
        # Élargir la période pour inclure PRJ-LATE
        params = f"?date_debut={(today - timedelta(days=100)).isoformat()}&date_fin={(today + timedelta(days=100)).isoformat()}"
        resp = auth_client.get(f"/api/projets/projets/gantt/{params}")
        assert resp.status_code == 200
        by_code = {p["code"]: p for p in resp.json()["projets"]}
        assert by_code["PRJ-LATE"]["est_en_retard"] is True
        # Le projet BTP non échu et statut en_cours ne doit pas être marqué en retard
        # (sauf si sous-performance — pas de réalisations donc progression 0,
        # ce qui peut déclencher la règle « attendue - 10 ».
        # On vérifie surtout que la flag passe à True pour les fins dépassées.)
        assert by_code["PRJ-G2"]["est_en_retard"] is False  # planifié, pas en cours

    def test_gantt_couleur_par_type(self, auth_client, projets):
        today = date.today()
        params = f"?date_debut={(today - timedelta(days=200)).isoformat()}&date_fin={(today + timedelta(days=200)).isoformat()}"
        resp = auth_client.get(f"/api/projets/projets/gantt/{params}")
        assert resp.status_code == 200
        by_code = {p["code"]: p for p in resp.json()["projets"]}
        assert by_code["PRJ-G1"]["couleur"] == "#D85A30"  # btp → coral
        assert by_code["PRJ-G2"]["couleur"] == "#639922"  # agriculture → green
        assert by_code["PRJ-G3"]["couleur"] == "#1D9E75"  # espaces_verts → teal
