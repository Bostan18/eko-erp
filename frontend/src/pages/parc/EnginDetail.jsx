import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import EnginForm from '../../components/forms/EnginForm'
import MaintenanceForm from '../../components/forms/MaintenanceForm'
import ContratLocationForm from '../../components/forms/ContratLocationForm'

const STATUT_TONE = {
  disponible: 'green', en_chantier: 'gold', en_location: 'blue',
  en_maintenance: 'gold', hors_service: 'red',
}
const MAINT_TYPE_TONE = { preventive: 'green', corrective: 'red', revision: 'blue' }
const LOC_STATUT_TONE = { planifie: 'gray', en_cours: 'blue', termine: 'green', annule: 'red' }

export default function EnginDetail() {
  const { id } = useParams()
  const [engin, setEngin] = useState(null)
  const [maintenances, setMaintenances] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('infos')
  const [modal, setModal] = useState(null)  // 'edit' | 'maint' | 'loc'

  const charger = useCallback(() => {
    Promise.all([
      api.get(`/parc/engins/${id}/`),
      api.get(`/parc/maintenances/?engin=${id}`),
      api.get(`/parc/locations/?engin=${id}`),
    ])
      .then(([{ data: e }, { data: m }, { data: l }]) => {
        setEngin(e)
        setMaintenances(m.results ?? m)
        setLocations(l.results ?? l)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { charger() }, [charger])

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (!engin) return <div className="p-12 text-center text-red-500 font-body">Engin introuvable.</div>

  const totalCoutMaint = maintenances.reduce((s, m) => s + Number(m.cout || 0), 0)
  const caLocation     = locations.filter((l) => l.statut !== 'annule')
                                  .reduce((s, l) => s + Number(l.montant_facturable || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/parc" className="hover:text-forest-700 transition-colors">Parc machines</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">{engin.code}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono text-[11px] text-forest-700 font-medium">{engin.code}</span>
            <Badge tone={STATUT_TONE[engin.statut] ?? 'gray'}>{engin.statut_display}</Badge>
            <Badge tone="gray">{engin.type_engin_display}</Badge>
            {engin.en_alerte_maintenance && <Badge tone="red">⚠ Révision proche</Badge>}
          </div>
          <h1 className="font-display font-bold text-ink text-xl">{engin.nom}</h1>
          {(engin.marque || engin.modele) && (
            <p className="font-body text-sand-600 text-[13px] mt-1">{engin.marque} {engin.modele}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="btn-secondary" onClick={() => setModal('edit')}>Modifier</button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setModal('maint')}>+ Maintenance</button>
            <button className="btn-primary" onClick={() => setModal('loc')}>+ Location</button>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid">
        <Kpi label="Compteur" value={`${Number(engin.heures_compteur).toLocaleString('fr-FR')} h`} />
        <div className="kpi">
          <p className="kpi-label">Usure</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 rounded-full bg-sand-200 overflow-hidden">
              <div className={`h-full ${
                engin.usure_pct >= 80 ? 'bg-red-500' : engin.usure_pct >= 50 ? 'bg-gold-500' : 'bg-forest-600'
              }`} style={{ width: `${engin.usure_pct}%` }} />
            </div>
            <span className="font-display font-semibold text-ink">{engin.usure_pct}%</span>
          </div>
        </div>
        <Kpi label="Avant prochaine révision" value={`${engin.heures_avant_revision} h`}
          tone={engin.en_alerte_maintenance ? 'red' : 'green'} />
        <Kpi label="Tarif location" value={`${Number(engin.tarif_location_jour).toLocaleString('fr-FR')} F/j`} />
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="tabs">
          {[
            { v: 'infos',        label: 'Infos' },
            { v: 'maintenance',  label: `Maintenance (${maintenances.length})` },
            { v: 'locations',    label: `Locations (${locations.length})` },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setTab(v)} className={`tab ${tab === v ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'infos' && (
          <div className="p-6 space-y-4">
            <Info2 label="Immatriculation" value={engin.immatriculation || '—'} mono
                   label2="N° série" value2={engin.numero_serie || '—'} mono2 />
            <Info2 label="Année mise en service" value={engin.annee_mise_service || '—'}
                   label2="Prix d'achat" value2={`${Number(engin.prix_achat).toLocaleString('fr-FR')} F`} />
            <Info2 label="Site actuel" value={engin.site_nom || '—'}
                   label2="Durée de vie estimée" value2={`${Number(engin.duree_vie_estimee_h).toLocaleString('fr-FR')} h`} />
            {engin.notes && (
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-sand-500 mb-1">Notes</p>
                <p className="font-body text-ink text-sm whitespace-pre-line">{engin.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'maintenance' && (
          <div>
            <div className="th-row">
              <div className="th-title">
                Interventions · <span className="text-sand-500 font-normal">{maintenances.length}</span>
                <span className="ml-3 text-sand-500 font-normal">
                  Coût total : <span className="font-display font-semibold text-forest-700">
                    {totalCoutMaint.toLocaleString('fr-FR')} F
                  </span>
                </span>
              </div>
            </div>
            <table className="table-eko">
              <thead><tr>{['Date', 'Type', 'Description', 'Compteur', 'Prochain seuil', 'Coût', 'Par'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {maintenances.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sand-500 font-body">Aucune intervention</td></tr>
                ) : maintenances.map((m) => (
                  <tr key={m.id}>
                    <td className="mono-cell text-sand-700">{m.date_intervention}</td>
                    <td><Badge tone={MAINT_TYPE_TONE[m.type_maintenance] ?? 'gray'}>{m.type_maintenance_display}</Badge></td>
                    <td className="font-display text-ink">{m.description}</td>
                    <td className="num">{Number(m.heures_compteur_intervention).toLocaleString('fr-FR')} h</td>
                    <td className="num text-sand-500 text-[12px]">
                      {m.prochaine_revision_heures ? `${Number(m.prochaine_revision_heures).toLocaleString('fr-FR')} h` : '—'}
                    </td>
                    <td className="num">{Number(m.cout).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                    <td className="text-sand-600">{m.effectue_par || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'locations' && (
          <div>
            <div className="th-row">
              <div className="th-title">
                Contrats · <span className="text-sand-500 font-normal">{locations.length}</span>
                <span className="ml-3 text-sand-500 font-normal">
                  CA généré : <span className="font-display font-semibold text-forest-700">
                    {caLocation.toLocaleString('fr-FR')} F
                  </span>
                </span>
              </div>
            </div>
            <table className="table-eko">
              <thead><tr>{['Numéro', 'Type', 'Cible', 'Période', 'Jours', 'Tarif/j', 'Montant', 'Statut'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {locations.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-sand-500 font-body">Aucun contrat</td></tr>
                ) : locations.map((l) => (
                  <tr key={l.id}>
                    <td className="mono-cell text-forest-700">{l.numero}</td>
                    <td>{l.est_externe ? <Badge tone="blue">Externe</Badge> : <Badge tone="gray">Interne</Badge>}</td>
                    <td className="font-display text-ink">{l.client_nom || l.projet_nom || '—'}</td>
                    <td className="mono-cell text-sand-700 text-[12px]">
                      {l.date_debut} → {l.date_fin_reelle || l.date_fin_prevue}
                    </td>
                    <td className="num">{l.nb_jours}</td>
                    <td className="num">{Number(l.tarif_jour).toLocaleString('fr-FR')}</td>
                    <td className="num font-display font-semibold text-ink">{Number(l.montant_facturable).toLocaleString('fr-FR')} F</td>
                    <td><Badge tone={LOC_STATUT_TONE[l.statut] ?? 'gray'}>{l.statut_display}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'edit' && (
        <Modal titre="Modifier l'engin" onClose={() => setModal(null)}>
          <EnginForm initial={engin} onClose={() => setModal(null)} onSuccess={() => { setModal(null); charger() }} />
        </Modal>
      )}
      {modal === 'maint' && (
        <Modal titre="Nouvelle intervention" sousTitre={engin.code} onClose={() => setModal(null)}>
          <MaintenanceForm engin={engin} onClose={() => setModal(null)} onSuccess={() => { setModal(null); charger() }} />
        </Modal>
      )}
      {modal === 'loc' && (
        <Modal titre="Nouveau contrat de location" sousTitre={engin.code} onClose={() => setModal(null)}>
          <ContratLocationForm engin={engin} onClose={() => setModal(null)} onSuccess={() => { setModal(null); charger() }} />
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

function Info2({ label, value, mono, label2, value2, mono2 }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-sand-500 mb-1">{label}</p>
        <p className={`font-body text-ink text-sm ${mono ? 'mono-cell' : ''}`}>{value}</p>
      </div>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-wider text-sand-500 mb-1">{label2}</p>
        <p className={`font-body text-ink text-sm ${mono2 ? 'mono-cell' : ''}`}>{value2}</p>
      </div>
    </div>
  )
}
