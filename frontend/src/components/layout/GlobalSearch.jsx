import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useClickOutside } from '../../hooks/useClickOutside'

/* Recherche globale v1 — côté client.
   Charge à la demande (au premier focus) les listes des entités principales,
   les met en cache pour la session, puis filtre en mémoire à chaque frappe.
   Aucun endpoint de recherche dédié côté backend : on réutilise les listes existantes. */

const SOURCES = [
  {
    cle: 'clients', endpoint: '/crm/clients/', categorie: 'Clients', tone: 'blue',
    champs: (c) => [c.nom, c.code],
    map: (c) => ({ id: c.id, titre: c.nom, meta: c.code, url: '/crm' }),
  },
  {
    cle: 'factures', endpoint: '/comptabilite/factures/', categorie: 'Factures', tone: 'green',
    champs: (f) => [f.numero, f.client_nom],
    map: (f) => ({ id: f.id, titre: f.numero, meta: f.client_nom, url: `/comptabilite/factures/${f.id}` }),
  },
  {
    cle: 'employes', endpoint: '/rh/employes/', categorie: 'Employés', tone: 'gold',
    champs: (e) => [e.nom, e.prenom, e.code],
    map: (e) => ({ id: e.id, titre: `${e.nom} ${e.prenom ?? ''}`.trim(), meta: e.code, url: `/rh/${e.id}` }),
  },
  {
    cle: 'projets', endpoint: '/projets/projets/', categorie: 'Projets', tone: 'green',
    champs: (p) => [p.nom, p.code],
    map: (p) => ({ id: p.id, titre: p.nom, meta: p.code, url: `/projets/${p.id}` }),
  },
  {
    cle: 'articles', endpoint: '/stocks/articles/', categorie: 'Stocks', tone: 'gray',
    champs: (a) => [a.nom, a.code],
    map: (a) => ({ id: a.id, titre: a.nom, meta: a.code, url: '/stocks' }),
  },
]

const MAX_PAR_CATEGORIE = 5

export default function GlobalSearch() {
  const [terme, setTerme]     = useState('')
  const [ouvert, setOuvert]   = useState(false)
  const [donnees, setDonnees] = useState(null)   // null = pas encore chargé
  const [chargement, setChargement] = useState(false)
  const [actif, setActif]     = useState(0)       // index du résultat surligné

  const ref     = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useClickOutside(ref, () => setOuvert(false), ouvert)

  // Charge toutes les sources une seule fois (au premier focus).
  const charger = useCallback(() => {
    if (donnees || chargement) return
    setChargement(true)
    Promise.all(
      SOURCES.map((s) =>
        api.get(s.endpoint)
          .then(({ data }) => (data.results ?? data))
          .catch(() => [])
      )
    ).then((listes) => {
      const parCle = {}
      SOURCES.forEach((s, i) => { parCle[s.cle] = listes[i] })
      setDonnees(parCle)
    }).finally(() => setChargement(false))
  }, [donnees, chargement])

  // Filtre en mémoire — groupes [{categorie, tone, items:[{...}]}]
  const q = terme.trim().toLowerCase()
  const groupes = []
  let total = 0
  if (q && donnees) {
    for (const s of SOURCES) {
      const items = (donnees[s.cle] ?? [])
        .filter((row) => s.champs(row).some((v) => String(v ?? '').toLowerCase().includes(q)))
        .slice(0, MAX_PAR_CATEGORIE)
        .map(s.map)
      if (items.length) {
        groupes.push({ categorie: s.categorie, tone: s.tone, items })
        total += items.length
      }
    }
  }

  // Liste à plat pour la navigation clavier
  const plat = groupes.flatMap((g) => g.items.map((it) => ({ ...it, categorie: g.categorie })))

  useEffect(() => { setActif(0) }, [terme])

  function aller(item) {
    if (!item) return
    setOuvert(false)
    setTerme('')
    navigate(item.url)
    inputRef.current?.blur()
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') { setOuvert(false); inputRef.current?.blur(); return }
    if (!plat.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActif((i) => (i + 1) % plat.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActif((i) => (i - 1 + plat.length) % plat.length) }
    else if (e.key === 'Enter') { e.preventDefault(); aller(plat[actif]) }
  }

  let indexPlat = -1

  return (
    <div className="relative" ref={ref}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
           className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-sand-500 pointer-events-none">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={inputRef}
        value={terme}
        onChange={(e) => { setTerme(e.target.value); setOuvert(true) }}
        onFocus={() => { setOuvert(true); charger() }}
        onKeyDown={onKeyDown}
        className="bg-sand-100 border border-sand-200 rounded-lg pl-8 pr-3 py-1.5 text-[13px] w-[240px]
                   focus:outline-none focus:border-forest-500 focus:bg-white transition"
        placeholder="Rechercher facture, client, employé…"
      />

      {ouvert && q && (
        <div className="absolute right-0 mt-2 w-[360px] bg-white border border-sand-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="max-h-[420px] overflow-y-auto py-1">
            {chargement && !donnees && (
              <p className="px-4 py-6 text-center text-[12px] text-sand-500">Chargement…</p>
            )}
            {donnees && total === 0 && (
              <p className="px-4 py-6 text-center text-[12px] text-sand-500">
                Aucun résultat pour « {terme.trim()} ».
              </p>
            )}
            {groupes.map((g) => (
              <div key={g.categorie} className="mb-0.5">
                <p className="px-4 pt-2 pb-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-sand-500">
                  {g.categorie}
                </p>
                {g.items.map((item) => {
                  indexPlat += 1
                  const surligne = indexPlat === actif
                  return (
                    <button
                      key={`${g.categorie}-${item.id}`}
                      onMouseEnter={() => setActif(plat.findIndex((p) => p.categorie === g.categorie && p.id === item.id))}
                      onClick={() => aller(item)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors
                                  ${surligne ? 'bg-sand-50' : 'hover:bg-sand-50'}`}
                    >
                      <span className={`badge-${g.tone} shrink-0`}>{g.categorie.slice(0, 3)}</span>
                      <span className="font-display font-medium text-[12.5px] text-ink truncate flex-1">
                        {item.titre}
                      </span>
                      {item.meta && (
                        <span className="font-mono text-[10px] text-sand-500 shrink-0">{item.meta}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
          {total > 0 && (
            <div className="px-4 py-1.5 border-t border-sand-100 flex items-center gap-3 text-[10px] text-sand-400 font-mono">
              <span><kbd className="text-sand-500">↑↓</kbd> naviguer</span>
              <span><kbd className="text-sand-500">↵</kbd> ouvrir</span>
              <span><kbd className="text-sand-500">esc</kbd> fermer</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
