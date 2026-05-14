import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../../components/ui/Modal'
import EmployeForm from '../../components/forms/EmployeForm'
import { useFetchList } from '../../hooks/useFetchList'
import { EMPLOYE_TYPE_BADGE, EMPLOYE_STATUT_BADGE } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function EmployeList() {
  const { items: employes, loading, error, charger } = useFetchList('/rh/employes/', 'Impossible de charger les employés.')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtered = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${employes.length} employé${employes.length !== 1 ? 's' : ''}`}
        </p>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvel employé</button>
      </div>

      <input
        type="text"
        className="input max-w-xs"
        placeholder="Rechercher par nom ou code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm font-body">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Code', 'Nom', 'Poste', 'Type', 'Statut', 'Taux/jour'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#A59F9B] font-body">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#fbf7f0] transition-colors">
                    <td className="px-4 py-3 font-display font-medium text-forest-700">{emp.code}</td>
                    <td className="px-4 py-3">
                      <Link to={`/rh/${emp.id}`} className="font-body font-medium text-[#1C1817] hover:text-forest-700 transition-colors">
                        {emp.nom} {emp.prenom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{emp.poste || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={EMPLOYE_TYPE_BADGE[emp.type_contrat] ?? 'badge-gray'}>
                        {emp.type_contrat.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={EMPLOYE_STATUT_BADGE[emp.statut] ?? 'badge-gray'}>
                        {emp.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-[#1C1817]">
                      {emp.taux_journalier ? `${fmt(emp.taux_journalier)} F` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvel employé" onClose={() => setModal(false)}>
          <EmployeForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
