import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ArticleForm from '../../components/forms/ArticleForm'
import { useFetchList } from '../../hooks/useFetchList'
import { ARTICLE_CAT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function StockList() {
  const { items: articles, loading, error, charger } = useFetchList('/stocks/articles/', 'Impossible de charger les articles.')
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const alertes = articles.filter((a) => Number(a.stock_actuel) <= Number(a.seuil_minimum))

  const filtered = articles.filter((a) => {
    const matchSearch = a.nom.toLowerCase().includes(search.toLowerCase()) ||
                        a.code.toLowerCase().includes(search.toLowerCase())
    const matchFiltre = filtre === 'tous' ? true
                      : filtre === 'alertes' ? Number(a.stock_actuel) <= Number(a.seuil_minimum)
                      : a.categorie === filtre
    return matchSearch && matchFiltre
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
        </p>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvel article</button>
      </div>

      {alertes.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl cursor-pointer"
          onClick={() => setFiltre('alertes')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-500 shrink-0">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="font-display font-semibold text-red-700 text-sm">
            {alertes.length} article{alertes.length > 1 ? 's' : ''} sous le seuil minimum
            <span className="font-body font-normal text-red-500 ml-2">— cliquer pour filtrer</span>
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          className="input max-w-xs"
          placeholder="Rechercher par nom ou code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {['tous', 'alertes', 'intrant', 'materiau', 'equipement', 'consommable', 'piece'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
                filtre === f
                  ? f === 'alertes' ? 'bg-red-500 text-white' : 'bg-forest-700 text-white'
                  : 'bg-white border border-[#ece2d3] text-[#1C1817] hover:border-forest-300'
              }`}
            >
              {f === 'tous' ? 'Tous' : f === 'alertes' ? '⚠ Alertes' : ARTICLE_CAT_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Code', 'Nom', 'Catégorie', 'Stock', 'Seuil', 'Unité', 'Prix unit.', 'Fournisseur'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#A59F9B] font-body">Aucun article trouvé</td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const enAlerte = Number(a.stock_actuel) <= Number(a.seuil_minimum)
                  return (
                    <tr key={a.id} className={`transition-colors ${enAlerte ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[#fbf7f0]'}`}>
                      <td className="px-4 py-3 font-display font-medium text-forest-700">{a.code}</td>
                      <td className="px-4 py-3 font-body font-medium text-[#1C1817]">{a.nom}</td>
                      <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{ARTICLE_CAT_LABEL[a.categorie] ?? a.categorie}</td>
                      <td className="px-4 py-3">
                        <span className={`font-display font-bold ${enAlerte ? 'text-red-600' : 'text-[#1C1817]'}`}>
                          {fmt(a.stock_actuel)}
                        </span>
                        {enAlerte && <span className="ml-1 text-red-500" title="Stock sous le seuil minimum">⚠</span>}
                      </td>
                      <td className="px-4 py-3 font-body text-[#A59F9B]">{fmt(a.seuil_minimum)}</td>
                      <td className="px-4 py-3 font-body text-[#A59F9B]">{a.unite}</td>
                      <td className="px-4 py-3 font-body text-[#1C1817]">{fmt(a.prix_unitaire)} F</td>
                      <td className="px-4 py-3 font-body text-[#A59F9B]">{a.fournisseur || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvel article" onClose={() => setModal(false)}>
          <ArticleForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
