import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { InfoHint } from '@/components/shared/InfoHint'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  currency: string
  onGoToStep: (stepId: string) => void
}

export function ReviewCalculationStep({ state, currency }: Omit<Props, 'onGoToStep'> & { onGoToStep?: (stepId: string) => void }) {
  const { t } = useTranslation()
  const { assumptionPacks } = useAppStore()
  const result = state.calculationResult
  const pack = assumptionPacks.find((p) => p.id === state.assumptionPackId)
  const hasErrors = result ? result.warnings.some((w) => w.severity === 'error') : true
  const allSegmentsExcluded = state.segments.length > 0 && state.segments.every((s) => !s.includeInCalculation)

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-review">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.review.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.review.subtitle')}</p>
      </div>

      {/* Status banner */}
      {!hasErrors && !allSegmentsExcluded ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-800 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          {t('wizard.review.canSaveReviewed')}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          {allSegmentsExcluded ? t('wizard.allSegmentsExcluded') : t('wizard.review.mustFixErrors')}
        </div>
      )}

      {result ? (
        <>
          {/* KPI grid */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            {[
              { label: t('results.monthlyCredits'), val: formatNumber(Math.round(result.monthlyCredits.mid)), sub: `${formatNumber(Math.round(result.monthlyCredits.min))} – ${formatNumber(Math.round(result.monthlyCredits.max))}`, hint: 'monthlyCredits' },
              { label: t('results.annualCredits'), val: formatNumber(Math.round(result.annualCredits.mid)), sub: '×12' },
              { label: t('results.monthlyCost'), val: formatCurrency(result.monthlyCost.mid, currency), sub: `${formatCurrency(result.monthlyCost.min, currency)} – ${formatCurrency(result.monthlyCost.max, currency)}`, accent: true, hint: 'monthlyCost' },
              { label: t('results.annualCost'), val: formatCurrency(result.annualCost.mid, currency), sub: `${formatCurrency(result.annualCost.min, currency)} – ${formatCurrency(result.annualCost.max, currency)}`, accent: true, hint: 'annualCost' },
            ].map((k, i) => (
              <Card key={i} className={k.accent ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="pt-3 pb-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                    {k.label}
                    {k.hint && <InfoHint hintKey={k.hint} size={11} />}
                  </p>
                  <p className={`text-lg font-bold mt-0.5 ${k.accent ? 'text-primary' : ''}`}>{k.val}</p>
                  <p className="text-xs text-muted-foreground">{k.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Breakdown */}
          {result.breakdownBySegment.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">{t('results.breakdownBySegment')}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="px-3 py-2 text-left">Segmento</th>
                      <th className="px-3 py-2 text-right">Attivi</th>
                      <th className="px-3 py-2 text-right">Crediti/mo</th>
                      <th className="px-3 py-2 text-right">Costo/mo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.breakdownBySegment.map((b) => (
                      <tr key={b.segmentId} className="border-b last:border-0">
                        <td className="px-3 py-1.5 font-medium">{b.segmentName}</td>
                        <td className="px-3 py-1.5 text-right">{formatNumber(b.activeUsers)}</td>
                        <td className="px-3 py-1.5 text-right">{formatNumber(Math.round(b.monthlyCredits.mid))}</td>
                        <td className="px-3 py-1.5 text-right text-primary font-semibold">{formatCurrency(b.monthlyCost.mid, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {result.warnings.filter((w) => w.severity !== 'info').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  {t('wizard.review.warningsTitle')} ({result.warnings.filter((w) => w.severity !== 'info').length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5">
                {result.warnings.filter((w) => w.severity !== 'info').map((w, i) => (
                  <div key={i} className={`flex items-start gap-2 rounded-md p-2 text-xs ${w.severity === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                    <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                    {w.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pack info */}
          {pack && (
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{pack.name}</span> v{pack.version}
              {pack.sourceDate ? ` · ${pack.sourceDate}` : ''}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <Info className="size-4 shrink-0" />
          Dati insufficienti per calcolare la preview. Completa i segmenti per vedere i risultati.
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
        <Info className="size-3.5 mt-0.5 shrink-0" />
        {t('app.disclaimer')}
      </div>
    </div>
  )
}
