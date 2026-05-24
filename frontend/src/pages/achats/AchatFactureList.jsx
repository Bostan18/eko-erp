import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge, { CenterBadge } from '../../components/ui/Badge'
import ModuleTabs, { ACHATS_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconInvoice, IconHourglass, IconAlert } from '../../components/ui/Icons'
import FactureAchatForm from '../../components/forms/FactureAchatForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const STATUT_TONE  = { brouillon: 'gray', validee: 'blue', payee: 'green', annulee: 'gray' }
const STATUT_LABEL = { brouillon: 'Brouillon', validee: 'Validée', payee: 'Payée', annulee: 'Annulée' }

const enRetard = (f, t = new Date().toISOString().slice(0, 10)) =>
  !!f.date_echeance && f.date_echeance < t && f.statut !== 'payee' && f.statut !== 'annulee'

export default function AchatFactureList() {
  const { items: factures, loading, error, charger } = useFetchList(
    '/achats/factures/', 'Impossible de charger les factures d\'achat.'
  )
  const [filtre, setFiltre] = useState('toutes')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtrees = factures
    .filter((f) => {
      if (filtre === 'toutes') return true
      if (filtre === 'en_retard') return enRetard(f)
      return f.statut === filtre
    })
    .filter((f) => !search ? true
      : (f.numero ?? '').toLowerCase().includes(search.toLowerCase()) ||
        f.fournisseur_nom?.toLowerCase().includes(search.toLowerCase()) ||
        f.libelle?.toLowerCase().includes(search.toLowerCase()))

  const totalAchats = factures.filter((f) => f.statut !== 'annulee').reduce((s, f) => s + Number(f.total_ttc ?? 0), 0)
  const totalAPayer = factures.filter((f) => f.statut !== 'payee' && f.statut !== 'annulee').reduce((s, f) => s + Number(f.solde_restant ?? 0), 0)
  const nbEnRetard  = factures.filter(enRetard).length

  const STATUTS = [
    { key: 'toutes', label: 'Tous les statuts' },
    { key: 'brouillon', label: 'Brouillons' },
    { key: 'validee', label: 'Validées' },
    { key: 'payee', label: 'Payées' },
    { key: 'en_retard', label: 'En retard' },
    { key: 'annulee', label: 'Annulées' },
  ]

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Achats &amp; Trésorerie</div>
          <div className="sec-sub">
            Factures fournisseurs ·{' '}
            {loading ? '…' : `${factures.length} facture${factures.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvelle facture d'achat
        </button>
      </div>

      {nbEnRetard > 0 && (
        <div className="alert-gold">
          <span className="w-1.5 h-1.5 bg-gold-500 rounded-full" />
          <strong className="font-display font-semibold">{nbEnRetard} facture{nbEnRetard > 1 ? 's' : ''} fournisseur en retard</strong>
          <span className="text-gold-600">· règlement à prévoir</span>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard
          icon={<IconInvoice />} tone="sand"
          label="Total achats"
          value={<>{fmt(totalAchats)} <span className="kpi-unit">FCFA</span></>}
          sub="cumul hors annulées"
        />
        <KpiCard
          icon={<IconHourglass />} tone="gold" valueTone="gold"
          label="Reste à payer"
          value={<>{fmt(totalAPayer)} <span className="kpi-unit">FCFA</span></>}
          sub="soldes fournisseurs"
        />
        <KpiCard
          icon={<IconAlert />} tone="red"
          label="En retard"
          value={nbEnRetard}
          sub={nbEnRetard > 0 ? 'Action requise' : 'À jour'}
        />
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={ACHATS_TABS} />
        <div className="th-row">
          <div className="th-title">Factures d'achat · <span className="text-sand-500 font-normal">{filtrees.length}</span></div>
          <div className="flex items-center gap-2">
            <select className="input input-sm w-auto" value={filtre} onChange={(e) => setFiltre(e.target.value)}>
              {STATUTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <input type="text" className="input input-sm w-[200px]" placeholder="Rechercher n°, fournisseur…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Numéro', 'Fournisseur', 'Libellé', 'Centre', 'TTC', 'Payé', 'Statut', 'Échéance'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtrees.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucune facture d'achat</td></tr>
              ) : filtrees.map((f) => {
                const retard = enRetard(f)
                return (
                  <tr key={f.id} className={retard ? 'bg-red-50/40 hover:bg-red-50' : ''}>
                    <td className="mono-cell text-forest-700">{f.numero}</td>
                    <td className="font-display font-medium text-ink">{f.fournisseur_nom}</td>
                    <td className="text-[12px] text-sand-600">{f.libelle}</td>
                    <td>{f.centre_cout_display ? <CenterBadge center={f.centre_cout_display} /> : <span className="text-sand-400">—</span>}</td>
                    <td className="num">{fmt(f.total_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                    <td className="mono-cell">{fmt(f.montant_paye)}</td>
                    <td><Badge tone={STATUT_TONE[f.statut] ?? 'gray'}>{STATUT_LABEL[f.statut] ?? f.statut}</Badge></td>
                    <td className={retard ? 'text-red-700 font-semibold' : 'text-sand-600'}>{f.date_echeance || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle facture d'achat" sousTitre="Fournisseur, montant, imputation analytique." onClose={() => setModal(false)} width={580}>
          <FactureAchatForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
