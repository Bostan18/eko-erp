import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { ACHATS_TABS } from '../../components/ui/ModuleTabs'
import CompteForm from '../../components/forms/CompteForm'
import TresorerieKpis from './TresorerieKpis'
import { fmt } from '../../utils/format'

const TYPE_TONE = { banque: 'blue', caisse: 'gold', mobile_money: 'green' }

export default function CompteList() {
  const [comptes, setComptes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)

  const charger = useCallback(() => {
    setLoading(true)
    api.get('/achats/comptes/').then(({ data }) => setComptes(data.results ?? data)).finally(() => setLoading(false))
  }, [])
  useEffect(() => { charger() }, [charger])

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
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Nom', 'Type', 'Banque / Opérateur', 'N° compte', 'Solde initial', 'Solde actuel'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {comptes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucun compte</td></tr>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau compte" sousTitre="Compte bancaire, caisse ou Mobile Money." onClose={() => setModal(false)}>
          <CompteForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
