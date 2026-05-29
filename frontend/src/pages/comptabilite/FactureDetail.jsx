import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Badge from '../../components/ui/Badge'
import { apiErrorMessage } from '../../utils/errors'

function exportFile(url, filename) {
  api.get(url, { responseType: 'blob' }).then(({ data }) => {
    const href = URL.createObjectURL(data)
    Object.assign(document.createElement('a'), { href, download: filename }).click()
    URL.revokeObjectURL(href)
  })
}

function fmt(n) { return Number(n ?? 0).toLocaleString('fr-FR') }
function today() { return new Date().toISOString().slice(0, 10) }

const STATUT_TONE  = { brouillon: 'gray', certifiee: 'blue', payee: 'green', annulee: 'gray' }
const STATUT_LABEL = { brouillon: 'Brouillon', certifiee: 'Certifiée FNE', payee: 'Payée', annulee: 'Annulée' }
const TVA_LABEL    = { TVA: 'TVA 18%', TVAB: 'TVAB 9%', TVAC: 'TVAC 0%', TVAD: 'TVAD 27%', '0': 'Exonéré' }
const TEMPLATE_LABEL = { B2B: 'B2B — Entreprise', B2C: 'B2C — Particulier', B2G: 'B2G — Administration', B2F: 'B2F — International' }
const MODE_LABEL   = {
  cash: 'Espèces', card: 'Carte', check: 'Chèque',
  'mobile-money': 'Mobile Money', transfer: 'Virement', deferred: 'Différé',
}

