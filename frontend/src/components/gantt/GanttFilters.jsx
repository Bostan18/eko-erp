import { useEffect, useState } from 'react'
import api from '../../services/api'

const PERIODES = [
  { value: '30j',   label: '30 jours', jours: 30 },
  { value: '90j',   label: '90 jours', jours: 90 },
  { value: '6mois', label: '6 mois',   jours: 180 },
  { value: '1an',   label: '1 an',     jours: 365 },
]

const STATUTS = [
  { value: 'planifie', label: 'Planifié' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'suspendu', label: 'Suspendu' },
  { value: 'termine',  label: 'Terminé' },
]

export default function GanttFilters({
  periodePreset, onPeriodePreset,
  statuts, onStatutsChange,
  chefId, onChefChange,
  onAujourdhui,
}) {
  const [chefs, setChefs] = useState([])

  useEffect(() => {
    // Liste des employés désignés chef d'au moins un projet → /api/rh/employes/
    api.get('/rh/employes/').then(({ data }) => {
      const employes = data.results ?? data
      setChefs(employes.filter((e) => e.type_contrat === 'cdi'))
    }).catch(() => setChefs([]))
  }, [])

  function toggleStatut(s) {
    if (statuts.includes(s)) onStatutsChange(statuts.filter((x) => x !== s))
    else                     onStatutsChange([...statuts, s])
  }

  return (
    <div className="card p-4 flex items-end gap-4 flex-wrap">
      {/* Période */}
      <div>
        <p className="font-display text-[11px] uppercase tracking-wide text-sand-500 mb-1">Période</p>
        <div className="flex gap-1">
          {PERIODES.map((p) => (
            <button
              key={p.value}
              onClick={() => onPeriodePreset(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
                periodePreset === p.value
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-ink hover:border-forest-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Statuts */}
      <div>
        <p className="font-display text-[11px] uppercase tracking-wide text-sand-500 mb-1">Statuts</p>
        <div className="flex gap-1">
          {STATUTS.map((s) => {
            const actif = statuts.includes(s.value)
            return (
              <button
                key={s.value}
                onClick={() => toggleStatut(s.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
                  actif
                    ? 'bg-forest-700 text-white'
                    : 'bg-white border border-sand-200 text-sand-500 hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Chef de chantier */}
      <div className="min-w-[200px]">
        <p className="font-display text-[11px] uppercase tracking-wide text-sand-500 mb-1">Chef de chantier</p>
        <select
          value={chefId ?? ''}
          onChange={(e) => onChefChange(e.target.value || null)}
          className="input text-sm py-1.5"
        >
          <option value="">Tous</option>
          {chefs.map((c) => (
            <option key={c.id} value={c.id}>{c.nom_complet ?? `${c.prenom} ${c.nom}`}</option>
          ))}
        </select>
      </div>

      <div className="ml-auto">
        <button onClick={onAujourdhui} className="btn-secondary text-sm py-2">
          Aujourd'hui
        </button>
      </div>
    </div>
  )
}

export { PERIODES }
