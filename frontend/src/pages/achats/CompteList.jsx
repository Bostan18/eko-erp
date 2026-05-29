import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { ACHATS_TABS } from '../../components/ui/ModuleTabs'
import CompteForm from '../../components/forms/CompteForm'
import TresorerieKpis from './TresorerieKpis'
import { apiErrorMessage } from '../../utils/errors'
import { fmt } from '../../utils/format'

const TYPE_TONE = { banque: 'blue', caisse: 'gold', mobile_money: 'green' }

export default function CompteList() {
  const [comptes, setComptes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [actionError, setActionError] = useState('')

  function fermerDrawer() { setModal(false); setEditing(null) }

  const charger = useCallback(() => {
    setLoading(true)
    api.get('/achats/comptes/').then(({ data }) => setComptes(data.results ?? data)).finally(() => setLoading(false))
  }, [])
  useEffect(() => { charger() }, [charger])

  async function confirmerSuppression() {
    if (!deleting) return
    setRemoving(true); setActionError('')
    try {
      await api.delete(`/achats/comptes/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Achats &amp; Trésorerie</div>
          <div className="sec-sub">Comptes de trésorerie · {loading ? '…' : `${comptes.length} compte${comptes.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau compte
        </button>
      </div>

      <TresorerieKpis />

      <div className="card overflow-hidden">
        <ModuleTabs items={ACHATS_TABS} />
        <div className="th-row"><div className="th-title">Comptes · <span className="text-sand-500 font-normal">{comptes.length}</span></div></div>
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
            <thead><tr>{['Nom', 'Type', 'Banque / Opérateur', 'N° compte', 'Solde initial', 'Solde actuel'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr></thead>
            <tbody>
              {comptes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucun compte</td></tr>
              ) : comptes.map((c) => (
                <tr key={c.id}>
                  <td className="font-display font-medium text-ink">{c.nom}</td>
                  <td><Badge tone={TYPE_TONE[c.type_compte] ?? 'gray'}>{c.type_compte_display}</Badge></td>
                  <td className="text-sand-600">{c.banque || '—'}</td>
                  <td className="mono-cell text-sand-500">{c.numero_compte || '—'}</td>
                  <td className="mono-cell">{fmt(c.solde_initial)}</td>
                  <td className={`num font-semibold ${Number(c.solde_actuel) >= 0 ? 'text-forest-700' : 'text-red-600'}`}>
                    {fmt(c.solde_actuel)} <span className="text-[10px] font-normal text-sand-500">F</span>
                  </td>
                  <td>
                    <RowActions
                      onEdit={() => setEditing(c)}
                      onDelete={() => setDeleting(c)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(modal || editing) && (
        <Modal
          titre={editing ? `Modifier ${editing.nom}` : 'Nouveau compte'}
          sousTitre="Compte bancaire, caisse ou Mobile Money."
          onClose={fermerDrawer}
        >
          <CompteForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce compte ?"
          message={`Le compte « ${deleting.nom} » sera supprimé. Les mouvements liés peuvent bloquer l'opération côté backend.`}
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
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
