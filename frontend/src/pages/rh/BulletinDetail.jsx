import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../services/api'
import { BULLETIN_STATUT_BADGE, BULLETIN_STATUT_LABEL, moisLabel } from '../../utils/constants'
import { fmt } from '../../utils/format'

export default function BulletinDetail() {
  const { id } = useParams()
  const [bulletin, setBulletin] = useState(null)
  const [entreprise, setEntreprise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get(`/rh/bulletins/${id}/`).then(({ data }) => setBulletin(data)),
      api.get('/core/entreprise/').then(({ data }) => setEntreprise(data)).catch(() => setEntreprise(null)),
    ])
      .catch(() => setError('Impossible de charger le bulletin.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-12 text-center text-[#A59F9B] font-body text-sm">Chargement…</div>
  if (error || !bulletin) return <div className="p-12 text-center text-red-500 text-sm">{error || 'Bulletin introuvable.'}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <nav className="flex items-center gap-2 text-sm text-[#A59F9B]">
          <Link to="/rh/paie/bulletins" className="hover:text-forest-700 transition-colors">Bulletins de paie</Link>
          <span>›</span>
          <span className="text-[#1C1817]">{bulletin.employe_nom}</span>
        </nav>
        <button className="btn-primary" onClick={() => window.print()}>
          Imprimer / PDF
        </button>
      </div>

      <div className="card p-10 bg-white max-w-3xl mx-auto print:shadow-none print:ring-0 print:p-6">
        <div className="flex justify-between items-start mb-8 pb-6 border-b border-[#ece2d3]">
          <div>
            <h1 className="font-display font-bold text-[#1C1817] text-2xl">
              {entreprise?.raison_sociale || 'EKO SARL'}
            </h1>
            {entreprise?.adresse && <p className="text-sm text-[#A59F9B] font-body mt-1">{entreprise.adresse}</p>}
            {entreprise?.ncc && <p className="text-xs text-[#A59F9B] font-body mt-0.5">NCC : {entreprise.ncc}</p>}
          </div>
          <div className="text-right">
            <p className="font-display font-semibold text-forest-700 text-lg">BULLETIN DE PAIE</p>
            <p className="text-sm text-[#1C1817] font-display font-medium mt-1">{moisLabel(bulletin.mois)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-2">Employé</p>
            <p className="font-display font-bold text-[#1C1817] text-lg">{bulletin.employe_nom}</p>
            <p className="font-body text-sm text-[#1C1817]">{bulletin.employe_poste || '—'}</p>
            <p className="font-mono text-xs text-[#A59F9B] mt-1">{bulletin.employe_code}</p>
          </div>
          <div>
            <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-2">Période</p>
            <p className="font-display font-bold text-[#1C1817] text-lg">{moisLabel(bulletin.mois)}</p>
            <p className="font-body text-sm text-[#A59F9B] mt-1">Statut :
              <span className={`ml-2 ${BULLETIN_STATUT_BADGE[bulletin.statut] ?? 'badge-gray'}`}>
                {BULLETIN_STATUT_LABEL[bulletin.statut]}
              </span>
            </p>
            {bulletin.paye_le && <p className="font-body text-xs text-[#A59F9B] mt-1">Payé le {bulletin.paye_le}</p>}
          </div>
        </div>

        <table className="w-full border border-[#ece2d3] mb-6">
          <thead>
            <tr className="bg-[#fbf7f0]">
              <th className="px-4 py-3 text-left font-display font-semibold text-[#1C1817] text-xs uppercase border-b border-[#ece2d3]">Libellé</th>
              <th className="px-4 py-3 text-right font-display font-semibold text-[#1C1817] text-xs uppercase border-b border-[#ece2d3]">Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 font-body text-[#1C1817]">Salaire brut mensuel</td>
              <td className="px-4 py-3 font-display font-semibold text-[#1C1817] text-right tabular-nums">{fmt(bulletin.brut)}</td>
            </tr>
            <tr className="border-t border-[#ece2d3] text-xs text-[#A59F9B]">
              <td className="px-4 py-2 font-body italic">Retenues (MVP — aucune)</td>
              <td className="px-4 py-2 text-right tabular-nums">0</td>
            </tr>
            <tr className="border-t-2 border-[#1C1817] bg-forest-50">
              <td className="px-4 py-3 font-display font-bold text-forest-700 uppercase">Net à payer</td>
              <td className="px-4 py-3 font-display font-bold text-forest-700 text-right text-xl tabular-nums">{fmt(bulletin.net)}</td>
            </tr>
          </tbody>
        </table>

        {bulletin.notes && (
          <div className="mb-6">
            <p className="font-display text-xs text-[#A59F9B] uppercase tracking-wide mb-1">Notes</p>
            <p className="font-body text-sm text-[#1C1817]">{bulletin.notes}</p>
          </div>
        )}

        <div className="pt-6 border-t border-[#ece2d3] grid grid-cols-2 gap-8 text-xs text-[#A59F9B] font-body">
          <div>
            <p className="mb-12">Signature employeur</p>
            <p className="border-t border-[#ece2d3] pt-1">{entreprise?.raison_sociale || 'EKO SARL'}</p>
          </div>
          <div>
            <p className="mb-12">Signature employé</p>
            <p className="border-t border-[#ece2d3] pt-1">{bulletin.employe_nom}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
