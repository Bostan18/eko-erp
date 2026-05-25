import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { tabsForModule } from '../layout/modules'

/**
 * Onglets in-card servant de navigation entre les pages sœurs d'un module
 * (gabarit maquette EKO : ex. Comptabilité → Factures · Devis · Charges).
 * L'onglet actif est animé via un indicateur glissant.
 *
 *   <ModuleTabs items={[{ label: 'Factures', to: '/comptabilite/factures' }, …]} />
 */
export default function ModuleTabs({ items }) {
  const containerRef = useRef(null)
  const { pathname } = useLocation()
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 })

  // Recalcule la position de la barre à chaque changement de route ou de taille
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const measure = () => {
      const active = containerRef.current?.querySelector('.tab.active')
      if (active) {
        setIndicator({
          left: active.offsetLeft,
          width: active.offsetWidth,
          opacity: 1,
        })
      } else {
        setIndicator((s) => ({ ...s, opacity: 0 }))
      }
    }
    measure()
    // Si les fonts arrivent en retard, on relance une mesure tardive
    const t = setTimeout(measure, 120)
    return () => clearTimeout(t)
  }, [pathname, items])

  useEffect(() => {
    const onResize = () => {
      const active = containerRef.current?.querySelector('.tab.active')
      if (active) {
        setIndicator({
          left: active.offsetLeft,
          width: active.offsetWidth,
          opacity: 1,
        })
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div ref={containerRef} className="tabs has-indicator">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
        >
          {it.label}
        </NavLink>
      ))}
      <span
        className="tab-indicator"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.opacity,
        }}
      />
    </div>
  )
}

/* ─── Onglets de modules (dérivés de modules.js) ─────────── */
/* Source unique : MODULES[i].children dans components/layout/modules.js.
   end:true sur les routes qui sont préfixes d'autres onglets sœurs. */

export const COMPTA_TABS     = tabsForModule('compta')
export const ACHATS_TABS     = tabsForModule('achats')
export const RH_TABS         = tabsForModule('rh')
export const STOCKS_TABS     = tabsForModule('stocks')
export const CRM_TABS        = tabsForModule('crm')
export const PROJETS_TABS    = tabsForModule('projets')
export const REPORTING_TABS  = tabsForModule('reporting')
export const OPERATIONS_TABS = tabsForModule('operations')
export const PARAMETRES_TABS = tabsForModule('parametres')
