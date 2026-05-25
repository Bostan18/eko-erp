import { useEffect, useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { STOCKS_TABS } from '../../components/ui/ModuleTabs'
import DechetForm from '../../components/forms/DechetForm'
import { useFetchList } from '../../hooks/useFetchList'
import { apiErrorMessage } from '../../utils/errors'

export default function DechetList() {
  const { items: dechets, loading, error, charger } = useFetchList(
    '/stocks/dechets/', 'Impossible de charger les déchets.'
  )
  const [synthese, setSynthese] = useState(null)
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
      await api.delete(`/stocks/dechets/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  useEffect(() => {
    api.get('/stocks/dechets/synthese/').then(({ data }) => setSynthese(data)).catch(() => {})
  }, [dechets.length])

  const filtres = dechets.filter((d) =>
    !search ? true
      : (d.type_dechet_display ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.projet_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.site_nom   ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (d.notes      ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Stocks · Déchets & valorisation</div>
          <div className="sec-sub">Suivi par origine et mode de traitement (alimente ESG).</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau déchet
        </button>
      </div>

      {synthese && (
        <div className="kpi-grid">
          <Kpi label="Quantité totale" value={`${synthese.total_quantite.toLocaleString('fr-FR')}`} sub="toutes unités" />
          <Kpi label="Valorisé" value={`${synthese.valorise_quantite.toLocaleString('fr-FR')}`} tone="green" />
          <Kpi label="Taux valorisation" value={`${synthese.taux_valorisation}%`}
            tone={synthese.taux_valorisation >= 60 ? 'green' : synthese.taux_valorisation >= 30 ? 'gold' : 'red'} />
          <Kpi label="Types distincts" value={synthese.par_type.length} />
        </div>
      )}

      <div className="card overflow-hidden">
        <ModuleTabs items={STOCKS_TABS} />
        <div className="th-row">
          <div className="th-title">Déchets · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher type, projet, site…"
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
            <thead><tr>{['Date', 'Type', 'Quantité', 'Projet', 'Site', 'Traitement', 'Valorisé'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun déchet enregistré</td></tr>
              ) : filtres.map((d) => (
                <tr key={d.id}>
                  <td className="mono-cell text-sand-700">{d.date}</td>
                  <td className="font-display font-medium text-ink">{d.type_dechet_display}</td>
                  <td className="num">
                    {Number(d.quantite).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-sand-500">{d.unite_display}</span>
                  </td>
                  <td className="text-sand-600">{d.projet_nom || '—'}</td>
                  <td className="text-sand-600">{d.site_nom || '—'}</td>
                  <td className="text-[12px] text-sand-500">{d.mode_traitement_display}</td>
                  <td>
                    {d.est_valorise
                      ? <Badge tone="green">Oui</Badge>
                      : <Badge tone="gray">Non</Badge>}
                  </td>
                  <td>
                    <RowActions
                      onEdit={() => setEditing(d)}
                      onDelete={() => setDeleting(d)}
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
          titre={editing ? 'Modifier le déchet' : 'Nouveau déchet'}
          sousTitre="Suivi pour conformité et indicateurs ESG."
          onClose={fermerDrawer}
        >
          <DechetForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce déchet ?"
          message={`L'enregistrement (${deleting.type_dechet_display}, ${deleting.date}) sera supprimé.`}
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

function Kpi({ label, value, sub, tone }) {
  const valueClass = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-forest-700' : tone === 'gold' ? 'text-gold-600' : 'text-ink'
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value ${valueClass}`}>{value}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
