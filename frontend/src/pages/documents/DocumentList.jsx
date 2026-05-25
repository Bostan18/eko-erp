import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge, { StatusBadge } from '../../components/ui/Badge'
import KpiCard from '../../components/ui/KpiCard'
import { IconFolder, IconCheck, IconClock, IconX } from '../../components/ui/Icons'
import DocumentForm from '../../components/forms/DocumentForm'
import { useFetchList } from '../../hooks/useFetchList'
import { fmt } from '../../utils/format'

const TYPE_LABEL = {
  permis:        'Permis',
  medical:       'Visite médicale',
  assurance:     'Assurance',
  certification: 'Certification',
  env_permit:    'Autorisation env.',
  cnps:          'CNPS',
  contrat:       'Contrat',
  autre:         'Autre',
}

const TYPE_TONE = {
  permis: 'blue', medical: 'green', assurance: 'gold', certification: 'green',
  env_permit: 'green', cnps: 'blue', contrat: 'gray', autre: 'gray',
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const today = new Date()
  return Math.ceil((d - today) / 86400000)
}

/** Statut calculé client-side si le backend ne le donne pas. */
function computeStatus(doc) {
  if (doc.statut) return doc.statut
  const days = daysUntil(doc.date_expiration)
  if (days === null) return 'valid'
  if (days < 0)  return 'expired'
  if (days < 30) return 'expiring'
  return 'valid'
}

export default function DocumentList() {
  // L'endpoint backend recommandé : /core/documents/ (cf. README ci-dessous)
  const { items: documents, loading, error, charger } = useFetchList(
    '/core/documents/', 'Impossible de charger les documents.'
  )
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [modal, setModal]   = useState(false)

  const docsAvecStatut = documents.map((d) => ({ ...d, _statut: computeStatus(d) }))

  const nbValid    = docsAvecStatut.filter((d) => d._statut === 'valid').length
  const nbExpiring = docsAvecStatut.filter((d) => d._statut === 'expiring').length
  const nbExpired  = docsAvecStatut.filter((d) => d._statut === 'expired').length

  const filtered = docsAvecStatut
    .filter((d) => filtre === 'tous' ? true : d._statut === filtre)
    .filter((d) =>
      !search ? true :
      (d.titre || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.id_doc || d.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.entite_id || '').toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Documents</div>
          <div className="sec-sub">
            Permis · Assurances · Visites médicales · Certifications · Alertes d'expiration
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Ajouter document
        </button>
      </div>

      {/* ─── Alerte globale ────────────────────────────── */}
      {(nbExpired > 0 || nbExpiring > 0) && (
        <div className={nbExpired > 0 ? 'alert-red' : 'alert-gold'}>
          <span className={`w-1.5 h-1.5 rounded-full ${nbExpired > 0 ? 'bg-red-500' : 'bg-gold-500'}`} />
          <strong className="font-display font-semibold">
            {nbExpired > 0 && `${nbExpired} document${nbExpired > 1 ? 's' : ''} expiré${nbExpired > 1 ? 's' : ''}`}
            {nbExpired > 0 && nbExpiring > 0 && ' · '}
            {nbExpiring > 0 && `${nbExpiring} expire${nbExpiring > 1 ? 'nt' : ''} bientôt`}
          </strong>
          <span className={nbExpired > 0 ? 'text-red-600' : 'text-gold-600'}>
            — vérifier les actions requises
          </span>
          <button
            onClick={() => setFiltre(nbExpired > 0 ? 'expired' : 'expiring')}
            className={'ml-auto font-display font-medium hover:underline ' + (nbExpired > 0 ? 'text-red-700' : 'text-gold-700')}
          >Filtrer →</button>
        </div>
      )}

      {/* ─── KPI grid ───────────────────────────────────── */}
      <div className="kpi-grid">
        <KpiCard
          icon={<IconFolder />} tone="sand"
          label="Documents enregistrés"
          value={documents.length}
          sub="Toutes entités confondues"
        />
        <KpiCard
          icon={<IconCheck />} tone="forest"
          label="Valides"
          value={nbValid}
          sub="Aucune action requise"
        />
        <KpiCard
          icon={<IconClock />} tone={nbExpiring > 0 ? 'gold' : 'sand'}
          label="Expire bientôt"
          value={nbExpiring}
          sub={<>À renouveler &lt; 30 j</>}
        />
        <KpiCard
          icon={<IconX />} tone="red"
          label="Expirés"
          value={nbExpired}
          sub={nbExpired > 0 ? 'Action immédiate' : 'Aucun expiré'}
        />
      </div>

      {/* ─── Carte : th-row (filtre + recherche) + table ── */}
      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="th-title">
            Tous les documents ·{' '}
            <span className="text-sand-500 font-normal">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="input input-sm w-auto"
              value={filtre}
              onChange={(e) => setFiltre(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="valid">Valides</option>
              <option value="expiring">Expire bientôt</option>
              <option value="expired">Expirés</option>
            </select>
            <input
              type="text"
              className="input input-sm w-[210px]"
              placeholder="Rechercher titre, code ou entité…"
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
              <tr>{['Code', 'Titre', 'Type', 'Entité liée', 'Émission', 'Expiration', 'Statut', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun document</td></tr>
              ) : filtered.map((d) => {
                const days = daysUntil(d.date_expiration)
                const daysLabel =
                  days === null ? null :
                  days < 0      ? `Expiré il y a ${Math.abs(days)} j` :
                  days < 30     ? `Dans ${days} j` : null
                return (
                  <tr key={d.id} className={d._statut === 'expired' ? 'bg-red-50/40 hover:bg-red-50' : ''}>
                    <td className="mono-cell text-forest-700">{d.id_doc || d.code || `DOC-${d.id}`}</td>
                    <td className="font-display font-medium text-ink">{d.titre}</td>
                    <td><Badge tone={TYPE_TONE[d.type_doc] ?? 'gray'}>{TYPE_LABEL[d.type_doc] ?? d.type_doc}</Badge></td>
                    <td>
                      <p className="text-[12.5px] text-ink">{d.entite_label || d.entite}</p>
                      {d.entite_id && <p className="mono-cell text-sand-500">{d.entite_id}</p>}
                    </td>
                    <td className="mono-cell">{d.date_emission || '—'}</td>
                    <td>
                      <p className={
                        'mono-cell ' +
                        (d._statut === 'expired' ? 'text-red-700 font-semibold' :
                         d._statut === 'expiring' ? 'text-gold-700 font-semibold' :
                         'text-sand-700')
                      }>{d.date_expiration || '—'}</p>
                      {daysLabel && (
                        <p className={'text-[10px] mt-0.5 ' + (d._statut === 'expired' ? 'text-red-500' : 'text-gold-600')}>
                          {daysLabel}
                        </p>
                      )}
                    </td>
                    <td><StatusBadge status={d._statut} /></td>
                    <td>
                      {d.fichier_url ? (
                        <a href={d.fichier_url} target="_blank" rel="noreferrer"
                           className="btn-secondary btn-sm">📎 Voir</a>
                      ) : (
                        <span className="text-[11px] text-sand-400">Aucun fichier</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          titre="Ajouter un document"
          sousTitre="Permis, médicale, assurance, certification, autorisation…"
          onClose={() => setModal(false)}
        >
          <DocumentForm
            onClose={() => setModal(false)}
            onSuccess={() => { setModal(false); charger() }}
          />
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
