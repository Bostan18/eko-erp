import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { apiErrorMessage } from '../../utils/errors'
import { FormSection, FormRow, Field, ModalFooter } from '../ui/Modal'

const INIT = {
  projet: '', tache: '', employe: '', site: '',
  date: new Date().toISOString().slice(0, 10),
  quantite: '', notes: '',
}

export default function LogTravailForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState(INIT)
  const [projets, setProjets]   = useState([])
  const [taches, setTaches]     = useState([])
  const [employes, setEmployes] = useState([])
  const [sites, setSites]       = useState([])
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/projets/projets/').then(({ data }) => setProjets(data.results ?? data)).catch(() => {})
    api.get('/rh/employes/').then(({ data }) => setEmployes(data.results ?? data)).catch(() => {})
    api.get('/operations/sites/?actif=true').then(({ data }) => setSites(data.results ?? data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!form.projet) { setTaches([]); return }
    api.get(`/projets/taches/?projet=${form.projet}`)
      .then(({ data }) => setTaches(data.results ?? data))
      .catch(() => setTaches([]))
  }, [form.projet])

  const tacheSelectionnee = useMemo(
    () => taches.find((t) => String(t.id) === String(form.tache)),
    [taches, form.tache]
  )

  const montantEstime = useMemo(() => {
    const q = Number(form.quantite) || 0
    const tarif = Number(tacheSelectionnee?.tarif_unitaire) || 0
    return q * tarif
  }, [form.quantite, tacheSelectionnee])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tache || !form.employe || !form.quantite) {
      setError('Tâche, employé et quantité sont requis.'); return
    }
    setSaving(true); setError('')
    try {
      await api.post('/projets/realisations/saisie_log/', {
        tache: form.tache, employe: form.employe,
        date: form.date, quantite: form.quantite,
        site: form.site || null, notes: form.notes,
      })
      onSuccess()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert-red mb-5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>
        )}
        <FormSection titre="Cible">
          <FormRow cols={2}>
            <Field label="Projet" required>
              <select className="input" value={form.projet}
                onChange={(e) => { set('projet', e.target.value); set('tache', '') }}>
                <option value="">— Sélectionner —</option>
                {projets.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.nom}</option>)}
              </select>
            </Field>
            <Field label="Tâche" required>
              <select className="input" value={form.tache}
                onChange={(e) => set('tache', e.target.value)} disabled={!form.projet}>
                <option value="">— Sélectionner —</option>
                {taches.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}{t.unite_label ? ` (${t.unite_label})` : ''}
                  </option>
                ))}
              </select>
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Employé" required>
              <select className="input" value={form.employe} onChange={(e) => set('employe', e.target.value)}>
                <option value="">— Sélectionner —</option>
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>{e.code} — {e.nom_complet}</option>
                ))}
              </select>
            </Field>
            <Field label="Site (optionnel)">
              <select className="input" value={form.site} onChange={(e) => set('site', e.target.value)}>
                <option value="">—</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>)}
              </select>
            </Field>
          </FormRow>
        </FormSection>

        <FormSection titre="Réalisation">
          <FormRow cols={2}>
            <Field label="Date">
              <input type="date" className="input" value={form.date}
                onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label={`Quantité${tacheSelectionnee?.unite_label ? ` (${tacheSelectionnee.unite_label})` : ''}`} required>
              <input type="number" step="0.01" min="0" className="input"
                value={form.quantite} onChange={(e) => set('quantite', e.target.value)} />
            </Field>
          </FormRow>
          {tacheSelectionnee && (
            <div className="card p-3 bg-sand-50 flex items-center justify-between">
              <span className="text-[12px] text-sand-600">
                Tarif : <span className="mono-cell">{Number(tacheSelectionnee.tarif_unitaire).toLocaleString('fr-FR')} F</span>
              </span>
              <span className="font-display font-semibold text-forest-700">
                ≈ {montantEstime.toLocaleString('fr-FR')} F
              </span>
            </div>
          )}
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      <ModalFooter>
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le log'}
        </button>
      </ModalFooter>
    </form>
  )
}
