import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import { fmt } from '../../utils/format'

const TYPE_TONE   = { cdi: 'green', journalier: 'blue', moo: 'gold', stagiaire: 'gray' }
const STATUT_TONE = { actif: 'green', inactif: 'gray', conge: 'gold' }

function today() { return new Date().toISOString().slice(0, 10) }

export default function EmployeDetail() {
  const { id } = useParams()
  const [employe, setEmploye]     = useState(null)
  const [presences, setPresences] = useState([])
  const [loading, setLoading]     = useState(true)
  const [mois, setMois]           = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => {
    Promise.all([
      api.get(`/rh/employes/${id}/`),
      api.get(`/rh/presences/?employe=${id}&date__startswith=${mois}`),
    ])
      .then(([{ data: emp }, { data: pres }]) => {
        setEmploye(emp)
        setPresences(pres.results ?? pres)
      })
      .finally(() => setLoading(false))
  }, [id, mois])

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (!employe) return <div className="p-12 text-center text-red-500 font-body">Employé introuvable.</div>

  const joursPresents = presences.filter((p) => p.present).length
  const totalMois     = presences.reduce((s, p) => s + Number(p.montant_du), 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/rh" className="hover:text-forest-700 transition-colors">RH & Paie</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">{employe.nom_complet}</span>
      </div>

      {/* Header fiche */}
      <div className="card p-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-forest-50 border border-forest-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-forest-700 text-xl">
              {employe.nom?.[0]}{employe.prenom?.[0]}
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 mb-1">
              {employe.code}
            </p>
            <h1 className="font-display font-bold text-ink text-xl">{employe.nom_complet}</h1>
            <p className="font-body text-sand-600 text-sm mt-0.5">{employe.poste || 'Poste non défini'}</p>
            <div className="flex gap-2 mt-2.5">
              <Badge tone={TYPE_TONE[employe.type_contrat] ?? 'gray'}>{employe.type_contrat?.toUpperCase()}</Badge>
              <Badge tone={STATUT_TONE[employe.statut] ?? 'gray'}>{employe.statut}</Badge>
            </div>
          </div>
        </div>
        <Link to="/rh" className="btn-secondary text-sm">← Retour</Link>
      </div>

      {/* Infos + stats mois */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="kpi-label mb-3">Informations</p>
          <dl className="space-y-2.5 text-[13px] font-body">
            <Row label="Code"           value={<span className="mono-cell text-forest-700">{employe.code}</span>} />
            <Row label="Téléphone"      value={employe.telephone || '—'} />
            <Row label="Date d'entrée"  value={employe.date_entree || '—'} />
            {employe.taux_journalier && (
              <Row label="Taux journalier" value={<strong className="font-semibold text-ink">{fmt(employe.taux_journalier)} F</strong>} />
            )}
            {employe.salaire_mensuel && (
              <Row label="Salaire mensuel" value={<strong className="font-semibold text-ink">{fmt(employe.salaire_mensuel)} F</strong>} />
            )}
          </dl>
        </div>

        <div className="kpi">
          <p className="kpi-label">Présences — {mois}</p>
          <p className="kpi-value text-forest-700">
            {joursPresents}<span className="kpi-unit">jour{joursPresents !== 1 ? 's' : ''}</span>
          </p>
          <p className="kpi-sub text-sand-500">{joursPresents > 0 ? 'Enregistrés ce mois' : 'Aucune présence'}</p>
        </div>

        <div className="kpi">
          <p className="kpi-label">Total à payer</p>
          <p className="kpi-value text-gold-700">
            {fmt(totalMois)}<span className="kpi-unit">FCFA</span>
          </p>
          <p className="kpi-sub text-sand-500">Pour le mois sélectionné</p>
        </div>
      </div>

      {/* Tableau présences */}
      <div className="card overflow-hidden">
        <div className="card-head">
          <p className="card-title">Historique présences</p>
          <input
            type="month"
            className="input input-sm w-44"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
          />
        </div>
        <table className="table-eko">
          <thead>
            <tr>{['Date', 'Présence', 'Heures', 'Montant', 'Projet', 'Notes'].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {presences.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucune présence enregistrée</td></tr>
            ) : presences.map((p) => (
              <tr key={p.id} className={!p.present ? 'opacity-60' : ''}>
                <td className="mono-cell">{p.date}</td>
                <td>
                  <Badge tone={p.present ? 'green' : 'red'}>{p.present ? 'Présent' : 'Absent'}</Badge>
                </td>
                <td className="text-sand-600">{p.heures_travaillees}h</td>
                <td className="num">{p.present ? `${fmt(p.montant_du)} F` : '—'}</td>
                <td className="mono-cell">{p.projet_ref || '—'}</td>
                <td className="text-sand-500 text-[12px]">{p.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-sand-500">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  )
}
