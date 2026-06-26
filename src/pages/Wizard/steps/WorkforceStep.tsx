import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Layers, RefreshCw, AlertTriangle, Info, Edit } from 'lucide-react'
import { nanoid } from 'nanoid'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/appStore'
import { SegmentForm } from '@/pages/Segments/SegmentForm'
import { SegmentTemplateSelector } from '@/pages/Segments/SegmentTemplateSelector'
import { useWorkforceSummary } from '@/pages/Segments/useWorkforceSummary'
import { SYSTEM_ASSUMPTION_PACK } from '@/lib/systemData'
import { formatNumber } from '@/lib/utils'
import type { WizardState } from '../useWizard'
import type { WorkforceSegment } from '@/types/domain'

interface Props {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  errors: Record<string, string>
}

export function WorkforceStep({ state, update, errors }: Props) {
  const { t } = useTranslation()
  const { companies, usageProfiles, modelAssumptions, assumptionPacks } = useAppStore()
  const [showSegmentForm, setShowSegmentForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingSegment, setEditingSegment] = useState<WorkforceSegment | null>(null)

  const company = companies.find((c) => c.id === state.companyId)
  const totalEmployees = (company?.totalEmployees) ?? (Number(state.newCompanyEmployees) || 0)
  const pack = assumptionPacks.find((p) => p.id === state.assumptionPackId) ?? SYSTEM_ASSUMPTION_PACK
  const defaultProfileId = usageProfiles.find((p) => p.isSystemDefault && p.name === 'Medium')?.id ?? usageProfiles[0]?.id ?? ''

  const { summary } = useWorkforceSummary(
    state.segments,
    totalEmployees,
    pack,
    usageProfiles,
    pack.fundingDefaults.paygPricePerCredit,
  )

  function handleSaveSegment(data: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    const now = new Date().toISOString()
    if (data.id) {
      update({
        segments: state.segments.map((s) =>
          s.id === data.id ? { ...s, ...data, updatedAt: now } : s,
        ),
      })
    } else {
      update({
        segments: [...state.segments, { ...data, id: nanoid(), createdAt: now, updatedAt: now }],
      })
    }
    setShowSegmentForm(false)
    setEditingSegment(null)
  }

  function handleDeleteSegment(id: string) {
    update({ segments: state.segments.filter((s) => s.id !== id) })
  }

  function handleApplyTemplate(segs: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const now = new Date().toISOString()
    const newSegs = segs.map((s) => ({ ...s, id: nanoid(), createdAt: now, updatedAt: now }))
    update({ segments: newSegs })
  }

  function handleUseBaseline() {
    if (!company?.baselineSegments.length) return
    const now = new Date().toISOString()
    const copied = company.baselineSegments.map((s) => ({
      ...s,
      id: nanoid(),
      scenarioId: state.scenarioId,
      source: 'copied' as const,
      createdAt: now,
      updatedAt: now,
    }))
    update({ segments: copied })
  }

  const hasBaseline = (company?.baselineSegments.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-5" data-tour="wizard-workforce">
      <div>
        <h2 className="text-lg font-semibold">{t('wizard.workforce.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('wizard.workforce.subtitle')}</p>
      </div>

      {/* Quick action cards */}
      {state.segments.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {hasBaseline && (
            <button
              onClick={handleUseBaseline}
              className="flex flex-col gap-1 rounded-lg border-2 p-3 text-left text-sm hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <span className="font-semibold flex items-center gap-1.5">
                <RefreshCw className="size-4 text-primary" />
                {t('wizard.workforce.useBaseline')}
              </span>
              <span className="text-xs text-muted-foreground">{t('wizard.workforce.useBaselineDesc')}</span>
            </button>
          )}
          <button
            onClick={() => setShowTemplates(true)}
            className="flex flex-col gap-1 rounded-lg border-2 p-3 text-left text-sm hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <span className="font-semibold flex items-center gap-1.5">
              <Layers className="size-4 text-primary" />
              {t('wizard.workforce.useTemplate')}
            </span>
            <span className="text-xs text-muted-foreground">{t('wizard.workforce.useTemplateDesc')}</span>
          </button>
          <button
            onClick={() => { setEditingSegment(null); setShowSegmentForm(true) }}
            className="flex flex-col gap-1 rounded-lg border-2 p-3 text-left text-sm hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <span className="font-semibold flex items-center gap-1.5">
              <Plus className="size-4 text-primary" />
              {t('wizard.workforce.addManual')}
            </span>
            <span className="text-xs text-muted-foreground">{t('wizard.workforce.addManualDesc')}</span>
          </button>
        </div>
      )}

      {/* Summary mini-bar */}
      {totalEmployees > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 border px-3 py-2 text-xs">
          <span className="text-muted-foreground">Azienda: <strong className="text-foreground">{formatNumber(totalEmployees)}</strong></span>
          <span className="text-muted-foreground">Segmentati: <strong className={summary.segmentOverTotal ? 'text-destructive' : 'text-foreground'}>{formatNumber(summary.totalSegmentedHeadcount)}</strong></span>
          {summary.unclassifiedEmployees > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
              <Info className="size-3" />
              {formatNumber(summary.unclassifiedEmployees)} non classificati
            </span>
          )}
          {summary.segmentOverTotal && (
            <span className="text-destructive flex items-center gap-0.5">
              <AlertTriangle className="size-3" />
              Supera il totale
            </span>
          )}
          <span className="text-muted-foreground">Abilitati: <strong className="text-foreground">{formatNumber(summary.totalEnabledUsers)}</strong></span>
          <span className="text-muted-foreground">Attivi: <strong className="text-foreground">{formatNumber(summary.totalActiveUsers)}</strong></span>
        </div>
      )}

      {/* Segments list */}
      {state.segments.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{state.segments.length} {state.segments.length === 1 ? 'segmento' : 'segmenti'}</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)}>
                <Layers className="size-4" />
              </Button>
              <Button size="sm" onClick={() => { setEditingSegment(null); setShowSegmentForm(true) }}>
                <Plus className="size-4" /> {t('segments.addSegment')}
              </Button>
            </div>
          </div>

          {state.segments.map((seg) => {
            const profile = usageProfiles.find((p) => p.id === seg.usageProfileId)
            return (
              <Card key={seg.id} className={seg.includeInCalculation ? '' : 'opacity-60'}>
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{seg.name}</p>
                      {!seg.includeInCalculation && (
                        <Badge variant="outline" className="text-[10px]">{t('segments.excluded')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(seg.headcount)} · {seg.enabledPercentage}% ab. · {seg.activeUsagePercentage}% att.
                      {profile ? ` · ${profile.name}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7"
                      onClick={() => { setEditingSegment(seg); setShowSegmentForm(true) }}>
                      <Edit className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSegment(seg.id)}>
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {errors.segments && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="size-3" /> {errors.segments}
        </p>
      )}

      {showSegmentForm && (
        <SegmentForm
          segment={editingSegment}
          companyId={state.companyId || 'wizard'}
          scenarioId={state.scenarioId}
          profiles={usageProfiles}
          models={modelAssumptions}
          defaultProfileId={defaultProfileId}
          defaultModelId="model-auto"
          onSave={handleSaveSegment}
          onClose={() => { setShowSegmentForm(false); setEditingSegment(null) }}
        />
      )}

      {showTemplates && (
        <SegmentTemplateSelector
          profiles={usageProfiles}
          models={modelAssumptions}
          companyId={state.companyId || 'wizard'}
          scenarioId={state.scenarioId}
          totalEmployees={totalEmployees}
          onApply={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}
