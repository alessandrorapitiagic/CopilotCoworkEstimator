import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  GitCompareArrows, ArrowUp, ArrowDown,
  AlertTriangle, Download, ExternalLink,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoHint } from '@/components/shared/InfoHint'
import { formatCurrency, formatNumber } from '@/lib/utils'


interface MetricRow {
  key: string
  labelKey: string
  valA: number | null
  valB: number | null
  format: 'number' | 'currency' | 'integer'
  lowerIsBetter: boolean
  hint?: string
}

function DeltaBadge({ a, b, lowerIsBetter }: { a: number | null; b: number | null; lowerIsBetter: boolean }) {
  if (a === null || b === null || b === 0) return <span className="text-muted-foreground text-xs">—</span>
  const pct = ((a - b) / Math.abs(b)) * 100
  if (Math.abs(pct) < 0.5) return <span className="text-muted-foreground text-xs">≈0%</span>
  const aIsBetter = lowerIsBetter ? a < b : a > b
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
      aIsBetter ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
    }`}>
      {pct > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

export default function Compare() {
  const { t } = useTranslation()
  const { scenarios, companies, assumptionPacks, preferences, recalculateScenario } = useAppStore()
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const scenA = scenarios.find((s) => s.id === idA) ?? null
  const scenB = scenarios.find((s) => s.id === idB) ?? null
  const compA = companies.find((c) => c.id === scenA?.companyId)
  const compB = companies.find((c) => c.id === scenB?.companyId)
  const packA = assumptionPacks.find((p) => p.id === scenA?.assumptionPackId)
  const packB = assumptionPacks.find((p) => p.id === scenB?.assumptionPackId)
  const currency = preferences.currency

  const resA = scenA?.calculationResult ?? null
  const resB = scenB?.calculationResult ?? null

  // Metrics table
  const metrics: MetricRow[] = useMemo(() => [
    { key: 'monthlyCredits', labelKey: 'compare.metrics.monthlyCredits', valA: resA?.monthlyCredits.mid ?? null, valB: resB?.monthlyCredits.mid ?? null, format: 'number', lowerIsBetter: true, hint: 'monthlyCredits' },
    { key: 'annualCredits', labelKey: 'compare.metrics.annualCredits', valA: resA?.annualCredits.mid ?? null, valB: resB?.annualCredits.mid ?? null, format: 'number', lowerIsBetter: true },
    { key: 'monthlyCost', labelKey: 'compare.metrics.monthlyCost', valA: resA?.monthlyCost.mid ?? null, valB: resB?.monthlyCost.mid ?? null, format: 'currency', lowerIsBetter: true, hint: 'monthlyCost' },
    { key: 'annualCost', labelKey: 'compare.metrics.annualCost', valA: resA?.annualCost.mid ?? null, valB: resB?.annualCost.mid ?? null, format: 'currency', lowerIsBetter: true, hint: 'annualCost' },
    { key: 'costPerEnabled', labelKey: 'compare.metrics.costPerEnabled', valA: resA?.costPerEnabledUser.mid ?? null, valB: resB?.costPerEnabledUser.mid ?? null, format: 'currency', lowerIsBetter: true, hint: 'costPerEnabled' },
    { key: 'costPerActive', labelKey: 'compare.metrics.costPerActive', valA: resA?.costPerActiveUser.mid ?? null, valB: resB?.costPerActiveUser.mid ?? null, format: 'currency', lowerIsBetter: true, hint: 'costPerActive' },
    { key: 'enabledUsers', labelKey: 'compare.metrics.enabledUsers', valA: resA ? resA.breakdownBySegment.reduce((s, b) => s + b.enabledUsers, 0) : null, valB: resB ? resB.breakdownBySegment.reduce((s, b) => s + b.enabledUsers, 0) : null, format: 'integer', lowerIsBetter: false },
    { key: 'activeUsers', labelKey: 'compare.metrics.activeUsers', valA: resA ? resA.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0) : null, valB: resB ? resB.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0) : null, format: 'integer', lowerIsBetter: false },
    { key: 'warnings', labelKey: 'compare.metrics.warnings', valA: resA ? resA.warnings.filter((w) => w.severity !== 'info').length : null, valB: resB ? resB.warnings.filter((w) => w.severity !== 'info').length : null, format: 'integer', lowerIsBetter: true },
  ], [resA, resB])

  function formatVal(val: number | null, fmt: MetricRow['format']): string {
    if (val === null) return '—'
    if (fmt === 'currency') return formatCurrency(val, currency)
    if (fmt === 'integer') return formatNumber(Math.round(val))
    return formatNumber(Math.round(val))
  }

  function handleExportCSV() {
    if (!scenA || !scenB) return
    const rows = [
      ['Metrica', scenA.name, scenB.name, 'Δ A vs B %'],
      ...metrics.map((m) => {
        const delta = m.valA !== null && m.valB !== null && m.valB !== 0
          ? ((m.valA - m.valB) / Math.abs(m.valB) * 100).toFixed(1) + '%'
          : '—'
        return [t(m.labelKey), formatVal(m.valA, m.format), formatVal(m.valB, m.format), delta]
      }),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compare-${scenA.name}-vs-${scenB.name}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const diffPacks = scenA && scenB && scenA.assumptionPackId !== scenB.assumptionPackId
  const diffCompanies = scenA && scenB && scenA.companyId !== scenB.companyId
  const diffCalculationMode = scenA && scenB && (scenA.calculationMode ?? 'officialGuide') !== (scenB.calculationMode ?? 'officialGuide')

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('compare.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('compare.subtitle')}</p>
        </div>
        {scenA && scenB && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="size-4" />
            {t('compare.exportComparison')}
          </Button>
        )}
      </div>

      {/* Selector row */}
      <div className="grid gap-3 sm:grid-cols-2" data-tour="compare-selectors">
        {[
          { label: t('compare.selectA'), id: idA, setId: setIdA, scen: scenA, comp: compA },
          { label: t('compare.selectB'), id: idB, setId: setIdB, scen: scenB, comp: compB },
        ].map(({ label, id, setId, scen, comp }, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <Select value={id} onValueChange={setId}>
              <SelectTrigger>
                <SelectValue placeholder={t('compare.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => {
                  const c = companies.find((co) => co.id === s.companyId)
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {c?.name ?? '—'}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {scen && (
              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg px-2 py-1">
                <span>{comp?.name ?? '—'}</span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={scen.status === 'draft' ? 'secondary' : 'success'} className="text-[10px]">
                    {t(`scenarios.status.${scen.status}`)}
                  </Badge>
                  <Button variant="ghost" size="icon" className="size-5" asChild>
                    <Link to={`/scenarios/${scen.id}`}><ExternalLink className="size-3" /></Link>
                  </Button>
                  {!scen.calculationResult && (
                    <Button variant="ghost" size="icon" className="size-5" onClick={() => recalculateScenario(scen.id)}>
                      <span className="text-[10px]">↻</span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Warnings */}
      {diffPacks && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          {t('compare.diffPackWarning')}
          <span className="ml-auto text-xs">
            A: {packA?.name} v{packA?.version} · B: {packB?.name} v{packB?.version}
          </span>
        </div>
      )}
      {diffCompanies && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <AlertTriangle className="size-3.5 shrink-0" />
          {t('compare.diffCompanyNote')}
        </div>
      )}
      {diffCalculationMode && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          Scenarios use different calculation modes. Differences may depend on methodology, not only usage.
        </div>
      )}

      {/* No result */}
      {scenA && scenB && (!resA || !resB) && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0" />
          {t('compare.noResults')}
        </div>
      )}

      {/* Empty state */}
      {(!idA || !idB) && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <GitCompareArrows className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t('compare.subtitle')}</p>
          </CardContent>
        </Card>
      )}

      {/* Main comparison */}
      {scenA && scenB && resA && resB && (
        <>
          {/* Summary header cards */}
          <div className="grid gap-3 grid-cols-2" data-tour="compare-summary">
            {[
              { label: scenA.name, res: resA, comp: compA, isA: true },
              { label: scenB.name, res: resB, comp: compB, isA: false },
            ].map(({ label, res, comp, isA }) => (
              <Card key={label} className={isA ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' : 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10'}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground truncate">{comp?.name ?? '—'}</p>
                  <p className={`font-bold truncate ${isA ? 'text-blue-700 dark:text-blue-300' : 'text-violet-700 dark:text-violet-300'}`}>{label}</p>
                  <p className="text-xl font-bold mt-1">{formatCurrency(res.monthlyCost.mid, currency)}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(Math.round(res.monthlyCredits.mid))} crediti · {res.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0)} attivi
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metrics table */}
          <Card data-tour="compare-metrics">
            <CardHeader>
              <CardTitle className="text-sm">{t('compare.metricsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground bg-muted/20">
                    <th className="px-4 py-2.5 text-left font-medium">Metrica</th>
                    <th className="px-4 py-2.5 text-right font-medium text-blue-700 dark:text-blue-300">A: {scenA.name.slice(0, 15)}{scenA.name.length > 15 ? '…' : ''}</th>
                    <th className="px-4 py-2.5 text-right font-medium text-violet-700 dark:text-violet-300">B: {scenB.name.slice(0, 15)}{scenB.name.length > 15 ? '…' : ''}</th>
                    <th className="px-4 py-2.5 text-center font-medium">{t('compare.delta')}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => {
                    const aIsBetter = m.valA !== null && m.valB !== null
                      ? (m.lowerIsBetter ? m.valA < m.valB : m.valA > m.valB)
                      : null
                    return (
                      <tr key={m.key} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-medium">
                          <span className="flex items-center gap-1">
                            {t(m.labelKey)}
                            {m.hint && <InfoHint hintKey={m.hint} size={11} />}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${aIsBetter === true ? 'text-emerald-600 dark:text-emerald-400' : aIsBetter === false ? 'text-muted-foreground' : ''}`}>
                          {formatVal(m.valA, m.format)}
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${aIsBetter === false ? 'text-emerald-600 dark:text-emerald-400' : aIsBetter === true ? 'text-muted-foreground' : ''}`}>
                          {formatVal(m.valB, m.format)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <DeltaBadge a={m.valA} b={m.valB} lowerIsBetter={m.lowerIsBetter} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Range comparison */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Range min / mid / max</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-xs">
              {[
                { scen: scenA, res: resA, color: 'blue' },
                { scen: scenB, res: resB, color: 'violet' },
              ].map(({ scen, res, color }) => (
                <div key={scen.id}>
                  <p className={`font-semibold mb-2 text-${color}-700 dark:text-${color}-300`}>{scen.name}</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { label: t('results.monthlyCredits'), min: res.monthlyCredits.min, mid: res.monthlyCredits.mid, max: res.monthlyCredits.max, fmt: 'number' as const },
                      { label: t('results.monthlyCost'), min: res.monthlyCost.min, mid: res.monthlyCost.mid, max: res.monthlyCost.max, fmt: 'currency' as const },
                    ].map(({ label, min, mid, max, fmt }) => {
                      const f = fmt === 'currency' ? (v: number) => formatCurrency(v, currency) : (v: number) => formatNumber(Math.round(v))
                      const range = max - min
                      const midPct = range > 0 ? ((mid - min) / range) * 100 : 50
                      return (
                        <div key={label}>
                          <p className="text-muted-foreground mb-0.5">{label}</p>
                          <div className="relative h-2 rounded-full bg-muted">
                            <div className="absolute top-0 left-0 h-full rounded-full bg-muted-foreground/20"
                              style={{ width: '100%' }} />
                            <div className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full border-2 border-primary bg-background"
                              style={{ left: `${midPct}%`, transform: 'translate(-50%, -50%)' }} />
                          </div>
                          <div className="flex justify-between mt-0.5 text-[10px] text-muted-foreground">
                            <span>{f(min)}</span>
                            <span className="font-bold text-foreground">{f(mid)}</span>
                            <span>{f(max)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Segment breakdown side-by-side */}
          <Card>
            <CardHeader><CardTitle className="text-sm">{t('compare.breakdownTitle')}</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 text-xs">
              {[
                { scen: scenA, res: resA, color: 'blue' },
                { scen: scenB, res: resB, color: 'violet' },
              ].map(({ scen, res, color }) => (
                <div key={scen.id}>
                  <p className={`font-semibold mb-2 text-${color}-700 dark:text-${color}-300`}>{scen.name}</p>
                  <div className="flex flex-col gap-1">
                    {res.breakdownBySegment.map((b) => {
                      const pct = res.monthlyCost.mid > 0 ? (b.monthlyCost.mid / res.monthlyCost.mid) * 100 : 0
                      return (
                        <div key={b.segmentId} className="flex items-center gap-2">
                          <span className="text-muted-foreground w-24 truncate">{b.segmentName}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-500' : 'bg-violet-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-16 text-right font-medium">{formatCurrency(b.monthlyCost.mid, currency)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Assumptions diff */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Confronto assunzioni</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                {[
                  { label: 'Scenario', valA: scenA.name, valB: scenB.name },
                  { label: 'Company', valA: compA?.name ?? '—', valB: compB?.name ?? '—' },
                  { label: 'Assumption Pack', valA: `${packA?.name ?? '—'} v${packA?.version ?? '—'}`, valB: `${packB?.name ?? '—'} v${packB?.version ?? '—'}` },
                  { label: 'Segmenti', valA: String(scenA.segments.filter((s) => s.includeInCalculation).length), valB: String(scenB.segments.filter((s) => s.includeInCalculation).length) },
                  { label: 'Status', valA: t(`scenarios.status.${scenA.status}`), valB: t(`scenarios.status.${scenB.status}`) },
                ].map(({ label, valA, valB }) => (
                  <div key={label} className="rounded-lg border p-2">
                    <p className="text-muted-foreground mb-0.5">{label}</p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-blue-700 dark:text-blue-300 truncate">A: {valA}</p>
                      <p className="text-violet-700 dark:text-violet-300 truncate">B: {valB}</p>
                    </div>
                    {valA !== valB && (
                      <p className="text-amber-600 dark:text-amber-400 text-[10px] mt-0.5 flex items-center gap-0.5">
                        <AlertTriangle className="size-2.5" /> Diversi
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
