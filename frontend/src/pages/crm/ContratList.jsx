import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge, { CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { CRM_TABS } from '../../components/ui/ModuleTabs'
import ContratForm from '../../components/forms/ContratForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const STATUT_TONE = { brouillon: 'gray', actif: 'green', suspendu: 'gold', expire: 'gray', resilie: 'red' }

export default function ContratList() {
  const { items: contrats, loading, error, charger } = useFetchList(
    '/crm/contrats/', 'Impossible de charger les contrats.'
  )
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const filtres = contrats.filter((c) => filtre === 'tous' ? true : c.statut === filtre)
  const nbActifs   = contrats.filter((c) => c.statut === 'actif').length
  const valeurActive = contrats.filter((c) => c.statut === 'actif').reduce((s, c) => s + Number(c.montant ?? 0), 0)

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">CRM — Contrats</div>
          <div className="sec-sub">{loading ? '…' : `${contrats.length} contrat${contrats.length !== 1 ? 's' : ''} · ${nbActifs} actif${nbActifs !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau contrat
        </button>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-icon text-2xl">📑</div>
          <p className="kpi-label">Contrats actifs</p>
          <p className="kpi-value text-forest-700">{nbActifs}</p>
          <p className="kpi-sub">en cours</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">💰</div>
          <p className="kpi-label">Valeur sous contrat</p>
          <p className="kpi-value">{fmt(valeurActive)} <span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub">montant des contrats actifs</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={CRM_TABS} />
        <div className="th-row">
          <div className="th-title">Contrats · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <select className="input input-sm w-auto" value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="tous">Tous les statuts</option>
            <option value="brouillon">Brouillons</option>
            <option value="actif">Actifs</option>
            <option value="suspendu">Suspendus</option>
            <option value="expire">Expirés</option>
            <option value="resilie">Résiliés</option>
          </select>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Numéro', 'Client', 'Objet', 'Type', 'Centre', 'Montant', 'Période', 'Statut'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun contrat</td></tr>
              ) : filtres.map((c) => (
                <tr key={c.id}>
                  <td className="mono-cell text-forest-700">{c.numero}</td>
                  <td className="font-display font-medium text-ink">{c.client_nom}</td>
                  <td className="text-[12px] text-sand-600">{c.objet}</td>
                  <td className="text-[12px] text-sand-500">{c.type_display}</td>
                  <td>{c.centre_cout_display ? <CenterBadge center={c.centre_cout_display} /> : <span className="text-sand-400">—</span>}</td>
                  <td className="num">{fmt(c.montant)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="text-[11.5px] text-sand-500">{c.date_debut}{c.date_fin ? ` → ${c.date_fin}` : ''}</td>
                  <td><Badge tone={STATUT_TONE[c.statut] ?? 'gray'}>{c.statut_display}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau contrat" sousTitre="Objet, type, période et montant." onClose={() => setModal(false)} width={560}>
          <ContratForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
