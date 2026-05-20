import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ClientForm from '../../components/forms/ClientForm'
import { useFetchList } from '../../hooks/useFetchList'

const TYPE_TONE   = { particulier: 'gray', entreprise: 'blue', collectivite: 'green' }
const STATUT_TONE = { actif: 'green', prospect: 'gold', inactif: 'gray' }

export default function ClientList() {
  const { items: clients, loading, error, charger } = useFetchList(
    '/crm/clients/', 'Impossible de charger les clients.'
  )
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const filtered = clients
    .filter((c) => filtre === 'tous' ? true : c.statut === filtre)
    .filter((c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    )

  const nbActifs    = clients.filter((c) => c.statut === 'actif').length
  const nbProspects = clients.filter((c) => c.statut === 'prospect').length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">Commerce / CRM</p>
          <h1 className="page-title">Clients</h1>
          <p className="page-sub mt-1.5">
            {loading ? '…' : `${clients.length} fiche${clients.length !== 1 ? 's' : ''} · ${nbActifs} actifs · ${nbProspects} prospects`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau client
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {[
            { key: 'tous',     label: 'Tous',      count: clients.length },
            { key: 'actif',    label: 'Actifs',    count: nbActifs },
            { key: 'prospect', label: 'Prospects', count: nbProspects },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={
                'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors flex items-center gap-1.5 ' +
                (filtre === key
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
              }
            >
              {label}
              <span className={
                'font-mono text-[10px] px-1.5 py-0.5 rounded-full ' +
                (filtre === key ? 'bg-forest-800 text-forest-100' : 'bg-sand-100 text-sand-500')
              }>{count}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input input-sm max-w-xs ml-auto"
          placeholder="Rechercher nom ou code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Code','Nom','Type','Secteur','Statut','Téléphone','Localité'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucun client</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id}>
                  <td className="mono-cell text-forest-700">{c.code}</td>
                  <td className="font-display font-medium text-ink">{c.nom}</td>
                  <td><Badge tone={TYPE_TONE[c.type_client] ?? 'gray'}>{c.type_client}</Badge></td>
                  <td className="text-sand-600 capitalize">{c.secteur || '—'}</td>
                  <td><Badge tone={STATUT_TONE[c.statut] ?? 'gray'}>{c.statut}</Badge></td>
                  <td className="mono-cell">{c.telephone || '—'}</td>
                  <td className="text-sand-600">{c.localite || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau client" sousTitre="Coordonnées et secteur d'activité." onClose={() => setModal(false)}>
          <ClientForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
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
