import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGantt } from '../../hooks/useGantt'
import ModuleTabs, { PROJETS_TABS } from '../../components/ui/ModuleTabs'
import GanttView from '../../components/gantt/GanttView'
import GanttFilters, { PERIODES } from '../../components/gantt/GanttFilters'
import { toISO } from '../../utils/dateHelpers'

const STATUTS_DEFAUT = ['planifie', 'en_cours', 'suspendu']

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function PlanningGantt() {
  const navigate = useNavigate()
  const [periodePreset, setPeriodePreset] = useState('90j')
  const [statuts, setStatuts] = useState(STATUTS_DEFAUT)
  const [chefId, setChefId]   = useState(null)
  const [aujourdhuiTick, setAujourdhuiTick] = useState(0)

  const { dateDebut, dateFin } = useMemo(() => {
    const preset = PERIODES.find((p) => p.value === periodePreset) ?? PERIODES[1]
    const debut = new Date()
    debut.setHours(0, 0, 0, 0)
    const fin = new Date(debut)
    fin.setDate(fin.getDate() + preset.jours)
    return { dateDebut: toISO(debut), dateFin: toISO(fin) }
  }, [periodePreset])

  const { data, loading, error } = useGantt({ dateDebut, dateFin, statuts, chefId })

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Planning Gantt</div>
          <div className="sec-sub">
            Vue calendaire des projets ·{' '}
            {loading ? '…' : `${data?.projets?.length ?? 0} projet${(data?.projets?.length ?? 0) !== 1 ? 's' : ''} sur ${data?.periode?.jours ?? 0} jours`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => navigate('/projets')}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau projet
        </button>
      </div>

      {/* ─── Onglets module ─────────────────────────────── */}
      <div className="card">
        <ModuleTabs items={PROJETS_TABS} />
      </div>

      <GanttFilters
        periodePreset={periodePreset}
        onPeriodePreset={setPeriodePreset}
        statuts={statuts}
        onStatutsChange={setStatuts}
        chefId={chefId}
        onChefChange={setChefId}
        onAujourdhui={() => setAujourdhuiTick((t) => t + 1)}
      />

      {error && (
        <div className="card p-4 bg-red-50 ring-red-200">
          <p className="text-red-700 text-sm font-body">{error}</p>
        </div>
      )}

      {loading && !data && (
        <div className="card p-12 text-center text-sand-500 font-body">Chargement du planning…</div>
      )}

      {data && (
        <GanttView
          key={`${dateDebut}-${dateFin}`}
          data={data}
          scrollOnToday={aujourdhuiTick > 0}
        />
      )}
    </div>
  )
}
