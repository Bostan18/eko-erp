import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EmployeList from './pages/rh/EmployeList'
import EmployeDetail from './pages/rh/EmployeDetail'
import Pointage from './pages/rh/Pointage'
import ProjetList from './pages/projets/ProjetList'
import ProjetDetail from './pages/projets/ProjetDetail'
import ClientList from './pages/crm/ClientList'
import StockList from './pages/stocks/StockList'
import FactureList from './pages/comptabilite/FactureList'
import FactureDetail from './pages/comptabilite/FactureDetail'
import ChargeList from './pages/comptabilite/ChargeList'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<MainLayout />}>
        <Route path="/"                             element={<Dashboard />} />
        <Route path="/rh"                           element={<EmployeList />} />
        <Route path="/rh/:id"                       element={<EmployeDetail />} />
        <Route path="/rh/pointage"                  element={<Pointage />} />
        <Route path="/projets"                      element={<ProjetList />} />
        <Route path="/projets/:id"                  element={<ProjetDetail />} />
        <Route path="/crm"                          element={<ClientList />} />
        <Route path="/stocks"                       element={<StockList />} />
        <Route path="/comptabilite/factures"        element={<FactureList />} />
        <Route path="/comptabilite/factures/:id"    element={<FactureDetail />} />
        <Route path="/comptabilite/charges"         element={<ChargeList />} />
        <Route path="/reporting"                    element={<PlaceholderPage titre="Reporting" />} />
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
        <p className="font-display text-2xl text-gray-300 font-semibold">{titre}</p>
        <p className="text-sm text-gray-400 mt-1">Module en cours de développement</p>
      </div>
    </div>
  )
}
