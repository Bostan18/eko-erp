import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ClientForm from '../../components/forms/ClientForm'
import { useFetchList } from '../../hooks/useFetchList'
import { CLIENT_TYPE_BADGE, CLIENT_STATUT_BADGE } from '../../utils/constants'

export default function ClientList() {
  const { items: clients, loading, error, charger } = useFetchList('/crm/clients/', 'Impossible de charger les clients.')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtered = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl">CRM</h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            {loading ? '…' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouveau client</button>
      </div>

      <input
        type="text"
        className="input max-w-xs"
        placeholder="Rechercher par nom ou code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Code', 'Nom', 'Type', 'Secteur', 'Statut', 'Téléphone', 'Localité'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-body">
                    Aucun client trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-display font-medium text-forest-700">{c.code}</td>
                    <td className="px-4 py-3 font-body font-medium text-gray-800">{c.nom}</td>
                    <td className="px-4 py-3">
                      <span className={CLIENT_TYPE_BADGE[c.type_client] ?? 'badge-gray'}>{c.type_client}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-gray-500 capitalize">{c.secteur || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={CLIENT_STATUT_BADGE[c.statut] ?? 'badge-gray'}>{c.statut}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-gray-500">{c.telephone || '—'}</td>
                    <td className="px-4 py-3 font-body text-gray-500">{c.localite || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau client" onClose={() => setModal(false)}>
          <ClientForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
