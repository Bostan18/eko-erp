import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import RowActions from '../../components/ui/RowActions'
import { StatusBadge } from '../../components/ui/Badge'
import ModuleTabs, { COMPTA_TABS } from '../../components/ui/ModuleTabs'
import KpiCard from '../../components/ui/KpiCard'
import { IconCornerUpLeft, IconDocument, IconUsers, IconChartBar } from '../../components/ui/Icons'
import { useFetchList } from '../../hooks/useFetchList'
import { FACTURE_STATUT_LABEL } from '../../utils/constants'
import { apiErrorMessage } from '../../utils/errors'
import { fmt } from '../../utils/format'

export default function AvoirList() {
  const { items: avoirs, loading, error, charger } = useFetchList(
    '/comptabilite/factures/?type_facture=avoir',
    'Impossible de charger les avoirs.'
  )
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [actionError, setActionError] = useState('')

  async function confirmerSuppression() {
    if (!deleting) return
    setRemoving(true); setActionError('')
    try {
      await api.delete(`/comptabilite/factures/${deleting.id}/`)
      setDeleting(null); charger()
    } catch (err) {
      setActionError(apiErrorMessage(err)); setDeleting(null)
    } finally { setRemoving(false) }
  }

  const filtres = avoirs.filter((a) =>
    !search
      ? true
      : (a.numero_local ?? '').toLowerCase().includes(search.toLowerCase()) ||
        a.client_nom?.toLowerCase().includes(search.toLowerCase()) ||
        (a.fne_reference ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const totalAvoirs = avoirs.reduce((s, a) => s + Number(a.total_ttc ?? 0), 0)
  const avoirMoyen  = avoirs.length ? Math.round(totalAvoirs / avoirs.length) : 0
  const clientsImpactes = new Set(avoirs.map((a) => a.client_nom).filter(Boolean)).size

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Avoirs</div>
          <div className="sec-sub">
            Factures d'avoir certifiées FNE ·{' '}
            {loading ? '…' : `${avoirs.length} avoir${avoirs.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          icon={<IconCornerUpLeft />} tone="red"
          label="Total avoirs"
          value={<>{fmt(totalAvoirs)} <span className="kpi-unit">FCFA</span></>}
          sub="montant annulé cumulé"
        />
        <KpiCard
          icon={<IconDocument />} tone="sand"
          label="Nombre d'avoirs"
          value={avoirs.length}
          sub="émis"
        />
        <KpiCard
          icon={<IconChartBar />} tone="gold"
          label="Avoir moyen"
          value={<>{fmt(avoirMoyen)} <span className="kpi-unit">FCFA</span></>}
          sub="Par avoir émis"
        />
        <KpiCard
          icon={<IconUsers />} tone="blue"
          label="Clients impactés"
          value={clientsImpactes}
          sub={`Sur ${avoirs.length} avoir${avoirs.length !== 1 ? 's' : ''}`}
        />
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={COMPTA_TABS} />

        <div className="th-row">
          <div className="th-title">
            Avoirs ·{' '}<span className="text-sand-500 font-normal">{filtres.length}</span>
          </div>
          <input
            type="text"
            className="input input-sm w-[210px]"
            placeholder="Rechercher numéro, client, réf FNE…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {actionError && (
          <p className="alert-red m-5">
            {actionError}
            <button type="button" onClick={() => setActionError('')}
              className="ml-3 text-[11px] underline decoration-dotted opacity-70 hover:opacity-100">Fermer</button>
          </p>
        )}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Numéro', 'Client', 'Réf. FNE', 'Facture origine', 'TTC', 'Statut', 'Émis le'].map((h) => <th key={h}>{h}</th>)}<th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sand-500 font-body">Aucun avoir</td></tr>
              ) : filtres.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/comptabilite/factures/${a.id}`} className="mono-cell text-forest-700 hover:text-forest-900 font-medium">
                      {a.numero_local}
                    </Link>
                  </td>
                  <td className="font-display font-medium text-ink">{a.client_nom}</td>
                  <td className="mono-cell text-sand-500">{a.fne_reference || '—'}</td>
                  <td className="mono-cell text-sand-500">
                    {a.facture_origine ? (
                      <Link to={`/comptabilite/factures/${a.facture_origine}`} className="text-forest-700 hover:underline">
                        {a.facture_origine_numero || '—'}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="num text-red-600">{fmt(a.total_ttc)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td><StatusBadge status={a.statut} label={FACTURE_STATUT_LABEL[a.statut] ?? a.statut} /></td>
                  <td className="mono-cell text-sand-500">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <RowActions
                      onView={() => navigate(`/comptabilite/factures/${a.id}`)}
                      onDelete={() => setDeleting(a)}
                      deleteDisabledReason={a.fne_reference ? 'Avoir certifié FNE — verrouillé' : null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleting && (
        <ConfirmDialog
          titre="Supprimer cet avoir ?"
          message={`L'avoir ${deleting.numero_local} (${deleting.client_nom}) sera supprimé. Cette action est irréversible.`}
          confirmLabel="Supprimer"
          tone="danger"
          busy={removing}
          onConfirm={confirmerSuppression}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
