import { useState } from 'react'
import api from '../services/api'

export function useConvertirDevis({ onSuccess, onError }) {
  const [loading, setLoading] = useState(false)

  async function convertir(devisId) {
    setLoading(true)
    try {
      const { data } = await api.post(
        `/comptabilite/devis/${devisId}/convertir-facture/`,
      )
      onSuccess?.(data)
    } catch (err) {
      onError?.(err.response?.data?.detail ?? 'Erreur lors de la conversion.')
    } finally {
      setLoading(false)
    }
  }

  return { convertir, loading }
}
