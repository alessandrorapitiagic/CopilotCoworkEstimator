import { useTranslation } from 'react-i18next'
import { BarChart3, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'

const CREDITS_PER_PROMPT = {
  light: 125,
  medium: 500,
  heavy: 1200,
}

interface BenchmarkRow {
  key: 'corporate' | 'customerFacing' | 'technical' | 'managers'
  shortLabel: string
  color: string
  light: number
  medium: number
  heavy: number
}

const ROWS: BenchmarkRow[] = [
  { key: 'corporate', shortLabel: 'Corporate', color: 'bg-blue-600', light: 22, medium: 11, heavy: 5 },
  { key: 'customerFacing', shortLabel: 'Customer-Facing', color: 'bg-violet-600', light: 17, medium: 13, heavy: 5 },
  { key: 'technical', shortLabel: 'Technical', color: 'bg-amber-600', light: 12, medium: 9, heavy: 14 },
  { key: 'managers', shortLabel: 'Managers', color: 'bg-teal-600', light: 13, medium: 6, heavy: 3 },
]

function credits(row: BenchmarkRow) {
  return row.light * CREDITS_PER_PROMPT.light
    + row.medium * CREDITS_PER_PROMPT.medium
    + row.heavy * CREDITS_PER_PROMPT.heavy
}

export function StandardProfileBenchmark() {
  const { t } = useTranslation()
  const maxCost = Math.max(...ROWS.map((r) => credits(r) * 0.01))

  return (
    <Card data-tour="quick-benchmark" className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t('quickBenchmark.kicker')}</p>
            <CardTitle className="mt-1 text-xl sm:text-2xl">{t('quickBenchmark.title')}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">{t('quickBenchmark.subtitle')}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">125 / 500 / 1.200</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                <th className="px-3 py-3 text-left font-semibold">{t('quickBenchmark.profile')}</th>
                <th className="px-3 py-3 text-right font-semibold">Light</th>
                <th className="px-3 py-3 text-right font-semibold">Medium</th>
                <th className="px-3 py-3 text-right font-semibold">Heavy</th>
                <th className="px-3 py-3 text-right font-semibold">{t('quickBenchmark.creditsMonth')}</th>
                <th className="px-3 py-3 text-right font-semibold">{t('quickBenchmark.costUserMonth')}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => {
                const c = credits(row)
                return (
                  <tr key={row.key} className={i % 2 === 1 ? 'bg-muted/40' : 'bg-background'}>
                    <td className="px-3 py-3 font-semibold">{t(`quickBenchmark.rows.${row.key}`)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{row.light}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{row.medium}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{row.heavy}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold">{formatNumber(c)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-bold text-primary">{formatCurrency(c * 0.01, 'USD')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Chart */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <p className="text-sm font-semibold">{t('quickBenchmark.chartTitle')}</p>
          </div>
          <div className="flex flex-col gap-4">
            {ROWS.map((row) => {
              const cost = credits(row) * 0.01
              const pct = (cost / maxCost) * 100
              return (
                <div key={row.key} className="grid grid-cols-[104px_1fr_52px] items-center gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{row.shortLabel}</span>
                  <div className="h-7 rounded-sm bg-muted">
                    <div className={`h-full rounded-sm ${row.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-right tabular-nums font-medium">{Math.round(cost)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Explanation */}
        <div className="lg:col-span-2 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong className="text-foreground">{t('quickBenchmark.howToReadTitle')}:</strong>{' '}
            {t('quickBenchmark.howToReadBody')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
