"""Seed les informations officielles EKO SARL.

Idempotent : peut être relancé sans créer de doublons.
- EntrepriseConfig : singleton mis à jour avec l'identité légale.
- Site (operations) : 6 sites de plantations / opérations.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import EntrepriseConfig
from apps.operations.models import Site


ADRESSE_OFFICIELLE = (
    "Siège social : Dabou · BP 812 Dabou\n"
    "Siège opérationnel : Abidjan — Songon Adiapoto\n"
    "Capital social : 2 000 000 FCFA"
)

MENTIONS_LEGALES = (
    "EKO SARL · Capital 2 000 000 FCFA · BP 812 Dabou\n"
    "RCCM : CI-DAB-2022-B-101 · N° CC : 2216607 D\n"
    "Tél : +225 27 23 25 49 08 · WhatsApp : 0709010498 / 0595853309\n"
    "Email : infos@eko.ci"
)

SITES = [
    {
        "nom": "Songon Adiapoto — Siège opérationnel",
        "type_site": "depot",
        "localisation": "Abidjan, Songon Adiapoto",
        "notes": "Siège opérationnel et lieu de recrutement.",
    },
    {
        "nom": "Toupah — Plantation hévéa",
        "type_site": "parcelle",
        "localisation": "Toupah",
        "notes": "Saignée d'hévéa et ramassage de fonds de tasses.",
    },
    {
        "nom": "Ousrou — Plantation hévéa",
        "type_site": "parcelle",
        "localisation": "Ousrou",
        "notes": "Saignée d'hévéa et ramassage de fonds de tasses.",
    },
    {
        "nom": "Ballet (Agboville) — Plantation hévéa",
        "type_site": "parcelle",
        "localisation": "Ballet, Agboville",
        "notes": "Saignée d'hévéa.",
    },
    {
        "nom": "Betié — Plantation hévéa",
        "type_site": "parcelle",
        "localisation": "Betié",
        "notes": "Entretien des plantations (désherbage, nettoyage, préparation du sol).",
    },
    {
        "nom": "LOPOU — Plantation hévéa",
        "type_site": "parcelle",
        "localisation": "LOPOU",
        "notes": "Surveillance des plantations.",
    },
]


class Command(BaseCommand):
    help = "Seed l'identité légale EKO SARL et les sites de plantations."

    @transaction.atomic
    def handle(self, *args, **kwargs):
        cfg = EntrepriseConfig.get()
        cfg.raison_sociale = "EKO SARL"
        cfg.adresse = ADRESSE_OFFICIELLE
        cfg.telephone = "+225 27 23 25 49 08"
        cfg.email = "infos@eko.ci"
        cfg.ncc = "2216607 D"
        cfg.rccm = "CI-DAB-2022-B-101"
        cfg.mentions_legales = MENTIONS_LEGALES
        cfg.save()
        self.stdout.write(self.style.SUCCESS("EntrepriseConfig mis à jour."))

        created, updated = 0, 0
        for data in SITES:
            obj, was_created = Site.objects.update_or_create(
                nom=data["nom"],
                defaults={
                    "type_site": data["type_site"],
                    "localisation": data["localisation"],
                    "notes": data["notes"],
                    "actif": True,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        self.stdout.write(self.style.SUCCESS(
            f"Sites : {created} créés, {updated} mis à jour ({len(SITES)} au total)."
        ))
