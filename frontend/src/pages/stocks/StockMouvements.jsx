import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ModuleTabs, { STOCKS_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconRefresh, IconDownload, IconUpload } from '../../components/ui/Icons'
import MouvementStockForm from '../../components/forms/MouvementStockForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const TYPE_BADGE = {
  entree: 'badge-green',
  sortie: 'badge-gold',
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

  const nbEntrees = mouvements.filter((m) => m.type_mouvement === 'entree').length
  const nbSorties = mouvements.filter((m) => m.type_mouvement === 'sortie').length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Mouvements de stock</div>
          <div className="sec-sub">
            Entrées & sorties d'articles ·{' '}
            {loading ? '…' : `${mouvements.length} mouvement${mouvements.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau mouvement
        </button>
      </div>

      {/* ─── KPI ────────────────────────────────────────── */}
      <div className="three-col">
        <KpiCard
          icon={<IconRefresh />} tone="blue"
          label="Total mouvements"
          value={mouvements.length}
          sub="Entrées & sorties"
        />
        <KpiCard
          icon={<IconDownload />} tone="forest" valueTone="forest"
          label="Entrées"
          value={nbEntrees}
          sub="Réapprovisionnements"
        />
        <KpiCard
          icon={<IconUpload />} tone="gold" valueTone="gold"
          label="Sorties"
          value={nbSorties}
          sub="Consommations"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={STOCKS_TABS} />

        <div className="th-row">
          <div className="th-title">
            Mouvements ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <select
            className="input input-sm w-auto"
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
          >
            <option value="tous">Tous les types</option>
            <option value="entree">Entrées</option>
            <option value="sortie">Sorties</option>
          </select>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Date', 'Type', 'Article', 'Quantité', 'Projet', 'Notes'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucun mouvement</td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id}>
                  <td className="mono-cell">{m.date}</td>
                  <td>
                    <span className={TYPE_BADGE[m.type_mouvement] ?? 'badge-gray'}>
                      {TYPE_LABEL[m.type_mouvement] ?? m.type_mouvement}
                    </span>
                  </td>
                  <td className="font-display font-medium text-ink">{m.article_nom}</td>
                  <td className={`num ${m.type_mouvement === 'entree' ? 'text-forest-700' : 'text-gold-700'}`}>
                    {m.type_mouvement === 'entree' ? '+' : '−'}{fmt(m.quantite)}
                  </td>
                  <td className="text-[12px] text-sand-500">{m.projet_nom || '—'}</td>
                  <td className="text-[12px] text-sand-500">{m.notes || '—'}</td>
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

function IconPlus({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
