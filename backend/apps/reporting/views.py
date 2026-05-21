from collections import defaultdict
from datetime import date

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


def _mois_precedent(annee, mois):
    return (annee - 1, 12) if mois == 1 else (annee, mois - 1)


def _decaler_mois(annee, mois, decalage):
    """Retourne (annee, mois) après ajout de `decalage` mois (peut être négatif)."""
    total = annee * 12 + (mois - 1) + decalage
    return total // 12, total % 12 + 1


def _facturation_mois(mois, annee):
    """Retourne (ca_facture, ca_encaisse) pour un mois donné."""
    factures = list(
        Facture.objects.filter(created_at__month=mois, created_at__year=annee)
        .exclude(statut="annulee")
        .prefetch_related("lignes")
    )
    ca_facture = float(sum(f.total_ttc for f in factures))
    ca_encaisse = float(sum(f.montant_paye or 0 for f in factures))
    return ca_facture, ca_encaisse


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def kpis(request):
    today = timezone.now().date()
    mois = today.month
    annee = today.year
    mp_annee, mp_mois = _mois_precedent(annee, mois)

    # ── RH ────────────────────────────────────────────────────────────
    employes_actifs = Employe.objects.filter(statut="actif", is_deleted=False).count()
    presences_aujourd_hui = PresenceJournaliere.objects.filter(date=today, present=True).count()

    masse_cdi = Employe.objects.filter(
        type_contrat="cdi", statut="actif", is_deleted=False
    ).aggregate(total=Sum("salaire_mensuel"))["total"] or 0
    masse_journaliers = PresenceJournaliere.objects.filter(
        date__month=mois, date__year=annee, present=True
    ).aggregate(total=Sum("montant_du"))["total"] or 0
    masse_salariale = float(masse_cdi) + float(masse_journaliers)

    masse_journaliers_prev = PresenceJournaliere.objects.filter(
        date__month=mp_mois, date__year=mp_annee, present=True
    ).aggregate(total=Sum("montant_du"))["total"] or 0
    masse_salariale_prev = float(masse_cdi) + float(masse_journaliers_prev)

    # ── Projets ───────────────────────────────────────────────────────
    projets_en_cours = Projet.objects.filter(statut="en_cours", is_deleted=False).count()
    projets_par_type = list(
        Projet.objects.filter(statut="en_cours", is_deleted=False)
        .values("type_projet").annotate(nb=Count("id")).order_by("-nb")
    )

    # ── CRM ───────────────────────────────────────────────────────────
    clients_total = Client.objects.filter(is_deleted=False).count()
    clients_nouveaux_mois = Client.objects.filter(
        created_at__month=mois, created_at__year=annee, is_deleted=False
    ).count()
    clients_nouveaux_prev = Client.objects.filter(
        created_at__month=mp_mois, created_at__year=mp_annee, is_deleted=False
    ).count()

    # ── Stocks ────────────────────────────────────────────────────────
    alertes_stock = Article.objects.filter(
        stock_actuel__lte=F("seuil_minimum"), is_deleted=False
    ).count()
    valeur_stock = float(
        Article.objects.filter(is_deleted=False)
        .aggregate(total=Sum("stock_actuel"))["total"] or 0
    )

    # ── Comptabilité — mois courant + précédent ───────────────────────
    ca_facture, ca_encaisse = _facturation_mois(mois, annee)
    ca_facture_prev, ca_encaisse_prev = _facturation_mois(mp_mois, mp_annee)

    charges_mois = float(
        Charge.objects.filter(date__month=mois, date__year=annee, is_deleted=False)
        .aggregate(t=Sum("montant"))["t"] or 0
    )
    charges_prev = float(
        Charge.objects.filter(date__month=mp_mois, date__year=mp_annee, is_deleted=False)
        .aggregate(t=Sum("montant"))["t"] or 0
    )

    factures_en_retard = Facture.objects.filter(
        date_echeance__lt=today,
        statut__in=["brouillon", "certifiee"],
    ).count()

    # ── Série mensuelle (12 derniers mois) ────────────────────────────
    debut_a, debut_m = _decaler_mois(annee, mois, -11)
    debut_date = date(debut_a, debut_m, 1)
    factures_12m = (
        Facture.objects.filter(created_at__gte=debut_date)
        .exclude(statut="annulee")
        .prefetch_related("lignes")
    )
    agg = defaultdict(lambda: {"ca_facture": 0.0, "ca_encaisse": 0.0})
    for f in factures_12m:
        key = (f.created_at.year, f.created_at.month)
        agg[key]["ca_facture"] += float(f.total_ttc)
        agg[key]["ca_encaisse"] += float(f.montant_paye or 0)

    serie_mensuelle = []
    y, m = debut_a, debut_m
    for _ in range(12):
        serie_mensuelle.append({
            "mois": f"{y:04d}-{m:02d}",
            "ca_facture": round(agg[(y, m)]["ca_facture"], 2),
            "ca_encaisse": round(agg[(y, m)]["ca_encaisse"], 2),
        })
        y, m = _decaler_mois(y, m, 1)

    # ── CA par centre de coût (12 derniers mois, hors avoirs) ─────────
    from apps.core.models import CentreCout
    ca_centre_agg = defaultdict(float)
    for f in factures_12m:
        if f.type_facture == "avoir":
            continue
        ca_centre_agg[f.centre_cout_id] += float(f.total_ttc)
    ca_par_centre = [
        {"code": c.code, "nom": c.nom, "couleur": c.couleur,
         "ca": round(ca_centre_agg.get(c.id, 0.0), 2)}
        for c in CentreCout.objects.filter(actif=True)
    ]
    non_ventile = round(ca_centre_agg.get(None, 0.0), 2)
    if non_ventile:
        ca_par_centre.append({"code": "", "nom": "Non ventilé",
                              "couleur": "#9ca3af", "ca": non_ventile})

    return Response({
        "rh": {
            "employes_actifs": employes_actifs,
            "presences_aujourd_hui": presences_aujourd_hui,
            "masse_salariale_mois": masse_salariale,
            "masse_salariale_prev": masse_salariale_prev,
        },
        "projets": {
            "en_cours": projets_en_cours,
            "par_type": projets_par_type,
        },
        "crm": {
            "clients_total": clients_total,
            "clients_nouveaux_mois": clients_nouveaux_mois,
            "clients_nouveaux_prev": clients_nouveaux_prev,
        },
        "stocks": {
            "alertes": alertes_stock,
            "valeur_stock": valeur_stock,
        },
        "finance": {
            "ca_facture": ca_facture,
            "ca_facture_prev": ca_facture_prev,
            "ca_encaisse": ca_encaisse,
            "ca_encaisse_prev": ca_encaisse_prev,
            "charges_mois": charges_mois,
            "charges_prev": charges_prev,
            "marge_mois": ca_encaisse - charges_mois,
            "marge_prev": ca_encaisse_prev - charges_prev,
            "factures_en_retard": factures_en_retard,
            "mois": mois,
            "annee": annee,
            "serie_mensuelle": serie_mensuelle,
            "ca_par_centre": ca_par_centre,
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def activite_recente(request):
    """Agrège les 8 derniers événements de l'ERP : factures, pointages, alertes stocks, clients."""
    today = timezone.now().date()
    events = []

    # Dernières factures
    statut_libelles = dict(Facture._meta.get_field("statut").choices)
    for f in (
        Facture.objects.exclude(statut="annulee")
        .select_related("client")
        .order_by("-created_at")
        .prefetch_related("lignes")[:4]
    ):
        en_retard = f.date_echeance and f.date_echeance < today and f.statut in ("brouillon", "certifiee")
        events.append({
            "id": f.numero_local,
            "label": f"Facture — {f.client.nom}",
            "meta": f"{float(f.total_ttc):,.0f} FCFA".replace(",", " "),
            "status": "En retard" if en_retard else statut_libelles.get(f.statut, f.statut),
            "tone": "bad" if en_retard else ("good" if f.statut == "payee" else "info"),
            "date": f.created_at.isoformat(),
            "url": f"/comptabilite/factures/{f.id}",
        })

    # Dernières présences validées (regroupées par jour + chantier)
    presences = PresenceJournaliere.objects.filter(present=True).order_by("-date", "-id")[:10]
    seen = set()
    nb_pnt = 0
    for p in presences:
        key = (p.date, p.projet_ref)
        if key in seen:
            continue
        seen.add(key)
        nb_jour = PresenceJournaliere.objects.filter(
            date=p.date, projet_ref=p.projet_ref, present=True
        ).count()
        events.append({
            "id": f"PNT-{p.date.strftime('%m-%d')}",
            "label": f"Pointage {p.date.strftime('%d/%m')} — {p.projet_ref or 'sans chantier'}",
            "meta": f"{nb_jour} journalier{'s' if nb_jour > 1 else ''}",
            "status": "Validé",
            "tone": "good",
            "date": p.date.isoformat(),
            "url": "/rh/pointage",
        })
        nb_pnt += 1
        if nb_pnt >= 2:
            break

    # Alertes stocks
    for a in Article.objects.filter(
        stock_actuel__lte=F("seuil_minimum"), is_deleted=False
    ).order_by("stock_actuel")[:2]:
        events.append({
            "id": a.code,
            "label": f"Alerte stock — {a.nom}",
            "meta": f"{a.stock_actuel} {a.unite} restant{'s' if a.stock_actuel != 1 else ''}",
            "status": "Rupture" if a.stock_actuel == 0 else "Bas",
            "tone": "bad",
            "date": a.updated_at.isoformat() if hasattr(a, "updated_at") else "",
            "url": "/stocks",
        })

    # Nouveaux clients
    for c in Client.objects.filter(is_deleted=False).order_by("-created_at")[:2]:
        events.append({
            "id": c.code or f"CLI-{c.id}",
            "label": f"Nouveau client — {c.nom}",
            "meta": c.get_type_client_display(),
            "status": "Nouveau",
            "tone": "info",
            "date": c.created_at.isoformat(),
            "url": "/crm",
        })

    events.sort(key=lambda e: e["date"], reverse=True)
    return Response(events[:8])
