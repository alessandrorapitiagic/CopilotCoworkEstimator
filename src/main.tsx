import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './i18n'
import './index.css'
import { useAppStore } from '@/store/appStore'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Companies from '@/pages/Companies'
import CompanyDetail from '@/pages/Companies/CompanyDetail'
import CompanyForm from '@/pages/Companies/CompanyForm'
import Scenarios from '@/pages/Scenarios'
import ScenarioNew from '@/pages/Scenarios/ScenarioNew'
import ScenarioDetail from '@/pages/Scenarios/ScenarioDetail'
import Assumptions from '@/pages/Assumptions'
import Compare from '@/pages/Compare'
import Settings from '@/pages/Settings'

function AppRoot() {
  const hydrate = useAppStore((s) => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/new" element={<CompanyForm />} />
          <Route path="companies/:id" element={<CompanyDetail />} />
          <Route path="companies/:id/edit" element={<CompanyForm />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="scenarios/new" element={<ScenarioNew />} />
          <Route path="scenarios/:id" element={<ScenarioDetail />} />
          <Route path="assumptions" element={<Assumptions />} />
          <Route path="compare" element={<Compare />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
)
