import { useEffect, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'

const INIT = {
  article: '',
  type_mouvement: 'entree',
  quantite: '',
  date: new Date().toISOString().slice(0, 10),
  projet: '',
  notes: '',
}

function validate(form) {
  if (!form.article) return 'Article requis.'
  if (!form.quantite || Number(form.quantite) <= 0) return 'La quantité doit être supérieure à 0.'
  if (!form.date) return 'Date requise.'
  return null
}

export default function MouvementStockForm({ onSuccess, onClose }) {
  const [form, setForm]       = useState(INIT)
  const [articles, setArticles] = useState([])
  const [projets, setProjets]   = useState([])
  const [error, setError]     = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    api.get('/stocks/articles/').then(({ data }) => setArticles(data.results ?? data))
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data))
  }, [])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  const articleSelectionne = articles.find((a) => String(a.id) === String(form.article))

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/stocks/mouvements/', {
        article: Number(form.article),
        type_mouvement: form.type_mouvement,
        quantite: form.quantite,
        date: form.date,
        projet: form.projet ? Number(form.projet) : null,
        notes: form.notes,
      })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
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
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Article *</label>
          <select className="input" value={form.article} onChange={(e) => set('article', e.target.value)}>
            <option value="">— Choisir un article —</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Type *</label>
          <select className="input" value={form.type_mouvement} onChange={(e) => set('type_mouvement', e.target.value)}>
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">
            Quantité *{articleSelectionne ? ` (${articleSelectionne.unite})` : ''}
          </label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0"
            value={form.quantite} onChange={(e) => set('quantite', e.target.value)} />
        </div>
        <div>
          <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Date *</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Projet (optionnel)</label>
        <select className="input" value={form.projet} onChange={(e) => set('projet', e.target.value)}>
          <option value="">— Aucun projet rattaché —</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-display text-xs font-medium text-[#1C1817] mb-1">Notes</label>
        <textarea className="input resize-none" rows={2} placeholder="Référence BL, motif…"
          value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </div>

      {articleSelectionne && form.type_mouvement === 'sortie' && form.quantite && (
        Number(form.quantite) > Number(articleSelectionne.stock_actuel) && (
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
            ⚠ Cette sortie ({form.quantite}) dépasse le stock actuel ({articleSelectionne.stock_actuel} {articleSelectionne.unite}).
          </div>
        )
      )}

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le mouvement'}
        </button>
      </div>
    </form>
  )
}
