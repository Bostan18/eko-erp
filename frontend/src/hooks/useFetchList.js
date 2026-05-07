import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useFetchList(endpoint, errorMsg = 'Impossible de charger les données.') {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const charger = useCallback(() => {
    setLoading(true)
    setError('')
    api.get(endpoint)
      .then(({ data }) => setItems(data.results ?? data))
      .catch(() => setError(errorMsg))
      .finally(() => setLoading(false))
  }, [endpoint, errorMsg])

  useEffect(() => { charger() }, [charger])

  return { items, loading, error, charger }
}
