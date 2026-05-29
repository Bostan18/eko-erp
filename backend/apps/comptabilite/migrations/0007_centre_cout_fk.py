import django.db.models.deletion
from django.db import migrations, models


def slug_vers_fk(apps, schema_editor):
    """Convertit l'ancienne valeur slug (CharField) en FK CentreCout."""
    Facture = apps.get_model("comptabilite", "Facture")
    CentreCout = apps.get_model("core", "CentreCout")
    par_code = {c.code: c for c in CentreCout.objects.all()}
    for f in Facture.objects.exclude(centre_cout=""):
        cc = par_code.get(f.centre_cout)
        if cc:
            f.centre_cout_tmp = cc
            f.save(update_fields=["centre_cout_tmp"])


def fk_vers_slug(apps, schema_editor):
    """Reverse : recopie le code du centre dans le CharField."""
    Facture = apps.get_model("comptabilite", "Facture")
    for f in Facture.objects.filter(centre_cout_tmp__isnull=False):
        f.centre_cout = f.centre_cout_tmp.code
        f.save(update_fields=["centre_cout"])


class Migration(migrations.Migration):

    dependencies = [
        ("comptabilite", "0006_facture_facture_origine"),
        ("core", "0004_seed_centres_cout"),
    ]

    operations = [
        migrations.AddField(
            model_name="facture",
            name="centre_cout_tmp",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name="factures", to="core.centrecout",
            ),
        ),
        migrations.RunPython(slug_vers_fk, fk_vers_slug),
        migrations.RemoveField(model_name="facture", name="centre_cout"),
        migrations.RenameField(
            model_name="facture", old_name="centre_cout_tmp", new_name="centre_cout",
        ),
        migrations.AddField(
            model_name="charge",
            name="centre_cout",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name="charges", to="core.centrecout",
            ),
        ),
    ]
