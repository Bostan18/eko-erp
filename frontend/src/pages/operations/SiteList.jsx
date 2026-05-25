import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { OPERATIONS_TABS } from '../../components/ui/ModuleTabs'
import SiteForm from '../../components/forms/SiteForm'
import { useFetchList } from '../../hooks/useFetchList'
import { apiErrorMessage } from '../../utils/errors'

const TYPE_TONE = {
  chantier:    'gold',
  parcelle:    'green',
  pepiniere:   'green',
  espace_vert: 'green',
  depot:       'blue',
  autre:       'gray',
}

export default function SiteList() {
  const { items: sites, loading, error, charger } = useFetchList(
    '/operations/sites/', 'Impossible de charger les sites.'
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
      await api.delete(`/operations/sites/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  const filtres = sites.filter((s) =>
    !search ? true
      : s.nom.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        (s.projet_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (s.localisation ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Opérations terrain</div>
          <div className="sec-sub">
            Sites · {loading ? '…' : `${sites.length} site${sites.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau site
        </button>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={OPERATIONS_TABS} />
        <div className="th-row">
          <div className="th-title">Sites · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher nom, code, projet…"
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
            <thead><tr>{['Code', 'Nom', 'Type', 'Projet', 'Responsable', 'Localisation', 'Statut'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun site</td></tr>
              ) : filtres.map((s) => (
                <tr key={s.id}>
                  <td className="mono-cell text-forest-700">{s.code}</td>
                  <td className="font-display font-medium text-ink">{s.nom}</td>
                  <td><Badge tone={TYPE_TONE[s.type_site] ?? 'gray'}>{s.type_site_display}</Badge></td>
                  <td className="text-sand-600">
                    {s.projet_code ? <span className="mono-cell text-forest-700">{s.projet_code}</span> : '—'}
                    {s.projet_nom && <span className="ml-2 text-sand-500 text-[12px]">{s.projet_nom}</span>}
                  </td>
                  <td className="text-sand-600">{s.responsable_nom || '—'}</td>
                  <td className="text-sand-600">{s.localisation || '—'}</td>
                  <td>
                    {s.actif
                      ? <Badge tone="green">Actif</Badge>
                      : <Badge tone="gray">Inactif</Badge>}
                  </td>
                  <td>
                    <RowActions
                      onEdit={() => setEditing(s)}
                      onDelete={() => setDeleting(s)}
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
          titre={editing ? `Modifier ${editing.code} — ${editing.nom}` : 'Nouveau site'}
          sousTitre="Lieu physique d'intervention."
          onClose={fermerDrawer}
        >
          <SiteForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce site ?"
          message={`Le site ${deleting.code} — ${deleting.nom} sera supprimé. Cette action est irréversible.`}
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
