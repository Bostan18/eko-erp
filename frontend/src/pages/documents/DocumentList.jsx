import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge, { StatusBadge } from '../../components/ui/Badge'
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
    <div className="space-y-6">
      {/* ─── Head ──────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">Conformité / Gestion documentaire</p>
          <h1 className="page-title">Documents</h1>
          <p className="page-sub mt-1.5">
            Permis · Assurances · Visites médicales · Certifications · Alertes d'expiration
          </p>
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

      {/* ─── KPI ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi">
          <p className="kpi-label">Documents enregistrés</p>
          <p className="kpi-value">{documents.length}</p>
          <p className="kpi-sub text-sand-500">Toutes entités confondues</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Valides</p>
          <p className="kpi-value text-forest-700">{nbValid}</p>
          <p className="kpi-sub text-sand-500">Aucune action requise</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Expire bientôt</p>
          <p className={'kpi-value ' + (nbExpiring > 0 ? 'text-gold-700' : 'text-sand-400')}>{nbExpiring}</p>
          <p className="kpi-sub text-sand-500">À renouveler &lt; 30 j</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Expirés</p>
          <p className={'kpi-value ' + (nbExpired > 0 ? 'text-red-600' : 'text-sand-400')}>{nbExpired}</p>
          <p className="kpi-sub text-sand-500">{nbExpired > 0 ? 'Action immédiate' : 'Aucun expiré'}</p>
        </div>
      </div>

      {/* ─── Filtres + recherche ───────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {[
            { key: 'tous',     label: 'Tous',     count: documents.length },
            { key: 'valid',    label: 'Valides',  count: nbValid },
            { key: 'expiring', label: 'Expire bientôt', count: nbExpiring, gold: true },
            { key: 'expired',  label: 'Expirés',  count: nbExpired, danger: true },
          ].map(({ key, label, count, gold, danger }) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={
                'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors flex items-center gap-1.5 ' +
                (filtre === key
                  ? danger
                    ? 'bg-red-500 text-white'
                    : gold
                      ? 'bg-gold-400 text-forest-950'
                      : 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
              }
            >
              {label}
              <span className={
                'font-mono text-[10px] px-1.5 py-0.5 rounded-full ' +
                (filtre === key
                  ? danger ? 'bg-red-700 text-white'
                  : gold ? 'bg-forest-950 text-gold-100'
                  : 'bg-forest-800 text-forest-100'
                  : 'bg-sand-100 text-sand-500')
              }>{count}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input input-sm max-w-xs ml-auto"
          placeholder="Rechercher titre, code ou entité…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ─── Table ──────────────────────────────────────── */}
      <div className="card overflow-hidden">
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
