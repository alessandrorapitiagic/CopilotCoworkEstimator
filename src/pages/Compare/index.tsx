import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GitCompareArrows } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function Compare() {
  const { t } = useTranslation()
  const { scenarios, companies, preferences } = useAppStore()
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const scenA = scenarios.find((s) => s.id === idA)
  const scenB = scenarios.find((s) => s.id === idB)
  const compA = companies.find((c) => c.id === scenA?.companyId)
  const compB = companies.find((c) => c.id === scenB?.companyId)
  const currency = preferences.currency

  function delta(a: number, b: number) {
    if (b === 0) return null
    return ((a - b) / b) * 100
  }

  function DeltaBadge({ pct }: { pct: number | null }) {
    if (pct === null) return <span className="text-muted-foreground">—</span>
    const positive = pct > 0
    return (
      <Badge variant={positive ? 'destructive' : 'success'}>
        {positive ? '+' : ''}{pct.toFixed(1)}%
      </Badge>
    )
  }

  const resA = scenA?.calculationResult
  const resB = scenB?.calculationResult

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('nav.compare')}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Scenario A</Label>
          <Select value={idA} onValueChange={setIdA}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona scenario A..." />
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
        </div>
        <div className="grid gap-2">
          <Label>Scenario B</Label>
          <Select value={idB} onValueChange={setIdB}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona scenario B..." />
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
        </div>
      </div>

      {(!idA || !idB) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <GitCompareArrows className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Seleziona due scenari per confrontarli.</p>
          </CardContent>
        </Card>
      )}

      {scenA && scenB && (
        <>
          {compA?.id !== compB?.id && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-400">
              Gli scenari appartengono ad aziende diverse — confronto portfolio.
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Confronto</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="p-3 text-left">Metrica</th>
                    <th className="p-3 text-right">{scenA.name}</th>
                    <th className="p-3 text-right">{scenB.name}</th>
                    <th className="p-3 text-right">Δ A vs B</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Crediti mensili (mid)', va: resA?.monthlyCredits.mid, vb: resB?.monthlyCredits.mid, fmt: (v: number) => formatNumber(Math.round(v)) },
                    { label: 'Crediti annuali (mid)', va: resA?.annualCredits.mid, vb: resB?.annualCredits.mid, fmt: (v: number) => formatNumber(Math.round(v)) },
                    { label: t('results.monthlyCost') + ' (mid)', va: resA?.monthlyCost.mid, vb: resB?.monthlyCost.mid, fmt: (v: number) => formatCurrency(v, currency) },
                    { label: t('results.annualCost') + ' (mid)', va: resA?.annualCost.mid, vb: resB?.annualCost.mid, fmt: (v: number) => formatCurrency(v, currency) },
                    { label: t('results.costPerEnabled'), va: resA?.costPerEnabledUser.mid, vb: resB?.costPerEnabledUser.mid, fmt: (v: number) => formatCurrency(v, currency) },
                    { label: t('results.costPerActive'), va: resA?.costPerActiveUser.mid, vb: resB?.costPerActiveUser.mid, fmt: (v: number) => formatCurrency(v, currency) },
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{row.label}</td>
                      <td className="p-3 text-right">{row.va !== undefined ? row.fmt(row.va) : '—'}</td>
                      <td className="p-3 text-right">{row.vb !== undefined ? row.fmt(row.vb) : '—'}</td>
                      <td className="p-3 text-right">
                        <DeltaBadge pct={row.va !== undefined && row.vb !== undefined ? delta(row.va, row.vb) : null} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Segments comparison */}
          <div className="grid gap-4 sm:grid-cols-2">
            {[{ scen: scenA, res: resA, comp: compA }, { scen: scenB, res: resB, comp: compB }].map(({ scen, res, comp }) => (
              <Card key={scen.id}>
                <CardHeader>
                  <CardTitle className="text-sm">{scen.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{comp?.name ?? '—'} · {scen.segments.length} segmenti</p>
                </CardHeader>
                <CardContent>
                  {res ? (
                    <div className="flex flex-col gap-1 text-xs">
                      {res.breakdownBySegment.map((b) => (
                        <div key={b.segmentId} className="flex justify-between">
                          <span className="text-muted-foreground">{b.segmentName}</span>
                          <span className="font-medium">{formatCurrency(b.monthlyCost.mid, currency)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nessun risultato calcolato.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
