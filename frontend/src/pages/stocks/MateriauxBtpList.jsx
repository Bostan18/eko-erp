import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { STOCKS_TABS } from '../../components/ui/ModuleTabs'
import TraceurRFIDForm from '../../components/forms/TraceurRFIDForm'
import { useFetchList } from '../../hooks/useFetchList'

const STATUT_TONE = {
  en_stock: 'green', sorti: 'gold', perdu: 'red', retire: 'gray',
}

export default function MateriauxBtpList() {
  const { items: tags, loading, error, charger } = useFetchList(
    '/stocks/traceurs-rfid/', 'Impossible de charger les tags RFID.'
  )
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtres = tags.filter((t) =>
    !search ? true
      : t.tag_uid.toLowerCase().includes(search.toLowerCase()) ||
        (t.article_nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (t.site_nom ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const enStock = tags.filter((t) => t.statut === 'en_stock').length
  const sortis  = tags.filter((t) => t.statut === 'sorti').length
  const perdus  = tags.filter((t) => t.statut === 'perdu').length

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Stocks · Matériaux BTP</div>
          <div className="sec-sub">Traçabilité RFID des matériaux et équipements.</div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau tag
        </button>
      </div>

      <div className="kpi-grid">
        <Kpi label="Tags posés" value={tags.length} />
        <Kpi label="En stock" value={enStock} tone="green" />
        <Kpi label="Sur site" value={sortis} tone="gold" />
        <Kpi label="Perdus / volés" value={perdus} tone={perdus > 0 ? 'red' : 'gray'} />
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={STOCKS_TABS} />
        <div className="th-row">
          <div className="th-title">Tags RFID · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher UID, article, site…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['UID', 'Article', 'Site', 'Qté', 'Pose', 'Statut'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucun tag RFID</td></tr>
              ) : filtres.map((t) => (
                <tr key={t.id}>
                  <td className="mono-cell text-forest-700">{t.tag_uid}</td>
                  <td className="font-display font-medium text-ink">
                    {t.article_code && <span className="mono-cell text-forest-700 mr-2">{t.article_code}</span>}
                    {t.article_nom}
                  </td>
                  <td className="text-sand-600">{t.site_nom || '—'}</td>
                  <td className="num">{Number(t.quantite).toLocaleString('fr-FR')}</td>
                  <td className="mono-cell text-sand-700">{t.date_pose}</td>
                  <td><Badge tone={STATUT_TONE[t.statut] ?? 'gray'}>{t.statut_display}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau tag RFID" sousTitre="Traçabilité d'un matériau ou équipement BTP." onClose={() => setModal(false)}>
          <TraceurRFIDForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function Kpi({ label, value, tone }) {
  const valueClass = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-forest-700' : tone === 'gold' ? 'text-gold-600' : 'text-ink'
  return (
    <div className="kpi">
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value ${valueClass}`}>{value}</p>
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
