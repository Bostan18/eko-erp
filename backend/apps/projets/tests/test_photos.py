"""
Tests pour POST /api/projets/projets/{id}/photos/ — Sprint PWA mobile terrain.
"""
import io
from datetime import datetime

import pytest
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image

from apps.projets.models import Projet, PhotoChantier


def _png_bytes(taille=(200, 150), couleur=(80, 160, 100)):
    """Construit une image PNG en mémoire pour les uploads."""
    img = Image.new("RGB", taille, couleur)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


@pytest.fixture
def projet_photo(db):
    return Projet.objects.create(code="PRJ-PH", nom="Chantier photo", type_projet="btp")


@pytest.fixture
def autre_projet(db):
    return Projet.objects.create(code="PRJ-PH2", nom="Autre", type_projet="btp")


class TestPhotosEndpoint:

    def test_upload_photo_avec_coordonnees_gps(self, auth_client, projet_photo):
        photo_file = SimpleUploadedFile(
            "chantier.png", _png_bytes(), content_type="image/png",
        )
        resp = auth_client.post(
            f"/api/projets/projets/{projet_photo.id}/photos/",
            {
                "image": photo_file,
                "latitude": "5.345678",
                "longitude": "-4.012345",
                "prise_le": timezone.now().isoformat(),
                "legende": "Coulage fondation",
                "type_photo": "avant",
            },
            format="multipart",
        )
        assert resp.status_code == 201, resp.content
        body = resp.json()
        assert body["latitude"] == "5.345678"
        assert body["longitude"] == "-4.012345"
        assert body["type_photo"] == "avant"
        assert body["image_url"]
        # prise_par renseigné automatiquement par la view
        assert body["prise_par_username"] == "testuser"

        # En base
        assert PhotoChantier.objects.filter(projet=projet_photo).count() == 1
        photo = PhotoChantier.objects.get()
        assert str(photo.latitude) == "5.345678"

    def test_thumbnail_generee_automatiquement(self, auth_client, projet_photo):
        # Image 1200×900 — la thumbnail doit la réduire à <= 320 sur le côté long
        gros = SimpleUploadedFile("gros.png", _png_bytes(taille=(1200, 900)), content_type="image/png")
        resp = auth_client.post(
            f"/api/projets/projets/{projet_photo.id}/photos/",
            {"image": gros, "prise_le": timezone.now().isoformat()},
            format="multipart",
        )
        assert resp.status_code == 201
        photo = PhotoChantier.objects.get()
        assert photo.thumbnail  # FieldFile non vide
        with Image.open(photo.thumbnail.path) as t:
            assert max(t.size) <= 320

    def test_user_anonyme_refuse(self, api_client, projet_photo):
        photo_file = SimpleUploadedFile("x.png", _png_bytes(), content_type="image/png")
        resp = api_client.post(
            f"/api/projets/projets/{projet_photo.id}/photos/",
            {"image": photo_file, "prise_le": timezone.now().isoformat()},
            format="multipart",
        )
        # Pas d'auth → 401 / 403 selon la config DRF
        assert resp.status_code in (401, 403)
        assert PhotoChantier.objects.count() == 0

    def test_liste_photos_filtree_par_type(self, auth_client, projet_photo, autre_projet):
        # 2 photos sur projet_photo, 1 sur autre_projet
        for type_, projet in [("avant", projet_photo), ("apres", projet_photo), ("avant", autre_projet)]:
            PhotoChantier.objects.create(
                projet=projet,
                image=SimpleUploadedFile(f"{type_}.png", _png_bytes(), content_type="image/png"),
                prise_le=timezone.now(),
                type_photo=type_,
                prise_par=User.objects.get(username="testuser"),
            )

        # GET filtré par type
        resp = auth_client.get(f"/api/projets/projets/{projet_photo.id}/photos/?type_photo=avant")
        assert resp.status_code == 200
        body = resp.json()
        assert len(body) == 1
        assert body[0]["type_photo"] == "avant"
