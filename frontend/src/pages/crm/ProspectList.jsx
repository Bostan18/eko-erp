import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import ModuleTabs, { CRM_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconTarget, IconFolder, IconPhone } from '../../components/ui/Icons'
import ClientForm from '../../components/forms/ClientForm'
import { useFetchList } from '../../hooks/useFetchList'
import { CLIENT_STATUT_BADGE } from '../../utils/constants'

export default function ProspectList() {
  const { items: prospects, loading, error, charger } = useFetchList(
    '/crm/clients/?type_client=prospect',
    'Impossible de charger les prospects.'
  )
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtered = prospects.filter(
    (p) =>
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  )

  const nbSecteurs = new Set(prospects.map((p) => p.secteur).filter(Boolean)).size
  const nbAvecTel  = prospects.filter((p) => p.telephone).length

  return (
    <div className="space-y-5">
      {/* ─── sec-head ───────────────────────────────────── */}
      <div className="sec-head">
        <div>
          <div className="sec-title">Prospects</div>
          <div className="sec-sub">
            Clients potentiels à convertir ·{' '}
            {loading ? '…' : `${prospects.length} prospect${prospects.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau prospect
        </button>
      </div>

      {/* ─── KPI ────────────────────────────────────────── */}
      <div className="three-col">
        <KpiCard
          icon={<IconTarget />} tone="gold" valueTone="gold"
          label="Total prospects"
          value={prospects.length}
          sub="À convertir en clients"
        />
        <KpiCard
          icon={<IconFolder />} tone="sand"
          label="Secteurs"
          value={nbSecteurs}
          sub="Secteurs distincts"
        />
        <KpiCard
          icon={<IconPhone />} tone="forest" valueTone="forest"
          label="Avec téléphone"
          value={nbAvecTel}
          sub="Joignables directement"
        />
      </div>

      {/* ─── Carte : onglets module + th-row + table ────── */}
      <div className="card overflow-hidden">
        <ModuleTabs items={CRM_TABS} />

        <div className="th-row">
          <div className="th-title">
            Prospects ·{' '}
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
        ) : (
          <table className="table-eko">
            <thead>
              <tr>
                {['Code', 'Nom', 'Secteur', 'Statut', 'Téléphone', 'Localité'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">
                    Aucun prospect trouvé
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono-cell text-forest-700">{p.code}</td>
                    <td className="font-display font-medium text-ink">{p.nom}</td>
                    <td className="text-sand-600 capitalize">{p.secteur || '—'}</td>
                    <td>
                      <span className={CLIENT_STATUT_BADGE[p.statut] ?? 'badge-gray'}>{p.statut}</span>
                    </td>
                    <td className="mono-cell">{p.telephone || '—'}</td>
                    <td className="text-sand-600">{p.localite || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau prospect" onClose={() => setModal(false)}>
          <ClientForm typeDefault="prospect" onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
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
