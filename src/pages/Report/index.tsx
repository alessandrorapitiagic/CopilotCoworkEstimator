import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Download,
  FileJson,
  Printer,
  Share2,
  ShieldAlert,
  Users,
  Zap,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BudgetStatusBadge } from '@/components/shared/BudgetStatusBadge'
import { HowCalculatedPanel } from '@/components/shared/HowCalculatedPanel'
import { ShareScenarioDialog } from '@/components/shared/ShareScenarioDialog'
import { ValidationPanel } from '@/components/shared/ValidationPanel'
import { ValueInsightsPanel } from '@/components/shared/ValueInsightsPanel'
import { exportScenarioSummaryCsv, exportSegmentBreakdownCsv } from '@/services/exportService'
import { validateScenario } from '@/services/validationService'
import { formatCurrency, formatNumber } from '@/lib/utils'

function ReportSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

export default function ScenarioReportPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [showShare, setShowShare] = useState(false)

  const {
    scenarios,
    companies,
    assumptionPacks,
    fundingPlans,
    usageProfiles,
    preferences,
  } = useAppStore()

  const scenario = scenarios.find((s) => s.id === id) ?? null
  const company = companies.find((c) => c.id === scenario?.companyId) ?? null
  const pack = assumptionPacks.find((p) => p.id === scenario?.assumptionPackId) ?? null
  const funding = fundingPlans.find((f) => f.scenarioId === scenario?.id) ?? null
  const result = scenario?.calculationResult ?? null
  const currency = company?.currency ?? preferences.currency

  if (!scenario) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> {t('common.back')}
        </Button>
        <p className="mt-4 text-muted-foreground">{t('common.noData')}</p>
      </div>
    )
  }

  const validation = validateScenario(scenario, company, pack, funding)
  const s = scenario
  const enabledUsers = result?.breakdownBySegment.reduce((sum, s) => sum + s.enabledUsers, 0) ?? 0
  const activeUsers = result?.breakdownBySegment.reduce((sum, s) => sum + s.activeUsers, 0) ?? 0
  const includedSegments = scenario.segments.filter((s) => s.includeInCalculation)
  const exportedAt = new Date().toISOString()

  function handlePrint() {
    window.print()
  }

  function handleExportJson() {
    const payload = {
      schemaVersion: '1.0.0',
      reportType: 'scenario_report',
      exportedAt,
      company,
      scenario: s,
      fundingPlan: funding,
      assumptionPack: pack,
      validation,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${s.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-full bg-background">
      {/* Screen toolbar */}
      <div className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" /> {t('common.back')}
          </Button>
          <div className="mx-2 h-5 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={handlePrint} data-tour="report-print">
            <Printer className="size-4" /> {t('report.print')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!result}
            onClick={() => exportScenarioSummaryCsv(scenario, company ?? undefined, pack ?? undefined, currency)}
          >
            <Download className="size-4" /> {t('report.exportSummaryCsv')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!result}
            onClick={() => exportSegmentBreakdownCsv(scenario, company ?? undefined, pack ?? undefined, currency)}
          >
            <Download className="size-4" /> {t('report.exportSegmentsCsv')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <FileJson className="size-4" /> {t('report.exportJson')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
            <Share2 className="size-4" /> {t('share.title')}
          </Button>
          <Button asChild size="sm" className="ml-auto">
            <Link to={`/scenarios/${scenario.id}`}>{t('report.backToScenario')}</Link>
          </Button>
        </div>
      </div>

      {/* Printable report */}
      <article className="mx-auto flex max-w-5xl flex-col gap-8 p-4 sm:p-8 print:max-w-none print:p-0" data-tour="scenario-report">
        {/* Header */}
        <header className="rounded-2xl border bg-card p-6 print:border-0 print:p-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">{t('report.title')}</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{scenario.name}</h1>
              <p className="mt-1 text-muted-foreground">{company?.name ?? '—'}</p>
              {scenario.description && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{scenario.description}</p>}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={scenario.status === 'reviewed' ? 'success' : 'secondary'}>
                  {t(`scenarios.status.${scenario.status}`)}
                </Badge>
                <BudgetStatusBadge result={result} funding={funding} size="md" />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('report.generatedAt')}: {new Date(exportedAt).toLocaleDateString()}
              </p>
              {result?.calculatedAt && (
                <p className="text-xs text-muted-foreground">
                  {t('report.calculatedAt')}: {new Date(result.calculatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Executive summary */}
        <ReportSection title={t('report.executiveSummary')}>
          {result ? (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: t('results.monthlyCredits'), value: formatNumber(Math.round(result.monthlyCredits.mid)), icon: Zap },
                { label: t('results.monthlyCost'), value: formatCurrency(result.monthlyCost.mid, currency), icon: CalendarDays, accent: true },
                { label: t('results.annualCost'), value: formatCurrency(result.annualCost.mid, currency), icon: CalendarDays, accent: true },
                { label: t('report.activeUsers'), value: formatNumber(activeUsers), icon: Users },
              ].map(({ label, value, icon: Icon, accent }) => (
                <Card key={label} className={accent ? 'border-primary/30 bg-primary/5' : ''}>
                  <CardContent className="pt-4">
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="size-3" />{label}</p>
                    <p className={`mt-1 text-2xl font-bold ${accent ? 'text-primary' : ''}`}>{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center gap-2 pt-6 text-sm text-muted-foreground">
                <ShieldAlert className="size-4" /> {t('report.partialResult')}
              </CardContent>
            </Card>
          )}
        </ReportSection>

        {/* Value insights */}
        <ReportSection title={t('insights.title')}>
          <ValueInsightsPanel
            company={company}
            scenario={scenario}
            funding={funding}
            usageProfiles={usageProfiles}
          />
        </ReportSection>

        {/* Configuration */}
        <ReportSection title={t('report.configuration')}>
          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">{t('companies.name')}</p><p className="font-medium">{company?.name ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('companies.totalEmployees')}</p><p className="font-medium">{company ? formatNumber(company.totalEmployees) : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('report.includedSegments')}</p><p className="font-medium">{includedSegments.length}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('segments.enabledUsers')}</p><p className="font-medium">{formatNumber(enabledUsers)}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('segments.activeUsers')}</p><p className="font-medium">{formatNumber(activeUsers)}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('assumptions.packs')}</p><p className="font-medium">{pack ? `${pack.name} v${pack.version}` : '—'}</p></div>
            </CardContent>
          </Card>
        </ReportSection>

        {/* Credit and cost estimates */}
        {result && (
          <ReportSection title={t('report.estimates')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-sm">{t('report.creditEstimate')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ['Min', result.monthlyCredits.min, result.annualCredits.min],
                    ['Mid', result.monthlyCredits.mid, result.annualCredits.mid],
                    ['Max', result.monthlyCredits.max, result.annualCredits.max],
                  ].map(([label, monthly, annual]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{label}</span>
                      <span>{formatNumber(Math.round(monthly as number))}/mo · {formatNumber(Math.round(annual as number))}/yr</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">{t('report.costEstimate')}</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    ['Min', result.monthlyCost.min, result.annualCost.min],
                    ['Mid', result.monthlyCost.mid, result.annualCost.mid],
                    ['Max', result.monthlyCost.max, result.annualCost.max],
                  ].map(([label, monthly, annual]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{label}</span>
                      <span>{formatCurrency(monthly as number, currency)}/mo · {formatCurrency(annual as number, currency)}/yr</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </ReportSection>
        )}

        {/* Funding */}
        <ReportSection title={t('funding.title')}>
          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Mode</p><p className="font-medium">{funding ? t(`funding.mode.${funding.mode}`) : 'PAYG default'}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('funding.pricePerCredit')}</p><p className="font-medium">{funding?.paygPricePerCredit ?? pack?.fundingDefaults.paygPricePerCredit ?? '—'} {currency}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('funding.existingMonthly')}</p><p className="font-medium">{formatNumber(funding?.existingMonthlyCredits ?? 0)}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('funding.prepaidCredits')}</p><p className="font-medium">{formatNumber(funding?.prepaidCredits ?? 0)}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('funding.budgetMonthly')}</p><p className="font-medium">{funding?.budgetMonthly ? formatCurrency(funding.budgetMonthly, currency) : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">{t('funding.budgetStatus')}</p><BudgetStatusBadge result={result} funding={funding} size="md" /></div>
            </CardContent>
          </Card>
        </ReportSection>

        {/* Breakdown */}
        {result && (
          <ReportSection title={t('report.breakdown')}>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="p-3 text-left">{t('segments.name')}</th>
                      <th className="p-3 text-right">{t('segments.activeUsers')}</th>
                      <th className="p-3 text-right">{t('results.monthlyCredits')}</th>
                      <th className="p-3 text-right">{t('results.monthlyCost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdownBySegment.map((b) => (
                      <tr key={b.segmentId} className="border-b last:border-0">
                        <td className="p-3 font-medium">{b.segmentName}</td>
                        <td className="p-3 text-right">{formatNumber(b.activeUsers)}</td>
                        <td className="p-3 text-right">{formatNumber(Math.round(b.monthlyCredits.mid))}</td>
                        <td className="p-3 text-right font-semibold text-primary">{formatCurrency(b.monthlyCost.mid, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </ReportSection>
        )}

        {/* How calculated */}
        <ReportSection title={t('scenarios.howCalculated')}>
          <HowCalculatedPanel scenario={scenario} pack={pack} funding={funding} company={company} currency={currency} />
        </ReportSection>

        {/* Warnings */}
        <ReportSection title={t('report.warningsLimitations')}>
          {validation.all.length > 0 ? (
            <ValidationPanel result={validation} />
          ) : (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">{t('results.noWarnings')}</CardContent>
            </Card>
          )}
        </ReportSection>

        {/* Metadata + Disclaimer */}
        <ReportSection title={t('report.metadata')}>
          <Card>
            <CardContent className="space-y-3 pt-6 text-xs text-muted-foreground">
              <div className="grid gap-2 sm:grid-cols-2">
                <p>Scenario ID: <span className="text-foreground">{scenario.id}</span></p>
                <p>Company ID: <span className="text-foreground">{scenario.companyId}</span></p>
                <p>Created: <span className="text-foreground">{new Date(scenario.createdAt).toLocaleDateString()}</span></p>
                <p>Updated: <span className="text-foreground">{new Date(scenario.updatedAt).toLocaleDateString()}</span></p>
                <p>Exported: <span className="text-foreground">{new Date(exportedAt).toLocaleDateString()}</span></p>
                <p>Status: <span className="text-foreground">{scenario.status}</span></p>
              </div>
              <Separator />
              <p className="flex items-start gap-2 text-sm">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                {t('app.disclaimer')}
              </p>
            </CardContent>
          </Card>
        </ReportSection>
      </article>

      {showShare && (
        <ShareScenarioDialog
          scenario={scenario}
          onClose={() => setShowShare(false)}
          onFallbackExport={handleExportJson}
        />
      )}
    </div>
  )
}
