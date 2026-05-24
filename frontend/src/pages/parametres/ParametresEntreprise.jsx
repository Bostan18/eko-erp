import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { SkeletonPage } from '../../components/ui/Skeleton'
import {
  IconBuilding, IconShield, IconLink, IconInvoice,
  IconCheck, IconAlert, IconRefresh,
} from '../../components/ui/Icons'

/* ─── Choix backend ──────────────────────────────────────── */
const REGIME_CHOICES = [
  { value: 'RNI',  label: 'Régime Normal' },
  { value: 'RSI',  label: 'Régime Simplifié' },
  { value: 'RME',  label: 'Micro-Entreprise' },
  { value: 'RENT', label: 'Entrepreneur' },
]
const REGIME_LABEL = Object.fromEntries(REGIME_CHOICES.map((r) => [r.value, r.label]))
const TEMPLATE_FNE_CHOICES = ['B2B', 'B2C', 'B2G', 'B2F']

/* ─── Tons icon-badge ────────────────────────────────────── */
const BADGE_TONE = {
  forest: 'bg-forest-100 text-forest-700',
  gold:   'bg-gold-100 text-gold-700',
  blue:   'bg-blue-100 text-blue-700',
  sand:   'bg-sand-100 text-sand-700',
}

export default function ParametresEntreprise() {
  const [config, setConfig]         = useState(null)
  const [initial, setInitial]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [testing, setTesting]       = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [feedback, setFeedback]     = useState(null) // {type: 'success'|'error', msg}

  useEffect(() => {
    api.get('/core/entreprise/')
      .then(({ data }) => { setConfig(data); setInitial(data) })
      .finally(() => setLoading(false))
  }, [])

  const dirty = useMemo(() => {
    if (!config || !initial) return false
    return JSON.stringify(config) !== JSON.stringify(initial)
  }, [config, initial])

  function set(field, value) {
    setConfig((c) => ({ ...c, [field]: value }))
    setFeedback(null)
  }

  function annuler() {
    setConfig(initial)
    setFeedback(null)
    setTestResult(null)
  }

  async function enregistrer(e) {
    if (e?.preventDefault) e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      const { data } = await api.put('/core/entreprise/', config)
      setConfig(data)
      setInitial(data)
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

  if (loading) return <SkeletonPage />
  if (!config) return <div className="p-12 text-center text-red-500 font-body">Configuration introuvable.</div>

  const fneOk = !!(config.fne_actif && config.fne_client_id && config.fne_client_secret)
  const tvaVal = Number(config.tva_defaut ?? 0)

  return (
    <div className="space-y-5 pb-24">
      {/* ─── sec-head ────────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Configuration entreprise</div>
          <div className="sec-sub">
            Identité légale, fiscalité, intégration FNE et préférences de facturation.
          </div>
        </div>
      </div>

      {/* ─── Status strip ────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-sand-100">
          <StatusCell
            label="Raison sociale"
            value={config.raison_sociale || '—'}
            sub={config.ncc ? `NCC · ${config.ncc}` : 'NCC non renseigné'}
          />
          <StatusCell
            label="Régime fiscal"
            value={REGIME_LABEL[config.regime_imposition] ?? '—'}
            sub={`TVA défaut · ${tvaVal}%`}
          />
          <StatusCell
            label="FNE"
            value={
              <span className="inline-flex items-center gap-2 whitespace-nowrap">
                <span className={`w-2 h-2 rounded-full ${fneOk ? 'bg-forest-500 animate-pulse' : 'bg-sand-400'}`} />
                {fneOk ? 'Activée' : 'Inactive'}
              </span>
            }
            sub={config.template_fne_defaut ? `Template · ${config.template_fne_defaut}` : '—'}
          />
          <StatusCell
            label="Préfixes"
            value={
              <span className="font-mono text-[14.5px]">
                {config.prefixe_devis || 'DEV'}<span className="text-sand-400 mx-1">·</span>{config.prefixe_facture || 'FAC'}
              </span>
            }
            sub="Devis · Facture"
          />
        </div>
      </div>

      {/* ─── Feedback global ─────────────────────────────── */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'alert-green' : 'alert-red'}>
          {feedback.type === 'success'
            ? <IconCheck className="w-4 h-4 shrink-0" />
            : <IconAlert className="w-4 h-4 shrink-0" />}
          <span className="min-w-0 truncate">{feedback.msg}</span>
        </div>
      )}

      <form onSubmit={enregistrer} className="space-y-5">
        {/* ─── Identité légale ───────────────────────────── */}
        <Section
          icon={IconBuilding}
          tone="forest"
          title="Identité légale"
          subtitle="Mentions obligatoires sur les factures FNE (Art. 6)."
        >
          <Grid>
            <Field label="Raison sociale" required>
              <input
                className="input"
                value={config.raison_sociale ?? ''}
                onChange={(e) => set('raison_sociale', e.target.value)}
                required
              />
            </Field>
            <Field label="Téléphone">
              <input
                className="input"
                value={config.telephone ?? ''}
                onChange={(e) => set('telephone', e.target.value)}
                placeholder="+225 …"
              />
            </Field>
            <Field label="Adresse" full>
              <textarea
                className="input min-h-[68px]"
                value={config.adresse ?? ''}
                onChange={(e) => set('adresse', e.target.value)}
                placeholder="Rue, quartier, commune, ville"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="input"
                value={config.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                placeholder="contact@eko-sarl.ci"
              />
            </Field>
            <Field label="Site web">
              <input
                type="url"
                className="input"
                value={config.site_web ?? ''}
                onChange={(e) => set('site_web', e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </Grid>
        </Section>

        {/* ─── Fiscalité ─────────────────────────────────── */}
        <Section
          icon={IconShield}
          tone="gold"
          title="Fiscalité Côte d'Ivoire"
          subtitle="Identifiants fiscaux exigés par la DGI."
        >
          <Grid>
            <Field label="N° Compte Contribuable (NCC)" hint="Identifiant DGI">
              <input
                className="input font-mono"
                value={config.ncc ?? ''}
                onChange={(e) => set('ncc', e.target.value)}
                placeholder="0123456789"
              />
            </Field>
            <Field label="N° RCCM" hint="Registre du Commerce">
              <input
                className="input font-mono"
                value={config.rccm ?? ''}
                onChange={(e) => set('rccm', e.target.value)}
                placeholder="CI-ABJ-…"
              />
            </Field>
            <Field label="Régime d'imposition">
              <select
                className="input"
                value={config.regime_imposition ?? 'RNI'}
                onChange={(e) => set('regime_imposition', e.target.value)}
              >
                {REGIME_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="TVA par défaut" hint="Appliquée hors exonération">
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  className="input pr-9"
                  value={config.tva_defaut ?? 18}
                  onChange={(e) => set('tva_defaut', e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-500 text-[12px] font-mono pointer-events-none">%</span>
              </div>
            </Field>
          </Grid>
        </Section>

        {/* ─── FNE ───────────────────────────────────────── */}
        <Section
          icon={IconLink}
          tone="blue"
          title="Intégration FNE (DGI)"
          subtitle="Credentials API DGI. À activer après validation."
          right={
            <span className={fneOk ? 'badge-green' : 'badge-gray'}>
              <span className={`w-1.5 h-1.5 rounded-full ${fneOk ? 'bg-forest-500' : 'bg-sand-500'}`} />
              {fneOk ? 'Activée' : 'Inactive'}
            </span>
          }
        >
          {/* Bandeau d'activation + test */}
          <div className="rounded-xl bg-sand-50 border border-sand-200 p-3 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={!!config.fne_actif}
                onChange={(e) => set('fne_actif', e.target.checked)}
                className="w-4 h-4 accent-forest-600 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-display font-medium text-ink text-[13px]">Activer la FNE</p>
                <p className="text-[11px] text-sand-500">Déclaration temps réel des factures à la DGI.</p>
              </div>
            </label>
            <button
              type="button"
              onClick={testerFNE}
              disabled={testing || !config.fne_client_id || !config.fne_client_secret}
              className="btn-secondary shrink-0 justify-center"
              title={(!config.fne_client_id || !config.fne_client_secret) ? 'Renseignez Client ID + Secret' : 'Tester la connexion'}
            >
              <IconRefresh className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Test…' : 'Tester la connexion'}
            </button>
          </div>

          {testResult && (
            <div className={`mb-4 ${testResult.ok ? 'alert-green' : 'alert-red'}`}>
              {testResult.ok
                ? <IconCheck className="w-4 h-4 shrink-0" />
                : <IconAlert className="w-4 h-4 shrink-0" />}
              <span>{testResult.message || (testResult.ok ? 'Connexion FNE OK.' : 'Échec de la connexion.')}</span>
            </div>
          )}

          <Grid>
            <Field label="URL API FNE" full hint="URL fournie par la DGI (test ou production)">
              <input
                className="input font-mono"
                value={config.fne_api_url ?? ''}
                onChange={(e) => set('fne_api_url', e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Client ID">
              <input
                className="input font-mono"
                value={config.fne_client_id ?? ''}
                onChange={(e) => set('fne_client_id', e.target.value)}
              />
            </Field>
            <Field label="Client Secret">
              <input
                type="password"
                className="input font-mono"
                value={config.fne_client_secret ?? ''}
                onChange={(e) => set('fne_client_secret', e.target.value)}
              />
            </Field>
            <Field label="Establishment ID">
              <input
                className="input font-mono"
                value={config.fne_establishment_id ?? ''}
                onChange={(e) => set('fne_establishment_id', e.target.value)}
              />
            </Field>
            <Field label="Point of Sale ID">
              <input
                className="input font-mono"
                value={config.fne_point_of_sale_id ?? ''}
                onChange={(e) => set('fne_point_of_sale_id', e.target.value)}
              />
            </Field>
          </Grid>
        </Section>

        {/* ─── Facturation ───────────────────────────────── */}
        <Section
          icon={IconInvoice}
          tone="sand"
          title="Préférences facturation"
          subtitle="Numérotation et mentions par défaut sur devis et factures."
        >
          <Grid>
            <Field label="Template FNE par défaut" hint="B2B, B2C, B2G ou B2F">
              <select
                className="input"
                value={config.template_fne_defaut ?? 'B2B'}
                onChange={(e) => set('template_fne_defaut', e.target.value)}
              >
                {TEMPLATE_FNE_CHOICES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Préfixe devis">
              <input
                className="input font-mono"
                value={config.prefixe_devis ?? 'DEV'}
                onChange={(e) => set('prefixe_devis', e.target.value)}
              />
            </Field>
            <Field label="Préfixe facture">
              <input
                className="input font-mono"
                value={config.prefixe_facture ?? 'FAC'}
                onChange={(e) => set('prefixe_facture', e.target.value)}
              />
            </Field>
            <Field
              label="Mentions légales"
              full
              hint={`Pied de chaque facture · ${(config.mentions_legales ?? '').length} car.`}
            >
              <textarea
                className="input min-h-[88px]"
                value={config.mentions_legales ?? ''}
                onChange={(e) => set('mentions_legales', e.target.value)}
                placeholder="Conditions de paiement, TVA, pénalités de retard…"
              />
            </Field>
          </Grid>
        </Section>
      </form>

      {/* ─── Sticky save bar (apparaît seulement quand dirty) ─── */}
      {dirty && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40 max-w-[640px] w-[calc(100%-24px)] md:bottom-6"
          style={{ bottom: 'max(1rem, calc(56px + 1rem + env(safe-area-inset-bottom)))' }}
        >
          <div className="bg-forest-950 text-sand-100 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 animate-popover ring-1 ring-white/10"
               style={{ boxShadow: '0 12px 28px -10px rgba(15,43,28,0.55)' }}>
            <p className="text-[12.5px] font-display flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse shrink-0" />
              <span className="truncate">Modifications non enregistrées</span>
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={annuler}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-[12px] font-display font-medium text-sand-200 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={enregistrer}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-forest-500 hover:bg-forest-600 text-white text-[12px] font-display font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving && <IconRefresh className="w-3 h-3 animate-spin" />}
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sous-composants ───────────────────────────────────── */

function StatusCell({ label, value, sub }) {
  return (
    <div className="px-5 py-4 min-w-0">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500 font-medium">{label}</p>
      <p className="font-display font-semibold text-[14.5px] text-ink mt-1.5 leading-tight truncate">
        {value}
      </p>
      {sub && <p className="text-[10.5px] text-sand-500 mt-1 truncate">{sub}</p>}
    </div>
  )
}

function Section({ icon: Icon, tone = 'sand', title, subtitle, right, children }) {
  return (
    <section className="card overflow-hidden">
      <div className="th-row">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${BADGE_TONE[tone] ?? BADGE_TONE.sand}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
          )}
          <div className="min-w-0">
            <p className="th-title">{title}</p>
            {subtitle && <p className="text-[11.5px] text-sand-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
      <div className="p-[18px]">{children}</div>
    </section>
  )
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">{children}</div>
}

function Field({ label, hint, full, required, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block font-display text-[12.5px] font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10.5px] text-sand-500 mt-1 font-body">{hint}</p>}
    </div>
  )
}
