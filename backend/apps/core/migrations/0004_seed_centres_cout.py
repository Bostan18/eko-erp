from django.db import migrations


CENTRES = [
    {"code": "btp",        "nom": "BTP",        "couleur": "#bc6c25", "ordre": 1},
    {"code": "pepiniere",  "nom": "Pépinière",  "couleur": "#386641", "ordre": 2},
    {"code": "location",   "nom": "Location",   "couleur": "#2563eb", "ordre": 3},
    {"code": "plantation", "nom": "Plantation", "couleur": "#6a994e", "ordre": 4},
]


def seed(apps, schema_editor):
    CentreCout = apps.get_model("core", "CentreCout")
    for c in CENTRES:
        CentreCout.objects.get_or_create(code=c["code"], defaults=c)


def unseed(apps, schema_editor):
    CentreCout = apps.get_model("core", "CentreCout")
    CentreCout.objects.filter(code__in=[c["code"] for c in CENTRES]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0003_centrecout")]
    operations = [migrations.RunPython(seed, unseed)]
