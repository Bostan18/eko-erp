import { useEffect, useState } from 'react'
import api from '../../services/api'

const REGIME_CHOICES = [
  { value: 'RNI',  label: 'Régime Normal' },
  { value: 'RSI',  label: 'Régime Simplifié' },
  { value: 'RME',  label: 'Micro-Entreprise' },
  { value: 'RENT', label: 'Entrepreneur' },
]

const TEMPLATE_FNE_CHOICES = ['B2B', 'B2C', 'B2G', 'B2F']

export default function ParametresEntreprise() {
  const [config, setConfig]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [testing, setTesting]       = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [feedback, setFeedback]     = useState(null) // {type: 'success'|'error', msg}

  useEffect(() => {
    api.get('/core/entreprise/')
      .then(({ data }) => setConfig(data))
      .finally(() => setLoading(false))
  }, [])

  function set(field, value) {
    setConfig((c) => ({ ...c, [field]: value }))
    setFeedback(null)
  }

  async function enregistrer(e) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const { data } = await api.put('/core/entreprise/', config)
      setConfig(data)
      setFeedback({ type: 'success', msg: 'Configuration enregistrée.' })
    } catch (err) {
      const detail = err.response?.data
      setFeedback({
        type: 'error',
        msg: typeof detail === 'string' ? detail : JSON.stringify(detail),
      })
    } finally {
      setSaving(false)
    }
  }

  async function testerFNE() {
    setTesting(true)
    setTestResult(null)
    try {
      const { data } = await api.post('/core/entreprise/test-fne/')
      setTestResult(data)
    } catch (err) {
      setTestResult({ ok: false, message: err.response?.data?.message ?? 'Échec du test.' })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body">Chargement…</div>
  if (!config) return <div className="p-12 text-center text-red-500 font-body">Configuration introuvable.</div>

  return (
    <form onSubmit={enregistrer} className="space-y-6 max-w-[1000px]">
      <p className="font-body text-[#A59F9B] text-sm -mt-2">
        Identité légale, fiscalité, intégration FNE et préférences de facturation.
      </p>

      {feedback && (
        <div className={`card p-4 ${feedback.type === 'success' ? 'bg-forest-50 ring-forest-200' : 'bg-red-50 ring-red-200'}`}>
          <p className={`text-sm font-body ${feedback.type === 'success' ? 'text-forest-700' : 'text-red-700'}`}>
            {feedback.msg}
          </p>
        </div>
      )}

      <Section title="Identité légale" subtitle="Mentions obligatoires apparaissant sur les factures FNE (Art.6).">
        <Grid>
          <Field label="Raison sociale *">
            <input className="input" value={config.raison_sociale ?? ''} onChange={(e) => set('raison_sociale', e.target.value)} required />
          </Field>
          <Field label="Adresse" full>
            <textarea className="input min-h-[60px]" value={config.adresse ?? ''} onChange={(e) => set('adresse', e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <input className="input" value={config.telephone ?? ''} onChange={(e) => set('telephone', e.target.value)} />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={config.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Site web">
            <input type="url" className="input" value={config.site_web ?? ''} onChange={(e) => set('site_web', e.target.value)} placeholder="https://…" />
          </Field>
        </Grid>
      </Section>

      <Section title="Fiscalité Côte d'Ivoire" subtitle="Identifiants fiscaux exigés par la DGI.">
        <Grid>
          <Field label="N° Compte Contribuable (NCC)">
            <input className="input" value={config.ncc ?? ''} onChange={(e) => set('ncc', e.target.value)} />
          </Field>
          <Field label="N° RCCM">
            <input className="input" value={config.rccm ?? ''} onChange={(e) => set('rccm', e.target.value)} />
          </Field>
          <Field label="Régime d'imposition">
            <select className="input" value={config.regime_imposition ?? 'RNI'} onChange={(e) => set('regime_imposition', e.target.value)}>
              {REGIME_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="TVA par défaut (%)">
            <input type="number" step="0.01" className="input" value={config.tva_defaut ?? 18} onChange={(e) => set('tva_defaut', e.target.value)} />
          </Field>
        </Grid>
      </Section>

      <Section
        title="Intégration FNE (DGI)"
        subtitle="Credentials API DGI. Activer seulement après validation des tests."
        right={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!config.fne_actif}
                onChange={(e) => set('fne_actif', e.target.checked)}
                className="w-4 h-4 accent-forest-600"
              />
              <span className="text-sm font-display font-medium text-[#1C1817]">FNE activée</span>
            </label>
            <button
              type="button"
              onClick={testerFNE}
              disabled={testing || !config.fne_client_id || !config.fne_client_secret}
              className="btn-secondary"
            >
              {testing ? 'Test…' : 'Tester la connexion'}
            </button>
          </div>
        }
      >
        {testResult && (
          <div className={`mb-4 p-3 rounded-lg ring-1 ${testResult.ok ? 'bg-forest-50 ring-forest-200 text-forest-700' : 'bg-red-50 ring-red-200 text-red-700'} text-sm font-body`}>
            {testResult.message || (testResult.ok ? 'Connexion FNE OK.' : 'Échec.')}
          </div>
        )}
        <Grid>
          <Field label="URL API FNE" full>
            <input className="input" value={config.fne_api_url ?? ''} onChange={(e) => set('fne_api_url', e.target.value)} />
          </Field>
          <Field label="Client ID">
            <input className="input" value={config.fne_client_id ?? ''} onChange={(e) => set('fne_client_id', e.target.value)} />
          </Field>
          <Field label="Client Secret">
            <input type="password" className="input" value={config.fne_client_secret ?? ''} onChange={(e) => set('fne_client_secret', e.target.value)} />
          </Field>
          <Field label="Establishment ID">
            <input className="input" value={config.fne_establishment_id ?? ''} onChange={(e) => set('fne_establishment_id', e.target.value)} />
          </Field>
          <Field label="Point of Sale ID">
            <input className="input" value={config.fne_point_of_sale_id ?? ''} onChange={(e) => set('fne_point_of_sale_id', e.target.value)} />
          </Field>
        </Grid>
      </Section>

      <Section title="Préférences facturation" subtitle="Numérotation et mentions par défaut.">
        <Grid>
          <Field label="Template FNE par défaut">
            <select className="input" value={config.template_fne_defaut ?? 'B2B'} onChange={(e) => set('template_fne_defaut', e.target.value)}>
              {TEMPLATE_FNE_CHOICES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Préfixe devis">
            <input className="input" value={config.prefixe_devis ?? 'DEV'} onChange={(e) => set('prefixe_devis', e.target.value)} />
          </Field>
          <Field label="Préfixe facture">
            <input className="input" value={config.prefixe_facture ?? 'FAC'} onChange={(e) => set('prefixe_facture', e.target.value)} />
          </Field>
          <Field label="Mentions légales (pied de facture)" full>
            <textarea className="input min-h-[80px]" value={config.mentions_legales ?? ''} onChange={(e) => set('mentions_legales', e.target.value)} />
          </Field>
        </Grid>
      </Section>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}

function Section({ title, subtitle, right, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-display font-semibold text-[#1C1817] text-[16px] leading-[1.4]">{title}</h3>
          {subtitle && <p className="font-body text-[#A59F9B] text-xs mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

function Field({ label, full, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block font-display text-[12.8px] font-medium text-[#1C1817] mb-1">{label}</label>
      {children}
    </div>
  )
}
