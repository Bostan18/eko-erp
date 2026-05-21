"""
Service FNE — DGI Côte d'Ivoire
Authentification OAuth2 + certification des factures.
Lit la configuration depuis EntrepriseConfig (singleton).

Deux modes :
- **réel** : appelle l'API DGI (procédure d'exception, credentials validés).
- **simulation** : génère localement référence/QR/sticker quand la FNE n'est pas
  activée ou que les credentials sont absents — permet de tester tout le flux en dev.
"""
import time
import uuid
import requests
from django.utils import timezone


class FNEError(Exception):
    """Erreur retournée par l'API FNE DGI."""


class FNEService:
    _token_cache: dict = {}  # {"token": str, "expires_at": float, "url": str}

    def __init__(self):
        from apps.core.models import EntrepriseConfig
        self.config = EntrepriseConfig.get()

    # ── Mode ──────────────────────────────────────────────────────────────────

    def mode_simulation(self) -> bool:
        """Simulation tant que la FNE n'est pas activée avec des credentials complets."""
        c = self.config
        return not (c.fne_actif and c.fne_api_url and c.fne_client_id and c.fne_client_secret)

    # ── Stickers ────────────────────────────────────────────────────────────────

    def _consommer_sticker(self, facture, reference, solde_api=None):
        """Enregistre la consommation d'un sticker pour une certification.
        En réel, réconcilie le solde local avec le balance_sticker de l'API."""
        from apps.comptabilite.models import StickerMouvement
        mvt = StickerMouvement.objects.create(
            type_mouvement="consommation",
            quantite=-1,
            facture=facture,
            notes=f"Certification {reference}" + ("" if solde_api is None else " (réel)"),
        )
        if solde_api is not None:
            mvt.solde_apres = solde_api
            mvt.save(update_fields=["solde_apres"])
        return mvt.solde_apres

    def _base_url(self) -> str:
        return self.config.fne_api_url.rstrip("/")

    def _get_token(self) -> str:
        """Récupère le JWT OAuth2, mis en cache jusqu'à expiration."""
        cache = FNEService._token_cache
        if (cache.get("token")
                and cache.get("url") == self._base_url()
                and cache.get("expires_at", 0) > time.time() + 30):
            return cache["token"]

        resp = requests.post(
            f"{self._base_url()}/oauth/token",
            data={
                "grant_type":    "client_credentials",
                "client_id":     self.config.fne_client_id,
                "client_secret": self.config.fne_client_secret,
            },
            timeout=10,
        )
        if not resp.ok:
            raise FNEError(f"Auth FNE échouée ({resp.status_code}) : {resp.text[:200]}")

        data = resp.json()
        cache["token"]      = data["access_token"]
        cache["expires_at"] = time.time() + data.get("expires_in", 3600)
        cache["url"]        = self._base_url()
        return cache["token"]

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type":  "application/json",
        }

    def _build_items(self, facture) -> list:
        return [
            {
                "designation": ligne.designation,
                "quantity":    float(ligne.quantite),
                "unitPrice":   float(ligne.prix_unitaire),
                "discount":    float(ligne.remise_pct),
                "taxes":       [ligne.taux_tva],
            }
            for ligne in facture.lignes.all()
        ]

    # ── Certification ─────────────────────────────────────────────────────────

    def certifier_facture(self, facture) -> dict:
        """Certifie une facture de vente. Dispatch réel / simulation."""
        if self.mode_simulation():
            return self._certifier_simulation(facture)
        return self._certifier_reel(facture)

    def _certifier_reel(self, facture) -> dict:
        """
        POST /external/invoices/sign
        Met à jour fne_reference, fne_token, fne_invoice_id, fne_certifiee_at.
        """
        payload = {
            "invoiceType":   "sale",
            "paymentMethod": facture.mode_reglement,
            "template":      facture.template_fne,
            "isRne":         False,
            "pointOfSale":   self.config.fne_point_of_sale_id,
            "establishment": self.config.fne_establishment_id,
            "items":         self._build_items(facture),
        }
        resp = requests.post(
            f"{self._base_url()}/external/invoices/sign",
            json=payload, headers=self._headers(), timeout=15,
        )
        if not resp.ok:
            raise FNEError(f"Certification FNE échouée ({resp.status_code}) : {resp.text[:300]}")

        data = resp.json()
        facture.fne_reference       = data.get("reference", "")
        facture.fne_token           = data.get("token", "")
        facture.fne_invoice_id      = str(data.get("invoice", {}).get("id", ""))
        facture.fne_certifiee_at    = timezone.now()
        facture.statut              = "certifiee"
        facture.fne_balance_sticker = self._consommer_sticker(
            facture, data.get("reference", ""), solde_api=data.get("balance_sticker"),
        )
        facture.save()

        # Stocker les fne_item_id sur chaque ligne
        items_retour = data.get("invoice", {}).get("items", [])
        lignes = list(facture.lignes.all())
        for i, item in enumerate(items_retour):
            if i < len(lignes):
                lignes[i].fne_item_id = str(item.get("id", ""))
                lignes[i].save(update_fields=["fne_item_id"])

        return data

    def _reference_simulee(self, prefixe="") -> str:
        """Reproduit le format DGI : [prefixe][NCC][Année][Séquence 6 chiffres]."""
        from apps.comptabilite.models import Facture
        annee = timezone.now().year
        ncc = self.config.ncc or "0000000A"
        seq = (
            Facture.objects.filter(fne_certifiee_at__year=annee)
            .exclude(fne_reference="").count() + 1
        )
        return f"{prefixe}{ncc}{annee}{seq:06d}"

    def _certifier_simulation(self, facture) -> dict:
        """Certification locale simulée — référence DGI, QR, sticker consommé."""
        reference = self._reference_simulee()
        facture.fne_reference    = reference
        facture.fne_token        = f"https://fne.dgi.gouv.ci/verify/{reference}"
        facture.fne_invoice_id   = f"SIM-{uuid.uuid4().hex[:12]}"
        facture.fne_certifiee_at = timezone.now()
        facture.statut           = "certifiee"
        facture.fne_balance_sticker = self._consommer_sticker(facture, reference)
        facture.save()

        for i, ligne in enumerate(facture.lignes.all(), start=1):
            ligne.fne_item_id = f"{facture.fne_invoice_id}-{i}"
            ligne.save(update_fields=["fne_item_id"])

        return {"reference": reference, "simulation": True,
                "balance_sticker": facture.fne_balance_sticker}

    # ── Avoirs ────────────────────────────────────────────────────────────────

    def emettre_avoir(self, facture_avoir, facture_origine) -> dict:
        """Émet un avoir pour une facture certifiée. Dispatch réel / simulation."""
        if not facture_origine.fne_invoice_id:
            raise FNEError("La facture d'origine n'a pas d'ID FNE (non certifiée).")
        if self.mode_simulation():
            return self._emettre_avoir_simulation(facture_avoir, facture_origine)
        return self._emettre_avoir_reel(facture_avoir, facture_origine)

    def _emettre_avoir_reel(self, facture_avoir, facture_origine) -> dict:
        """POST /external/invoices/{fne_invoice_id}/refund"""
        items = [
            {"id": ligne.fne_item_id, "quantity": float(ligne.quantite)}
            for ligne in facture_avoir.lignes.all()
            if ligne.fne_item_id
        ]
        resp = requests.post(
            f"{self._base_url()}/external/invoices/{facture_origine.fne_invoice_id}/refund",
            json={"items": items}, headers=self._headers(), timeout=15,
        )
        if not resp.ok:
            raise FNEError(f"Avoir FNE échoué ({resp.status_code}) : {resp.text[:300]}")

        data = resp.json()
        facture_avoir.fne_reference    = data.get("reference", "")
        facture_avoir.fne_token        = data.get("token", "")
        facture_avoir.fne_invoice_id   = str(data.get("invoice", {}).get("id", ""))
        facture_avoir.fne_certifiee_at = timezone.now()
        facture_avoir.statut           = "certifiee"
        facture_avoir.fne_balance_sticker = self._consommer_sticker(
            facture_avoir, data.get("reference", ""), solde_api=data.get("balance_sticker"),
        )
        facture_avoir.save()
        return data

    def _emettre_avoir_simulation(self, facture_avoir, facture_origine) -> dict:
        """Avoir local simulé — référence préfixée « A » (format DGI des avoirs)."""
        reference = self._reference_simulee(prefixe="A")
        facture_avoir.fne_reference    = reference
        facture_avoir.fne_token        = f"https://fne.dgi.gouv.ci/verify/{reference}"
        facture_avoir.fne_invoice_id   = f"SIM-{uuid.uuid4().hex[:12]}"
        facture_avoir.fne_certifiee_at = timezone.now()
        facture_avoir.statut           = "certifiee"
        facture_avoir.fne_balance_sticker = self._consommer_sticker(facture_avoir, reference)
        facture_avoir.save()
        return {"reference": reference, "simulation": True,
                "balance_sticker": facture_avoir.fne_balance_sticker}

    def tester_connexion(self) -> dict:
        """Teste les credentials — retourne {ok: True, message} ou lève FNEError."""
        try:
            token = self._get_token()
            return {"ok": True, "message": f"Connexion FNE réussie. Token obtenu."}
        except FNEError:
            raise
        except Exception as e:
            raise FNEError(str(e))
