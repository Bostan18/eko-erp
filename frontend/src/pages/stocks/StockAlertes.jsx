import { useState } from 'react'
import ModuleTabs, { STOCKS_TABS } from '../../components/ui/ModuleTabs'
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

  const manqueTotal = articles.reduce(
    (s, a) => s + Math.max(0, Number(a.seuil_minimum) - Number(a.stock_actuel)),
    0
  )
  const nbFournisseurs = new Set(articles.map((a) => a.fournisseur).filter(Boolean)).size

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Alertes de stock</div>
          <div className="sec-sub">
            Articles sous le seuil minimum ·{' '}
            {loading ? '…' : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* ─── KPI ────────────────────────────────────────── */}
      <div className="three-col">
        <div className="kpi">
          <div className="kpi-icon text-2xl">⚠</div>
          <p className="kpi-label">Articles en alerte</p>
          <p className={`kpi-value ${articles.length > 0 ? 'text-red-600' : 'text-sand-400'}`}>{articles.length}</p>
          <p className="kpi-sub">{articles.length > 0 ? 'Sous le seuil minimum' : 'Tout est à niveau'}</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">📉</div>
          <p className="kpi-label">Manque cumulé</p>
          <p className="kpi-value text-red-600">{fmt(manqueTotal)}</p>
          <p className="kpi-sub">Unités à réapprovisionner</p>
        </div>
        <div className="kpi">
          <div className="kpi-icon text-2xl">🚚</div>
          <p className="kpi-label">Fournisseurs</p>
          <p className="kpi-value">{nbFournisseurs}</p>
          <p className="kpi-sub">À solliciter</p>
        </div>
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={STOCKS_TABS} />

        <div className="th-row">
          <div className="th-title">
            Articles sous seuil ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <input
            type="text"
            className="input input-sm w-[210px]"
            placeholder="Rechercher par nom ou code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">
            {articles.length === 0
              ? 'Aucun article en alerte — tous les stocks sont au-dessus du seuil.'
              : 'Aucun article ne correspond à la recherche.'}
          </div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Code', 'Nom', 'Catégorie', 'Stock', 'Seuil', 'Manque', 'Unité', 'Fournisseur'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const manque = Number(a.seuil_minimum) - Number(a.stock_actuel)
                return (
                  <tr key={a.id} className="bg-red-50/40 hover:bg-red-50">
                    <td className="mono-cell text-forest-700">{a.code}</td>
                    <td className="font-display font-medium text-ink">{a.nom}</td>
                    <td className="text-[12px] text-sand-500">{ARTICLE_CAT_LABEL[a.categorie] ?? a.categorie}</td>
                    <td className="num text-red-600">
                      {fmt(a.stock_actuel)}<span className="ml-1 text-red-500" title="Stock sous le seuil minimum">⚠</span>
                    </td>
                    <td className="mono-cell">{fmt(a.seuil_minimum)}</td>
                    <td className="num text-red-600">{fmt(manque)}</td>
                    <td className="text-sand-600">{a.unite}</td>
                    <td className="text-sand-600">{a.fournisseur || '—'}</td>
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
