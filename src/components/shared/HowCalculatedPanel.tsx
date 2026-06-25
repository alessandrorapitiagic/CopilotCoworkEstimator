import { useTranslation } from 'react-i18next'
import { Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Scenario, AssumptionPack, FundingPlan, Company } from '@/types/domain'

interface Props {
  scenario: Scenario
  pack: AssumptionPack | null
  funding: FundingPlan | null
  company: Company | null
  currency: string
}

export function HowCalculatedPanel({ scenario, pack, funding }: Props) {
  const { t } = useTranslation()
  const result = scenario.calculationResult

  return (
    <div className="flex flex-col gap-4 text-sm" data-tour="how-calculated">
      {/* Scenario overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="size-4 text-primary" />
            {t('results.formula')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Calculation mode</p>
              <p className="font-semibold">{scenario.calculationMode ?? 'officialGuide'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Workload</p>
              <p className="font-semibold">{scenario.workloadType ?? 'cowork'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Source guide</p>
              <p className="font-semibold">{pack?.sourceGuideName ?? '—'} {pack?.sourceGuideVersion ?? ''}</p>
            </div>
          </div>
          {scenario.calculationMode !== 'officialGuide' && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              This estimate applies custom planning factors beyond the official guide methodology. These factors are not a Microsoft rate card.
            </p>
          )}
          {pack?.heavyDefaults.openEnded && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              Heavy tasks are modeled as 1,500+ Copilot Credits. Maximum values are open-ended unless a planning cap is configured.
            </p>
          )}
          <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`enabledUsers    = headcount × enabledPct / 100
activeUsers     = enabledUsers × activePct / 100
monthlyTasks    = activeUsers × tasksPerUserPerMonth
baseCredits     = monthlyTasks × creditsPerTask (light/medium/heavy band)
adjustedCredits = baseCredits
                  × modelFactor
                  × contextFactor
                  × toolsFactor
                  × runtimeFactor
                  × browserFactor × imageFactor

totalMonthlyCredits = Σ adjustedCredits (all segments)
billableCredits     = max(0, totalCredits - existingCapacity)
monthlyCost         = billableCredits × effectivePricePerCredit`}
          </pre>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="size-3 mt-0.5 shrink-0" />
            {t('app.disclaimer')}
          </p>
        </CardContent>
      </Card>

      {/* Assumption pack snapshot */}
      {pack && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm">{t('results.calculatedWith')}: {pack.name}</CardTitle>
              <Badge variant="secondary">v{pack.version}</Badge>
              {pack.isSystemDefault && <Badge>{t('assumptions.systemDefault')}</Badge>}
              {!pack.isSystemDefault && <Badge variant="warning">{t('assumptions.custom')}</Badge>}
              {pack.isDeprecated && <Badge variant="destructive">Deprecated</Badge>}
            </div>
            {pack.sourceDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('assumptions.source')}: {pack.sourceName ?? pack.source ?? '—'} · {pack.sourceDate}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Credit bands */}
            <div>
              <p className="text-xs font-semibold mb-2">{t('assumptions.creditBands')}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['light', 'medium', 'heavy'] as const).map((int) => (
                  <div key={int} className="rounded-lg border p-2.5 bg-muted/30">
                    <p className="font-semibold capitalize mb-1">{int}</p>
                    <p className="text-muted-foreground">Min: <span className="text-foreground font-medium">{pack.creditBands[`${int}Min` as keyof typeof pack.creditBands]}</span></p>
                    <p className="text-muted-foreground">Mid: <span className="text-foreground font-medium">{pack.creditBands[`${int}Mid` as keyof typeof pack.creditBands]}</span></p>
                    <p className="text-muted-foreground">Max: <span className="text-foreground font-medium">{pack.creditBands[`${int}Max` as keyof typeof pack.creditBands]}</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Model factors */}
            <div>
              <p className="text-xs font-semibold mb-2">{t('assumptions.models')} — Factors</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {Object.entries(pack.modelFactors).map(([modelId, factor]) => (
                  <div key={modelId} className="rounded border px-2 py-1 flex justify-between">
                    <span className="text-muted-foreground truncate">{modelId.replace('model-', '')}</span>
                    <span className="font-bold ml-1">{factor}×</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver factors */}
            <div>
              <p className="text-xs font-semibold mb-2">{t('assumptions.factors')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {Object.entries(pack.factors).map(([key, val]) => (
                  <div key={key} className="rounded border px-2 py-1 flex justify-between">
                    <span className="text-muted-foreground truncate">{key}</span>
                    <span className="font-bold ml-1">{val}×</span>
                  </div>
                ))}
              </div>
            </div>

            {pack.disclaimer && (
              <p className="text-xs text-muted-foreground border-t pt-2">{pack.disclaimer}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Funding snapshot */}
      {funding && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('funding.title')}: {t(`funding.mode.${funding.mode}`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: t('funding.pricePerCredit'), val: `${funding.paygPricePerCredit} ${funding.currency}/credito` },
                { label: t('funding.existingMonthly'), val: formatNumber(funding.existingMonthlyCredits) },
                { label: t('funding.prepaidCredits'), val: formatNumber(funding.prepaidCredits) },
                { label: t('funding.discount'), val: `${funding.discountPercentage}%` },
                ...(funding.budgetMonthly ? [{ label: t('funding.budgetMonthly'), val: formatCurrency(funding.budgetMonthly, funding.currency) }] : []),
              ].map(({ label, val }) => (
                <div key={label} className="rounded border px-2 py-1">
                  <p className="text-muted-foreground text-[10px]">{label}</p>
                  <p className="font-medium">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segment custom assumptions */}
      {scenario.segments.filter((s) => s.includeInCalculation && (s.taskMixMode === 'custom' || s.contextFactorOverride != null || s.toolsFactorOverride != null)).length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Segmenti con assunzioni personalizzate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1.5">
              {scenario.segments
                .filter((s) => s.includeInCalculation && (s.taskMixMode === 'custom' || s.contextFactorOverride != null || s.toolsFactorOverride != null))
                .map((seg) => (
                  <div key={seg.id} className="flex items-center gap-2 text-xs">
                    <Badge variant="warning" className="text-[10px]">{seg.name}</Badge>
                    {seg.taskMixMode === 'custom' && <span className="text-muted-foreground">Task mix custom</span>}
                    {seg.contextFactorOverride != null && <span className="text-muted-foreground">Context ×{seg.contextFactorOverride}</span>}
                    {seg.toolsFactorOverride != null && <span className="text-muted-foreground">Tools ×{seg.toolsFactorOverride}</span>}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculation metadata */}
      {result && (
        <div className="text-xs text-muted-foreground flex items-center justify-between border rounded-lg px-3 py-2">
          <span>Calcolato il: <strong className="text-foreground">{new Date(result.calculatedAt).toLocaleDateString()}</strong></span>
          <span>Pack: <strong className="text-foreground">{pack?.name ?? '—'} v{pack?.version ?? '—'}</strong></span>
          {result.isRangeBased && <Badge variant="secondary" className="text-[10px]">Range</Badge>}
        </div>
      )}
    </div>
  )
}
