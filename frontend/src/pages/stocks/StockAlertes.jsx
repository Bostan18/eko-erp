import { useState } from 'react'
import { useFetchList } from '../../hooks/useFetchList'
import { ARTICLE_CAT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function StockAlertes() {
  const { items: articles, loading, error } = useFetchList(
    '/stocks/articles/alertes/',
    'Impossible de charger les alertes stock.'
  )
  const [search, setSearch] = useState('')

  const filtered = articles.filter(
    (a) =>
      a.nom.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <p className="font-body text-[#A59F9B] text-sm">
          {loading ? '…' : `${articles.length} article${articles.length !== 1 ? 's' : ''} sous le seuil`}
        </p>
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
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#A59F9B] font-body text-sm">
            {articles.length === 0
              ? 'Aucun article en alerte — tous les stocks sont au-dessus du seuil.'
              : 'Aucun article ne correspond à la recherche.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fbf7f0] border-b border-[#ece2d3]">
              <tr>
                {['Code', 'Nom', 'Catégorie', 'Stock', 'Seuil', 'Manque', 'Unité', 'Fournisseur'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-[#A59F9B] text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ebe0]">
              {filtered.map((a) => {
                const manque = Number(a.seuil_minimum) - Number(a.stock_actuel)
                return (
                  <tr key={a.id} className="bg-red-50 hover:bg-red-100 transition-colors">
                    <td className="px-4 py-3 font-display font-medium text-forest-700">{a.code}</td>
                    <td className="px-4 py-3 font-body font-medium text-[#1C1817]">{a.nom}</td>
                    <td className="px-4 py-3 font-body text-[#A59F9B] text-xs">{ARTICLE_CAT_LABEL[a.categorie] ?? a.categorie}</td>
                    <td className="px-4 py-3">
                      <span className="font-display font-bold text-red-600">{fmt(a.stock_actuel)}</span>
                      <span className="ml-1 text-red-500" title="Stock sous le seuil minimum">⚠</span>
                    </td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{fmt(a.seuil_minimum)}</td>
                    <td className="px-4 py-3 font-display font-semibold text-red-600">{fmt(manque)}</td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{a.unite}</td>
                    <td className="px-4 py-3 font-body text-[#A59F9B]">{a.fournisseur || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
