import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER


# ─── Couleurs EKO ──────────────────────────────────────────────────────────────
VERT_EKO = "1A5C38"
VERT_CLAIR = "E8F5EE"

STATUT_LABEL = {
    "brouillon": "Brouillon", "envoyee": "Envoyée",
    "partiellement_payee": "Partiellement payée", "payee": "Payée",
    "en_retard": "En retard", "annulee": "Annulée",
}
CAT_LABEL = {
    "salaire": "Salaires", "materiel": "Matériel", "carburant": "Carburant",
    "sous_traitance": "Sous-traitance", "location": "Location",
    "fourniture": "Fournitures", "autre": "Autre",
}


def _border(style="thin"):
    s = Side(style=style)
    return Border(left=s, right=s, top=s, bottom=s)


# ── Excel Facture ──────────────────────────────────────────────────────────────

def facture_excel(facture):
    wb = Workbook()
    ws = wb.active
    ws.title = "Facture"

    header_fill = PatternFill("solid", fgColor=VERT_EKO)
    sub_fill    = PatternFill("solid", fgColor=VERT_CLAIR)
    bold        = Font(bold=True)
    white_bold  = Font(bold=True, color="FFFFFF")

    # Titre
    ws.merge_cells("A1:E1")
    ws["A1"] = f"FACTURE {facture.numero}"
    ws["A1"].font = Font(bold=True, size=14, color="FFFFFF")
    ws["A1"].fill = header_fill
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 30

    # Infos facture
    infos = [
        ("Client",    facture.client.nom),
        ("Projet",    facture.projet.nom if facture.projet else "—"),
        ("Émission",  str(facture.date_emission)),
        ("Échéance",  str(facture.date_echeance)),
        ("Statut",    STATUT_LABEL.get(facture.statut, facture.statut)),
    ]
    for i, (label, val) in enumerate(infos, start=2):
        ws[f"A{i}"] = label
        ws[f"A{i}"].font = bold
        ws[f"B{i}"] = val
        ws.merge_cells(f"B{i}:E{i}")

    # En-tête lignes
    row = 8
    headers = ["Désignation", "Quantité", "Prix unitaire (F)", "Montant HT (F)"]
    for col, h in enumerate(headers, start=1):
        cell = ws.cell(row=row, column=col, value=h)
        cell.font = white_bold
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        cell.border = _border()

    # Lignes
    for ligne in facture.lignes.all():
        row += 1
        ws.cell(row=row, column=1, value=ligne.designation).border = _border()
        ws.cell(row=row, column=2, value=float(ligne.quantite)).border = _border()
        ws.cell(row=row, column=3, value=float(ligne.prix_unitaire)).border = _border()
        ws.cell(row=row, column=4, value=float(ligne.montant_ht)).border = _border()

    # Totaux
    row += 2
    totaux = [
        ("Montant HT",  float(facture.montant_ht)),
        (f"TVA ({facture.taux_tva}%)", float(facture.montant_tva)),
        ("TOTAL TTC",   float(facture.montant_ttc)),
        ("Payé",        float(facture.montant_paye)),
        ("Solde restant", float(facture.solde_restant)),
    ]
    for label, val in totaux:
        ws.cell(row=row, column=3, value=label).font = bold
        cell = ws.cell(row=row, column=4, value=val)
        cell.font = Font(bold=(label in ("TOTAL TTC", "Solde restant")))
        cell.number_format = "#,##0"
        row += 1

    # Largeurs colonnes
    ws.column_dimensions["A"].width = 35
    ws.column_dimensions["B"].width = 12
    ws.column_dimensions["C"].width = 20
    ws.column_dimensions["D"].width = 18
    ws.column_dimensions["E"].width = 15

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer


# ── PDF Facture ────────────────────────────────────────────────────────────────

