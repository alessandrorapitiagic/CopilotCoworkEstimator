import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoHint } from '@/components/shared/InfoHint'
import type { WizardState } from '../useWizard'
import type { Industry } from '@/types/domain'

const INDUSTRIES: Industry[] = [
  'technology', 'finance', 'healthcare', 'retail', 'manufacturing',
  'professional_services', 'education', 'government', 'energy', 'media', 'other',
]

interface Props {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
}

export function CompanyInfoStep({ state, update, errors }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-company">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.companyInfo.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.companyInfo.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="wiz-co-name">{t('companies.name')} *</Label>
          <Input
            id="wiz-co-name"
            value={state.newCompanyName}
            onChange={(e) => update({ newCompanyName: e.target.value })}
            aria-invalid={!!errors.newCompanyName}
          />
          {errors.newCompanyName && <p className="text-xs text-destructive">{errors.newCompanyName}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="wiz-co-emp" className="flex items-center gap-1">
            {t('companies.totalEmployees')} *
            <InfoHint hintKey="totalEmployees" />
          </Label>
          <Input
            id="wiz-co-emp"
            type="number"
            min={1}
            value={state.newCompanyEmployees}
            onChange={(e) => update({ newCompanyEmployees: e.target.value })}
            aria-invalid={!!errors.newCompanyEmployees}
          />
          {errors.newCompanyEmployees && <p className="text-xs text-destructive">{errors.newCompanyEmployees}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="wiz-co-ind">{t('companies.industry')}</Label>
          <Select
            value={state.newCompanyIndustry}
            onValueChange={(v) => update({ newCompanyIndustry: v as Industry })}
          >
            <SelectTrigger id="wiz-co-ind">
              <SelectValue placeholder={t('common.optional')} />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>{t(`industries.${i}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="wiz-co-country">{t('companies.country')}</Label>
          <Input
            id="wiz-co-country"
            value={state.newCompanyCountry}
            onChange={(e) => update({ newCompanyCountry: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
