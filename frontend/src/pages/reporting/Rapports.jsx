import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { REPORTING_TABS } from '../../components/ui/ModuleTabs'
import { useFetchList } from '../../hooks/useFetchList'
import { FormSection, FormRow, Field } from '../../components/ui/Modal'
import { apiErrorMessage } from '../../utils/errors'

const TYPE_TONE = { bilan_carbone: 'green', esg: 'blue', operations: 'gold' }

export default function Rapports() {
  const { items: rapports, loading, error, charger } = useFetchList(
    '/reporting/rapports/', 'Impossible de charger les rapports.'
  )
  const [modal, setModal] = useState(false)

  function ouvrirPdf(rapport) {
    // GET avec token JWT via api → blob → ouvre dans un nouvel onglet
    api.get(`/reporting/rapports/${rapport.id}/pdf/`, { responseType: 'blob' })
      .then(({ data }) => {
        const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
        window.open(url, '_blank')
        // libère mémoire un peu plus tard
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      })
      .catch(() => {/* silencieux */})
  }

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden"><ModuleTabs items={REPORTING_TABS} /></div>

      <div className="sec-head">
        <div>
          <div className="sec-title">Rapports BI</div>
          <div className="sec-sub">Génération à la demande · PDF Bilan Carbone, ESG, Synthèse opérationnelle.</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau rapport
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="th-title">Historique · <span className="text-sand-500 font-normal">{rapports.length}</span></div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Titre', 'Type', 'Période', 'Généré par', 'Créé le', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rapports.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucun rapport généré</td></tr>
              ) : rapports.map((r) => (
                <tr key={r.id}>
                  <td className="font-display font-medium text-ink">{r.titre}</td>
                  <td><Badge tone={TYPE_TONE[r.type_rapport] ?? 'gray'}>{r.type_rapport_display}</Badge></td>
                  <td className="mono-cell text-sand-700 text-[12px]">{r.periode_debut} → {r.periode_fin}</td>
                  <td className="text-sand-600">{r.genere_par || '—'}</td>
                  <td className="mono-cell text-sand-500 text-[11px]">{r.created_at?.slice(0, 10)}</td>
                  <td>
                    <button onClick={() => ouvrirPdf(r)}
                      className="text-[11px] px-2 py-1 rounded bg-forest-50 text-forest-700 hover:bg-forest-100">
                      📄 Voir PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Générer un rapport" sousTitre="Métadonnées du rapport." onClose={() => setModal(false)}>
          <RapportForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function RapportForm({ onSuccess, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const debutAnnee = `${new Date().getFullYear()}-01-01`
  const [form, setForm] = useState({
    titre: '', type_rapport: 'bilan_carbone',
    periode_debut: debutAnnee, periode_fin: today,
    genere_par: '', notes: '',
  })
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titre.trim()) { setError('Titre requis.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/reporting/rapports/', form)
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
        <FormSection titre="Rapport">
          <Field label="Titre" required>
            <input className="input" placeholder="Bilan Carbone T1 2026, ESG annuel…"
              value={form.titre} onChange={(e) => set('titre', e.target.value)} />
          </Field>
          <FormRow cols={2}>
            <Field label="Type">
              <select className="input" value={form.type_rapport} onChange={(e) => set('type_rapport', e.target.value)}>
                <option value="bilan_carbone">Bilan Carbone</option>
                <option value="esg">Rapport ESG</option>
                <option value="operations">Synthèse opérationnelle</option>
              </select>
            </Field>
            <Field label="Généré par">
              <input className="input" placeholder="RSE / DAF / Direction…"
                value={form.genere_par} onChange={(e) => set('genere_par', e.target.value)} />
            </Field>
          </FormRow>
          <FormRow cols={2}>
            <Field label="Période début" required>
              <input type="date" className="input" value={form.periode_debut}
                onChange={(e) => set('periode_debut', e.target.value)} />
            </Field>
            <Field label="Période fin" required>
              <input type="date" className="input" value={form.periode_fin}
                onChange={(e) => set('periode_fin', e.target.value)} />
            </Field>
          </FormRow>
          <Field label="Notes">
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </FormSection>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-sand-200 -mx-6 px-6 -mb-5 pb-5 mt-2 bg-sand-50/40">
        <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Génération…' : 'Générer'}
        </button>
      </div>
    </form>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