def facture_pdf(facture):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
    )
    styles = getSampleStyleSheet()
    vert = colors.HexColor(f"#{VERT_EKO}")

    title_style = ParagraphStyle("title", parent=styles["Normal"],
                                 fontSize=18, textColor=vert,
                                 fontName="Helvetica-Bold", spaceAfter=4)
    sub_style   = ParagraphStyle("sub", parent=styles["Normal"],
                                 fontSize=9, textColor=colors.grey)
    label_style = ParagraphStyle("label", parent=styles["Normal"],
                                 fontSize=9, fontName="Helvetica-Bold")
    val_style   = ParagraphStyle("val", parent=styles["Normal"], fontSize=9)

    story = []

    # En-tête
    story.append(Paragraph("EKO SARL", title_style))
    story.append(Paragraph("Agriculture · BTP · Location · Espaces verts", sub_style))
    story.append(Spacer(1, 0.5*cm))

    # Bloc facture / client côte à côte
    info_data = [
        [Paragraph("FACTURE", label_style), Paragraph("CLIENT", label_style)],
        [Paragraph(facture.numero, ParagraphStyle("num", fontSize=13, fontName="Helvetica-Bold")),
         Paragraph(facture.client.nom, val_style)],
        [Paragraph(f"Émission : {facture.date_emission}", val_style),
         Paragraph(facture.projet.nom if facture.projet else "", val_style)],
        [Paragraph(f"Échéance : {facture.date_echeance}", val_style), Paragraph("", val_style)],
        [Paragraph(f"Statut : {STATUT_LABEL.get(facture.statut, facture.statut)}", val_style), Paragraph("", val_style)],
    ]
    info_table = Table(info_data, colWidths=[8.5*cm, 8.5*cm])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 1, vert),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
        ("TOPPADDING", (0, 1), (-1, -1), 2),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.7*cm))

    # Tableau des lignes
    header = [["Désignation", "Qté", "Prix unitaire", "Montant HT"]]
    rows = [
        [l.designation, str(l.quantite), f"{float(l.prix_unitaire):,.0f} F", f"{float(l.montant_ht):,.0f} F"]
        for l in facture.lignes.all()
    ]
    if not rows:
        rows = [["—", "", "", ""]]

    table = Table(header + rows, colWidths=[9*cm, 2*cm, 3.5*cm, 3*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, 0), vert),
        ("TEXTCOLOR",    (0, 0), (-1, 0), colors.white),
        ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",     (0, 0), (-1, -1), 9),
        ("ALIGN",        (1, 0), (-1, -1), "RIGHT"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor(f"#{VERT_CLAIR}")]),
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("LEFTPADDING",  (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(table)
    story.append(Spacer(1, 0.5*cm))

    # Totaux
    totaux = [
        ["Montant HT",             f"{float(facture.montant_ht):,.0f} F"],
        [f"TVA ({facture.taux_tva}%)", f"{float(facture.montant_tva):,.0f} F"],
        ["TOTAL TTC",              f"{float(facture.montant_ttc):,.0f} F"],
        ["Payé",                   f"{float(facture.montant_paye):,.0f} F"],
        ["Solde restant",          f"{float(facture.solde_restant):,.0f} F"],
    ]
    tot_table = Table(totaux, colWidths=[9*cm, 3*cm], hAlign="RIGHT")
    tot_table.setStyle(TableStyle([
        ("ALIGN",       (0, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("FONTNAME",    (0, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTNAME",    (0, 4), (-1, 4), "Helvetica-Bold"),
        ("TEXTCOLOR",   (0, 2), (-1, 2), vert),
        ("LINEABOVE",   (0, 2), (-1, 2), 1, vert),
        ("LINEABOVE",   (0, 4), (-1, 4), 0.5, colors.HexColor("#DDDDDD")),
        ("TOPPADDING",  (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
    ]))
    story.append(tot_table)

    doc.build(story)
    buffer.seek(0)
    return buffer


# ── Excel Charges ──────────────────────────────────────────────────────────────

def charges_excel(charges, titre="Charges"):
    wb = Workbook()
    ws = wb.active
    ws.title = "Charges"

    header_fill = PatternFill("solid", fgColor=VERT_EKO)
    white_bold  = Font(bold=True, color="FFFFFF")
    bold        = Font(bold=True)

    ws.merge_cells("A1:G1")
    ws["A1"] = titre
    ws["A1"].font = Font(bold=True, size=13, color="FFFFFF")
    ws["A1"].fill = header_fill
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 26

    headers = ["Date", "Libellé", "Catégorie", "Montant (F)", "Projet", "Fournisseur", "Référence"]
    for col, h in enumerate(headers, start=1):
        cell = ws.cell(row=2, column=col, value=h)
        cell.font = white_bold
        cell.fill = PatternFill("solid", fgColor="2D7A50")
        cell.alignment = Alignment(horizontal="center")
        cell.border = _border()

    total = 0
    for i, c in enumerate(charges, start=3):
        ws.cell(row=i, column=1, value=str(c.date)).border = _border()
        ws.cell(row=i, column=2, value=c.libelle).border = _border()
        ws.cell(row=i, column=3, value=CAT_LABEL.get(c.categorie, c.categorie)).border = _border()
        cell = ws.cell(row=i, column=4, value=float(c.montant))
        cell.number_format = "#,##0"
        cell.border = _border()
        ws.cell(row=i, column=5, value=c.projet.nom if c.projet else "—").border = _border()
        ws.cell(row=i, column=6, value=c.fournisseur or "—").border = _border()
        ws.cell(row=i, column=7, value=c.reference or "—").border = _border()
        total += float(c.montant)

    row = len(list(charges)) + 3
    ws.merge_cells(f"A{row}:C{row}")
    ws[f"A{row}"] = "TOTAL"
    ws[f"A{row}"].font = bold
    ws[f"A{row}"].fill = PatternFill("solid", fgColor=VERT_CLAIR)
    cell = ws.cell(row=row, column=4, value=total)
    cell.font = bold
    cell.number_format = "#,##0"
    cell.fill = PatternFill("solid", fgColor=VERT_CLAIR)

    ws.column_dimensions["A"].width = 12
    ws.column_dimensions["B"].width = 35
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 16
    ws.column_dimensions["E"].width = 22
    ws.column_dimensions["F"].width = 20
    ws.column_dimensions["G"].width = 16

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
