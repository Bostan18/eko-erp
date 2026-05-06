from django.utils import timezone
from django.db.models import Sum, Count, F
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.rh.models import Employe, PresenceJournaliere
from apps.projets.models import Projet
from apps.crm.models import Client
from apps.stocks.models import Article
from apps.comptabilite.models import Facture, Charge


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpis(request):
    today = timezone.now().date()
    mois  = today.month
    annee = today.year

    # ── RH ────────────────────────────────────────────────────────────
    employes_actifs = Employe.objects.filter(statut="actif", is_deleted=False).count()

    presences_aujourd_hui = PresenceJournaliere.objects.filter(
        date=today, present=True
    ).count()

    masse_cdi = Employe.objects.filter(
        type_contrat="cdi", statut="actif", is_deleted=False
    ).aggregate(total=Sum("salaire_mensuel"))["total"] or 0

    masse_journaliers = PresenceJournaliere.objects.filter(
        date__month=mois, date__year=annee, present=True
    ).aggregate(total=Sum("montant_du"))["total"] or 0

    masse_salariale = float(masse_cdi) + float(masse_journaliers)

    # ── Projets ───────────────────────────────────────────────────────
    projets_en_cours = Projet.objects.filter(statut="en_cours", is_deleted=False).count()

    projets_par_type = list(
        Projet.objects.filter(statut="en_cours", is_deleted=False)
        .values("type_projet")
        .annotate(nb=Count("id"))
        .order_by("-nb")
    )

    # ── CRM ───────────────────────────────────────────────────────────
    clients_total = Client.objects.filter(is_deleted=False).count()

    # ── Stocks ────────────────────────────────────────────────────────
    alertes_stock = Article.objects.filter(
        stock_actuel__lte=F("seuil_minimum"), is_deleted=False
    ).count()

    valeur_stock = float(
        Article.objects.filter(is_deleted=False)
        .aggregate(total=Sum("stock_actuel"))["total"] or 0
    )

    # ── Comptabilité du mois ──────────────────────────────────────────
    factures_mois = Facture.objects.filter(
        date_emission__month=mois,
        date_emission__year=annee,
        is_deleted=False,
    ).exclude(statut="annulee")

    ca_facture  = float(factures_mois.aggregate(t=Sum("montant_ttc"))["t"] or 0)
    ca_encaisse = float(factures_mois.aggregate(t=Sum("montant_paye"))["t"] or 0)

    charges_mois = float(
        Charge.objects.filter(
            date__month=mois, date__year=annee, is_deleted=False
        ).aggregate(t=Sum("montant"))["t"] or 0
    )

    factures_en_retard = Facture.objects.filter(
        statut="en_retard", is_deleted=False
    ).count()

    return Response({
        "rh": {
            "employes_actifs":       employes_actifs,
            "presences_aujourd_hui": presences_aujourd_hui,
            "masse_salariale_mois":  masse_salariale,
        },
        "projets": {
            "en_cours":  projets_en_cours,
            "par_type":  projets_par_type,
        },
        "crm": {
            "clients_total": clients_total,
        },
        "stocks": {
            "alertes":      alertes_stock,
            "valeur_stock": valeur_stock,
        },
        "finance": {
            "ca_facture":         ca_facture,
            "ca_encaisse":        ca_encaisse,
            "charges_mois":       charges_mois,
            "marge_mois":         ca_encaisse - charges_mois,
            "factures_en_retard": factures_en_retard,
            "mois":               mois,
            "annee":              annee,
        },
    })
