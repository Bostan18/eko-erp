import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge, { CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { COMPTA_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconWallet, IconChartBar, IconTrendUp, IconFolder } from '../../components/ui/Icons'
import ChargeForm from '../../components/forms/ChargeForm'
import { useFetchList } from '../../hooks/useFetchList'
import { CHARGE_CAT_LABEL, CHARGE_CAT_BADGE } from '../../utils/constants'
import { apiErrorMessage } from '../../utils/errors'
import { fmt } from '../../utils/format'

function exportCharges(filtre) {
  const params = new URLSearchParams()
  if (filtre !== 'toutes') params.set('categorie', filtre)
  api.get(`/comptabilite/charges/export_excel/?${params}`, { responseType: 'blob' })
    .then(({ data }) => {
      const href = URL.createObjectURL(data)
      Object.assign(document.createElement('a'), { href, download: 'charges.xlsx' }).click()
      URL.revokeObjectURL(href)
    })
    .catch(() => alert('Échec du téléchargement.'))
}

// Conversion classes legacy `badge-yellow` etc. vers tons Badge
function badgeToTone(cls) {
  if (!cls) return 'gray'
  if (cls.includes('green'))  return 'green'
  if (cls.includes('yellow')) return 'gold'
  if (cls.includes('red'))    return 'red'
  if (cls.includes('blue'))   return 'blue'
  return 'gray'
}

export default function ChargeList() {
  const { items: charges, loading, error, charger } = useFetchList(
    '/comptabilite/charges/', 'Impossible de charger les charges.'
  )
  const [filtre, setFiltre] = useState('toutes')
  const [modal, setModal]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [actionError, setActionError] = useState('')

  function fermerDrawer() { setModal(false); setEditing(null) }

  async function confirmerSuppression() {
    if (!deleting) return
    setRemoving(true); setActionError('')
    try {
      await api.delete(`/comptabilite/charges/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  const filtrees    = charges.filter((c) => filtre === 'toutes' ? true : c.categorie === filtre)
  const totalFiltre = filtrees.reduce((s, c) => s + Number(c.montant), 0)
  const totalGlobal = charges.reduce((s, c) => s + Number(c.montant), 0)

  const moyenne = charges.length ? Math.round(totalGlobal / charges.length) : 0
  const plusGrosse = charges.length ? Math.max(...charges.map((c) => Number(c.montant))) : 0
  const nbCategories = Object.keys(CHARGE_CAT_LABEL).length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Charges</div>
          <div className="sec-sub">
            Dépenses & charges d'exploitation ·{' '}
            {loading ? '…' : `${charges.length} ligne${charges.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => exportCharges(filtre)}>⬇ Excel</button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouvelle charge
          </button>
        </div>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconWallet />} tone="red"
          label="Total charges"
          value={<>{fmt(totalGlobal)} <span className="kpi-unit">FCFA</span></>}
          sub={`${charges.length} ligne${charges.length !== 1 ? 's' : ''} · cumul`}
        />
        <KpiCard
          icon={<IconChartBar />} tone="sand"
          label="Charge moyenne"
          value={<>{fmt(moyenne)} <span className="kpi-unit">FCFA</span></>}
          sub="Par ligne"
        />
        <KpiCard
          icon={<IconTrendUp />} tone="gold"
          label="Plus grosse charge"
          value={<>{fmt(plusGrosse)} <span className="kpi-unit">FCFA</span></>}
          sub="Montant maximal"
        />
        <KpiCard
          icon={<IconFolder />} tone="sand"
          label="Catégories"
          value={nbCategories}
          sub="Types de charge"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={COMPTA_TABS} />

        <div className="th-row">
          <div className="th-title">
            Charges ·{' '}
            <span className="text-sand-500 font-normal">{filtrees.length}</span>
          </div>
          <select
            className="input input-sm w-auto"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          >
            <option value="toutes">Toutes les catégories</option>
            {Object.entries(CHARGE_CAT_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {actionError && (
          <p className="alert-red m-5">
            {actionError}
            <button type="button" onClick={() => setActionError('')}
              className="ml-3 text-[11px] underline decoration-dotted opacity-70 hover:opacity-100">Fermer</button>
          </p>
        )}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Date', 'Libellé', 'Catégorie', 'Montant', 'Projet', 'Centre', 'Fournisseur', 'Référence'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filtrees.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sand-500 font-body">Aucune charge</td></tr>
              ) : filtrees.map((c) => (
                <tr key={c.id}>
                  <td className="mono-cell">{c.date}</td>
                  <td className="font-display font-medium text-ink">{c.libelle}</td>
                  <td><Badge tone={badgeToTone(CHARGE_CAT_BADGE[c.categorie])}>{CHARGE_CAT_LABEL[c.categorie] ?? c.categorie}</Badge></td>
                  <td className="num">{fmt(c.montant)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="text-sand-600 text-[12px]">{c.projet_nom || '—'}</td>
                  <td>{c.centre_cout_display ? <CenterBadge center={c.centre_cout_display} /> : <span className="text-sand-400">—</span>}</td>
                  <td className="text-sand-600">{c.fournisseur || '—'}</td>
                  <td className="mono-cell text-sand-500">{c.reference || '—'}</td>
                  <td>
                    <RowActions
                      onEdit={() => setEditing(c)}
                      onDelete={() => setDeleting(c)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-sand-50 border-t-2 border-sand-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-display font-semibold text-sand-700 text-[13px]">
                  Total {filtre !== 'toutes' ? CHARGE_CAT_LABEL[filtre] : 'charges'}
                </td>
                <td className="px-4 py-3 num text-[14px]">{fmt(totalFiltre)} F</td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {(modal || editing) && (
        <Modal
          titre={editing ? `Modifier ${editing.libelle}` : 'Nouvelle charge'}
          sousTitre="Catégorie, montant, projet et fournisseur."
          onClose={fermerDrawer}
        >
          <ChargeForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer cette charge ?"
          message={`La charge « ${deleting.libelle} » du ${deleting.date} sera supprimée.`}
          confirmLabel="Supprimer"
          tone="danger"
          busy={removing}
          onConfirm={confirmerSuppression}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
