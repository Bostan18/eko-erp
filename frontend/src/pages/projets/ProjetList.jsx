import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge, { CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { PROJETS_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconBuilding, IconRefresh, IconCheck, IconWallet } from '../../components/ui/Icons'
import ProjetForm from '../../components/forms/ProjetForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'
import { apiErrorMessage } from '../../utils/errors'

const TYPE_LABEL = {
  btp: 'BTP', agriculture: 'Agriculture', pepiniere: 'Pépinière',
  location: 'Location', espaces_verts: 'Espaces verts',
}
const TYPE_TONE = {
  btp: 'blue', agriculture: 'green', pepiniere: 'green',
  location: 'gold', espaces_verts: 'green',
}
const STATUT_TONE = {
  planifie: 'gray', en_cours: 'blue', suspendu: 'gold',
  termine: 'green', annule: 'red',
}
const STATUT_LABEL = {
  planifie: 'Planifié', en_cours: 'En cours', suspendu: 'Suspendu',
  termine: 'Terminé', annule: 'Annulé',
}

export default function ProjetList() {
  const { items: projets, loading, error, charger } = useFetchList(
    '/projets/projets/', 'Impossible de charger les projets.'
  )
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
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
      await api.delete(`/projets/projets/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  const filtered = projets
    .filter((p) => filtre === 'tous' ? true : p.type_projet === filtre)
    .filter((p) =>
      !search ? true :
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    )

  const nbEnCours = projets.filter((p) => p.statut === 'en_cours').length
  const nbTermines = projets.filter((p) => p.statut === 'termine').length
  const budgetTotal = projets.reduce((s, p) => s + Number(p.budget_estime ?? 0), 0)

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Projets</div>
          <div className="sec-sub">
            Chantiers BTP, agricoles & locations ·{' '}
            {loading ? '…' : `${projets.length} projet${projets.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau projet
        </button>
      </div>

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconBuilding />} tone="sand"
          label="Projets"
          value={projets.length}
          sub="Tous statuts"
        />
        <KpiCard
          icon={<IconRefresh />} tone="blue"
          label="En cours"
          value={nbEnCours}
          sub="Projets actifs"
        />
        <KpiCard
          icon={<IconCheck />} tone="forest"
          label="Terminés"
          value={nbTermines}
          sub="Cumul"
        />
        <KpiCard
          icon={<IconWallet />} tone="sand"
          label="Budget cumulé"
          value={<>{fmt(budgetTotal)} <span className="kpi-unit">FCFA</span></>}
          sub="Tous projets confondus"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={PROJETS_TABS} />

        <div className="th-row">
          <div className="th-title">
            Liste des projets ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input input-sm w-auto"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            >
              <option value="tous">Tous les types</option>
              {Object.entries(TYPE_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              className="input input-sm w-[210px]"
              placeholder="Rechercher nom ou code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
              <tr>{['Code','Nom','Type','Centre','Statut','Client','Début','Budget'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-sand-500 font-body">Aucun projet</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id}>
                  <td className="mono-cell text-forest-700">{p.code}</td>
                  <td>
                    <Link to={`/projets/${p.id}`} className="font-display font-medium text-ink hover:text-forest-700 transition-colors">
                      {p.nom}
                    </Link>
                  </td>
                  <td><Badge tone={TYPE_TONE[p.type_projet] ?? 'gray'}>{TYPE_LABEL[p.type_projet] ?? p.type_projet}</Badge></td>
                  <td>{p.centre_cout_display ? <CenterBadge center={p.centre_cout_display} /> : <span className="text-sand-400">—</span>}</td>
                  <td><Badge tone={STATUT_TONE[p.statut] ?? 'gray'}>{STATUT_LABEL[p.statut] ?? p.statut}</Badge></td>
                  <td className="text-sand-600">{p.client_nom ?? '—'}</td>
                  <td className="mono-cell">{p.date_debut ?? '—'}</td>
                  <td className="num">{p.budget_estime ? `${fmt(p.budget_estime)} F` : '—'}</td>
                  <td>
                    <RowActions
                      onView={() => navigate(`/projets/${p.id}`)}
                      onEdit={() => setEditing(p)}
                      onDelete={() => setDeleting(p)}
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
          titre={editing ? `Modifier ${editing.code} — ${editing.nom}` : 'Nouveau projet'}
          sousTitre="Définir le projet, client, planning et budget."
          onClose={fermerDrawer}
        >
          <ProjetForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce projet ?"
          message={`Le projet ${deleting.code} — ${deleting.nom} sera supprimé. Cette action est irréversible.`}
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
