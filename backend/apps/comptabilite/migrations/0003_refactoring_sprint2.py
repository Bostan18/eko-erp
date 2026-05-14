"""
Refactoring Sprint 2 :
- EntrepriseConfig singleton dans core
- Devis : TimeStampedModel (retire is_deleted/deleted_at), date_validite nullable
- LigneDevis : quantite(3), taux_tva→DecimalField
- Facture : TimeStampedModel, rename numero→numero_local, retire montants stockés,
            date_echeance nullable, fne_invoice_id, fne_balance_sticker→IntegerField,
            fne_token→URLField, devis FK→OneToOneField
- LigneFacture : TimeStampedModel (created_at/updated_at), retire montant_ht stocké,
                 quantite(3), taux_tva choices + '0'
"""
import django.db.models.deletion
import django.utils.timezone
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('comptabilite', '0002_facture_fne_balance_sticker_facture_fne_certifiee_at_and_more'),
        ('core', '0001_initial'),
    ]

    operations = [
        # ── Devis → TimeStampedModel ──────────────────────────────────────────
        migrations.RemoveField(model_name='devis', name='is_deleted'),
        migrations.RemoveField(model_name='devis', name='deleted_at'),
        migrations.AlterField(
            model_name='devis',
            name='date_validite',
            field=models.DateField(blank=True, null=True),
        ),

        # ── LigneDevis — quantite(3), taux_tva→DecimalField ──────────────────
        migrations.AlterField(
            model_name='lignedevis',
            name='quantite',
            field=models.DecimalField(decimal_places=3, default=Decimal('1'), max_digits=10),
        ),
        migrations.AlterField(
            model_name='lignedevis',
            name='taux_tva',
            field=models.DecimalField(decimal_places=2, default=Decimal('18'), max_digits=5),
        ),

        # ── Facture → TimeStampedModel ────────────────────────────────────────
        migrations.RemoveField(model_name='facture', name='is_deleted'),
        migrations.RemoveField(model_name='facture', name='deleted_at'),

        # ── Facture — retirer champs stockés ─────────────────────────────────
        migrations.RemoveField(model_name='facture', name='date_emission'),
        migrations.RemoveField(model_name='facture', name='taux_tva'),
        migrations.RemoveField(model_name='facture', name='montant_ht'),
        migrations.RemoveField(model_name='facture', name='montant_tva'),
        migrations.RemoveField(model_name='facture', name='montant_ttc'),

        # ── Facture — renommer numero → numero_local ─────────────────────────
        migrations.RenameField(model_name='facture', old_name='numero', new_name='numero_local'),

        # ── Facture — nouveaux champs ─────────────────────────────────────────
        migrations.AddField(
            model_name='facture',
            name='fne_invoice_id',
            field=models.CharField(
                blank=True, max_length=100,
                help_text='ID interne DGI — requis pour émettre un avoir',
            ),
        ),

        # ── Facture — altération de champs existants ──────────────────────────
        migrations.AlterField(
            model_name='facture',
            name='date_echeance',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='facture',
            name='fne_reference',
            field=models.CharField(
                blank=True, max_length=100,
                help_text='Format DGI: [NCC][Année][Séq]',
            ),
        ),
        migrations.AlterField(
            model_name='facture',
            name='fne_token',
            field=models.URLField(
                blank=True, max_length=500,
                help_text='URL de vérification QR code',
            ),
        ),
        migrations.AlterField(
            model_name='facture',
            name='fne_balance_sticker',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='facture',
            name='devis',
            field=models.OneToOneField(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='facture',
                to='comptabilite.devis',
            ),
        ),
        migrations.AlterField(
            model_name='facture',
            name='statut',
            field=models.CharField(
                choices=[
                    ('brouillon', 'Brouillon'), ('certifiee', 'Certifiée FNE'),
                    ('payee', 'Payée'), ('annulee', 'Annulée'),
                ],
                default='brouillon', max_length=15,
            ),
        ),
        migrations.AlterModelOptions(
            name='facture',
            options={'ordering': ['-created_at'], 'verbose_name': 'Facture'},
        ),

        # ── LigneFacture → TimeStampedModel ──────────────────────────────────
        migrations.AddField(
            model_name='lignefacture',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='lignefacture',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),

        # ── LigneFacture — retirer montant_ht stocké ─────────────────────────
        migrations.RemoveField(model_name='lignefacture', name='montant_ht'),

        # ── LigneFacture — quantite(3) ────────────────────────────────────────
        migrations.AlterField(
            model_name='lignefacture',
            name='quantite',
            field=models.DecimalField(decimal_places=3, default=Decimal('1'), max_digits=10),
        ),

        # ── LigneFacture — taux_tva choices (add '0') ────────────────────────
        migrations.AlterField(
            model_name='lignefacture',
            name='taux_tva',
            field=models.CharField(
                choices=[
                    ('TVA', 'TVA 18%'), ('TVAB', 'TVAB 9%'),
                    ('TVAC', 'TVAC 0%'), ('TVAD', 'TVAD 27%'), ('0', 'Exonéré'),
                ],
                default='TVA', max_length=10,
            ),
        ),
    ]
