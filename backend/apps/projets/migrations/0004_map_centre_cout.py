from django.db import migrations


# Ventilation par défaut : type de projet → code de centre de coût.
# espaces_verts laissé non ventilé (pas de centre dédié).
MAP = {
    "btp":         "btp",
    "pepiniere":   "pepiniere",
    "location":    "location",
    "agriculture": "plantation",
}


def mapper(apps, schema_editor):
    Projet = apps.get_model("projets", "Projet")
    CentreCout = apps.get_model("core", "CentreCout")
    par_code = {c.code: c for c in CentreCout.objects.all()}
    for p in Projet.objects.filter(centre_cout__isnull=True):
        code = MAP.get(p.type_projet)
        cc = par_code.get(code) if code else None
        if cc:
            p.centre_cout = cc
            p.save(update_fields=["centre_cout"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("projets", "0003_projet_centre_cout"),
        ("core", "0004_seed_centres_cout"),
    ]
    operations = [migrations.RunPython(mapper, noop)]
