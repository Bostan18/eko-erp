"""
Générateur PDF FNE — mentions obligatoires Art.6 de l'Arrêté FNE (DGI CI).
Utilise WeasyPrint + template Django.
"""
import base64
import io

import qrcode
from django.template.loader import render_to_string
from weasyprint import HTML


def _generer_qr_base64(url: str) -> str:
    """Génère un QR Code depuis une URL et retourne en base64 PNG."""
    qr = qrcode.QRCode(version=1, box_size=5, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def generer_facture_pdf(facture) -> io.BytesIO:
    """Retourne un BytesIO contenant le PDF FNE de la facture."""
    from apps.core.models import EntrepriseConfig
    config = EntrepriseConfig.get()

    qr_base64 = _generer_qr_base64(facture.fne_token) if facture.fne_token else None

    # URL absolue du logo si présent
    logo_url = ""
    if config.logo:
        try:
            logo_url = config.logo.path  # chemin local → WeasyPrint peut lire les fichiers locaux
            logo_url = f"file://{logo_url}"
        except (ValueError, AttributeError):
            logo_url = ""

    context = {
        "facture":      facture,
        "config":       config,
        "qr_base64":    qr_base64,
        "logo_url":     logo_url,
        "total_ht":     facture.total_ht,
        "total_tva":    facture.total_tva,
        "total_ttc":    facture.total_ttc,
        "solde_restant": facture.solde_restant,
    }

    html_string = render_to_string("comptabilite/facture_pdf.html", context)
    pdf_bytes = HTML(string=html_string).write_pdf()

    buf = io.BytesIO(pdf_bytes)
    buf.seek(0)
    return buf
