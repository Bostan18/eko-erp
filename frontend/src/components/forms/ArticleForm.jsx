import { useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field } from '../ui/Modal'

const INIT = {
  code: '', nom: '', categorie: 'materiau', unite: 'u',
  stock_actuel: '0', seuil_minimum: '0', prix_unitaire: '0',
  fournisseur: '', description: '',
}

function validate(form) {
  if (!form.code.trim()) return 'Le code est requis (ex : ART-001).'
  if (!form.nom.trim()) return "Le nom de l'article est requis."
  if (Number(form.prix_unitaire) < 0) return 'Le prix unitaire ne peut pas être négatif.'
  if (Number(form.stock_actuel) < 0) return 'Le stock actuel ne peut pas être négatif.'
  if (Number(form.seuil_minimum) < 0) return 'Le seuil minimum ne peut pas être négatif.'
  return null
}

export default function ArticleForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validErr = validate(form)
    if (validErr) { setError(validErr); return }
    setSaving(true)
    setError('')
    try {
      await api.post('/stocks/articles/', form)
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1">
        {error && (
          <div className="alert-red mb-5">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            {error}
          </div>
        )}

        <FormSection titre="Identification">
          <FormRow cols={2}>
            <Field label="Code" required hint="Format : ART-001">
              <input className="input" placeholder="ART-001" value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())} />
            </Field>
            <Field label="Catégorie" required>
              <select className="input" value={form.categorie} onChange={(e) => set('categorie', e.target.value)}>
                <option value="intrant">Intrant agricole</option>
                <option value="materiau">Matériau BTP</option>
                <option value="equipement">Équipement</option>
                <option value="consommable">Consommable</option>
                <option value="piece">Pièce détachée</option>
              </select>
            </Field>
          </FormRow>
          <Field label="Nom" required>
            <input className="input" placeholder="Ciment Portland 50kg" value={form.nom}
              onChange={(e) => set('nom', e.target.value)} />
          </Field>
        </FormSection>

        <FormSection titre="Unité & valorisation">
          <FormRow cols={2}>
            <Field label="Unité">
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
            </Field>
            <Field label="Prix unitaire (F)">
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.prix_unitaire}
                onChange={(e) => set('prix_unitaire', e.target.value)} />
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Stock & seuils">
          <FormRow cols={2}>
            <Field label="Stock actuel">
              <input type="number" min="0" step="1" className="input" placeholder="0" value={form.stock_actuel}
                onChange={(e) => set('stock_actuel', e.target.value)} />
            </Field>
            <Field label="Seuil minimum" hint="Déclenche l'alerte stock">
              <input type="number" min="0" step="1" className="input" placeholder="5" value={form.seuil_minimum}
                onChange={(e) => set('seuil_minimum', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Fournisseur">
            <input className="input" placeholder="Société ABC" value={form.fournisseur}
              onChange={(e) => set('fournisseur', e.target.value)} />
          </Field>
        </FormSection>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : "Créer l'article"}
        </button>
      </div>
    </form>
  )
}
