from datetime import date

from django.core.management.base import BaseCommand

from apps.core.models import Document


class Command(BaseCommand):
    help = "Seed les 6 documents de démo pour /documents."

    def handle(self, *args, **kwargs):
        rows = [
            dict(id_doc="DOC-001", titre="Permis de construire – Chantier Cocody",
                 type_doc="permis", entite_type="site", entite_id="SITE-001",
                 date_emission=date(2026, 1, 10), date_expiration=date(2027, 1, 10)),
            dict(id_doc="DOC-002", titre="Visite médicale – Kouamé Y. Bernard",
                 type_doc="medical", entite_type="employe", entite_id="EMP-2024-001",
                 date_emission=date(2026, 3, 5), date_expiration=date(2027, 3, 5)),
            dict(id_doc="DOC-003", titre="Assurance parc machines",
                 type_doc="assurance", entite_type="entreprise", entite_id="EKO-SARL",
                 date_emission=date(2026, 1, 1), date_expiration=date(2026, 12, 31)),
            dict(id_doc="DOC-004", titre="Autorisation défrichement – Azaguié",
                 type_doc="env_permit", entite_type="site", entite_id="SITE-004",
                 date_emission=date(2025, 10, 15), date_expiration=date(2026, 4, 30)),
            dict(id_doc="DOC-005", titre="Certificat CNPS – Mars 2026",
                 type_doc="cnps", entite_type="entreprise", entite_id="EKO-SARL",
                 date_emission=date(2026, 3, 31), date_expiration=date(2026, 6, 30)),
            dict(id_doc="DOC-006", titre="Visite médicale – Bamba Lacina",
                 type_doc="medical", entite_type="employe", entite_id="EMP-2025-003",
                 date_emission=date(2025, 1, 10), date_expiration=date(2026, 1, 10)),
        ]
        for r in rows:
            Document.objects.update_or_create(id_doc=r["id_doc"], defaults=r)
        self.stdout.write(self.style.SUCCESS(f"Seed : {len(rows)} documents."))
