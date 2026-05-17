import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import MouvementStockForm from '../../components/forms/MouvementStockForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const TYPE_BADGE = {
  entree: 'badge-green',
  sortie: 'badge-yellow',
}

const TYPE_LABEL = {
  entree: 'Entrée',
  sortie: 'Sortie',
}

export default function StockMouvements() {
  const { items: mouvements, loading, error, charger } = useFetchList(
    '/stocks/mouvements/',
    'Impossible de charger les mouvements.'
  )
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const filtered = mouvements.filter((m) =>
    filtre === 'tous' ? true : m.type_mouvement === filtre
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${mouvements.length} mouvement${mouvements.length !== 1 ? 's' : ''}`}
        </p>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouveau mouvement</button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {['tous', 'entree', 'sortie'].map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
              filtre === f
                ? 'bg-forest-700 text-white'
                : 'bg-white border border-[#ece2d3] text-[#1C1817] hover:border-forest-300'
            }`}
          >
            {f === 'tous' ? 'Tous' : TYPE_LABEL[f] + 's'}
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
                {['Date', 'Type', 'Article', 'Quantité', 'Projet', 'Notes'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#A59F9B] font-body">Aucun mouvement</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="hover:bg-[#fbf7f0] transition-colors">
                  <td className="px-4 py-3 font-body text-[#1C1817] tabular-nums">{m.date}</td>
                  <td className="px-4 py-3">
                    <span className={TYPE_BADGE[m.type_mouvement] ?? 'badge-gray'}>
                      {TYPE_LABEL[m.type_mouvement] ?? m.type_mouvement}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body font-medium text-[#1C1817]">{m.article_nom}</td>
                  <td className={`px-4 py-3 font-display font-semibold tabular-nums ${
                    m.type_mouvement === 'entree' ? 'text-forest-700' : 'text-amber-700'
                  }`}>
                    {m.type_mouvement === 'entree' ? '+' : '−'}{fmt(m.quantite)}
                  </td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{m.projet_nom || '—'}</td>
                  <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{m.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau mouvement de stock" onClose={() => setModal(false)}>
          <MouvementStockForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
