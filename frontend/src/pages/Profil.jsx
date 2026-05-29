import useAuthStore from '../store/authStore'
import KpiCard from '../components/ui/KpiCard'
import EmptyState, { IconEmptyClipboard } from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import { IconCheck, IconClock, IconBriefcase, IconUsers } from '../components/ui/Icons'

/**
 * Page Profil employé (lecture seule pour l'instant — endpoints RH à venir).
 * Affiche : identité, soldes congés, demandes en cours, préférences.
 */

const MOCK = {
  matricule:     'EMP-001',
  poste:         'Administrateur',
  departement:   'Direction',
  date_embauche: '2024-01-15',
  type_contrat:  'CDI',
  email_pro:     'admin@eko-sarl.ci',
  telephone:     '+225 07 00 00 00 00',
  adresse:       'Abidjan, Côte d\'Ivoire',
  conges: { acquis: 24, pris: 6, restants: 18 },
  demandes: [],
}

export default function Profil() {
  const { user } = useAuthStore()
  const initiale = user?.username?.[0]?.toUpperCase() ?? 'U'

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Mon profil</div>
          <div className="sec-sub">Informations personnelles, congés et interactions RH</div>
        </div>
      </div>

      {/* ─── Identité ───────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-sand-200">
          <div className="w-14 h-14 bg-forest-600 rounded-full flex items-center justify-center shrink-0 ring-2 ring-forest-100">
            <span className="font-display text-white text-xl font-bold">{initiale}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-ink text-[18px] leading-tight">
              {user?.username ?? 'Utilisateur'}
            </div>
            <div className="text-sand-500 text-[12.5px] mt-0.5">
              {MOCK.poste} · {MOCK.departement}
            </div>
          </div>
          <Badge tone="green" dot>Actif</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Matricule"           value={MOCK.matricule}     readonly />
          <Field label="Type de contrat"     value={MOCK.type_contrat}  readonly />
          <Field label="Date d'embauche"     value={MOCK.date_embauche} readonly />
          <Field label="Département"         value={MOCK.departement}   readonly />
          <Field label="Email professionnel" value={MOCK.email_pro}     readonly />
          <Field label="Téléphone"           value={MOCK.telephone}     editable />
          <Field label="Adresse"             value={MOCK.adresse}       editable className="sm:col-span-2" />
        </div>

        <div className="mt-5 pt-4 border-t border-sand-200 flex items-center justify-between">
          <p className="text-[11.5px] text-sand-500">
            Les champs en lecture seule sont gérés par les RH. Pour modification, contactez votre responsable.
          </p>
          <button className="btn-secondary btn-sm" disabled title="Bientôt disponible">
            Modifier mes infos
          </button>
        </div>
      </div>

      {/* ─── Congés & soldes ────────────────────────────── */}
      <div>
        <div className="sec-head">
          <div>
            <div className="sec-title text-[15px]">Congés & soldes</div>
            <div className="sec-sub">Solde au {new Date().toLocaleDateString('fr-FR')}</div>
          </div>
          <button className="btn-primary btn-sm" disabled title="Bientôt disponible">
            Nouvelle demande
          </button>
        </div>
        <div className="kpi-grid mt-3">
          <KpiCard
            icon={<IconCheck />} tone="forest"
            label="Jours acquis"
            value={MOCK.conges.acquis}
            sub="Cumul exercice"
          />
          <KpiCard
            icon={<IconBriefcase />} tone="gold"
            label="Jours pris"
            value={MOCK.conges.pris}
            sub="Depuis le 1er janvier"
          />
          <KpiCard
            icon={<IconClock />} tone="blue"
            label="Jours restants"
            value={MOCK.conges.restants}
            sub="Solde disponible"
          />
        </div>
      </div>

      {/* ─── Demandes RH ────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="th-row">
          <div className="th-title">
            Mes demandes RH ·{' '}
            <span className="text-sand-500 font-normal">{MOCK.demandes.length}</span>
          </div>
        </div>
        {MOCK.demandes.length === 0 ? (
          <EmptyState
            icon={<IconEmptyClipboard />}
            titre="Aucune demande en cours"
            sub="Vos demandes de congés, documents ou attestations apparaîtront ici."
          />
        ) : null}
      </div>

      {/* ─── Préférences ────────────────────────────────── */}
      <div className="card p-5">
        <div className="sec-title text-[15px] mb-1">Préférences</div>
        <div className="sec-sub mb-4">Personnalisation de l'interface</div>
        <Pref label="Langue de l'interface"     value="Français" />
        <Pref label="Notifications par email"   value="Activées" />
        <Pref label="Récap hebdomadaire"        value="Lundi 8h" />
      </div>
    </div>
  )
}

/* ─── Sous-composants ─────────────────────────────── */
function Field({ label, value, readonly, editable, className = '' }) {
  return (
    <div className={className}>
      <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-sand-500 mb-1 flex items-center gap-2">
        <span>{label}</span>
        {editable && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-forest-50 text-forest-700 font-display font-medium normal-case tracking-normal">
            Modifiable
          </span>
        )}
        {readonly && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sand-100 text-sand-600 font-display font-medium normal-case tracking-normal">
            RH
          </span>
        )}
      </div>
      <div className="text-ink font-display font-medium text-[13.5px]">{value}</div>
    </div>
  )
}

function Pref({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-sand-200 last:border-0">
      <span className="text-[13px] text-ink font-display">{label}</span>
      <span className="text-[12.5px] text-sand-600 font-mono">{value}</span>
    </div>
  )
}
