import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Building2,
  FlaskConical,
  TrendingUp,
  Plus,
  Upload,
  Download,
  AlertTriangle,
  Clock,
  BarChart3,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'

function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
  accent,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  sub?: string
  accent?: boolean
}) {
  return (
    <Card className={accent ? 'border-primary/40 bg-primary/5' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <Icon className={`size-4 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { companies, scenarios, preferences } = useAppStore()

  const activeCompanies = companies.filter((c) => c.status === 'active')
  const activeScenarios = scenarios.filter((s) => s.status !== 'archived')

  const totalMonthlyCostMid = activeScenarios.reduce(
    (sum, s) => sum + (s.calculationResult?.monthlyCost.mid ?? 0),
    0,
  )
  const totalAnnualCostMid = totalMonthlyCostMid * 12

  const recentScenarios = [...activeScenarios]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  const recentCompanies = [...activeCompanies]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)

  const allWarnings = activeScenarios.flatMap(
    (s) => s.calculationResult?.warnings.filter((w) => w.severity !== 'info') ?? [],
  )

  const hasData = companies.length > 0

  function handleExportPortfolio() {
    const { storageService } = require('@/services/storageService')
    const json = (storageService as { exportAll: () => string }).exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copilot-estimator-portfolio-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('nav.dashboard')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('app.tagline')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPortfolio}>
            <Download className="size-4" />
            {t('dashboard.actions.exportPortfolio')}
          </Button>
          <Button asChild size="sm">
            <Link to="/companies/new">
              <Plus className="size-4" />
              {t('dashboard.actions.newCompany')}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('dashboard.kpi.companies')}
          value={activeCompanies.length}
          icon={Building2}
        />
        <KpiCard
          title={t('dashboard.kpi.scenarios')}
          value={activeScenarios.length}
          icon={FlaskConical}
        />
        <KpiCard
          title={t('dashboard.kpi.monthlyCost')}
          value={formatCurrency(totalMonthlyCostMid, preferences.currency)}
          icon={TrendingUp}
          sub={t('results.rangeMode')}
          accent
        />
        <KpiCard
          title={t('dashboard.kpi.annualCost')}
          value={formatCurrency(totalAnnualCostMid, preferences.currency)}
          icon={BarChart3}
          sub="× 12"
          accent
        />
      </div>

      {/* Empty state */}
      {!hasData && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="rounded-full bg-muted p-4">
              <FlaskConical className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-semibold">{t('dashboard.emptyState.title')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('dashboard.emptyState.description')}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to="/companies/new">
                  <Plus className="size-4" />
                  {t('dashboard.actions.newCompany')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/scenarios/new">
                  <FlaskConical className="size-4" />
                  {t('dashboard.actions.newScenario')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Scenarios */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('dashboard.recentScenarios')}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/scenarios">
                    <Clock className="size-3" />
                    All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentScenarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              ) : (
                recentScenarios.map((s) => {
                  const company = companies.find((c) => c.id === s.companyId)
                  const cost = s.calculationResult?.monthlyCost.mid
                  return (
                    <Link
                      key={s.id}
                      to={`/scenarios/${s.id}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company?.name ?? '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {cost !== undefined && (
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(cost, preferences.currency)}/mo
                          </span>
                        )}
                        <Badge variant={s.status === 'draft' ? 'secondary' : 'success'}>
                          {t(`scenarios.status.${s.status}`)}
                        </Badge>
                      </div>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Companies */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t('dashboard.recentCompanies')}</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/companies">All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {recentCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              ) : (
                recentCompanies.map((c) => {
                  const cScenarios = scenarios.filter((s) => s.companyId === c.id)
                  return (
                    <Link
                      key={c.id}
                      to={`/companies/${c.id}`}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(c.totalEmployees)} {t('common.headcount').toLowerCase()}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {cScenarios.length} {t('nav.scenarios').toLowerCase()}
                      </Badge>
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          {allWarnings.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="size-4" />
                  {t('dashboard.warnings')} ({allWarnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {allWarnings.slice(0, 6).map((w, i) => (
                  <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                    {w.message}
                  </p>
                ))}
                {allWarnings.length > 6 && (
                  <p className="text-xs text-muted-foreground">
                    +{allWarnings.length - 6} altri warning
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground border-t pt-4 flex items-start gap-1">
        <Upload className="size-3 mt-0.5 shrink-0" />
        {t('app.disclaimer')}
      </p>
    </div>
  )
}
