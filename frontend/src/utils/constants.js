// ─── Employés ────────────────────────────────────────────────────────────────
export const EMPLOYE_TYPE_BADGE = {
  cdi:        'badge-green',
  journalier: 'badge-blue',
  moo:        'badge-yellow',
  stagiaire:  'badge-gray',
}

export const EMPLOYE_STATUT_BADGE = {
  actif:   'badge-green',
  inactif: 'badge-gray',
  conge:   'badge-yellow',
}

// ─── Clients ─────────────────────────────────────────────────────────────────
export const CLIENT_TYPE_BADGE = {
  client:     'badge-green',
  prospect:   'badge-blue',
  partenaire: 'badge-yellow',
}

export const CLIENT_STATUT_BADGE = {
  actif:       'badge-green',
  inactif:     'badge-gray',
  negociation: 'badge-yellow',
}

// ─── Projets ─────────────────────────────────────────────────────────────────
export const PROJET_STATUT_BADGE = {
  planifie: 'badge-gray',
  en_cours: 'badge-blue',
  suspendu: 'badge-yellow',
  termine:  'badge-green',
  annule:   'badge-red',
}

export const PROJET_TYPE_LABEL = {
  btp:           'BTP',
  agriculture:   'Agriculture',
  pepiniere:     'Pépinière',
  location:      'Location',
  espaces_verts: 'Espaces verts',
}

// ─── Factures ─────────────────────────────────────────────────────────────────
// Statuts réels en base (post-Sprint 2). "en_retard" est une vue dérivée
// (date_echeance < today + statut ∈ brouillon/certifiee).
export const FACTURE_STATUT_BADGE = {
  brouillon: 'badge-gray',
  certifiee: 'badge-blue',
  payee:     'badge-green',
  annulee:   'badge-gray',
}

export const FACTURE_STATUT_LABEL = {
  brouillon: 'Brouillon',
  certifiee: 'Certifiée FNE',
  payee:     'Payée',
  annulee:   'Annulée',
}

export const factureEnRetard = (f, today = new Date().toISOString().slice(0, 10)) =>
  !!f.date_echeance && f.date_echeance < today && ['brouillon', 'certifiee'].includes(f.statut)

// ─── Devis ────────────────────────────────────────────────────────────────────
export const DEVIS_STATUT_BADGE = {
  brouillon: 'badge-gray',
  envoye:    'badge-blue',
  accepte:   'badge-green',
  refuse:    'badge-red',
  expire:    'badge-yellow',
}

export const DEVIS_STATUT_LABEL = {
  brouillon: 'Brouillon',
  envoye:    'Envoyé',
  accepte:   'Accepté',
  refuse:    'Refusé',
  expire:    'Expiré',
}

// Codes FNE de TVA (LigneFacture)
export const TVA_LABEL = {
  TVA:  'TVA 18%',
  TVAB: 'TVAB 9%',
  TVAC: 'TVAC 0%',
  TVAD: 'TVAD 27%',
  '0':  'Exonéré',
}

// ─── Charges ──────────────────────────────────────────────────────────────────
export const CHARGE_CAT_LABEL = {
  salaire:        'Salaires',
  materiel:       'Matériel',
  carburant:      'Carburant',
  sous_traitance: 'Sous-traitance',
  location:       'Location',
  fourniture:     'Fournitures',
  autre:          'Autre',
}

export const CHARGE_CAT_BADGE = {
  salaire:        'badge-blue',
  materiel:       'badge-gray',
  carburant:      'badge-yellow',
  sous_traitance: 'badge-green',
  location:       'badge-yellow',
  fourniture:     'badge-gray',
  autre:          'badge-gray',
}

// ─── Paie ─────────────────────────────────────────────────────────────────────
export const BULLETIN_STATUT_BADGE = {
  genere: 'badge-yellow',
  paye:   'badge-green',
}

export const BULLETIN_STATUT_LABEL = {
  genere: 'Généré',
  paye:   'Payé',
}

export const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export const moisLabel = (isoDate) => {
  if (!isoDate) return ''
  const [y, m] = isoDate.split('-').map(Number)
  return `${MOIS_NOMS[m - 1]} ${y}`
}

// ─── Stocks ───────────────────────────────────────────────────────────────────
export const ARTICLE_CAT_LABEL = {
  intrant:     'Intrant agricole',
  materiau:    'Matériau BTP',
  equipement:  'Équipement',
  consommable: 'Consommable',
  piece:       'Pièce détachée',
}
