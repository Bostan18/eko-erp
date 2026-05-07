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
export const FACTURE_STATUT_BADGE = {
  brouillon:           'badge-gray',
  envoyee:             'badge-blue',
  partiellement_payee: 'badge-yellow',
  payee:               'badge-green',
  en_retard:           'badge-red',
  annulee:             'badge-gray',
}

export const FACTURE_STATUT_LABEL = {
  brouillon:           'Brouillon',
  envoyee:             'Envoyée',
  partiellement_payee: 'Partiel',
  payee:               'Payée',
  en_retard:           'En retard',
  annulee:             'Annulée',
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

// ─── Stocks ───────────────────────────────────────────────────────────────────
export const ARTICLE_CAT_LABEL = {
  intrant:     'Intrant agricole',
  materiau:    'Matériau BTP',
  equipement:  'Équipement',
  consommable: 'Consommable',
  piece:       'Pièce détachée',
}
