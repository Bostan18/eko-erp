import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import ModuleTabs, { OPERATIONS_TABS } from '../../components/ui/ModuleTabs'
import LogTravailForm from '../../components/forms/LogTravailForm'
import { useFetchList } from '../../hooks/useFetchList'
import { apiErrorMessage } from '../../utils/errors'

export default function LogTravailList() {
  const { items: logs, loading, error, charger } = useFetchList(
    '/projets/realisations/', 'Impossible de charger les logs de travail.'
  )
  const [search, setSearch] = useState('')
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
      await api.delete(`/projets/realisations/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  const filtres = logs.filter((l) =>
    !search ? true
      : (l.tache_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.employe_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.site_nom ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalMontant = filtres.reduce((acc, l) => acc + Number(l.montant_calcule || 0), 0)

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Opérations terrain</div>
          <div className="sec-sub">
            Logs de travail · {loading ? '…' : `${logs.length} log${logs.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau log
        </button>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={OPERATIONS_TABS} />
        <div className="th-row">
          <div className="th-title">
            Logs · <span className="text-sand-500 font-normal">{filtres.length}</span>
            <span className="ml-3 text-sand-500 font-normal">
              Total : <span className="font-display font-semibold text-forest-700">
                {totalMontant.toLocaleString('fr-FR')} F
              </span>
            </span>
          </div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher tâche, employé, site…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
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
            <thead><tr>{['Date', 'Tâche', 'Employé', 'Site', 'Quantité', 'Montant', 'Notes'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun log enregistré</td></tr>
              ) : filtres.map((l) => (
                <tr key={l.id}>
                  <td className="mono-cell text-sand-700">{l.date}</td>
                  <td className="font-display font-medium text-ink">{l.tache_nom}</td>
                  <td className="text-sand-600">{l.employe_nom}</td>
                  <td className="text-sand-600">
                    {l.site_code
                      ? <><span className="mono-cell text-forest-700">{l.site_code}</span> <span className="text-[12px] text-sand-500">{l.site_nom}</span></>
                      : '—'}
                  </td>
                  <td className="num">{Number(l.quantite_realisee).toLocaleString('fr-FR')}</td>
                  <td className="num">
                    {Number(l.montant_calcule).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-sand-500">F</span>
                  </td>
                  <td className="text-[12px] text-sand-500">{l.notes || '—'}</td>
                  <td>
                    <RowActions
                      onEdit={() => setEditing(l)}
                      onDelete={() => setDeleting(l)}
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
          titre={editing ? 'Modifier le log de travail' : 'Nouveau log de travail'}
          sousTitre="Réalisation à la tâche pour un journalier."
          onClose={fermerDrawer}
        >
          <LogTravailForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce log ?"
          message={`Le log du ${deleting.date} (${deleting.tache_nom}, ${deleting.employe_nom}) sera supprimé. Cette action est irréversible.`}
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
