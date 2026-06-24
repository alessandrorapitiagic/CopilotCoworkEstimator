import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './i18n'
import './index.css'
import { useAppStore } from '@/store/appStore'
import { TooltipProvider } from '@/components/ui/tooltip'
import { TourProvider } from '@/components/tour/TourProvider'
import { TourOverlay } from '@/components/tour/TourOverlay'
import { SharedScenarioPreview } from '@/components/shared/SharedScenarioPreview'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Companies from '@/pages/Companies'
import CompanyDetail from '@/pages/Companies/CompanyDetail'
import CompanyForm from '@/pages/Companies/CompanyForm'
import Scenarios from '@/pages/Scenarios'
// ScenarioNew replaced by wizard
import ScenarioDetail from '@/pages/Scenarios/ScenarioDetail'
import Assumptions from '@/pages/Assumptions'
import Compare from '@/pages/Compare'
import Settings from '@/pages/Settings'
import Help from '@/pages/Help'
import WorkforceSegmentation from '@/pages/Segments'
import ScenarioWizardPage from '@/pages/Wizard'
import UsageProfilesPage from '@/pages/Profiles'
import PortfolioPage from '@/pages/Portfolio'
import ScenarioReportPage from '@/pages/Report'

function AppRoot() {
  const hydrate = useAppStore((s) => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])
  return (
    <TooltipProvider delayDuration={200}>
      <TourProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/new" element={<CompanyForm />} />
              <Route path="companies/:id" element={<CompanyDetail />} />
              <Route path="companies/:id/edit" element={<CompanyForm />} />
              <Route path="scenarios" element={<Scenarios />} />
              <Route path="scenarios/new" element={<ScenarioWizardPage />} />
              <Route path="scenarios/:id" element={<ScenarioDetail />} />
              <Route path="scenarios/:id/report" element={<ScenarioReportPage />} />
              <Route path="scenarios/:scenarioId/segments" element={<WorkforceSegmentation />} />
              <Route path="assumptions" element={<Assumptions />} />
              <Route path="profiles" element={<UsageProfilesPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="compare" element={<Compare />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<Help />} />
            </Route>
          </Routes>
        </HashRouter>
        <TourOverlay />
        <SharedScenarioPreview />
      </TourProvider>
    </TooltipProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
