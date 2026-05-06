import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import FactureForm from '../../components/forms/FactureForm'

function fmt(n) { return Number(n).toLocaleString('fr-FR') }

const STATUT_BADGE = {
  brouillon:            'badge-gray',
  envoyee:              'badge-blue',
  partiellement_payee:  'badge-yellow',
  payee:                'badge-green',
  en_retard:            'badge-red',
  annulee:              'badge-gray',
}

const STATUT_LABEL = {
  brouillon:            'Brouillon',
  envoyee:              'Envoyée',
  partiellement_payee:  'Partiel',
  payee:                'Payée',
  en_retard:            'En retard',
  annulee:              'Annulée',
}

export default function FactureList() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filtre, setFiltre]     = useState('toutes')
  const [modal, setModal]       = useState(false)

  function charger() {
    setLoading(true)
    api.get('/comptabilite/factures/')
      .then(({ data }) => setFactures(data.results ?? data))
      .catch(() => setError('Impossible de charger les factures.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [])

  const filtrees = factures.filter((f) =>
    filtre === 'toutes' ? true : f.statut === filtre
  )

  const totalEncaisse = factures.filter((f) => f.statut === 'payee').reduce((s, f) => s + Number(f.montant_ttc), 0)
  const totalEnAttente = factures.filter((f) => ['envoyee', 'partiellement_payee'].includes(f.statut))
                                  .reduce((s, f) => s + Number(f.solde_restant ?? 0), 0)
  const nbEnRetard = factures.filter((f) => f.statut === 'en_retard').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl">Factures</h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            {loading ? '…' : `${factures.length} facture${factures.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvelle facture</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-forest-100 bg-forest-50">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Encaissé</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{fmt(totalEncaisse)} F</p>
        </div>
        <div className="card p-4 border-amber-100 bg-amber-50">
          <p className="font-display text-xs text-amber-600 uppercase tracking-wide mb-1">En attente</p>
          <p className="font-display font-bold text-amber-700 text-2xl">{fmt(totalEnAttente)} F</p>
        </div>
        <div className={`card p-4 ${nbEnRetard > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
          <p className={`font-display text-xs uppercase tracking-wide mb-1 ${nbEnRetard > 0 ? 'text-red-600' : 'text-gray-500'}`}>En retard</p>
          <p className={`font-display font-bold text-2xl ${nbEnRetard > 0 ? 'text-red-600' : 'text-gray-400'}`}>{nbEnRetard}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-1 flex-wrap">
        {[
          { key: 'toutes', label: 'Toutes' },
          { key: 'brouillon', label: 'Brouillons' },
          { key: 'envoyee', label: 'Envoyées' },
          { key: 'partiellement_payee', label: 'Partiellement payées' },
          { key: 'payee', label: 'Payées' },
          { key: 'en_retard', label: 'En retard' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
              filtre === key
                ? key === 'en_retard' ? 'bg-red-500 text-white' : 'bg-forest-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Numéro', 'Client', 'Projet', 'Montant TTC', 'Payé', 'Solde', 'Statut', 'Échéance'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrees.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 font-body">Aucune facture</td></tr>
              ) : filtrees.map((f) => (
                <tr key={f.id} className={`transition-colors ${f.statut === 'en_retard' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <Link to={`/comptabilite/factures/${f.id}`} className="font-display font-medium text-forest-700 hover:text-forest-900">
                      {f.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-gray-800">{f.client_nom}</td>
                  <td className="px-4 py-3 font-body text-gray-500 text-xs">{f.projet_nom || '—'}</td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-800">{fmt(f.montant_ttc)} F</td>
                  <td className="px-4 py-3 font-body text-gray-600">{fmt(f.montant_paye)} F</td>
                  <td className={`px-4 py-3 font-display font-semibold ${Number(f.solde_restant) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {fmt(f.solde_restant)} F
                  </td>
                  <td className="px-4 py-3">
                    <span className={STATUT_BADGE[f.statut] ?? 'badge-gray'}>{STATUT_LABEL[f.statut] ?? f.statut}</span>
                  </td>
                  <td className={`px-4 py-3 font-body text-sm ${f.statut === 'en_retard' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {f.date_echeance || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle facture" onClose={() => setModal(false)}>
          <FactureForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
