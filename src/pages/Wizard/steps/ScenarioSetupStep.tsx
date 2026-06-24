import { useTranslation } from 'react-i18next'
import { Building2, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
}

export function ScenarioSetupStep({ state, update, errors }: Props) {
  const { t } = useTranslation()
  const { companies, scenarios } = useAppStore()
  const activeCompanies = companies.filter((c) => c.status === 'active')

  // Check duplicate scenario name (non-blocking)
  const isDupName = scenarios.some(
    (s) => s.name.trim().toLowerCase() === state.scenarioName.trim().toLowerCase(),
  )

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-step1">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.scenarioSetup.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.step', { current: 1, total: 7 })}</p>
      </div>

      {/* Scenario name */}
      <div className="grid gap-1.5">
        <Label htmlFor="wiz-name">{t('wizard.scenarioSetup.nameLabel')}</Label>
        <Input
          id="wiz-name"
          value={state.scenarioName}
          onChange={(e) => update({ scenarioName: e.target.value })}
          placeholder={t('wizard.scenarioSetup.namePlaceholder')}
          aria-invalid={!!errors.scenarioName}
        />
        {errors.scenarioName && (
          <p className="text-xs text-destructive">{errors.scenarioName}</p>
        )}
        {isDupName && !errors.scenarioName && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="size-3" />
            {t('wizard.scenarioSetup.nameDuplicate')}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="grid gap-1.5">
        <Label htmlFor="wiz-desc">{t('wizard.scenarioSetup.descLabel')}</Label>
        <Textarea
          id="wiz-desc"
          value={state.scenarioDescription}
          onChange={(e) => update({ scenarioDescription: e.target.value })}
          rows={2}
        />
      </div>

      {/* Company selection */}
      <div className="flex flex-col gap-3">
        <Label>{t('wizard.scenarioSetup.companyMode')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {(['existing', 'new'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => update({ companyMode: mode })}
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors text-left ${
                state.companyMode === mode
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/30'
              }`}
            >
              <Building2 className={`size-4 shrink-0 ${state.companyMode === mode ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>
                {mode === 'existing' ? t('wizard.scenarioSetup.existing') : t('wizard.scenarioSetup.newCompany')}
              </span>
            </button>
          ))}
        </div>

        {state.companyMode === 'existing' && (
          <div className="grid gap-1.5">
            <Select
              value={state.companyId}
              onValueChange={(v) => update({ companyId: v })}
            >
              <SelectTrigger aria-invalid={!!errors.companyId}>
                <SelectValue placeholder={t('wizard.scenarioSetup.selectCompany')} />
              </SelectTrigger>
              <SelectContent>
                {activeCompanies.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t('wizard.scenarioSetup.noCompanies')}
                  </div>
                ) : (
                  activeCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {c.name}
                        <Badge variant="secondary" className="text-[10px]">
                          {c.totalEmployees.toLocaleString()} emp.
                        </Badge>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.companyId && <p className="text-xs text-destructive">{errors.companyId}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
