import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { InfoHint } from '@/components/shared/InfoHint'
import { useAppStore } from '@/store/appStore'
import type { WizardState } from '../useWizard'
import type { CalculationMode } from '@/types/domain'

interface Props {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onRecalculate: () => void
}

export function ModelsAssumptionsStep({ state, update, onRecalculate }: Props) {
  const { t } = useTranslation()
  const { assumptionPacks, modelAssumptions } = useAppStore()
  const selectedPack = assumptionPacks.find((p) => p.id === state.assumptionPackId)
  const isCustomPack = selectedPack && !selectedPack.isSystemDefault

  function handlePackChange(packId: string) {
    update({ assumptionPackId: packId })
    onRecalculate()
  }

  function handleModelChange(modelId: string) {
    const updatedSegs = state.segments.map((s) => ({ ...s, preferredModelId: modelId }))
    update({ defaultModelId: modelId, segments: updatedSegs })
    onRecalculate()
  }

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-models">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.modelsAssumptions.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.modelsAssumptions.subtitle')}</p>
      </div>

      {/* Calculation mode */}
      <div className="flex flex-col gap-2">
        <Label>Calculation mode</Label>
        <Select
          value={state.calculationMode ?? 'officialGuide'}
          onValueChange={(v) => {
            update({ calculationMode: v as CalculationMode })
            onRecalculate()
          }}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="officialGuide">Official Guide Mode</SelectItem>
            <SelectItem value="advancedDriverAdjusted">Advanced Driver-Adjusted Mode</SelectItem>
            <SelectItem value="customPlanning">Custom Planning Mode</SelectItem>
          </SelectContent>
        </Select>
        {(state.calculationMode ?? 'officialGuide') !== 'officialGuide' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            This mode applies custom planning factors and is not a Microsoft rate card.
          </p>
        )}
      </div>

      {/* Assumption pack */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1">
          {t('wizard.modelsAssumptions.packLabel')}
          <InfoHint hintKey="assumptionPack" />
        </Label>
        <Select value={state.assumptionPackId} onValueChange={handlePackChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {assumptionPacks.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  {p.name}
                  <span className="text-xs text-muted-foreground">v{p.version}</span>
                  {p.isSystemDefault && (
                    <Badge className="text-[10px]">{t('assumptions.systemDefault')}</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isCustomPack && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            {t('assumptions.custom')} — {t('companies.messages.nameDuplicate', { count: 0 })}
          </p>
        )}
        {selectedPack?.disclaimer && (
          <p className="text-xs text-muted-foreground">{selectedPack.disclaimer}</p>
        )}
      </div>

      <Separator />

      {/* Default model */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1">
          {t('wizard.modelsAssumptions.defaultModel')}
          <InfoHint hintKey="preferredModel" />
        </Label>
        <Select value={state.defaultModelId} onValueChange={handleModelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {modelAssumptions.filter((m) => m.isEnabled).map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex items-center gap-2">
                  {m.name}
                  <span className="text-xs text-muted-foreground">{m.modelFactor}×</span>
                  {!m.isOfficiallyDocumented && (
                    <Badge variant="warning" className="text-[10px]">{t('assumptions.notOfficial')}</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(state.calculationMode ?? 'officialGuide') === 'officialGuide' ? (
          <p className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
            {t('wizard.modelsAssumptions.officialGuideModelNote')}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('wizard.modelsAssumptions.globalModel')}</p>
        )}
        <p className="text-xs text-muted-foreground">{t('wizard.modelsAssumptions.modelFactorSource')}</p>
      </div>
    </div>
  )
}