export default function FactureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [facture, setFacture]     = useState(null)
  const [paiements, setPaiements] = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('detail')

  const [showPaie, setShowPaie]   = useState(false)
  const [paie, setPaie]           = useState({ montant: '', mode: 'virement', reference: '', date: today() })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // États actions FNE
  const [fneBusy, setFneBusy]     = useState(false)
  const [fneMsg, setFneMsg]       = useState(null)   // { tone, text }

  function charger() {
    Promise.all([
      api.get(`/comptabilite/factures/${id}/`),
      api.get(`/comptabilite/paiements/?facture=${id}`),
    ]).then(([{ data: f }, { data: p }]) => {
      setFacture(f)
      setPaiements(p.results ?? p)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [id])

  async function enregistrerPaiement(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/comptabilite/paiements/', { ...paie, facture: id })
      setShowPaie(false)
      setPaie({ montant: '', mode: 'virement', reference: '', date: today() })
      charger()
    } catch (err) {
      setError(apiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function certifier() {
    setFneBusy(true); setFneMsg(null)
    try {
      const { data } = await api.post(`/comptabilite/factures/${id}/certifier/`)
      setFneMsg({
        tone: 'good',
        text: data.simulation
          ? `Certifiée en mode simulation — référence ${data.fne_reference}.`
          : `Certifiée FNE — référence ${data.fne_reference}.`,
      })
      charger()
    } catch (err) {
      setFneMsg({ tone: 'bad', text: apiErrorMessage(err) })
    } finally {
      setFneBusy(false)
    }
  }

  async function emettreAvoir() {
    if (!confirm("Émettre un avoir pour cette facture ? Un sticker sera consommé.")) return
    setFneBusy(true); setFneMsg(null)
    try {
      const { data } = await api.post(`/comptabilite/factures/${id}/avoir/`)
      navigate(`/comptabilite/factures/${data.id}`)
    } catch (err) {
      setFneMsg({ tone: 'bad', text: apiErrorMessage(err) })
      setFneBusy(false)
    }
  }

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (!facture) return <div className="p-12 text-center text-red-500 font-body">Facture introuvable.</div>

  const estAvoir   = facture.type_facture === 'avoir'
  const progression = facture.total_ttc > 0
    ? Math.min(100, (Number(facture.montant_paye) / Number(facture.total_ttc)) * 100)
    : 0

  const TABS = [
    { key: 'detail', label: 'Détail' },
    { key: 'fne',    label: 'Certification FNE' },
    ...(estAvoir ? [] : [{ key: 'avoirs', label: `Avoirs${facture.avoirs?.length ? ` (${facture.avoirs.length})` : ''}` }]),
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/comptabilite/factures" className="hover:text-forest-700 transition-colors">Factures</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">{facture.numero_local}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="font-display font-bold text-ink text-xl">{facture.numero_local}</h1>
            <Badge tone={STATUT_TONE[facture.statut] ?? 'gray'}>
              {STATUT_LABEL[facture.statut] ?? facture.statut}
            </Badge>
            {estAvoir && <Badge tone="red">Avoir</Badge>}
            {facture.est_verrouillee && (
              <span className="badge-gray inline-flex items-center gap-1" title="Facture verrouillée (certifiée FNE)">
                <IconLock className="w-3 h-3" /> Verrouillée
              </span>
            )}
            {facture.centre_cout_display && <span className="badge-blue">{facture.centre_cout_display}</span>}
          </div>
          <p className="font-display font-medium text-ink text-[15px]">{facture.client_nom}</p>
          <p className="font-body text-sand-500 text-[12px] mt-0.5">
            {facture.client_ncc ? `NCC ${facture.client_ncc}` : 'NCC non renseigné'}
            {facture.projet_nom && <span> · {facture.projet_nom}</span>}
            {estAvoir && facture.facture_origine_numero && (
              <span> · sur <Link to={`/comptabilite/factures/${facture.facture_origine}`} className="text-forest-700 hover:underline">{facture.facture_origine_numero}</Link></span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {facture.statut === 'brouillon' && (
            <button className="btn-primary" onClick={certifier} disabled={fneBusy}>
              {fneBusy ? 'Certification…' : '⚡ Certifier FNE'}
            </button>
          )}
          {facture.statut !== 'payee' && !estAvoir && (
            <button className="btn-secondary" onClick={() => { setTab('detail'); setShowPaie(true) }}>
              <IconPlus className="w-3.5 h-3.5" /> Paiement
            </button>
          )}
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/export_excel/`, `facture_${facture.numero_local}.xlsx`)}>⬇ Excel</button>
          <button className="btn-secondary" onClick={() => exportFile(`/comptabilite/factures/${id}/pdf/`, `facture_${facture.numero_local}.pdf`)}>⬇ PDF</button>
          <Link to="/comptabilite/factures" className="btn-ghost">← Retour</Link>
        </div>
      </div>

      {fneMsg && (
        <div className={fneMsg.tone === 'bad' ? 'alert-red' : 'alert-green'}>
          <span className={`w-1.5 h-1.5 rounded-full ${fneMsg.tone === 'bad' ? 'bg-red-500' : 'bg-forest-500'}`} />
          {fneMsg.text}
        </div>
      )}

      {/* Onglets */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`tab${tab === t.key ? ' active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'detail' && (
        <DetailTab
          facture={facture} paiements={paiements} progression={progression}
          showPaie={showPaie} setShowPaie={setShowPaie}
          paie={paie} setPaie={setPaie} saving={saving} error={error}
          enregistrerPaiement={enregistrerPaiement}
        />
      )}
      {tab === 'fne' && (
        <CertificationTab facture={facture} certifier={certifier} fneBusy={fneBusy} />
      )}
      {tab === 'avoirs' && !estAvoir && (
        <AvoirsTab facture={facture} emettreAvoir={emettreAvoir} fneBusy={fneBusy} />
      )}
    </div>
  )
}

/* ─── Onglet Détail ──────────────────────────────────────────── */
function DetailTab({ facture, paiements, progression, showPaie, setShowPaie, paie, setPaie, saving, error, enregistrerPaiement }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi">
          <p className="kpi-label">Montant TTC</p>
          <p className="kpi-value">{fmt(facture.total_ttc)} <span className="kpi-unit">F</span></p>
          <p className="kpi-sub text-sand-500">HT : {fmt(facture.total_ht)} · TVA : {fmt(facture.total_tva)}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Payé</p>
          <p className="kpi-value text-forest-700">{fmt(facture.montant_paye)} <span className="kpi-unit">F</span></p>
          <div className="mt-3 bg-sand-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-forest-500 h-full rounded-full transition-all" style={{ width: `${progression}%` }} />
          </div>
        </div>
        <div className="kpi">
          <p className="kpi-label">Solde restant</p>
          <p className={`kpi-value ${Number(facture.solde_restant) > 0 ? 'text-gold-700' : 'text-sand-400'}`}>
            {fmt(facture.solde_restant)} <span className="kpi-unit">F</span>
          </p>
          <p className="kpi-sub text-sand-500">Échéance : {facture.date_echeance || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-[12px]">
        <InfoCell label="Type de facturation" value={TEMPLATE_LABEL[facture.template_fne] ?? facture.template_fne} />
        <InfoCell label="Mode de règlement" value={MODE_LABEL[facture.mode_reglement] ?? facture.mode_reglement} />
        <InfoCell label="Centre de coût" value={facture.centre_cout_display || '—'} />
      </div>

      {showPaie && (
        <div className="card p-5 border-forest-200 bg-forest-50/40">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display font-semibold text-forest-800">Enregistrer un paiement</p>
            <button className="btn-ghost btn-sm" onClick={() => setShowPaie(false)}>Annuler</button>
          </div>
          {error && <p className="alert-red mb-3">{error}</p>}
          <form onSubmit={enregistrerPaiement} className="grid grid-cols-2 gap-3">
            <Field label="Montant (F)" required>
              <input type="number" className="input" placeholder={fmt(facture.solde_restant)}
                value={paie.montant} onChange={(e) => setPaie({ ...paie, montant: e.target.value })} required />
            </Field>
            <Field label="Mode" required>
              <select className="input" value={paie.mode} onChange={(e) => setPaie({ ...paie, mode: e.target.value })}>
                <option value="virement">Virement</option>
                <option value="especes">Espèces</option>
                <option value="cheque">Chèque</option>
                <option value="mobile">Mobile Money</option>
              </select>
            </Field>
            <Field label="Date" required>
              <input type="date" className="input" value={paie.date} onChange={(e) => setPaie({ ...paie, date: e.target.value })} required />
            </Field>
            <Field label="Référence">
              <input className="input" placeholder="N° virement…" value={paie.reference}
                onChange={(e) => setPaie({ ...paie, reference: e.target.value })} />
            </Field>
            <div className="col-span-2 flex justify-end mt-1">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Valider le paiement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lignes */}
      <div className="card overflow-hidden">
        <div className="card-head"><p className="card-title">Lignes ({facture.lignes?.length ?? 0})</p></div>
        <table className="table-eko">
          <thead><tr>{['Désignation', 'Qté', 'Prix unit.', 'TVA', 'Montant HT'].map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {(facture.lignes ?? []).length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sand-500 font-body text-sm">Aucune ligne</td></tr>
            ) : facture.lignes.map((l) => (
              <tr key={l.id}>
                <td className="font-display font-medium text-ink">{l.designation}</td>
                <td className="mono-cell">{l.quantite}</td>
                <td className="num">{fmt(l.prix_unitaire)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                <td className="text-[12px] text-sand-500">{TVA_LABEL[l.taux_tva] ?? l.taux_tva}</td>
                <td className="num">{fmt(l.montant_ht)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paiements */}
      <div className="card overflow-hidden">
        <div className="card-head"><p className="card-title">Paiements reçus ({paiements.length})</p></div>
        {paiements.length === 0 ? (
          <p className="px-4 py-6 text-center text-sand-500 font-body text-sm">Aucun paiement enregistré</p>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Date', 'Montant', 'Mode', 'Référence'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {paiements.map((p) => (
                <tr key={p.id}>
                  <td className="mono-cell">{p.date}</td>
                  <td className="num text-forest-700">{fmt(p.montant)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="text-sand-600 capitalize">{p.mode}</td>
                  <td className="mono-cell text-sand-500">{p.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ─── Onglet Certification FNE ───────────────────────────────── */
function CertificationTab({ facture, certifier, fneBusy }) {
  if (!facture.est_certifiee) {
    return (
      <div className="card p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center mx-auto mb-4">
          <IconShield className="w-6 h-6 text-sand-500" />
        </div>
        <p className="font-display font-semibold text-ink">Facture non certifiée</p>
        <p className="text-[13px] text-sand-500 mt-1 max-w-md mx-auto">
          La certification FNE génère la référence DGI, le QR code de vérification et consomme un sticker électronique.
        </p>
        {facture.statut === 'brouillon' && (
          <button className="btn-primary mt-5" onClick={certifier} disabled={fneBusy}>
            {fneBusy ? 'Certification…' : '⚡ Certifier maintenant'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4">
      {/* QR + sticker */}
      <div className="card p-5 flex flex-col items-center text-center">
        {facture.fne_qr ? (
          <img src={`data:image/png;base64,${facture.fne_qr}`} alt="QR FNE"
               className="w-44 h-44 rounded-lg border border-sand-200" />
        ) : (
          <div className="w-44 h-44 rounded-lg border border-dashed border-sand-300 flex items-center justify-center text-sand-400 text-[12px]">
            QR indisponible
          </div>
        )}
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 mt-3">Sticker FNE</p>
        <p className="font-display font-bold text-ink text-lg">
          {facture.fne_balance_sticker ?? '—'} <span className="text-[11px] font-normal text-sand-500">restants</span>
        </p>
      </div>

      {/* Détails certification */}
      <div className="card divide-y divide-sand-100">
        <CertRow label="Référence DGI" value={facture.fne_reference} mono />
        <CertRow label="Type de facturation" value={TEMPLATE_LABEL[facture.template_fne] ?? facture.template_fne} />
        <CertRow label="Mode de règlement" value={MODE_LABEL[facture.mode_reglement] ?? facture.mode_reglement} />
        <CertRow label="Certifiée le" value={facture.fne_certifiee_at ? new Date(facture.fne_certifiee_at).toLocaleString('fr-FR') : '—'} />
        <CertRow label="ID interne FNE" value={facture.fne_invoice_id || '—'} mono />
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 mb-1">Lien de vérification</p>
          {facture.fne_token ? (
            <a href={facture.fne_token} target="_blank" rel="noreferrer"
               className="text-[12.5px] text-forest-700 hover:underline break-all">{facture.fne_token}</a>
          ) : <span className="text-sand-400 text-[12.5px]">—</span>}
          {facture.fne_invoice_id?.startsWith('SIM-') && (
            <p className="text-[11px] text-gold-700 mt-2">⚠ Certification générée en mode simulation (FNE non activée).</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Onglet Avoirs ──────────────────────────────────────────── */
function AvoirsTab({ facture, emettreAvoir, fneBusy }) {
  const avoirs = facture.avoirs ?? []
  return (
    <div className="space-y-4">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-ink">Avoirs sur cette facture</p>
          <p className="text-[12.5px] text-sand-500 mt-0.5">
            Un avoir certifié annule tout ou partie de la facture et consomme un sticker.
          </p>
        </div>
        {facture.est_certifiee && (
          <button className="btn-primary" onClick={emettreAvoir} disabled={fneBusy}>
            {fneBusy ? 'Émission…' : '+ Émettre un avoir'}
          </button>
        )}
      </div>

      {!facture.est_certifiee && (
        <p className="text-[12.5px] text-sand-500 px-1">La facture doit être certifiée FNE avant d'émettre un avoir.</p>
      )}

      {avoirs.length > 0 && (
        <div className="card overflow-hidden">
          <table className="table-eko">
            <thead><tr>{['Numéro', 'Référence FNE', 'TTC', 'Statut', 'Émis le'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {avoirs.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/comptabilite/factures/${a.id}`} className="mono-cell text-forest-700 hover:text-forest-900 font-medium">
                      {a.numero_local}
                    </Link>
                  </td>
                  <td className="mono-cell text-sand-500">{a.fne_reference || '—'}</td>
                  <td className="num">{fmt(a.total_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td><Badge tone={STATUT_TONE[a.statut] ?? 'gray'}>{STATUT_LABEL[a.statut] ?? a.statut}</Badge></td>
                  <td className="mono-cell text-sand-500">{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Sous-composants ────────────────────────────────────────── */
function InfoCell({ label, value }) {
  return (
    <div className="card px-4 py-3">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500">{label}</p>
      <p className="font-display font-medium text-ink text-[13px] mt-0.5">{value}</p>
    </div>
  )
}

function CertRow({ label, value, mono }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">{label}</p>
      <p className={`text-[12.5px] text-ink text-right ${mono ? 'font-mono' : 'font-display font-medium'}`}>{value}</p>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-display font-medium text-ink">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
function IconLock({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
}
function IconShield({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
}
