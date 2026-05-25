import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'

const Dashboard       = lazy(() => import('./pages/Dashboard'))
const EmployeList     = lazy(() => import('./pages/rh/EmployeList'))
const EmployeDetail   = lazy(() => import('./pages/rh/EmployeDetail'))
const Pointage        = lazy(() => import('./pages/rh/Pointage'))
const PointageSemaine = lazy(() => import('./pages/rh/PointageSemaine'))
const BulletinList    = lazy(() => import('./pages/rh/BulletinList'))
const BulletinDetail  = lazy(() => import('./pages/rh/BulletinDetail'))
const PaiementsJournaliers = lazy(() => import('./pages/rh/PaiementsJournaliers'))
const CongesList      = lazy(() => import('./pages/rh/CongesList'))
const MissionsMoo     = lazy(() => import('./pages/rh/MissionsMoo'))
const Reporting       = lazy(() => import('./pages/Reporting'))
const BilanCarboneEsg = lazy(() => import('./pages/reporting/BilanCarboneEsg'))
const RapportsBi      = lazy(() => import('./pages/reporting/Rapports'))
const ProjetList      = lazy(() => import('./pages/projets/ProjetList'))
const ProjetDetail    = lazy(() => import('./pages/projets/ProjetDetail'))
const TacheDetail     = lazy(() => import('./pages/projets/TacheDetail'))
const PlanningGantt   = lazy(() => import('./pages/projets/PlanningGantt'))
const ClientList      = lazy(() => import('./pages/crm/ClientList'))
const ProspectList    = lazy(() => import('./pages/crm/ProspectList'))
const Pipeline        = lazy(() => import('./pages/crm/Pipeline'))
const ContratList     = lazy(() => import('./pages/crm/ContratList'))
const StockList       = lazy(() => import('./pages/stocks/StockList'))
const StockAlertes    = lazy(() => import('./pages/stocks/StockAlertes'))
const StockMouvements = lazy(() => import('./pages/stocks/StockMouvements'))
const LotBiologiqueList = lazy(() => import('./pages/stocks/LotBiologiqueList'))
const MateriauxBtpList  = lazy(() => import('./pages/stocks/MateriauxBtpList'))
const DechetList        = lazy(() => import('./pages/stocks/DechetList'))
const FactureList     = lazy(() => import('./pages/comptabilite/FactureList'))
const FactureDetail   = lazy(() => import('./pages/comptabilite/FactureDetail'))
const AvoirList       = lazy(() => import('./pages/comptabilite/AvoirList'))
const StickerList     = lazy(() => import('./pages/comptabilite/StickerList'))
const ChargeList      = lazy(() => import('./pages/comptabilite/ChargeList'))
const AchatFactureList = lazy(() => import('./pages/achats/AchatFactureList'))
const FournisseurList = lazy(() => import('./pages/achats/FournisseurList'))
const CompteList      = lazy(() => import('./pages/achats/CompteList'))
const TresorerieList  = lazy(() => import('./pages/achats/TresorerieList'))
const DevisList       = lazy(() => import('./pages/comptabilite/DevisList'))
const DevisDetail     = lazy(() => import('./pages/comptabilite/DevisDetail'))
const EnginList           = lazy(() => import('./pages/parc/EnginList'))
const EnginDetail         = lazy(() => import('./pages/parc/EnginDetail'))
const SiteList            = lazy(() => import('./pages/operations/SiteList'))
const JournalierList      = lazy(() => import('./pages/operations/JournalierList'))
const LogTravailList      = lazy(() => import('./pages/operations/LogTravailList'))
const TacheCatalogueList  = lazy(() => import('./pages/operations/TacheCatalogueList'))
const DocumentList    = lazy(() => import('./pages/documents/DocumentList'))
const ParametresEntreprise   = lazy(() => import('./pages/parametres/ParametresEntreprise'))
const ParametresUtilisateurs = lazy(() => import('./pages/parametres/Utilisateurs'))
const Profil           = lazy(() => import('./pages/Profil'))

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
        <Route path="/rh/conges"                    element={<CongesList />} />
        <Route path="/rh/paie/bulletins"            element={<BulletinList />} />
        <Route path="/rh/paie/bulletins/:id"        element={<BulletinDetail />} />
        <Route path="/rh/paie/journaliers"          element={<PaiementsJournaliers />} />
        <Route path="/rh/paie/missions"             element={<MissionsMoo />} />
        <Route path="/rh/paie"                      element={<Navigate to="/rh/paie/bulletins" replace />} />
        <Route path="/projets"                      element={<ProjetList />} />
        <Route path="/projets/planning"             element={<PlanningGantt />} />
        <Route path="/projets/btp"                  element={<ProjetList typeProjet="btp" />} />
        <Route path="/projets/agriculture"          element={<ProjetList typeProjet="agriculture" />} />
        <Route path="/projets/pepiniere"            element={<ProjetList typeProjet="pepiniere" />} />
        <Route path="/projets/locations"            element={<ProjetList typeProjet="location" />} />
        <Route path="/projets/:id"                  element={<ProjetDetail />} />
        <Route path="/projets/:projetId/taches/:tacheId" element={<TacheDetail />} />
        <Route path="/crm"                          element={<ClientList />} />
        <Route path="/crm/prospects"                element={<ProspectList />} />
        <Route path="/crm/pipeline"                 element={<Pipeline />} />
        <Route path="/crm/contrats"                 element={<ContratList />} />
        <Route path="/stocks"                       element={<StockList />} />
        <Route path="/stocks/alertes"               element={<StockAlertes />} />
        <Route path="/stocks/mouvements"            element={<StockMouvements />} />
        <Route path="/stocks/lots-biologiques"      element={<LotBiologiqueList />} />
        <Route path="/stocks/materiaux-btp"         element={<MateriauxBtpList />} />
        <Route path="/stocks/dechets"               element={<DechetList />} />
        <Route path="/comptabilite/factures"        element={<FactureList />} />
        <Route path="/comptabilite/factures/:id"    element={<FactureDetail />} />
        <Route path="/comptabilite/avoirs"          element={<AvoirList />} />
        <Route path="/comptabilite/stickers"        element={<StickerList />} />
        <Route path="/comptabilite/charges"         element={<ChargeList />} />
        <Route path="/comptabilite/devis"           element={<DevisList />} />
        <Route path="/comptabilite/devis/:id"       element={<DevisDetail />} />
        <Route path="/documents"                    element={<DocumentList />} />
        <Route path="/reporting"                    element={<Reporting />} />
        <Route path="/reporting/esg"                element={<BilanCarboneEsg />} />
        <Route path="/reporting/rapports"           element={<RapportsBi />} />
        <Route path="/parametres/entreprise"        element={<ParametresEntreprise />} />
        <Route path="/parametres/utilisateurs"      element={<ParametresUtilisateurs />} />
        <Route path="/parametres"                   element={<Navigate to="/parametres/entreprise" replace />} />
        <Route path="/profil"                       element={<Profil />} />
        <Route path="/comptabilite"                 element={<Navigate to="/comptabilite/factures" replace />} />
        <Route path="/achats/factures"              element={<AchatFactureList />} />
        <Route path="/achats/fournisseurs"          element={<FournisseurList />} />
        <Route path="/achats/comptes"               element={<CompteList />} />
        <Route path="/achats/tresorerie"            element={<TresorerieList />} />
        <Route path="/achats"                       element={<Navigate to="/achats/factures" replace />} />
        <Route path="/parc"                         element={<EnginList />} />
        <Route path="/parc/:id"                     element={<EnginDetail />} />
        <Route path="/operations"                   element={<Navigate to="/operations/sites" replace />} />
        <Route path="/operations/sites"             element={<SiteList />} />
        <Route path="/operations/journaliers"       element={<JournalierList />} />
        <Route path="/operations/logs"              element={<LogTravailList />} />
        <Route path="/operations/taches-catalogue"  element={<TacheCatalogueList />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
