export const fmt = (n) => Number(n).toLocaleString('fr-FR')

export const today = () => new Date().toISOString().slice(0, 10)

export const MOIS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/* Temps écoulé en français, format court : « à l'instant », « il y a 3 h », « il y a 5 j ». */
export function tempsRelatif(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const secondes = Math.floor((Date.now() - d.getTime()) / 1000)
  if (secondes < 60) return "à l'instant"
  const minutes = Math.floor(secondes / 60)
  if (minutes < 60) return `il y a ${minutes} min`
  const heures = Math.floor(minutes / 60)
  if (heures < 24) return `il y a ${heures} h`
  const jours = Math.floor(heures / 24)
  if (jours < 30) return `il y a ${jours} j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}
