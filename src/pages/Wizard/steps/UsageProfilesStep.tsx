import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'
import { formatNumber } from '@/lib/utils'
import type { WizardState } from '../useWizard'

interface Props {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
}

export function UsageProfilesStep({ state, update }: Props) {
  const { t } = useTranslation()
  const { usageProfiles } = useAppStore()

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-profiles">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.usageProfiles.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.usageProfiles.subtitle')}</p>
      </div>

      {/* Per-segment profile assignments */}
      <div className="flex flex-col gap-3">
        {state.segments.filter((s) => s.includeInCalculation).map((seg) => {
          const profile = usageProfiles.find((p) => p.id === seg.usageProfileId)
          const enabled = Math.floor((seg.headcount * seg.enabledPercentage) / 100)
          const active = Math.floor((enabled * seg.activeUsagePercentage) / 100)

          return (
            <div key={seg.id} className="rounded-lg border p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{seg.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(seg.headcount)} persone · {formatNumber(active)} attivi
                  </p>
                </div>
                <Badge variant="secondary">{profile?.name ?? '—'}</Badge>
              </div>

              <Select
                value={seg.usageProfileId}
                onValueChange={(v) => {
                  update({
                    segments: state.segments.map((s) =>
                      s.id === seg.id ? { ...s, usageProfileId: v } : s,
                    ),
                  })
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {usageProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        {p.name}
                        {p.isSystemDefault && (
                          <span className="text-xs text-muted-foreground">
                            ({p.lightTasksPerUserPerMonth}L / {p.mediumTasksPerUserPerMonth}M / {p.heavyTasksPerUserPerMonth}H)
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        })}
      </div>

      {state.segments.filter((s) => s.includeInCalculation).length === 0 && (
        <p className="text-sm text-muted-foreground">Nessun segmento incluso nel calcolo.</p>
      )}
    </div>
  )
}
