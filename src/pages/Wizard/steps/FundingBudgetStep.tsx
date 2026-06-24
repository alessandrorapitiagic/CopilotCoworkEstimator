import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { InfoHint } from '@/components/shared/InfoHint'

import type { WizardState } from '../useWizard'
import type { FundingMode } from '@/types/domain'

const FUNDING_MODES: FundingMode[] = ['payg', 'prepaid', 'existing_capacity', 'blended']

interface Props {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  onRecalculate: () => void
}

export function FundingBudgetStep({ state, update, onRecalculate }: Props) {
  const { t } = useTranslation()

  function handleChange(patch: Partial<WizardState>) {
    update(patch)
    onRecalculate()
  }

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-funding">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.fundingBudget.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.fundingBudget.subtitle')}</p>
      </div>

      {/* Funding mode */}
      <div className="grid gap-1.5">
        <Label>{t('wizard.fundingBudget.modeLabel')}</Label>
        <Select value={state.fundingMode} onValueChange={(v) => handleChange({ fundingMode: v as FundingMode })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUNDING_MODES.map((m) => (
              <SelectItem key={m} value={m}>{t(`funding.mode.${m}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price per credit */}
      <div className="grid gap-1.5">
        <Label htmlFor="wiz-price" className="flex items-center gap-1">
          {t('wizard.fundingBudget.priceLabel', { currency: state.currency })}
          <InfoHint hintKey="pricePerCredit" />
        </Label>
        <Input
          id="wiz-price"
          type="number"
          step={0.001}
          min={0}
          value={state.pricePerCredit}
          onChange={(e) => handleChange({ pricePerCredit: e.target.value })}
        />
      </div>

      {/* Existing capacity */}
      {(state.fundingMode === 'existing_capacity' || state.fundingMode === 'blended') && (
        <div className="grid gap-1.5">
          <Label htmlFor="wiz-existing" className="flex items-center gap-1">
            {t('wizard.fundingBudget.existingLabel')}
            <InfoHint hintKey="existingCredits" />
          </Label>
          <Input
            id="wiz-existing"
            type="number"
            min={0}
            value={state.existingCredits}
            onChange={(e) => handleChange({ existingCredits: e.target.value })}
          />
        </div>
      )}

      {/* Prepaid */}
      {(state.fundingMode === 'prepaid' || state.fundingMode === 'blended') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="wiz-prepaid" className="flex items-center gap-1">
              {t('wizard.fundingBudget.prepaidLabel')}
              <InfoHint hintKey="prepaidCredits" />
            </Label>
            <Input
              id="wiz-prepaid"
              type="number"
              min={0}
              value={state.prepaidCredits}
              onChange={(e) => handleChange({ prepaidCredits: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wiz-discount" className="flex items-center gap-1">
              {t('wizard.fundingBudget.discountLabel')}
              <InfoHint hintKey="discount" />
            </Label>
            <Input
              id="wiz-discount"
              type="number"
              min={0}
              max={100}
              value={state.discountPct}
              onChange={(e) => handleChange({ discountPct: e.target.value })}
            />
          </div>
        </div>
      )}

      <Separator />

      {/* Budget guardrails */}
      <div>
        <p className="text-sm font-medium mb-3">{t('funding.budgetMonthly')} <span className="text-muted-foreground text-xs">({t('wizard.fundingBudget.budgetOptional')})</span></p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="wiz-bm" className="flex items-center gap-1">
              {t('wizard.fundingBudget.budgetMonthlyLabel')}
              <InfoHint hintKey="monthlyBudget" />
            </Label>
            <Input
              id="wiz-bm"
              type="number"
              min={0}
              value={state.budgetMonthly}
              onChange={(e) => update({ budgetMonthly: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wiz-ba">{t('wizard.fundingBudget.budgetAnnualLabel')}</Label>
            <Input
              id="wiz-ba"
              type="number"
              min={0}
              value={state.budgetAnnual}
              onChange={(e) => update({ budgetAnnual: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
