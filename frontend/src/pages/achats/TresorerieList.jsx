import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge, { CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { ACHATS_TABS } from '../../components/ui/ModuleTabs'
import MouvementForm from '../../components/forms/MouvementForm'
import TresorerieKpis from './TresorerieKpis'
import { fmt } from '../../utils/format'

const CAT_LABEL = {
  vente: 'Vente', achat: 'Achat', salaire: 'Salaire', charge: 'Charge',
  impot: 'Impôt', transfert: 'Transfert', autre: 'Autre',
}

export default function TresorerieList() {
  const [mouvements, setMouvements] = useState([])
  const [comptes, setComptes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreCompte, setFiltreCompte] = useState('tous')
  const [filtreSens, setFiltreSens] = useState('tous')
  const [modal, setModal] = useState(false)
  const [refresh, setRefresh] = useState(0)

  const charger = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/achats/tresorerie/').then((r) => r.data.results ?? r.data).catch(() => []),
      api.get('/achats/comptes/').then((r) => r.data.results ?? r.data).catch(() => []),
    ]).then(([m, c]) => {
      setMouvements(Array.isArray(m) ? m : [])
      setComptes(Array.isArray(c) ? c : [])
    }).finally(() => setLoading(false))
  }, [])
  useEffect(() => { charger() }, [charger])

  const filtres = mouvements
    .filter((m) => filtreCompte === 'tous' ? true : String(m.compte) === filtreCompte)
    .filter((m) => filtreSens === 'tous' ? true : m.sens === filtreSens)

  function apresAjout() {
    setModal(false)
    setRefresh((r) => r + 1)
    charger()
  }

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Achats &amp; Trésorerie</div>
          <div className="sec-sub">Paiements & mouvements · {loading ? '…' : `${mouvements.length} mouvement${mouvements.length !== 1 ? 's' : ''}`}</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau mouvement
        </button>
      </div>

      <TresorerieKpis key={refresh} />

      <div className="card overflow-hidden">
        <ModuleTabs items={ACHATS_TABS} />
        <div className="th-row">
          <div className="th-title">Mouvements · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <div className="flex items-center gap-2">
            <select className="input input-sm w-auto" value={filtreSens} onChange={(e) => setFiltreSens(e.target.value)}>
              <option value="tous">Tous les sens</option>
              <option value="entree">Encaissements</option>
              <option value="sortie">Décaissements</option>
            </select>
            <select className="input input-sm w-auto" value={filtreCompte} onChange={(e) => setFiltreCompte(e.target.value)}>
              <option value="tous">Tous les comptes</option>
              {comptes.map((c) => <option key={c.id} value={String(c.id)}>{c.nom}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Date', 'Libellé', 'Compte', 'Catégorie', 'Centre', 'Facture achat', 'Montant'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucun mouvement</td></tr>
              ) : filtres.map((m) => (
                <tr key={m.id}>
                  <td className="mono-cell text-sand-500">{m.date}</td>
                  <td className="font-display font-medium text-ink">{m.libelle}</td>
                  <td className="text-sand-600 text-[12px]">{m.compte_nom}</td>
                  <td className="text-[12px] text-sand-500">{CAT_LABEL[m.categorie] ?? m.categorie}</td>
                  <td>{m.centre_cout_display ? <CenterBadge center={m.centre_cout_display} /> : <span className="text-sand-400">—</span>}</td>
                  <td className="mono-cell text-sand-500">{m.facture_achat_numero || '—'}</td>
                  <td className={`num font-semibold ${m.sens === 'entree' ? 'text-forest-700' : 'text-red-600'}`}>
                    {m.sens === 'entree' ? '+' : '−'}{fmt(m.montant)} <span className="text-[10px] font-normal text-sand-500">F</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau mouvement" sousTitre="Encaissement ou décaissement de trésorerie." onClose={() => setModal(false)} width={560}>
          <MouvementForm onClose={() => setModal(false)} onSuccess={apresAjout} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
