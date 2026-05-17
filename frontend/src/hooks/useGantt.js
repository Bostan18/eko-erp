import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'

export function useGantt({ dateDebut, dateFin, statuts, chefId }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (dateDebut) p.set('date_debut', dateDebut)
    if (dateFin)   p.set('date_fin', dateFin)
    if (statuts && statuts.length > 0) p.set('statut', statuts.join(','))
    if (chefId)    p.set('chef_chantier', chefId)
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [dateDebut, dateFin, statuts, chefId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api.get(`/projets/projets/gantt/${queryString}`)
      .then(({ data: payload }) => { if (!cancelled) setData(payload) })
      .catch(() => { if (!cancelled) setError('Impossible de charger le planning.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [queryString])

  return { data, loading, error }
}
