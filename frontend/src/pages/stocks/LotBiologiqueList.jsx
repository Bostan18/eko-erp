import { useEffect, useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { STOCKS_TABS } from '../../components/ui/ModuleTabs'
import LotBiologiqueForm from '../../components/forms/LotBiologiqueForm'
import { useFetchList } from '../../hooks/useFetchList'
import { apiErrorMessage } from '../../utils/errors'

const ETAT_TONE = {
  excellent: 'green', bon: 'green', moyen: 'gold',
  critique:  'red',   perdu: 'red',
}
const PHASE_TONE = {
  semis: 'blue', repiquage: 'gold', production: 'green', perdu: 'red',
}

export default function LotBiologiqueList() {
  const { items: lots, loading, error, charger } = useFetchList(
    '/stocks/lots-biologiques/', 'Impossible de charger les lots.'
  )
  const [kpis, setKpis] = useState(null)
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
      await api.delete(`/stocks/lots-biologiques/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  useEffect(() => {
    api.get('/stocks/lots-biologiques/kpis_sante/').then(({ data }) => setKpis(data)).catch(() => {})
  }, [lots.length])

  const filtres = lots.filter((l) =>
    !search ? true
      : l.espece.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase()) ||
        (l.site_nom ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Stocks · Lots biologiques</div>
          <div className="sec-sub">
            Pépinière & agriculture · cycle semis → repiquage → production
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau lot
        </button>
      </div>

      {kpis && (
        <div className="kpi-grid">
          <Kpi label="Lots actifs" value={kpis.total} />
          <Kpi label="Taux de survie moyen" value={`${kpis.taux_survie_moyen}%`}
            tone={kpis.taux_survie_moyen >= 80 ? 'green' : kpis.taux_survie_moyen >= 60 ? 'gold' : 'red'} />
          <Kpi label="En alerte" value={kpis.en_alerte}
            tone={kpis.en_alerte > 0 ? 'red' : 'green'} />
          <Kpi label="Phases"
            value={`${kpis.par_phase.semis ?? 0}/${kpis.par_phase.repiquage ?? 0}/${kpis.par_phase.production ?? 0}`}
            sub="Semis / Repiquage / Production" />
        </div>
      )}

      <div className="card overflow-hidden">
        <ModuleTabs items={STOCKS_TABS} />
        <div className="th-row">
          <div className="th-title">Lots · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher espèce, code, site…"
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
            <thead><tr>{['Code', 'Espèce', 'Article', 'Site', 'Semis', 'Repiquage', 'Qté init.', 'Qté actu.', 'Survie', 'Santé', 'Phase'].map(h => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-sand-500 font-body">Aucun lot biologique</td></tr>
              ) : filtres.map((l) => (
                <tr key={l.id}>
                  <td className="mono-cell text-forest-700">{l.code}</td>
                  <td className="font-display font-medium text-ink">{l.espece}</td>
                  <td className="text-sand-600">{l.article_nom}</td>
                  <td className="text-sand-600">{l.site_nom || '—'}</td>
                  <td className="mono-cell text-sand-700">{l.date_semis}</td>
                  <td className="mono-cell text-sand-700">{l.date_repiquage || '—'}</td>
                  <td className="num">{Number(l.quantite_initiale).toLocaleString('fr-FR')}</td>
                  <td className="num">{Number(l.quantite_actuelle).toLocaleString('fr-FR')}</td>
                  <td className="num">
                    <span className={l.taux_survie >= 80 ? 'text-forest-700 font-medium'
                                    : l.taux_survie >= 60 ? 'text-gold-600' : 'text-red-600 font-medium'}>
                      {l.taux_survie}%
                    </span>
                  </td>
                  <td><Badge tone={ETAT_TONE[l.etat_sante] ?? 'gray'}>{l.etat_sante_display}</Badge></td>
                  <td><Badge tone={PHASE_TONE[l.phase] ?? 'gray'}>{l.phase}</Badge></td>
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
          titre={editing ? `Modifier ${editing.code} — ${editing.espece}` : 'Nouveau lot biologique'}
          sousTitre="Cohorte de plants suivie sur son cycle."
          onClose={fermerDrawer}
        >
          <LotBiologiqueForm
            initial={editing}
            onClose={fermerDrawer}
            onSuccess={() => { fermerDrawer(); charger() }}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          titre="Supprimer ce lot biologique ?"
          message={`Le lot ${deleting.code} (${deleting.espece}) sera supprimé. Cette action est irréversible.`}
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
