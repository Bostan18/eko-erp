"""Calculs Bilan Carbone & ESG pour EKO ERP.

Hypothèses (Sprint 9 — MVP) :
- Séquestration : 1 plant ≈ 20 kg CO₂eq / an (réf. ADEME, forêts tropicales jeunes).
- Émission diesel : 1 litre ≈ 2.64 kg CO₂eq (réf. ADEME 2024).
- Consommation horaire des engins selon leur type (estimations métier).
"""
from decimal import Decimal


SEQUESTRATION_KG_PAR_PLANT_PAR_AN = Decimal("20")
FACTEUR_DIESEL_KG_CO2_PAR_L = Decimal("2.64")

CONSO_LITRES_PAR_HEURE = {
    "pelleteuse":     Decimal("15"),
    "tractopelle":    Decimal("12"),
    "compacteur":     Decimal("8"),
    "chargeuse":      Decimal("18"),
    "niveleuse":      Decimal("20"),
    "camion_benne":   Decimal("10"),
    "betonniere":     Decimal("4"),
    "tracteur":       Decimal("8"),
    "groupe_electro": Decimal("5"),
    "autre":          Decimal("5"),
}


def co2_sequestre_lot(lot) -> Decimal:
    """Estimation CO₂ séquestré (kg) pour 1 an pour un lot biologique vivant."""
    if lot.etat_sante == "perdu":
        return Decimal("0")
    return (lot.quantite_actuelle or Decimal("0")) * SEQUESTRATION_KG_PAR_PLANT_PAR_AN


def co2_emis_engin(engin) -> Decimal:
    """Estimation CO₂ émis (kg) sur la totalité du compteur de l'engin."""
    conso = CONSO_LITRES_PAR_HEURE.get(engin.type_engin, CONSO_LITRES_PAR_HEURE["autre"])
    return (engin.heures_compteur or Decimal("0")) * conso * FACTEUR_DIESEL_KG_CO2_PAR_L


def score_esg(env: Decimal, social: Decimal, gouv: Decimal) -> Decimal:
    """Moyenne arithmétique des 3 axes (chaque axe 0–100)."""
    parts = [env, social, gouv]
    return round(sum(parts) / Decimal(len(parts)), 1)
