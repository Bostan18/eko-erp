import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ModuleTabs, { ACHATS_TABS } from '../../components/ui/ModuleTabs'
import FournisseurForm from '../../components/forms/FournisseurForm'
import { useFetchList } from '../../hooks/useFetchList'

const CAT_TONE = {
  materiaux: 'blue', materiel: 'gold', sous_traitance: 'green',
  services: 'gray', transport: 'gold', autre: 'gray',
}

export default function FournisseurList() {
  const { items: fournisseurs, loading, error, charger } = useFetchList(
    '/achats/fournisseurs/', 'Impossible de charger les fournisseurs.'
  )
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const filtres = fournisseurs.filter((f) =>
    !search ? true
      : f.nom.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase()) ||
        (f.ncc ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="sec-head">
        <div>
          <div className="sec-title">Achats &amp; Trésorerie</div>
          <div className="sec-sub">
            Fournisseurs ·{' '}
            {loading ? '…' : `${fournisseurs.length} fournisseur${fournisseurs.length !== 1 ? 's' : ''}`}
          </div>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <IconPlus className="w-3.5 h-3.5" /> Nouveau fournisseur
        </button>
      </div>

      <div className="card overflow-hidden">
        <ModuleTabs items={ACHATS_TABS} />
        <div className="th-row">
          <div className="th-title">Fournisseurs · <span className="text-sand-500 font-normal">{filtres.length}</span></div>
          <input type="text" className="input input-sm w-[210px]" placeholder="Rechercher nom, code, NCC…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead><tr>{['Code', 'Nom', 'Catégorie', 'NCC', 'Téléphone', 'Localité', 'Factures'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtres.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucun fournisseur</td></tr>
              ) : filtres.map((f) => (
                <tr key={f.id}>
                  <td className="mono-cell text-forest-700">{f.code}</td>
                  <td className="font-display font-medium text-ink">{f.nom}</td>
                  <td><Badge tone={CAT_TONE[f.categorie] ?? 'gray'}>{f.categorie_display}</Badge></td>
                  <td className="mono-cell text-sand-500">{f.ncc || '—'}</td>
                  <td className="text-sand-600">{f.telephone || '—'}</td>
                  <td className="text-sand-600">{f.localite || '—'}</td>
                  <td className="num">{f.nb_factures}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouveau fournisseur" sousTitre="Coordonnées et catégorie." onClose={() => setModal(false)}>
          <FournisseurForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}

function IconPlus({ className }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M12 5v14M5 12h14" /></svg>
}
