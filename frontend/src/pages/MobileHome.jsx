import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../offline/db'
import SyncStatus from '../components/offline/SyncStatus'

function aujourdhuiFR() {
  const d = new Date()
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function MobileHome() {
  const [nbProjets, setNbProjets] = useState(null)
  const [nbJournaliers, setNbJournaliers] = useState(null)
  const [premierProjet, setPremierProjet] = useState(null)

  useEffect(() => {
    (async () => {
      const projets = await db.projets.toArray()
      const employes = await db.employes.toArray()
      setNbProjets(projets.filter((p) => p.statut !== 'termine' && p.statut !== 'annule').length)
      setNbJournaliers(employes.filter((e) => e.type_contrat === 'journalier').length)
      const enCours = projets.find((p) => p.statut === 'en_cours')
      setPremierProjet(enCours ?? projets[0] ?? null)
    })()
  }, [])

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      {/* Salutation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-[#1C1817] text-[22px] leading-tight">Bonjour</h1>
          <p className="font-body text-[14px] text-[#A59F9B] capitalize">{aujourdhuiFR()}</p>
        </div>
        <SyncStatus />
      </div>

      {/* 3 grosses cartes touch */}
      <Link
        to="/rh/pointage-mobile"
        className="block bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5 active:bg-[#fbf7f0] min-h-[88px]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center text-2xl shrink-0">📋</div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-[#1C1817] text-[16px]">Pointer mes équipes</p>
            <p className="font-body text-[13px] text-[#A59F9B] truncate">
              {nbJournaliers === null ? '…' : `${nbJournaliers} journalier${nbJournaliers !== 1 ? 's' : ''} actif${nbJournaliers !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </Link>

      <Link
        to={premierProjet ? `/projets/${premierProjet.id}/photos/nouvelle` : '#'}
        className={`block bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5 min-h-[88px] ${premierProjet ? 'active:bg-[#fbf7f0]' : 'opacity-50 pointer-events-none'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FAEEDA] flex items-center justify-center text-2xl shrink-0">📸</div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-[#1C1817] text-[16px]">Photos chantier</p>
            <p className="font-body text-[13px] text-[#A59F9B] truncate">
              {premierProjet ? premierProjet.nom : 'Aucun projet disponible'}
            </p>
          </div>
        </div>
      </Link>

      <Link
        to="/projets"
        className="block bg-white rounded-2xl ring-1 ring-[#ece2d3] p-5 active:bg-[#fbf7f0] min-h-[88px]"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#EAF3DE] flex items-center justify-center text-2xl shrink-0">📁</div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-[#1C1817] text-[16px]">Mes projets</p>
            <p className="font-body text-[13px] text-[#A59F9B]">
              {nbProjets === null ? '…' : `${nbProjets} en cours`}
            </p>
          </div>
        </div>
      </Link>

      <p className="text-center font-body text-[12px] text-[#A59F9B] pt-4">
        Données disponibles hors-ligne après la première connexion.
      </p>
    </div>
  )
}
