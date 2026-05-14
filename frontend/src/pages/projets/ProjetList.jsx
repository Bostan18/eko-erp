import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import ProjetForm from '../../components/forms/ProjetForm'
import { useFetchList } from '../../hooks/useFetchList'
import { PROJET_STATUT_BADGE, PROJET_TYPE_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function ProjetList() {
  const { items: projets, loading, error, charger } = useFetchList('/projets/projets/', 'Impossible de charger les projets.')
  const [modal, setModal] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${projets.length} projet${projets.length !== 1 ? 's' : ''}`}
        </p>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouveau projet</button>
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Code', 'Nom', 'Type', 'Statut', 'Client', 'Début', 'Budget'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {projets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#A59F9B] font-body">
                    Aucun projet enregistré
                  </td>
                </tr>
              ) : (
                projets.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fbf7f0] transition-colors">
                    <td className="px-4 py-3 font-display font-medium text-forest-700">{p.code}</td>
                    <td className="px-4 py-3">
                      <Link to={`/projets/${p.id}`} className="font-body font-medium text-[#1C1817] hover:text-forest-700 transition-colors">
                        {p.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{PROJET_TYPE_LABEL[p.type_projet] ?? p.type_projet}</td>
                    <td className="px-4 py-3">
                      <span className={PROJET_STATUT_BADGE[p.statut] ?? 'badge-gray'}>{p.statut}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{p.client_nom ?? '—'}</td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{p.date_debut ?? '—'}</td>
                    <td className="px-4 py-3 font-body text-[#1C1817]">
                      {p.budget_estime ? `${fmt(p.budget_estime)} F` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau projet" onClose={() => setModal(false)}>
          <ProjetForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
