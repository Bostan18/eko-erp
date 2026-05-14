import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import FactureForm from '../../components/forms/FactureForm'
import { useFetchList } from '../../hooks/useFetchList'
import { FACTURE_STATUT_BADGE, FACTURE_STATUT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function FactureList() {
  const { items: factures, loading, error, charger } = useFetchList('/comptabilite/factures/', 'Impossible de charger les factures.')
  const [filtre, setFiltre] = useState('toutes')
  const [modal, setModal]   = useState(false)

  const filtrees = factures.filter((f) => filtre === 'toutes' ? true : f.statut === filtre)
  const totalEncaisse  = factures.filter((f) => f.statut === 'payee').reduce((s, f) => s + Number(f.montant_ttc), 0)
  const totalEnAttente = factures.filter((f) => ['envoyee', 'partiellement_payee'].includes(f.statut))
                                 .reduce((s, f) => s + Number(f.solde_restant ?? 0), 0)
  const nbEnRetard = factures.filter((f) => f.statut === 'en_retard').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${factures.length} facture${factures.length !== 1 ? 's' : ''}`}
        </p>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvelle facture</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-forest-100 bg-forest-50">
          <p className="font-display text-xs text-forest-600 uppercase tracking-wide mb-1">Encaissé</p>
          <p className="font-display font-bold text-forest-700 text-2xl">{fmt(totalEncaisse)} F</p>
        </div>
        <div className="card p-4 border-amber-100 bg-amber-50">
          <p className="font-display text-xs text-amber-600 uppercase tracking-wide mb-1">En attente</p>
          <p className="font-display font-bold text-amber-700 text-2xl">{fmt(totalEnAttente)} F</p>
        </div>
        <div className={`card p-4 ${nbEnRetard > 0 ? 'border-red-200 bg-red-50' : 'border-[#ece2d3]'}`}>
          <p className={`font-display text-xs uppercase tracking-wide mb-1 ${nbEnRetard > 0 ? 'text-red-600' : 'text-[#A59F9B]'}`}>En retard</p>
          <p className={`font-display font-bold text-2xl ${nbEnRetard > 0 ? 'text-red-600' : 'text-[#A59F9B]'}`}>{nbEnRetard}</p>
        </div>
      </div>

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
                : 'bg-white border border-[#ece2d3] text-[#1C1817] hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Numéro', 'Client', 'Projet', 'Montant TTC', 'Payé', 'Solde', 'Statut', 'Échéance'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtrees.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#A59F9B] font-body">Aucune facture</td></tr>
              ) : filtrees.map((f) => (
                <tr key={f.id} className={`transition-colors ${f.statut === 'en_retard' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[#fbf7f0]'}`}>
                  <td className="px-4 py-3">
                    <Link to={`/comptabilite/factures/${f.id}`} className="font-display font-medium text-forest-700 hover:text-forest-900">
                      {f.numero}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-[#1C1817]">{f.client_nom}</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{f.projet_nom || '—'}</td>
                  <td className="px-4 py-3 font-display font-semibold text-[#1C1817]">{fmt(f.montant_ttc)} F</td>
                  <td className="px-4 py-3 font-body text-[#1C1817]">{fmt(f.montant_paye)} F</td>
                  <td className={`px-4 py-3 font-display font-semibold ${Number(f.solde_restant) > 0 ? 'text-amber-600' : 'text-[#A59F9B]'}`}>
                    {fmt(f.solde_restant)} F
                  </td>
                  <td className="px-4 py-3">
                    <span className={FACTURE_STATUT_BADGE[f.statut] ?? 'badge-gray'}>{FACTURE_STATUT_LABEL[f.statut] ?? f.statut}</span>
                  </td>
                  <td className={`px-4 py-3 font-body text-sm ${f.statut === 'en_retard' ? 'text-red-600 font-semibold' : 'text-[#A59F9B]'}`}>
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
