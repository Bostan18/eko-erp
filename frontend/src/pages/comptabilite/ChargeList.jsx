import { useState } from 'react'
import api from '../../services/api'
import Modal from '../../components/ui/Modal'
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

export default function ChargeList() {
  const { items: charges, loading, error, charger } = useFetchList('/comptabilite/charges/', 'Impossible de charger les charges.')
  const [filtre, setFiltre] = useState('toutes')
  const [modal, setModal]   = useState(false)

  const filtrees    = charges.filter((c) => filtre === 'toutes' ? true : c.categorie === filtre)
  const totalFiltre = filtrees.reduce((s, c) => s + Number(c.montant), 0)
  const totalGlobal = charges.reduce((s, c) => s + Number(c.montant), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl">Charges</h1>
          <p className="font-body text-gray-500 text-sm mt-1">
            {loading ? '…' : `${charges.length} charge${charges.length !== 1 ? 's' : ''} · Total : ${fmt(totalGlobal)} F`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => exportCharges(filtre)}>↓ Excel</button>
          <button className="btn-primary" onClick={() => setModal(true)}>+ Nouvelle charge</button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setFiltre('toutes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
            filtre === 'toutes' ? 'bg-forest-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-forest-300'
          }`}
        >
          Toutes
        </button>
        {Object.entries(CHARGE_CAT_LABEL).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-colors ${
              filtre === key ? 'bg-forest-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-forest-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtre !== 'toutes' && (
        <div className="card p-4 bg-amber-50 border-amber-100 flex items-center justify-between">
          <span className="font-display text-sm text-amber-700">Total {CHARGE_CAT_LABEL[filtre]}</span>
          <span className="font-display font-bold text-amber-800 text-lg">{fmt(totalFiltre)} F</span>
        </div>
      )}

      <div className="card overflow-hidden">
        {error && <p className="p-6 text-red-500 text-sm">{error}</p>}
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-body text-sm">Chargement…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Date', 'Libellé', 'Catégorie', 'Montant', 'Projet', 'Fournisseur', 'Référence'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-display font-semibold text-gray-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrees.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 font-body">Aucune charge</td></tr>
              ) : filtrees.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-body text-gray-700">{c.date}</td>
                  <td className="px-4 py-3 font-body font-medium text-gray-800">{c.libelle}</td>
                  <td className="px-4 py-3">
                    <span className={CHARGE_CAT_BADGE[c.categorie] ?? 'badge-gray'}>{CHARGE_CAT_LABEL[c.categorie] ?? c.categorie}</span>
                  </td>
                  <td className="px-4 py-3 font-display font-semibold text-gray-800">{fmt(c.montant)} F</td>
                  <td className="px-4 py-3 font-body text-gray-500 text-xs">{c.projet_nom || '—'}</td>
                  <td className="px-4 py-3 font-body text-gray-500">{c.fournisseur || '—'}</td>
                  <td className="px-4 py-3 font-body text-gray-400 text-xs">{c.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-100">
              <tr>
                <td colSpan={3} className="px-4 py-3 font-display font-semibold text-gray-600 text-sm">
                  Total {filtre !== 'toutes' ? CHARGE_CAT_LABEL[filtre] : 'charges'}
                </td>
                <td className="px-4 py-3 font-display font-bold text-gray-800">{fmt(totalFiltre)} F</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {modal && (
        <Modal titre="Nouvelle charge" onClose={() => setModal(false)}>
          <ChargeForm onClose={() => setModal(false)} onSuccess={() => { setModal(false); charger() }} />
        </Modal>
      )}
    </div>
  )
}
