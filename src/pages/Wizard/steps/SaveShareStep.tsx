import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CheckCircle, Download, FileJson, ExternalLink, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  savedScenarioId: string | null
  currency: string
  onSaveDraft: () => void
  onSaveReviewed: () => void
  onExportCSV: () => void
  onExportJSON: () => void
}

export function SaveShareStep({
  state, savedScenarioId, currency,
  onSaveDraft, onSaveReviewed, onExportCSV, onExportJSON,
}: Props) {
  const { t } = useTranslation()
  const result = state.calculationResult
  const hasErrors = result ? result.warnings.some((w) => w.severity === 'error') : true
  const allExcluded = state.segments.every((s) => !s.includeInCalculation)

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-save">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.saveShare.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.saveShare.subtitle')}</p>
      </div>

      {/* Result summary */}
      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t('results.monthlyCredits')}</p>
              <p className="font-bold">{formatNumber(Math.round(result.monthlyCredits.mid))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('results.monthlyCost')}</p>
              <p className="font-bold text-primary">{formatCurrency(result.monthlyCost.mid, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('results.annualCost')}</p>
              <p className="font-bold text-primary">{formatCurrency(result.annualCost.mid, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Segmenti</p>
              <p className="font-bold">{state.segments.filter((s) => s.includeInCalculation).length}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save buttons */}
      <div className="flex flex-col gap-3">
        <Button
          className="w-full justify-start gap-3"
          disabled={hasErrors || allExcluded}
          onClick={onSaveReviewed}
        >
          <CheckCircle className="size-4" />
          {t('wizard.saveReviewed')}
        </Button>

        <Button variant="outline" className="w-full justify-start gap-3" onClick={onSaveDraft}>
          <FileJson className="size-4" />
          {t('wizard.saveDraft')}
        </Button>

        <Button variant="outline" className="w-full justify-start gap-3" onClick={onExportCSV} disabled={!result}>
          <Download className="size-4" />
          {t('wizard.saveShare.exportCsv')}
        </Button>

        <Button variant="outline" className="w-full justify-start gap-3" onClick={onExportJSON}>
          <FileJson className="size-4" />
          {t('wizard.saveShare.exportJson')}
        </Button>
      </div>

      {/* Post-save navigation */}
      {savedScenarioId && (
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button asChild variant="outline">
            <Link to={`/scenarios/${savedScenarioId}`}>
              <ExternalLink className="size-4" />
              {t('wizard.saveShare.openReport')}
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">
              <LayoutDashboard className="size-4" />
              {t('wizard.saveShare.backDashboard')}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
