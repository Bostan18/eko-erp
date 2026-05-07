export const fmt = (n) => Number(n).toLocaleString('fr-FR')

export const today = () => new Date().toISOString().slice(0, 10)

export const MOIS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
