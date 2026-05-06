import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import ProjetForm from '../../components/forms/ProjetForm'

const STATUT_BADGE = {
  planifie: 'badge-gray',
  en_cours: 'badge-blue',
  suspendu: 'badge-yellow',
  termine:  'badge-green',
  annule:   'badge-red',
}

const TYPE_LABEL = {
  btp:          'BTP',
  agriculture:  'Agriculture',
  pepiniere:    'Pépinière',
  location:     'Location',
  espaces_verts: 'Espaces verts',
}

export default function ProjetList() {
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [modal, setModal]     = useState(false)

  function charger() {
    setLoading(true)
    api.get('/projets/projets/')
      .then(({ data }) => setProjets(data.results ?? data))
      .catch(() => setError('Impossible de charger les projets.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { charger() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl">Projets</h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            {loading ? '…' : `${projets.length} projet${projets.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouveau projet</button>
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Code', 'Nom', 'Type', 'Statut', 'Client', 'Début', 'Budget'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-body">
                    Aucun projet enregistré
                  </td>
                </tr>
              ) : (
                projets.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-display font-medium text-forest-700">{p.code}</td>
                    <td className="px-4 py-3">
                      <Link to={`/projets/${p.id}`} className="font-body font-medium text-gray-800 hover:text-forest-700 transition-colors">
                        {p.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-body text-gray-500">{TYPE_LABEL[p.type_projet] ?? p.type_projet}</td>
                    <td className="px-4 py-3">
                      <span className={STATUT_BADGE[p.statut] ?? 'badge-gray'}>{p.statut}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-gray-500">{p.client_nom ?? '—'}</td>
                    <td className="px-4 py-3 font-body text-gray-500">{p.date_debut ?? '—'}</td>
                    <td className="px-4 py-3 font-body text-gray-600">
                      {p.budget_estime ? `${Number(p.budget_estime).toLocaleString('fr-FR')} F` : '—'}
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
          <ProjetForm
            onClose={() => setModal(false)}
            onSuccess={() => { setModal(false); charger() }}
          />
        </Modal>
      )}
    </div>
  )
}
