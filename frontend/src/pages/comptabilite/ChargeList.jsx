import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ChargeForm from '../../components/forms/ChargeForm'
import { useFetchList } from '../../hooks/useFetchList'
import { CHARGE_CAT_LABEL, CHARGE_CAT_BADGE } from '../../utils/constants'
import { fmt } from '../../utils/format'

function exportCharges(filtre) {
  const params = new URLSearchParams()
  if (filtre !== 'toutes') params.set('categorie', filtre)
  api.get(`/comptabilite/charges/export_excel/?${params}`, { responseType: 'blob' })
    .then(({ data }) => {
      const href = URL.createObjectURL(data)
      Object.assign(document.createElement('a'), { href, download: 'charges.xlsx' }).click()
      URL.revokeObjectURL(href)
    })
    .catch(() => alert('Échec du téléchargement.'))
}

// Conversion classes legacy `badge-yellow` etc. vers tons Badge
function badgeToTone(cls) {
  if (!cls) return 'gray'
  if (cls.includes('green'))  return 'green'
  if (cls.includes('yellow')) return 'gold'
  if (cls.includes('red'))    return 'red'
  if (cls.includes('blue'))   return 'blue'
  return 'gray'
}

export default function ChargeList() {
  const { items: charges, loading, error, charger } = useFetchList(
    '/comptabilite/charges/', 'Impossible de charger les charges.'
  )
  const [filtre, setFiltre] = useState('toutes')
  const [modal, setModal]   = useState(false)

  const filtrees    = charges.filter((c) => filtre === 'toutes' ? true : c.categorie === filtre)
  const totalFiltre = filtrees.reduce((s, c) => s + Number(c.montant), 0)
  const totalGlobal = charges.reduce((s, c) => s + Number(c.montant), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="page-eyebrow mb-1.5">Finance / Comptabilité</p>
          <h1 className="page-title">Charges</h1>
          <p className="page-sub mt-1.5">
            {loading ? '…' : `${charges.length} ligne${charges.length !== 1 ? 's' : ''} · Total : ${fmt(totalGlobal)} F`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => exportCharges(filtre)}>⬇ Excel</button>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <IconPlus className="w-3.5 h-3.5" /> Nouvelle charge
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setFiltre('toutes')}
            className={
              'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors ' +
              (filtre === 'toutes'
                ? 'bg-forest-700 text-white'
                : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
            }
          >Toutes</button>
          {Object.entries(CHARGE_CAT_LABEL).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFiltre(key)}
              className={
                'px-3 py-1.5 rounded-lg text-[12px] font-display font-medium transition-colors ' +
                (filtre === key
                  ? 'bg-forest-700 text-white'
                  : 'bg-white border border-sand-200 text-sand-700 hover:border-forest-300')
              }
            >{label}</button>
          ))}
        </div>

        {filtre !== 'toutes' && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-gold-50 border border-gold-200 rounded-lg">
            <span className="text-[12px] text-gold-700">
              Total <strong className="font-display font-semibold">{CHARGE_CAT_LABEL[filtre]}</strong> :
            </span>
            <span className="font-display font-bold text-gold-700 text-sm">{fmt(totalFiltre)} F</span>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {error && <p className="alert-red m-5">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-sand-500 font-body text-sm">Chargement…</div>
        ) : (
          <table className="table-eko">
            <thead>
              <tr>{['Date', 'Libellé', 'Catégorie', 'Montant', 'Projet', 'Fournisseur', 'Référence'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtrees.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sand-500 font-body">Aucune charge</td></tr>
              ) : filtrees.map((c) => (
                <tr key={c.id}>
                  <td className="mono-cell">{c.date}</td>
                  <td className="font-display font-medium text-ink">{c.libelle}</td>
                  <td><Badge tone={badgeToTone(CHARGE_CAT_BADGE[c.categorie])}>{CHARGE_CAT_LABEL[c.categorie] ?? c.categorie}</Badge></td>
                  <td className="num">{fmt(c.montant)} <span className="text-[10px] font-normal text-sand-500">F</span></td>
                  <td className="text-sand-600 text-[12px]">{c.projet_nom || '—'}</td>
                  <td className="text-sand-600">{c.fournisseur || '—'}</td>
                  <td className="mono-cell text-sand-500">{c.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-sand-50 border-t-2 border-sand-200">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-display font-semibold text-sand-700 text-[13px]">
                  Total {filtre !== 'toutes' ? CHARGE_CAT_LABEL[filtre] : 'charges'}
                </td>
                <td className="px-4 py-3 num text-[14px]">{fmt(totalFiltre)} F</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle charge" sousTitre="Catégorie, montant, projet et fournisseur." onClose={() => setModal(false)}>
          <ChargeForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
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
