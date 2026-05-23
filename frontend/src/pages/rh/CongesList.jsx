import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { RH_TABS } from '../../components/ui/ModuleTabs'
import CongeForm from '../../components/forms/CongeForm'
import { useFetchList } from '../../hooks/useFetchList'

const STATUT_TONE = {
  demande: 'gold', approuve: 'green', refuse: 'red', annule: 'gray',
}
const TYPE_TONE = {
  conges_payes: 'blue', maladie: 'gold', maternite: 'green',
  sans_solde:   'gray', special: 'gold',
}

export default function CongesList() {
  const { items: conges, loading, error, charger } = useFetchList(
    '/rh/conges/', 'Impossible de charger les congés.'
  )
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  async function changerStatut(id, action) {
    setActionLoading(id)
    try {
      await api.post(`/rh/conges/${id}/${action}/`, { approuve_par: 'RH' })
      charger()
    } catch {
      // silencieux
    } finally {
      setActionLoading(null)
    }
  }

  const filtres = conges.filter((c) => {
    const matchS = !search || (c.employe_nom ?? '').toLowerCase().includes(search.toLowerCase())
                            || (c.motif ?? '').toLowerCase().includes(search.toLowerCase())
    const matchF = filtreStatut === 'tous' || c.statut === filtreStatut
    return matchS && matchF
  })

  const enAttente = conges.filter((c) => c.statut === 'demande').length

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">RH & Paie</div>
          <div className="sec-sub">
            Congés · {enAttente > 0 ? <span className="text-gold-600 font-medium">{enAttente} en attente</span> : 'aucune demande en attente'}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle demande
        </button>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={RH_TABS} />
        <div className="th-row">
          <div className="th-title">Demandes · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <div className="flex items-center gap-2">
            <select className="input input-sm w-[140px]" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="tous">Tous statuts</option>
              <option value="demande">Demandés</option>
              <option value="approuve">Approuvés</option>
              <option value="refuse">Refusés</option>
              <option value="annule">Annulés</option>
            </select>
            <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher employé, motif…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Employé', 'Type', 'Période', 'Jours', 'Motif', 'Statut', 'Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucune demande</td></tr>
              ) : filtres.map((c) => (
                <tr key={c.id}>
                  <td className="font-display font-medium text-ink">
                    <span className="mono-cell text-forest-700 mr-2">{c.employe_code}</span>
                    {c.employe_nom}
                  </td>
                  <td><Badge tone={TYPE_TONE[c.type_conge] ?? 'gray'}>{c.type_conge_display}</Badge></td>
                  <td className="mono-cell text-sand-700 text-[12px]">{c.date_debut} → {c.date_fin}</td>
                  <td className="num">{c.nb_jours} j</td>
                  <td className="text-sand-600 text-[12px]">{c.motif || '—'}</td>
                  <td><Badge tone={STATUT_TONE[c.statut] ?? 'gray'}>{c.statut_display}</Badge></td>
                  <td>
                    {c.statut === 'demande' ? (
                      <div className="flex gap-1">
                        <button className="text-[11px] px-2 py-1 rounded bg-forest-50 text-forest-700 hover:bg-forest-100 disabled:opacity-50"
                          onClick={() => changerStatut(c.id, 'approuver')} disabled={actionLoading === c.id}>
                          ✓ Approuver
                        </button>
                        <button className="text-[11px] px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                          onClick={() => changerStatut(c.id, 'refuser')} disabled={actionLoading === c.id}>
                          ✗ Refuser
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-sand-500">{c.approuve_par || '—'} {c.approuve_le && `· ${c.approuve_le}`}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle demande de congé" sousTitre="Workflow d'approbation." onClose={() => setModal(false)}>
          <CongeForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
