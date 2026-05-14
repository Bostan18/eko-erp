import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'

function fmt(n) { return Number(n).toLocaleString('fr-FR') }

const TYPE_BADGE = {
  cdi: 'badge-green', journalier: 'badge-blue', moo: 'badge-yellow', stagiaire: 'badge-gray',
}
const STATUT_BADGE = {
  actif: 'badge-green', inactif: 'badge-gray', conge: 'badge-yellow',
}

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

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>
  if (!employe) return <div className="p-12 text-center text-red-500 font-body">Employé introuvable.</div>

  const joursPresents = presences.filter((p) => p.present).length
  const totalMois     = presences.reduce((s, p) => s + Number(p.montant_du), 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-body text-[#A59F9B]">
        <Link to="/rh" className="hover:text-forest-700 transition-colors">RH & Paie</Link>
        <span>/</span>
        <span className="text-[#1C1817]">{employe.nom_complet}</span>
      </div>

      {/* Header fiche */}
      <div className="card p-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-forest-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-forest-700 text-xl">
              {employe.nom?.[0]}{employe.prenom?.[0]}
            </span>
          </div>
          <div>
            <h1 className="font-display font-bold text-[#1C1817] text-xl">{employe.nom_complet}</h1>
            <p className="font-body text-[#A59F9B] text-sm">{employe.poste || 'Poste non défini'}</p>
            <div className="flex gap-2 mt-2">
              <span className={TYPE_BADGE[employe.type_contrat] ?? 'badge-gray'}>{employe.type_contrat?.toUpperCase()}</span>
              <span className={STATUT_BADGE[employe.statut] ?? 'badge-gray'}>{employe.statut}</span>
            </div>
          </div>
        </div>
        <Link to="/rh" className="btn-secondary text-sm">← Retour</Link>
      </div>

      {/* Infos + stats mois */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="font-display text-xs font-medium text-[#A59F9B] uppercase tracking-wide mb-3">Informations</p>
          <dl className="space-y-2 text-sm font-body">
            <div className="flex justify-between">
              <dt className="text-[#A59F9B]">Code</dt>
              <dd className="font-medium text-forest-700">{employe.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#A59F9B]">Téléphone</dt>
              <dd className="text-[#1C1817]">{employe.telephone || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#A59F9B]">Date d'entrée</dt>
              <dd className="text-[#1C1817]">{employe.date_entree || '—'}</dd>
            </div>
            {employe.taux_journalier && (
              <div className="flex justify-between">
                <dt className="text-[#A59F9B]">Taux journalier</dt>
                <dd className="font-semibold text-[#1C1817]">{fmt(employe.taux_journalier)} F</dd>
              </div>
            )}
            {employe.salaire_mensuel && (
              <div className="flex justify-between">
                <dt className="text-[#A59F9B]">Salaire mensuel</dt>
                <dd className="font-semibold text-[#1C1817]">{fmt(employe.salaire_mensuel)} F</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="card p-5 bg-forest-50 border-forest-100">
          <p className="font-display text-xs font-medium text-forest-600 uppercase tracking-wide mb-3">Présences — {mois}</p>
          <p className="font-display font-bold text-forest-700 text-4xl">{joursPresents}</p>
          <p className="font-body text-forest-600 text-sm mt-1">jour{joursPresents !== 1 ? 's' : ''} présent{joursPresents !== 1 ? 's' : ''}</p>
        </div>

        <div className="card p-5 bg-amber-50 border-amber-100">
          <p className="font-display text-xs font-medium text-amber-600 uppercase tracking-wide mb-3">Total à payer</p>
          <p className="font-display font-bold text-amber-700 text-4xl">{fmt(totalMois)}</p>
          <p className="font-body text-amber-600 text-sm mt-1">F CFA</p>
        </div>
      </div>

      {/* Filtre mois + tableau présences */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#ece2d3]">
          <p className="font-display font-semibold text-[#1C1817] text-sm">Historique présences</p>
          <input
            type="month"
            className="input w-40 py-1.5 text-sm"
            value={mois}
            onChange={(e) => setMois(e.target.value)}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#fbf7f0]">
            <tr>
              {['Date', 'Présent', 'Heures', 'Montant', 'Projet', 'Notes'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4ebe0]">
            {presences.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#A59F9B] font-body">
                  Aucune présence enregistrée pour ce mois
                </td>
              </tr>
            ) : (
              presences.map((p) => (
                <tr key={p.id} className={p.present ? 'hover:bg-[#fbf7f0]' : 'bg-[#fbf7f0] opacity-60'}>
                  <td className="px-4 py-3 font-display font-medium text-[#1C1817]">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={p.present ? 'badge-green' : 'badge-red'}>
                      {p.present ? 'Présent' : 'Absent'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-[#1C1817]">{p.heures_travaillees}h</td>
                  <td className="px-4 py-3 font-display font-semibold text-[#1C1817]">
                    {p.present ? `${fmt(p.montant_du)} F` : '—'}
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B]">{p.projet_ref || '—'}</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{p.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
