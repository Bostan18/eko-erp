import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ModuleTabs, { STOCKS_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconBox, IconWallet, IconAlert, IconFolder } from '../../components/ui/Icons'
import ArticleForm from '../../components/forms/ArticleForm'
import { useFetchList } from '../../hooks/useFetchList'
import { ARTICLE_CAT_LABEL } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function StockList() {
  const { items: articles, loading, error, charger } = useFetchList(
    '/stocks/articles/', 'Impossible de charger les articles.'
  )
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const alertes = articles.filter((a) => Number(a.stock_actuel) <= Number(a.seuil_minimum))
  const valeurStock = articles.reduce((s, a) => s + Number(a.stock_actuel) * Number(a.prix_unitaire ?? 0), 0)

  const filtered = articles.filter((a) => {
    const matchSearch =
      a.nom.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    const matchFiltre =
      filtre === 'tous' ? true :
      filtre === 'alertes' ? Number(a.stock_actuel) <= Number(a.seuil_minimum) :
      a.categorie === filtre
    return matchSearch && matchFiltre
  })

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Stocks</div>
          <div className="sec-sub">
            Articles, intrants & matériaux ·{' '}
            {loading ? '…' : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvel article
        </button>
      </div>

      {alertes.length > 0 && (
        <button
          className="alert-red w-full text-left hover:bg-red-100 transition-colors"
          onClick={() => setFiltre('alertes')}
        >
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          <strong className="font-display font-semibold">
            {alertes.length} article{alertes.length > 1 ? 's' : ''} sous le seuil minimum
          </strong>
          <span className="text-red-600">— cliquer pour filtrer</span>
          <span className="ml-auto text-red-700 font-display font-medium">Voir →</span>
        </button>
      )}

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconBox />} tone="sand"
          label="Articles"
          value={articles.length}
          sub="Références en stock"
        />
        <KpiCard
          icon={<IconWallet />} tone="forest" valueTone="forest"
          label="Valeur du stock"
          value={<>{fmt(valeurStock)} <span className="kpi-unit">FCFA</span></>}
          sub="Valorisation au prix unitaire"
        />
        <KpiCard
          icon={<IconAlert />} tone={alertes.length > 0 ? 'red' : 'sand'} valueTone={alertes.length > 0 ? 'red' : 'sand'}
          label="Alertes"
          value={alertes.length}
          sub={alertes.length > 0 ? 'Sous le seuil minimum' : 'Tout est à niveau'}
        />
        <KpiCard
          icon={<IconFolder />} tone="sand"
          label="Catégories"
          value={Object.keys(ARTICLE_CAT_LABEL).length}
          sub="Types d'article"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={STOCKS_TABS} />

        <div className="th-row">
          <div className="th-title">
            Articles ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input input-sm w-auto"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            >
              <option value="tous">Toutes les catégories</option>
              <option value="alertes">⚠ Alertes</option>
              {Object.entries(ARTICLE_CAT_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="text"
              className="input input-sm w-[210px]"
              placeholder="Rechercher nom ou code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Code', 'Nom', 'Catégorie', 'Stock', 'Seuil', 'Unité', 'Prix unit.', 'Fournisseur'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun article</td></tr>
              ) : filtered.map((a) => {
                const enAlerte = Number(a.stock_actuel) <= Number(a.seuil_minimum)
                return (
                  <tr key={a.id} className={enAlerte ? 'bg-red-50/40 hover:bg-red-50' : ''}>
                    <td className="mono-cell text-forest-700">{a.code}</td>
                    <td className="font-display font-medium text-ink">{a.nom}</td>
                    <td className="text-sand-600 text-[12px]">{ARTICLE_CAT_LABEL[a.categorie] ?? a.categorie}</td>
                    <td className="num">
                      <span className={enAlerte ? 'text-red-700' : 'text-ink'}>{fmt(a.stock_actuel)}</span>
                      {enAlerte && <span className="ml-1 text-red-500" title="Sous seuil">⚠</span>}
                    </td>
                    <td className="mono-cell">{fmt(a.seuil_minimum)}</td>
                    <td className="text-sand-600">{a.unite}</td>
                    <td className="num">{fmt(a.prix_unitaire)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                    <td className="text-sand-600">{a.fournisseur || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvel article" sousTitre="Code, catégorie, seuil et fournisseur." onClose={() => setModal(false)}>
          <ArticleForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
