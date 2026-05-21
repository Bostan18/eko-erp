import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Modal, { FormSection, FormRow, Field } from '../../components/ui/Modal'
import ModuleTabs, { COMPTA_TABS } from '../../components/ui/ModuleTabs'
import { apiErrorMessage } from '../../utils/errors'
import { today } from '../../utils/format'

const TYPE_BADGE = {
  achat:        'badge-green',
  consommation: 'badge-red',
  ajustement:   'badge-gray',
}
const MODE_LABEL = { 'mobile-money': 'Mobile Money', card: 'Carte bancaire', transfer: 'Virement' }

export default function StickerList() {
  const [solde, setSolde]         = useState(null)
  const [mouvements, setMouvements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/comptabilite/stickers-achats/solde/').then((r) => r.data).catch(() => null),
      api.get('/comptabilite/stickers-mouvements/').then((r) => r.data.results ?? r.data).catch(() => []),
    ]).then(([s, m]) => {
      setSolde(s)
      setMouvements(Array.isArray(m) ? m : [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { charger() }, [charger])

  const soldeBas = solde && solde.solde <= 20

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Stickers FNE</div>
          <div className="sec-sub">
            Stock de vignettes électroniques · consommées à chaque certification
            {solde?.mode_simulation && <span className="text-gold-600"> · mode simulation</span>}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Acheter des stickers
        </button>
      </div>

      {soldeBas && (
        <div className="alert-gold">
          <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
          <strong className="font-display font-semibold">Solde bas ({solde.solde})</strong>
          <span className="text-gold-600">· rechargez le stock pour continuer à certifier</span>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-icon text-2xl">🎟️</div>
          <p className="kpi-label">Solde actuel</p>
          <p className={`kpi-value ${soldeBas ? 'text-gold-600' : 'text-forest-700'}`}>
            {loading ? '…' : solde?.solde ?? 0}
          </p>
          <p className="kpi-sub">stickers disponibles</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">⬆</div>
          <p className="kpi-label">Total acheté</p>
          <p className="kpi-value">{loading ? '…' : solde?.total_achete ?? 0}</p>
          <p className="kpi-sub">cumul des recharges</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">⬇</div>
          <p className="kpi-label">Total consommé</p>
          <p className="kpi-value">{loading ? '…' : solde?.total_consomme ?? 0}</p>
          <p className="kpi-sub">certifications & avoirs</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">{solde?.mode_simulation ? '🧪' : '🔗'}</div>
          <p className="kpi-label">Mode FNE</p>
          <p className="kpi-value text-[18px] pt-1">{solde?.mode_simulation ? 'Simulation' : 'API DGI'}</p>
          <p className="kpi-sub">{solde?.mode_simulation ? 'Credentials non configurés' : 'Connecté à la DGI'}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={COMPTA_TABS} />

        <div className="th-row">
          <div className="th-title">
            Mouvements ·{' '}
            <span className="text-sand-500 font-normal">{mouvements.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Date', 'Type', 'Quantité', 'Solde après', 'Facture', 'Détail'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {mouvements.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucun mouvement</td></tr>
              ) : mouvements.map((m) => (
                <tr key={m.id}>
                  <td className="mono-cell text-sand-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td><span className={TYPE_BADGE[m.type_mouvement] ?? 'badge-gray'}>{m.type_display}</span></td>
                  <td className={`num font-semibold ${m.quantite >= 0 ? 'text-forest-700' : 'text-red-600'}`}>
                    {m.quantite > 0 ? `+${m.quantite}` : m.quantite}
                  </td>
                  <td className="mono-cell">{m.solde_apres}</td>
                  <td className="mono-cell text-forest-700">{m.facture_numero || '—'}</td>
                  <td className="text-[12px] text-sand-500">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Acheter des stickers" sousTitre="Recharge du stock de vignettes FNE." onClose={() => setModal(false)}>
          <StickerAchatForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function StickerAchatForm({ onSuccess, onClose }) {
  const [form, setForm]     = useState({ date: today(), quantite: '', montant: '', mode_paiement: 'mobile-money', reference: '', notes: '' })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.quantite || Number(form.quantite) <= 0) { setError('Indiquez une quantité valide.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/comptabilite/stickers-achats/', { ...form, montant: form.montant || 0 })
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
          <div className="alert-red mb-5"><span className="w-1.5 h-1.5 bg-red-500 rounded-full" />{error}</div>
        )}
        <FormSection titre="Recharge">
          <FormRow cols={2}>
            <Field label="Quantité" required>
              <input type="number" min="1" className="input" placeholder="100" value={form.quantite}
                onChange={(e) => set('quantite', e.target.value)} />
            </Field>
            <Field label="Montant (F)" hint="Coût total de la recharge">
              <input type="number" min="0" className="input" placeholder="10000" value={form.montant}
                onChange={(e) => set('montant', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Date" required>
              <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Mode de paiement">
              <select className="input" value={form.mode_paiement} onChange={(e) => set('mode_paiement', e.target.value)}>
                {Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </FormRow>
          <Field label="Référence">
            <input className="input" placeholder="N° transaction Mobile Money…" value={form.reference}
              onChange={(e) => set('reference', e.target.value)} />
          </Field>
        </FormSection>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer la recharge'}
        </button>
      </div>
    </form>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
