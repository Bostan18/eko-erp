import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGantt } from '../../hooks/useGantt'
import GanttView from '../../components/gantt/GanttView'
import GanttFilters, { PERIODES } from '../../components/gantt/GanttFilters'
import { toISO } from '../../utils/dateHelpers'

const STATUTS_DEFAUT = ['planifie', 'en_cours', 'suspendu']

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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-[#A59F9B] text-sm">
            {loading ? '…' : `${data?.projets?.length ?? 0} projets sur ${data?.periode?.jours ?? 0} jours`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-white border border-[#ece2d3] p-0.5">
            <Link
              to="/projets"
              className="px-3 py-1.5 rounded-md text-xs font-display font-medium text-[#A59F9B] hover:text-[#1C1817]"
            >
              Vue liste
            </Link>
            <span className="px-3 py-1.5 rounded-md text-xs font-display font-medium bg-forest-700 text-white">
              Vue Gantt
            </span>
          </div>
          <button className="btn-primary" onClick={() => navigate('/projets')}>+ Nouveau projet</button>
        </div>
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
        <div className="card p-12 text-center text-[#A59F9B] font-body">Chargement du planning…</div>
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
