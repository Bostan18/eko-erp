import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import EmployeForm from '../../components/forms/EmployeForm'

const TYPE_BADGE = {
  cdi:        'badge-green',
  journalier: 'badge-blue',
  moo:        'badge-yellow',
  stagiaire:  'badge-gray',
}

const STATUT_BADGE = {
  actif:   'badge-green',
  inactif: 'badge-gray',
  conge:   'badge-yellow',
}

export default function EmployeList() {
  const [employes, setEmployes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)

  function charger() {
    setLoading(true)
    api.get('/rh/employes/')
      .then(({ data }) => setEmployes(data.results ?? data))
      .catch(() => setError('Impossible de charger les employés.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [])

  const filtered = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl">RH & Paie</h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            {loading ? '…' : `${employes.length} employé${employes.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvel employé</button>
      </div>

      {/* Search */}
      <input
        type="text"
        className="input max-w-xs"
        placeholder="Rechercher par nom ou code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Table */}
      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm font-body">{error}</p>}

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Code', 'Nom', 'Poste', 'Type', 'Statut', 'Taux/jour'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400 font-body">
                    Aucun employé trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-display font-medium text-forest-700">{emp.code}</td>
                    <td className="px-4 py-3">
                      <Link to={`/rh/${emp.id}`} className="font-body font-medium text-gray-800 hover:text-forest-700 transition-colors">
                        {emp.nom} {emp.prenom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-body text-gray-500">{emp.poste || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={TYPE_BADGE[emp.type_contrat] ?? 'badge-gray'}>
                        {emp.type_contrat.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUT_BADGE[emp.statut] ?? 'badge-gray'}>
                        {emp.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-body text-gray-600">
                      {emp.taux_journalier ? `${Number(emp.taux_journalier).toLocaleString('fr-FR')} F` : '—'}
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
          <EmployeForm
            onClose={() => setModal(false)}
            onSuccess={() => { setModal(false); charger() }}
          />
        </Modal>
      )}
    </div>
  )
}
