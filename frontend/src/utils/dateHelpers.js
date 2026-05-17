const MS_PAR_JOUR = 86400000

const MOIS_COURT_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
]

const MOIS_LONG_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function parseISO(s) {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function toISO(d) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function joursEntreDates(a, b) {
  const da = a instanceof Date ? a : parseISO(a)
  const db = b instanceof Date ? b : parseISO(b)
  if (!da || !db) return 0
  return Math.round((db - da) / MS_PAR_JOUR)
}

export function lundiDeLaSemaine(d) {
  const date = new Date(d)
  const jour = date.getDay() // 0 = dimanche, 1 = lundi …
  const delta = (jour + 6) % 7
  date.setDate(date.getDate() - delta)
  date.setHours(0, 0, 0, 0)
  return date
}

export function numeroSemaine(d) {
  // ISO 8601 — semaine commençant le lundi, qui contient le 1er jeudi de l'année
  const target = new Date(d.valueOf())
  const jour = (d.getDay() + 6) % 7
  target.setDate(target.getDate() - jour + 3)
  const jeudiAnnee = target.getFullYear()
  const v = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const num = 1 + Math.ceil((v - target) / (7 * MS_PAR_JOUR))
  return { num, annee: jeudiAnnee }
}

export function genererSemaines(debut, fin) {
  /** Tableau de semaines couvrant la période [debut, fin] (lundi → dimanche). */
  const start = lundiDeLaSemaine(debut)
  const end = parseISO(fin) ?? fin
  const out = []
  let cursor = new Date(start)
  while (cursor <= end) {
    const ws = new Date(cursor)
    const we = new Date(cursor)
    we.setDate(we.getDate() + 6)
    const { num } = numeroSemaine(ws)
    out.push({
      debut: new Date(ws),
      fin: we,
      num,
      mois: ws.getMonth(),
      moisLabel: MOIS_COURT_FR[ws.getMonth()],
    })
    cursor.setDate(cursor.getDate() + 7)
  }
  return out
}

export function genererMoisGroupes(semaines) {
  /** Regroupe consécutivement les semaines partageant le même mois.
      Le « mois » d'un en-tête est celui du début de la première semaine. */
  const groupes = []
  for (const s of semaines) {
    const cle = `${s.debut.getFullYear()}-${s.mois}`
    const last = groupes[groupes.length - 1]
    if (last && last.cle === cle) {
      last.semaines += 1
    } else {
      groupes.push({
        cle,
        label: `${MOIS_LONG_FR[s.mois]} ${s.debut.getFullYear()}`,
        labelCourt: `${MOIS_COURT_FR[s.mois]} ${s.debut.getFullYear()}`,
        semaines: 1,
      })
    }
  }
  return groupes
}

export function estWeekend(d) {
  const j = d.getDay()
  return j === 0 || j === 6
}

export function memeJour(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate()
}

export function dateFR(d) {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
