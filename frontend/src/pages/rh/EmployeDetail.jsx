import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import CongeForm from '../../components/forms/CongeForm'
import CompetenceEmployeForm from '../../components/forms/CompetenceEmployeForm'
import CertificationForm from '../../components/forms/CertificationForm'
import HistoriqueContratForm from '../../components/forms/HistoriqueContratForm'
import { fmt } from '../../utils/format'

const TYPE_TONE   = { cdi: 'green', journalier: 'blue', moo: 'gold', stagiaire: 'gray' }
const STATUT_TONE = { actif: 'green', inactif: 'gray', conge: 'gold' }
const CERT_TONE   = { valide: 'green', bientot_expiree: 'gold', expiree: 'red', sans_expiration: 'gray' }
const CERT_LABEL  = { valide: 'Valide', bientot_expiree: 'Expire bientôt', expiree: 'Expirée', sans_expiration: 'Permanente' }
const CONGE_TONE  = { demande: 'gold', approuve: 'green', refuse: 'red', annule: 'gray' }

export default function EmployeDetail() {
  const { id } = useParams()
  const [employe, setEmploye] = useState(null)
  const [presences, setPresences] = useState([])
  const [conges, setConges] = useState([])
  const [competences, setCompetences] = useState([])
  const [certifications, setCertifications] = useState([])
  const [contrats, setContrats] = useState([])
  const [loading, setLoading] = useState(true)
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7))
  const [tab, setTab] = useState('presences')
  const [modal, setModal] = useState(null)  // 'conge' | 'comp' | 'cert' | 'contrat'

  const chargerAnnexes = useCallback(() => {
    Promise.all([
      api.get(`/rh/conges/?employe=${id}`),
      api.get(`/rh/competences-employes/?employe=${id}`),
      api.get(`/rh/certifications/?employe=${id}`),
      api.get(`/rh/historique-contrats/?employe=${id}`),
    ]).then(([{ data: c }, { data: cmp }, { data: crt }, { data: h }]) => {
      setConges(c.results ?? c)
      setCompetences(cmp.results ?? cmp)
      setCertifications(crt.results ?? crt)
      setContrats(h.results ?? h)
    })
  }, [id])

  useEffect(() => {
    Promise.all([
      api.get(`/rh/employes/${id}/`),
      api.get(`/rh/presences/?employe=${id}&date__startswith=${mois}`),
    ])
      .then(([{ data: emp }, { data: pres }]) => {
        setEmploye(emp)
        setPresences(pres.results ?? pres)
      })
      .finally(() => setLoading(false))
  }, [id, mois])

  useEffect(() => { chargerAnnexes() }, [chargerAnnexes])

  if (loading) return <div className="p-12 text-center text-sand-500 font-body">Chargement…</div>
  if (!employe) return <div className="p-12 text-center text-red-500 font-body">Employé introuvable.</div>

  const joursPresents = presences.filter((p) => p.present).length
  const totalMois     = presences.reduce((s, p) => s + Number(p.montant_du), 0)
  const certsAlerte   = certifications.filter((c) => c.statut === 'bientot_expiree' || c.statut === 'expiree').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500">
        <Link to="/rh" className="hover:text-forest-700 transition-colors">RH & Paie</Link>
        <span className="text-sand-300">/</span>
        <span className="text-ink">{employe.nom_complet}</span>
      </div>

      {/* Header */}
      <div className="card p-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-forest-50 border border-forest-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="font-display font-bold text-forest-700 text-xl">
              {employe.nom?.[0]}{employe.prenom?.[0]}
            </span>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sand-500 mb-1">{employe.code}</p>
            <h1 className="font-display font-bold text-ink text-xl">{employe.nom_complet}</h1>
            <p className="font-body text-sand-600 text-sm mt-0.5">{employe.poste || 'Poste non défini'}</p>
            <div className="flex gap-2 mt-2.5 flex-wrap">
              <Badge tone={TYPE_TONE[employe.type_contrat] ?? 'gray'}>{employe.type_contrat?.toUpperCase()}</Badge>
              <Badge tone={STATUT_TONE[employe.statut] ?? 'gray'}>{employe.statut}</Badge>
              {certsAlerte > 0 && <Badge tone="red">⚠ {certsAlerte} certif{certsAlerte > 1 ? 's' : ''} à renouveler</Badge>}
            </div>
          </div>
        </div>
        <Link to="/rh" className="btn-secondary text-sm">← Retour</Link>
      </div>

      {/* KPI mois */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="kpi-label mb-3">Informations</p>
          <dl className="space-y-2.5 text-[13px] font-body">
            <Row label="Téléphone"      value={employe.telephone || '—'} />
            <Row label="Date d'entrée"  value={employe.date_entree || '—'} />
            {employe.taux_journalier && (
              <Row label="Taux journalier" value={<strong className="font-semibold text-ink">{fmt(employe.taux_journalier)} F</strong>} />
            )}
            {employe.salaire_mensuel && (
              <Row label="Salaire mensuel" value={<strong className="font-semibold text-ink">{fmt(employe.salaire_mensuel)} F</strong>} />
            )}
          </dl>
        </div>
        <div className="kpi">
          <p className="kpi-label">Présences — {mois}</p>
          <p className="kpi-value text-forest-700">
            {joursPresents}<span className="kpi-unit">jour{joursPresents !== 1 ? 's' : ''}</span>
          </p>
          <p className="kpi-sub text-sand-500">{joursPresents > 0 ? 'Enregistrés ce mois' : 'Aucune présence'}</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Total à payer</p>
          <p className="kpi-value text-gold-700">{fmt(totalMois)}<span className="kpi-unit">FCFA</span></p>
          <p className="kpi-sub text-sand-500">Pour le mois sélectionné</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="card overflow-hidden">
        <div className="tabs">
          {[
            { v: 'presences',      label: 'Présences' },
            { v: 'conges',         label: `Congés (${conges.length})` },
            { v: 'competences',    label: `Compétences (${competences.length})` },
            { v: 'certifications', label: `Certifications (${certifications.length})` },
            { v: 'contrats',       label: `Contrats (${contrats.length})` },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setTab(v)} className={`tab ${tab === v ? 'active' : ''}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'presences' && (
          <div>
            <div className="th-row">
              <div className="th-title">Présences mensuelles</div>
              <input type="month" className="input input-sm w-44" value={mois} onChange={(e) => setMois(e.target.value)} />
            </div>
            <table className="table-eko">
              <thead><tr>{['Date', 'Présence', 'Heures', 'Montant', 'Site', 'Notes'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {presences.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucune présence enregistrée</td></tr>
                ) : presences.map((p) => (
                  <tr key={p.id} className={!p.present ? 'opacity-60' : ''}>
                    <td className="mono-cell">{p.date}</td>
                    <td><Badge tone={p.present ? 'green' : 'red'}>{p.present ? 'Présent' : 'Absent'}</Badge></td>
                    <td className="text-sand-600">{p.heures_travaillees}h</td>
                    <td className="num">{p.present ? `${fmt(p.montant_du)} F` : '—'}</td>
                    <td className="text-sand-600">{p.site_nom || '—'}</td>
                    <td className="text-sand-500 text-[12px]">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'conges' && (
          <div>
            <div className="th-row">
              <div className="th-title">Demandes de congé</div>
              <button className="btn-primary text-xs" onClick={() => setModal('conge')}>+ Demander</button>
            </div>
            <table className="table-eko">
              <thead><tr>{['Type', 'Période', 'Jours', 'Motif', 'Statut'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {conges.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sand-500 font-body">Aucun congé</td></tr>
                ) : conges.map((c) => (
                  <tr key={c.id}>
                    <td className="font-display text-ink">{c.type_conge_display}</td>
                    <td className="mono-cell text-sand-700 text-[12px]">{c.date_debut} → {c.date_fin}</td>
                    <td className="num">{c.nb_jours} j</td>
                    <td className="text-sand-600 text-[12px]">{c.motif || '—'}</td>
                    <td><Badge tone={CONGE_TONE[c.statut] ?? 'gray'}>{c.statut_display}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'competences' && (
          <div>
            <div className="th-row">
              <div className="th-title">Compétences</div>
              <button className="btn-primary text-xs" onClick={() => setModal('comp')}>+ Ajouter</button>
            </div>
            <table className="table-eko">
              <thead><tr>{['Code', 'Compétence', 'Catégorie', 'Niveau', 'Acquise le'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {competences.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sand-500 font-body">Aucune compétence enregistrée</td></tr>
                ) : competences.map((c) => (
                  <tr key={c.id}>
                    <td className="mono-cell text-forest-700">{c.competence_code}</td>
                    <td className="font-display text-ink">{c.competence_nom}</td>
                    <td className="text-sand-600 text-[12px]">{c.competence_categorie}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: c.niveau_max }).map((_, i) => (
                          <span key={i} className={`w-3 h-3 rounded-sm ${i < c.niveau ? 'bg-forest-600' : 'bg-sand-200'}`} />
                        ))}
                        <span className="text-[11px] text-sand-500 ml-1">{c.niveau}/{c.niveau_max}</span>
                      </div>
                    </td>
                    <td className="mono-cell text-sand-700">{c.date_acquisition || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'certifications' && (
          <div>
            <div className="th-row">
              <div className="th-title">Certifications & habilitations</div>
              <button className="btn-primary text-xs" onClick={() => setModal('cert')}>+ Ajouter</button>
            </div>
            <table className="table-eko">
              <thead><tr>{['Libellé', 'Organisme', 'N°', 'Obtention', 'Expiration', 'Statut'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {certifications.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sand-500 font-body">Aucune certification</td></tr>
                ) : certifications.map((c) => (
                  <tr key={c.id}>
                    <td className="font-display font-medium text-ink">{c.libelle}</td>
                    <td className="text-sand-600">{c.organisme || '—'}</td>
                    <td className="mono-cell text-sand-500">{c.numero || '—'}</td>
                    <td className="mono-cell text-sand-700">{c.date_obtention}</td>
                    <td className="mono-cell text-sand-700">{c.date_expiration || '—'}</td>
                    <td><Badge tone={CERT_TONE[c.statut] ?? 'gray'}>{CERT_LABEL[c.statut] ?? c.statut}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'contrats' && (
          <div>
            <div className="th-row">
              <div className="th-title">Historique contractuel</div>
              <button className="btn-primary text-xs" onClick={() => setModal('contrat')}>+ Ajouter</button>
            </div>
            <table className="table-eko">
              <thead><tr>{['Type', 'Poste', 'Période', 'Rémunération', 'Statut', 'Motif fin'].map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {contrats.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sand-500 font-body">Aucun contrat historisé</td></tr>
                ) : contrats.map((c) => (
                  <tr key={c.id}>
                    <td><Badge tone={TYPE_TONE[c.type_contrat] ?? 'gray'}>{c.type_contrat_display}</Badge></td>
                    <td className="font-display text-ink">{c.poste || '—'}</td>
                    <td className="mono-cell text-sand-700 text-[12px]">
                      {c.date_debut} → {c.date_fin || <span className="text-forest-700">en cours</span>}
                    </td>
                    <td className="num">
                      {c.salaire_mensuel
                        ? <>{fmt(c.salaire_mensuel)} <span className="text-[10px] text-sand-500">F/mois</span></>
                        : c.taux_journalier
                          ? <>{fmt(c.taux_journalier)} <span className="text-[10px] text-sand-500">F/j</span></>
                          : '—'}
                    </td>
                    <td>{c.est_en_cours ? <Badge tone="green">En cours</Badge> : <Badge tone="gray">Clos</Badge>}</td>
                    <td className="text-sand-500 text-[12px]">{c.motif_fin || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'conge' && (
        <Modal titre="Nouvelle demande de congé" sousTitre={employe.nom_complet} onClose={() => setModal(null)}>
          <CongeForm employeId={employe.id} onClose={() => setModal(null)} onSuccess={() => { setModal(null); chargerAnnexes() }} />
        </Modal>
      )}
      {modal === 'comp' && (
        <Modal titre="Ajouter une compétence" sousTitre={employe.nom_complet} onClose={() => setModal(null)}>
          <CompetenceEmployeForm employeId={employe.id} onClose={() => setModal(null)} onSuccess={() => { setModal(null); chargerAnnexes() }} />
        </Modal>
      )}
      {modal === 'cert' && (
        <Modal titre="Ajouter une certification" sousTitre={employe.nom_complet} onClose={() => setModal(null)}>
          <CertificationForm employeId={employe.id} onClose={() => setModal(null)} onSuccess={() => { setModal(null); chargerAnnexes() }} />
        </Modal>
      )}
      {modal === 'contrat' && (
        <Modal titre="Ajouter une entrée contractuelle" sousTitre={employe.nom_complet} onClose={() => setModal(null)}>
          <HistoriqueContratForm employeId={employe.id} onClose={() => setModal(null)} onSuccess={() => { setModal(null); chargerAnnexes() }} />
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-sand-500">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  )
}
