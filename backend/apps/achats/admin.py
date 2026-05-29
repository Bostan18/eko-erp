from django.contrib import admin
from .models import Fournisseur, FactureAchat, CompteBancaire, MouvementTresorerie

admin.site.register(Fournisseur)
admin.site.register(FactureAchat)
admin.site.register(CompteBancaire)
admin.site.register(MouvementTresorerie)
