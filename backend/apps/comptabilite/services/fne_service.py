"""
Service FNE — DGI Côte d'Ivoire
Authentification OAuth2 + certification des factures.
Lit la configuration depuis EntrepriseConfig (singleton).
"""
import time
import requests
from django.utils import timezone


class FNEError(Exception):
    """Erreur retournée par l'API FNE DGI."""


class FNEService:
    _token_cache: dict = {}  # {"token": str, "expires_at": float, "url": str}

    def __init__(self):
        from apps.core.models import EntrepriseConfig
        self.config = EntrepriseConfig.get()

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

    def certifier_facture(self, facture) -> dict:
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
        facture.fne_balance_sticker = data.get("balance_sticker")
        facture.fne_invoice_id      = str(data.get("invoice", {}).get("id", ""))
        facture.fne_certifiee_at    = timezone.now()
        facture.statut              = "certifiee"
        facture.save()

        # Stocker les fne_item_id sur chaque ligne
        items_retour = data.get("invoice", {}).get("items", [])
        lignes = list(facture.lignes.all())
        for i, item in enumerate(items_retour):
            if i < len(lignes):
                lignes[i].fne_item_id = str(item.get("id", ""))
                lignes[i].save(update_fields=["fne_item_id"])

        return data

    def emettre_avoir(self, facture_avoir, facture_origine) -> dict:
        """
        POST /external/invoices/{fne_invoice_id}/refund
        """
        if not facture_origine.fne_invoice_id:
            raise FNEError("La facture d'origine n'a pas d'ID FNE (non certifiée).")

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
        facture_avoir.save()
        return data

    def tester_connexion(self) -> dict:
        """Teste les credentials — retourne {ok: True, message} ou lève FNEError."""
        try:
            token = self._get_token()
            return {"ok": True, "message": f"Connexion FNE réussie. Token obtenu."}
        except FNEError:
            raise
        except Exception as e:
            raise FNEError(str(e))
