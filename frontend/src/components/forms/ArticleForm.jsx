import { useState } from 'react'
import api from '../../services/api'

const INIT = {
  code: '', nom: '', categorie: 'materiau', unite: 'u',
  stock_actuel: '0', seuil_minimum: '0', prix_unitaire: '0', fournisseur: '', description: '',
}

export default function ArticleForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.post('/stocks/articles/', form)
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      setError(data ? JSON.stringify(data) : 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Code *</label>
          <input className="input" placeholder="ART-001" value={form.code}
            onChange={(e) => set('code', e.target.value)} required />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Catégorie *</label>
          <select className="input" value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
            <option value="intrant">Intrant agricole</option>
            <option value="materiau">Matériau BTP</option>
            <option value="equipement">Équipement</option>
            <option value="consommable">Consommable</option>
            <option value="piece">Pièce détachée</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-gray-600 mb-1">Nom *</label>
        <input className="input" placeholder="Ciment Portland 50kg" value={form.nom}
          onChange={(e) => set('nom', e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Unité</label>
          <select className="input" value={form.unite} onChange={(e) => set('unite', e.target.value)}>
            <option value="u">Unité</option>
            <option value="sac">Sac</option>
            <option value="kg">Kilogramme</option>
            <option value="tonne">Tonne</option>
            <option value="l">Litre</option>
            <option value="m">Mètre</option>
            <option value="m2">Mètre carré</option>
            <option value="m3">Mètre cube</option>
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Prix unitaire (F)</label>
          <input type="number" className="input" placeholder="0" value={form.prix_unitaire}
            onChange={(e) => set('prix_unitaire', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Stock actuel</label>
          <input type="number" className="input" placeholder="0" value={form.stock_actuel}
            onChange={(e) => set('stock_actuel', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-gray-600 mb-1">Seuil minimum ⚠️</label>
          <input type="number" className="input" placeholder="5" value={form.seuil_minimum}
            onChange={(e) => set('seuil_minimum', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-gray-600 mb-1">Fournisseur</label>
        <input className="input" placeholder="Société ABC" value={form.fournisseur}
          onChange={(e) => set('fournisseur', e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Créer l\'article'}
        </button>
      </div>
    </form>
  )
}
