import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'

const Dashboard       = lazy(() => import('./pages/Dashboard'))
const EmployeList     = lazy(() => import('./pages/rh/EmployeList'))
const EmployeDetail   = lazy(() => import('./pages/rh/EmployeDetail'))
const Pointage        = lazy(() => import('./pages/rh/Pointage'))
const PointageSemaine = lazy(() => import('./pages/rh/PointageSemaine'))
const ProjetList      = lazy(() => import('./pages/projets/ProjetList'))
const ProjetDetail    = lazy(() => import('./pages/projets/ProjetDetail'))
const TacheDetail     = lazy(() => import('./pages/projets/TacheDetail'))
const ClientList      = lazy(() => import('./pages/crm/ClientList'))
const ProspectList    = lazy(() => import('./pages/crm/ProspectList'))
const StockList       = lazy(() => import('./pages/stocks/StockList'))
const StockAlertes    = lazy(() => import('./pages/stocks/StockAlertes'))
const StockMouvements = lazy(() => import('./pages/stocks/StockMouvements'))
const FactureList     = lazy(() => import('./pages/comptabilite/FactureList'))
const FactureDetail   = lazy(() => import('./pages/comptabilite/FactureDetail'))
const ChargeList      = lazy(() => import('./pages/comptabilite/ChargeList'))
const DevisList       = lazy(() => import('./pages/comptabilite/DevisList'))
const DevisDetail     = lazy(() => import('./pages/comptabilite/DevisDetail'))
const ParametresEntreprise = lazy(() => import('./pages/parametres/ParametresEntreprise'))

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MainLayout />}>
        <Route path="/"                             element={<Dashboard />} />
        <Route path="/rh"                           element={<EmployeList />} />
        <Route path="/rh/:id"                       element={<EmployeDetail />} />
        <Route path="/rh/pointage"                  element={<Pointage />} />
        <Route path="/rh/pointage-semaine"          element={<PointageSemaine />} />
        <Route path="/rh/paie"                      element={<PlaceholderPage titre="Paie & bulletins" />} />
        <Route path="/projets"                      element={<ProjetList />} />
        <Route path="/projets/btp"                  element={<ProjetList typeProjet="btp" />} />
        <Route path="/projets/agriculture"          element={<ProjetList typeProjet="agriculture" />} />
        <Route path="/projets/pepiniere"            element={<ProjetList typeProjet="pepiniere" />} />
        <Route path="/projets/locations"            element={<ProjetList typeProjet="location" />} />
        <Route path="/projets/:id"                  element={<ProjetDetail />} />
        <Route path="/projets/:projetId/taches/:tacheId" element={<TacheDetail />} />
        <Route path="/crm"                          element={<ClientList />} />
        <Route path="/crm/prospects"                element={<ProspectList />} />
        <Route path="/stocks"                       element={<StockList />} />
        <Route path="/stocks/alertes"               element={<StockAlertes />} />
        <Route path="/stocks/mouvements"            element={<StockMouvements />} />
        <Route path="/comptabilite/factures"        element={<FactureList />} />
        <Route path="/comptabilite/factures/:id"    element={<FactureDetail />} />
        <Route path="/comptabilite/charges"         element={<ChargeList />} />
        <Route path="/comptabilite/devis"           element={<DevisList />} />
        <Route path="/comptabilite/devis/:id"       element={<DevisDetail />} />
        <Route path="/reporting"                    element={<PlaceholderPage titre="Reporting" />} />
        <Route path="/parametres/entreprise"        element={<ParametresEntreprise />} />
        <Route path="/parametres"                   element={<Navigate to="/parametres/entreprise" replace />} />
        <Route path="/comptabilite"                 element={<Navigate to="/comptabilite/factures" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function PlaceholderPage({ titre }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="font-display text-2xl text-[#A59F9B] font-semibold">{titre}</p>
        <p className="text-sm text-[#A59F9B] mt-1">Module en cours de développement</p>
      </div>
    </div>
  )
}
