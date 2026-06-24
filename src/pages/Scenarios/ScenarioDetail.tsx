import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Download, AlertTriangle, Info, Users } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { FundingPlanEditor } from './components/FundingPlanEditor'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Cell,
} from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

export default function ScenarioDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { scenarios, companies, assumptionPacks, fundingPlans,
    recalculateScenario, upsertFundingPlan, preferences } = useAppStore()

  const scenario = scenarios.find((s) => s.id === id) ?? null

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

  // scenario is narrowed to non-null after the early return above
  const s = scenario
  const company = companies.find((c) => c.id === s.companyId)
  const pack = assumptionPacks.find((p) => p.id === s.assumptionPackId)
  const result = s.calculationResult
  const currency = preferences.currency
  const existingFundingPlan = fundingPlans.find((fp) => fp.scenarioId === s.id) ?? null
  const defaultPrice = pack?.fundingDefaults.paygPricePerCredit ?? 0.01

  function handleSaveFunding(data: Parameters<typeof upsertFundingPlan>[0]) {
    upsertFundingPlan(data)
    recalculateScenario(s.id)
  }

  const segmentChartData = result?.breakdownBySegment.map((b) => ({
    name: b.segmentName.length > 12 ? b.segmentName.slice(0, 12) + '…' : b.segmentName,
    credits: Math.round(b.monthlyCredits.mid),
    cost: Number(b.monthlyCost.mid.toFixed(2)),
  })) ?? []

  function handleExportCSV() {
    if (!result) return
    const rows = [
      ['Company', 'Scenario', 'Assumption Pack', 'Segment', 'Headcount', 'Enabled Users', 'Active Users', 'Monthly Credits Min', 'Monthly Credits Mid', 'Monthly Credits Max', 'Monthly Cost Mid', 'Annual Cost Mid'],
      ...result.breakdownBySegment.map((b) => {
        const seg = s.segments.find((s) => s.id === b.segmentId)
        return [
          company?.name ?? '',
          s.name,
          pack?.name ?? '',
          b.segmentName,
          seg?.headcount ?? 0,
          b.enabledUsers,
          b.activeUsers,
          Math.round(b.monthlyCredits.min),
          Math.round(b.monthlyCredits.mid),
          Math.round(b.monthlyCredits.max),
          b.monthlyCost.mid.toFixed(2),
          (b.monthlyCost.mid * 12).toFixed(2),
        ]
      }),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scenario-${s.name}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">{s.name}</h1>
            <Badge variant={s.status === 'draft' ? 'secondary' : 'success'}>
              {t(`scenarios.status.${s.status}`)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{company?.name ?? '—'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/scenarios/${id}/segments`}>
              <Users className="size-4" /> {t('scenarios.segments')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => recalculateScenario(s.id)}>
            <RefreshCw className="size-4" /> {t('scenarios.recalculate')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!result}>
            <Download className="size-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/scenarios/${id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {!result ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Info className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Nessun risultato calcolato.</p>
            <Button onClick={() => recalculateScenario(s.id)}>
              <RefreshCw className="size-4" /> {t('scenarios.recalculate')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {[
              { label: t('results.monthlyCredits'), value: formatNumber(result.monthlyCredits.mid), sub: `${formatNumber(result.monthlyCredits.min)} – ${formatNumber(result.monthlyCredits.max)}` },
              { label: t('results.annualCredits'), value: formatNumber(result.annualCredits.mid), sub: `× 12` },
              { label: t('results.monthlyCost'), value: formatCurrency(result.monthlyCost.mid, currency), sub: `${formatCurrency(result.monthlyCost.min, currency)} – ${formatCurrency(result.monthlyCost.max, currency)}`, accent: true },
              { label: t('results.annualCost'), value: formatCurrency(result.annualCost.mid, currency), sub: `${formatCurrency(result.annualCost.min, currency)} – ${formatCurrency(result.annualCost.max, currency)}`, accent: true },
            ].map((k, i) => (
              <Card key={i} className={k.accent ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${k.accent ? 'text-primary' : ''}`}>{k.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per user */}
          <div className="grid gap-3 grid-cols-2">
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{t('results.costPerEnabled')}</p>
                <p className="text-lg font-semibold">{formatCurrency(result.costPerEnabledUser.mid, currency)}/mo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{t('results.costPerActive')}</p>
                <p className="text-lg font-semibold">{formatCurrency(result.costPerActiveUser.mid, currency)}/mo</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs: Breakdown + Funding + Warnings + Formula */}
          <Tabs defaultValue="segments">
            <TabsList>
              <TabsTrigger value="segments">{t('results.breakdownBySegment')}</TabsTrigger>
              <TabsTrigger value="funding">{t('funding.title')}</TabsTrigger>
              <TabsTrigger value="warnings">
                {t('results.warnings')}
                {result.warnings.filter((w) => w.severity !== 'info').length > 0 && (
                  <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] px-1.5">
                    {result.warnings.filter((w) => w.severity !== 'info').length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="formula">{t('scenarios.howCalculated')}</TabsTrigger>
            </TabsList>

            <TabsContent value="segments" className="flex flex-col gap-4" data-tour="breakdown-segments">
              {segmentChartData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">{t('results.breakdownBySegment')} (mid)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={segmentChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ReTooltip />
                        <Bar dataKey="credits" radius={[4, 4, 0, 0]}>
                          {segmentChartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="p-3 text-left">Segmento</th>
                        <th className="p-3 text-right">Utenti attivi</th>
                        <th className="p-3 text-right">Crediti/mo (mid)</th>
                        <th className="p-3 text-right">Costo/mo (mid)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdownBySegment.map((b) => (
                        <tr key={b.segmentId} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-3 font-medium">{b.segmentName}</td>
                          <td className="p-3 text-right">{formatNumber(b.activeUsers)}</td>
                          <td className="p-3 text-right">{formatNumber(Math.round(b.monthlyCredits.mid))}</td>
                          <td className="p-3 text-right text-primary font-semibold">
                            {formatCurrency(b.monthlyCost.mid, currency)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-bold">
                        <td className="p-3">Totale</td>
                        <td className="p-3 text-right">
                          {formatNumber(result.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0))}
                        </td>
                        <td className="p-3 text-right">{formatNumber(Math.round(result.monthlyCredits.mid))}</td>
                        <td className="p-3 text-right text-primary">
                          {formatCurrency(result.monthlyCost.mid, currency)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Breakdown by model */}
              {Object.keys(result.breakdownByModel).length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">{t('results.modelBreakdown')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-1">
                      {Object.entries(result.breakdownByModel).map(([modelId, cr]) => {
                        const modelName = modelId.replace('model-', '').replace(/-/g, ' ')
                        const pct = result.monthlyCredits.mid > 0 ? (cr.mid / result.monthlyCredits.mid) * 100 : 0
                        return (
                          <div key={modelId} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground w-32 truncate capitalize">{modelName}</span>
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-16 text-right font-medium">{formatNumber(Math.round(cr.mid))}</span>
                            <span className="w-10 text-right text-muted-foreground">{pct.toFixed(1)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Breakdown by intensity */}
              <Card>
                <CardHeader><CardTitle className="text-sm">{t('results.intensityBreakdown')}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {(['light', 'medium', 'heavy'] as const).map((int) => {
                      const cr = result.breakdownByIntensity[int]
                      const pct = result.monthlyCredits.mid > 0 ? (cr.mid / result.monthlyCredits.mid) * 100 : 0
                      return (
                        <div key={int} className="rounded-lg border p-3 bg-muted/30 text-center">
                          <p className="text-muted-foreground capitalize mb-1">{int}</p>
                          <p className="font-bold text-sm">{formatNumber(Math.round(cr.mid))}</p>
                          <p className="text-muted-foreground">{pct.toFixed(1)}%</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Funding tab */}
            <TabsContent value="funding">
              <FundingPlanEditor
                scenarioId={s.id}
                existingPlan={existingFundingPlan}
                result={result}
                currency={currency}
                defaultPrice={defaultPrice}
                onSave={handleSaveFunding}
              />
            </TabsContent>

            <TabsContent value="warnings">
              <Card>
                <CardContent className="pt-4 flex flex-col gap-2">
                  {result.warnings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('results.noWarnings')}</p>
                  ) : (
                    result.warnings.map((w, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-md p-3 text-sm
                          ${w.severity === 'error' ? 'bg-destructive/10 text-destructive' :
                            w.severity === 'warning' ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-muted text-muted-foreground'}`}
                      >
                        <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                        <span>{w.message}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="formula">
              <Card>
                <CardContent className="pt-4 flex flex-col gap-3 text-sm">
                  <p className="font-semibold">Formula base (per segmento):</p>
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap">
{`enabledUsers = headcount × enabledPercentage / 100
activeUsers  = enabledUsers × activeUsagePercentage / 100
monthlyTasks = activeUsers × tasksPerActiveUserPerMonth
baseCredits  = monthlyTasks × creditsPerTask (dalla banda light/medium/heavy)
adjustedCredits = baseCredits × modelFactor × contextFactor × toolsFactor
                  × runtimeFactor × browserFactor × imageFactor
totalMonthlyCredits = Σ adjustedCredits (tutti i segmenti)
monthlyCost = max(0, totalCredits - existingCapacity) × pricePerCredit`}
                  </pre>
                  {pack && (
                    <div className="grid gap-2">
                      <p className="font-semibold">Assumption Pack: {pack.name} v{pack.version}</p>
                      <p className="text-muted-foreground text-xs">Fonte: {pack.source ?? '—'} · Data: {pack.sourceDate ?? '—'}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {(['light', 'medium', 'heavy'] as const).map((int) => (
                          <div key={int} className="rounded border p-2">
                            <p className="font-semibold capitalize mb-1">{int}</p>
                            <p>Min: {pack.creditBands[`${int}Min` as keyof typeof pack.creditBands]}</p>
                            <p>Mid: {pack.creditBands[`${int}Mid` as keyof typeof pack.creditBands]}</p>
                            <p>Max: {pack.creditBands[`${int}Max` as keyof typeof pack.creditBands]}</p>
                          </div>
                        ))}
                      </div>
                      {pack.disclaimer && (
                        <p className="text-xs text-muted-foreground border-t pt-2">{pack.disclaimer}</p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground border-t pt-2">{t('app.disclaimer')}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
