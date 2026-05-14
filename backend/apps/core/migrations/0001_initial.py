from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='EntrepriseConfig',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('raison_sociale', models.CharField(default='EKO SARL', max_length=200)),
                ('adresse', models.TextField(blank=True)),
                ('telephone', models.CharField(blank=True, max_length=30)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('site_web', models.URLField(blank=True)),
                ('logo', models.ImageField(blank=True, upload_to='entreprise/')),
                ('ncc', models.CharField(blank=True, max_length=50, verbose_name='N° Compte Contribuable')),
                ('rccm', models.CharField(blank=True, max_length=50, verbose_name='N° RCCM')),
                ('regime_imposition', models.CharField(
                    choices=[
                        ('RNI', 'Régime Normal'), ('RSI', 'Régime Simplifié'),
                        ('RME', 'Micro-Entreprise'), ('RENT', 'Entrepreneur'),
                    ],
                    default='RNI', max_length=10,
                )),
                ('fne_api_url', models.URLField(
                    default='http://54.247.95.108/ws',
                    help_text='URL env. test DGI. Remplacer par URL prod après validation.',
                )),
                ('fne_client_id', models.CharField(blank=True, max_length=200)),
                ('fne_client_secret', models.CharField(blank=True, max_length=200)),
                ('fne_establishment_id', models.CharField(blank=True, max_length=100)),
                ('fne_point_of_sale_id', models.CharField(blank=True, max_length=100)),
                ('fne_actif', models.BooleanField(
                    default=False,
                    help_text='Activer seulement après validation DGI',
                )),
                ('template_fne_defaut', models.CharField(
                    choices=[('B2B', 'B2B'), ('B2C', 'B2C'), ('B2G', 'B2G'), ('B2F', 'B2F')],
                    default='B2B', max_length=5,
                )),
                ('prefixe_devis', models.CharField(default='DEV', max_length=10)),
                ('prefixe_facture', models.CharField(default='FAC', max_length=10)),
                ('tva_defaut', models.DecimalField(decimal_places=2, default=Decimal('18'), max_digits=5)),
                ('mentions_legales', models.TextField(blank=True)),
            ],
            options={
                'verbose_name': 'Configuration entreprise',
            },
        ),
    ]
