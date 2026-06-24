import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoIcon } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useDashboardSummary, type RangeMode } from './useDashboardSummary'
import { DashboardHeader } from './DashboardHeader'
import { RangeSelector } from './RangeSelector'
import { DashboardKpiCards } from './DashboardKpiCards'
import { RecentScenariosTable } from './RecentScenariosTable'
import { DashboardAlertsPanel } from './DashboardAlertsPanel'
import { EmptyDashboardState } from './EmptyDashboardState'
import { StorageStatusBadge } from './StorageStatusBadge'

export default function Dashboard() {
  const { t } = useTranslation()
  const {
    companies,
    scenarios,
    assumptionPacks,
    preferences,
    recalculateScenario,
  } = useAppStore()

  const [range, setRange] = useState<RangeMode>('mid')
  const [importToast, setImportToast] = useState(false)
  const autoCalcDone = useRef(false)

  // Auto-recalculate scenarios without a result on mount (AC-005, BR-FP001-003)
  useEffect(() => {
    if (autoCalcDone.current) return
    autoCalcDone.current = true
    const missing = scenarios.filter((s) => s.status !== 'archived' && !s.calculationResult)
    missing.forEach((s) => recalculateScenario(s.id))
  }, [scenarios, recalculateScenario])

  const summary = useDashboardSummary(companies, scenarios, assumptionPacks)

  const totalWarnings = summary.recentScenarios.reduce((sum, r) => sum + r.warningCount, 0)
  const maxSev = summary.recentScenarios.some((r) => r.warningMaxSeverity === 'error')
    ? 'error'
    : summary.recentScenarios.some((r) => r.warningMaxSeverity === 'warning')
      ? 'warning'
      : summary.recentScenarios.some((r) => r.warningMaxSeverity === 'info')
        ? 'info'
        : null

  const lastUpdated = scenarios.length > 0
    ? [...scenarios].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt ?? new Date().toISOString()
    : new Date().toISOString()

  function handleImportDone() {
    setImportToast(true)
    setTimeout(() => setImportToast(false), 4000)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Import toast */}
      {importToast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-800 dark:text-green-300 shadow-lg flex items-center gap-2">
          <InfoIcon className="size-4" />
          Import completato. La dashboard è stata aggiornata con i nuovi dati.
        </div>
      )}

      {/* Header */}
      <DashboardHeader
        storageStatus={summary.storageStatus}
        lastUpdated={lastUpdated}
        onImportDone={handleImportDone}
      />

      {/* Empty state — no data at all */}
      {!summary.hasData && (
        <EmptyDashboardState hasCompanies={false} onImportDone={handleImportDone} />
      )}

      {/* Companies exist but no scenarios */}
      {summary.hasCompanies && !summary.hasActiveScenarios && (
        <EmptyDashboardState hasCompanies={true} onImportDone={handleImportDone} />
      )}

      {/* Main content — has active scenarios */}
      {summary.hasActiveScenarios && (
        <>
          {/* Range selector + storage badge row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Vista:</span>
              <RangeSelector value={range} onChange={setRange} />
            </div>
            <StorageStatusBadge status={summary.storageStatus} />
          </div>

          {/* KPI cards */}
          <DashboardKpiCards
            kpi={summary.kpi}
            range={range}
            currency={preferences.currency}
            totalWarnings={totalWarnings}
            maxWarningSeverity={maxSev}
          />

          {/* Alerts panel */}
          {summary.alerts.length > 0 && (
            <DashboardAlertsPanel alerts={summary.alerts} />
          )}

          {/* Recent scenarios table */}
          <RecentScenariosTable
            rows={summary.recentScenarios}
            range={range}
            currency={preferences.currency}
            mostExpensive={summary.mostExpensiveScenario}
          />
        </>
      )}

      {/* Alerts even without active scenarios (e.g. all archived, storage issues) */}
      {!summary.hasActiveScenarios && summary.alerts.length > 0 && (
        <DashboardAlertsPanel alerts={summary.alerts} />
      )}

      {/* Disclaimer (AC-013, BR-FP001-009) */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <InfoIcon className="size-3.5 mt-0.5 shrink-0" />
        <span>{t('app.disclaimer')}</span>
      </div>
    </div>
  )
}
