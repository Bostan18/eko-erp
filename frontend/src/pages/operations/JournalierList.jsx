import { Link } from 'react-router-dom'
import { useState } from 'react'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { OPERATIONS_TABS } from '../../components/ui/ModuleTabs'
import { useFetchList } from '../../hooks/useFetchList'

export default function JournalierList() {
  const { items: employes, loading, error } = useFetchList(
    '/rh/employes/?type_contrat=journalier', 'Impossible de charger les journaliers.'
  )
  const [search, setSearch] = useState('')

  const filtres = employes.filter((e) =>
    !search ? true
      : e.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        (e.poste ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Opérations terrain</div>
          <div className="sec-sub">
            Journaliers · {loading ? '…' : `${employes.length} actif${employes.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <Link to="/rh" className="btn-secondary">Gérer dans RH →</Link>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={OPERATIONS_TABS} />
        <div className="th-row">
          <div className="th-title">Journaliers · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher nom, code, poste…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Code', 'Nom', 'Poste', 'Taux journalier', 'Statut', 'Entrée'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sand-500 font-body">Aucun journalier</td></tr>
              ) : filtres.map((e) => (
                <tr key={e.id}>
                  <td className="mono-cell text-forest-700">{e.code}</td>
                  <td className="font-display font-medium text-ink">
                    <Link to={`/rh/${e.id}`} className="hover:text-forest-700 transition-colors">
                      {e.nom_complet}
                    </Link>
                  </td>
                  <td className="text-sand-600">{e.poste || '—'}</td>
                  <td className="num">
                    {e.taux_journalier
                      ? <>{Number(e.taux_journalier).toLocaleString('fr-FR')} <span className="text-[10px] font-normal text-sand-500">F/j</span></>
                      : '—'}
                  </td>
                  <td>
                    {e.statut === 'actif'   ? <Badge tone="green">Actif</Badge>
                     : e.statut === 'conge' ? <Badge tone="gold">En congé</Badge>
                     : <Badge tone="gray">Inactif</Badge>}
                  </td>
                  <td className="text-sand-600">{e.date_entree || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
