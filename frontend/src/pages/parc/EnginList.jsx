import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EnginForm from '../../components/forms/EnginForm'
import { useFetchList } from '../../hooks/useFetchList'

const STATUT_TONE = {
  disponible:     'green',
  en_chantier:    'gold',
  en_location:    'blue',
  en_maintenance: 'gold',
  hors_service:   'red',
}

export default function EnginList() {
  const { items: engins, loading, error, charger } = useFetchList(
    '/parc/engins/', 'Impossible de charger le parc.'
  )
  const [kpis, setKpis]   = useState(null)
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [modal, setModal] = useState(false)

  useEffect(() => {
    api.get('/parc/engins/kpis/').then(({ data }) => setKpis(data)).catch(() => {})
  }, [engins.length])

  const filtres = engins.filter((e) => {
    const matchS = !search || e.nom.toLowerCase().includes(search.toLowerCase())
                 || e.code.toLowerCase().includes(search.toLowerCase())
                 || (e.marque ?? '').toLowerCase().includes(search.toLowerCase())
                 || (e.immatriculation ?? '').toLowerCase().includes(search.toLowerCase())
    const matchF = filtreStatut === 'tous' || e.statut === filtreStatut
    return matchS && matchF
  })

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Parc machines</div>
          <div className="sec-sub">
            Engins, maintenance préventive et contrats de location.
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouvel engin
        </button>
      </div>

      {kpis && (
        <div className="kpi-grid">
          <Kpi label="Total parc" value={kpis.total} />
          <Kpi label="Disponibles" value={kpis.disponibles} tone="green" />
          <Kpi label="En chantier / location" value={kpis.en_chantier + kpis.en_location} tone="gold" />
          <Kpi label="Alertes révision" value={kpis.en_alerte}
            tone={kpis.en_alerte > 0 ? 'red' : 'green'} />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="th-title">Engins · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <div className="flex items-center gap-2">
            <select className="input input-sm w-[150px]" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="tous">Tous statuts</option>
              <option value="disponible">Disponible</option>
              <option value="en_chantier">En chantier</option>
              <option value="en_location">En location</option>
              <option value="en_maintenance">En maintenance</option>
              <option value="hors_service">Hors service</option>
            </select>
            <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher nom, code, marque…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Code', 'Engin', 'Marque / Modèle', 'Statut', 'Compteur', 'Usure', 'Site', 'Tarif/j'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun engin</td></tr>
              ) : filtres.map((e) => (
                <tr key={e.id}>
                  <td className="mono-cell text-forest-700">
                    <Link to={`/parc/${e.id}`} className="hover:underline">{e.code}</Link>
                  </td>
                  <td className="font-display font-medium text-ink">
                    <Link to={`/parc/${e.id}`} className="hover:text-forest-700 transition-colors">
                      {e.nom}
                    </Link>
                    <span className="ml-2 text-[11px] text-sand-500">{e.type_engin_display}</span>
                  </td>
                  <td className="text-sand-600">{e.marque} {e.modele}</td>
                  <td>
                    <Badge tone={STATUT_TONE[e.statut] ?? 'gray'}>{e.statut_display}</Badge>
                    {e.en_alerte_maintenance && <span className="ml-1 text-red-500" title="Révision proche">⚠</span>}
                  </td>
                  <td className="num">{Number(e.heures_compteur).toLocaleString('fr-FR')} <span className="text-[10px] text-sand-500">h</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-sand-200 overflow-hidden">
                        <div className={`h-full ${
                          e.usure_pct >= 80 ? 'bg-red-500' : e.usure_pct >= 50 ? 'bg-gold-500' : 'bg-forest-600'
                        }`} style={{ width: `${e.usure_pct}%` }} />
                      </div>
                      <span className="text-[11px] mono-cell">{e.usure_pct}%</span>
                    </div>
                  </td>
                  <td className="text-sand-600">{e.site_nom || '—'}</td>
                  <td className="num">
                    {Number(e.tarif_location_jour).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-sand-500">F</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvel engin" sousTitre="Ajoute une machine au parc." onClose={() => setModal(false)}>
          <EnginForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
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
