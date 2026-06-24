import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { InfoHint } from '@/components/shared/InfoHint'
import type {
  WorkforceSegment, UsageProfile, ModelAssumption, SegmentCategoryType,
} from '@/types/domain'

const CATEGORY_TYPES: SegmentCategoryType[] = [
  'manager', 'whiteCollar', 'blueCollar', 'sales', 'customerCare',
  'legal', 'finance', 'hr', 'it', 'operations', 'fieldWorkers', 'custom',
]

// Default enabled/active percentages per category
const CATEGORY_DEFAULTS: Record<SegmentCategoryType, { enabledPct: number; activePct: number }> = {
  manager: { enabledPct: 80, activePct: 70 },
  whiteCollar: { enabledPct: 60, activePct: 50 },
  blueCollar: { enabledPct: 20, activePct: 15 },
  sales: { enabledPct: 80, activePct: 65 },
  customerCare: { enabledPct: 70, activePct: 60 },
  legal: { enabledPct: 90, activePct: 75 },
  finance: { enabledPct: 75, activePct: 60 },
  hr: { enabledPct: 70, activePct: 55 },
  it: { enabledPct: 100, activePct: 85 },
  operations: { enabledPct: 40, activePct: 30 },
  fieldWorkers: { enabledPct: 25, activePct: 20 },
  custom: { enabledPct: 60, activePct: 50 },
}

interface Props {
  segment?: WorkforceSegment | null  // null = new segment
  companyId: string
  scenarioId: string | null
  profiles: UsageProfile[]
  models: ModelAssumption[]
  defaultProfileId: string
  defaultModelId: string
  onSave: (segment: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onClose: () => void
}

export function SegmentForm({
  segment, companyId, scenarioId, profiles, models,
  defaultProfileId, defaultModelId, onSave, onClose,
}: Props) {
  const { t } = useTranslation()
  const isNew = !segment

  // Basic fields
  const [name, setName] = useState(segment?.name ?? '')
  const [description, setDescription] = useState(segment?.description ?? '')
  const [categoryType, setCategoryType] = useState<SegmentCategoryType>(segment?.categoryType ?? 'custom')
  const [headcount, setHeadcount] = useState(String(segment?.headcount ?? '100'))
  const [enabledPct, setEnabledPct] = useState(String(segment?.enabledPercentage ?? 60))
  const [activePct, setActivePct] = useState(String(segment?.activeUsagePercentage ?? 50))
  const [profileId, setProfileId] = useState(segment?.usageProfileId ?? defaultProfileId)
  const [modelId, setModelId] = useState(segment?.preferredModelId ?? defaultModelId)
  const [includeInCalc, setIncludeInCalc] = useState(segment?.includeInCalculation !== false)
  const [rolloutPhase, setRolloutPhase] = useState(segment?.rolloutPhase ?? '')
  const [notes, setNotes] = useState(segment?.notes ?? '')

  // Task mix
  const [taskMixMode, setTaskMixMode] = useState<'profile' | 'custom'>(segment?.taskMixMode ?? 'profile')
  const [lightTasks, setLightTasks] = useState(String(segment?.customTaskMix?.lightTasksPerUserPerMonth ?? ''))
  const [mediumTasks, setMediumTasks] = useState(String(segment?.customTaskMix?.mediumTasksPerUserPerMonth ?? ''))
  const [heavyTasks, setHeavyTasks] = useState(String(segment?.customTaskMix?.heavyTasksPerUserPerMonth ?? ''))

  // Factor overrides
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [ctxOverride, setCtxOverride] = useState(String(segment?.contextFactorOverride ?? ''))
  const [toolsOverride, setToolsOverride] = useState(String(segment?.toolsFactorOverride ?? ''))
  const [rtOverride, setRtOverride] = useState(String(segment?.runtimeFactorOverride ?? ''))
  const [brOverride, setBrOverride] = useState(String(segment?.browserFactorOverride ?? ''))
  const [imgOverride, setImgOverride] = useState(String(segment?.imageFactorOverride ?? ''))

  const [errors, setErrors] = useState<Record<string, string>>({})

  // When category changes, apply smart defaults for new segments
  function onCategoryChange(cat: SegmentCategoryType) {
    setCategoryType(cat)
    if (isNew) {
      const defs = CATEGORY_DEFAULTS[cat]
      setEnabledPct(String(defs.enabledPct))
      setActivePct(String(defs.activePct))
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('segments.warnings.nameEmpty')
    const hc = Number(headcount)
    if (!headcount || isNaN(hc) || hc < 0) e.headcount = t('segments.warnings.headcountNegative')
    if (!Number.isInteger(hc)) e.headcount = t('segments.warnings.headcountDecimal')
    const ep = Number(enabledPct)
    if (isNaN(ep) || ep < 0 || ep > 100) e.enabledPct = t('segments.warnings.percentageInvalid')
    const ap = Number(activePct)
    if (isNaN(ap) || ap < 0 || ap > 100) e.activePct = t('segments.warnings.percentageInvalid')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const floatOrNull = (v: string) => v.trim() ? Number(v) : null

    onSave({
      ...(segment?.id ? { id: segment.id } : {}),
      companyId,
      scenarioId,
      name: name.trim(),
      description: description.trim() || null,
      categoryType,
      headcount: Math.floor(Number(headcount)),
      enabledPercentage: Number(enabledPct),
      activeUsagePercentage: Number(activePct),
      usageProfileId: profileId,
      preferredModelId: modelId,
      taskMixMode,
      customTaskMix: taskMixMode === 'custom' ? {
        lightTasksPerUserPerMonth: Number(lightTasks) || 0,
        mediumTasksPerUserPerMonth: Number(mediumTasks) || 0,
        heavyTasksPerUserPerMonth: Number(heavyTasks) || 0,
      } : null,
      taskMix: [],
      contextFactorOverride: floatOrNull(ctxOverride),
      toolsFactorOverride: floatOrNull(toolsOverride),
      runtimeFactorOverride: floatOrNull(rtOverride),
      browserFactorOverride: floatOrNull(brOverride),
      imageFactorOverride: floatOrNull(imgOverride),
      rolloutPhase: rolloutPhase.trim() || null,
      includeInCalculation: includeInCalc,
      notes: notes.trim() || null,
      source: 'manual',
      metadata: {},
    })
  }

  const hasOverrides = [ctxOverride, toolsOverride, rtOverride, brOverride, imgOverride].some((v) => v.trim())
  const isCustomMix = taskMixMode === 'custom'
  const selectedProfile = profiles.find((p) => p.id === profileId)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('segments.addSegment') : `${t('common.edit')}: ${segment?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Category + name */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="seg-category">{t('segments.categoryType')}</Label>
              <Select value={categoryType} onValueChange={(v) => onCategoryChange(v as SegmentCategoryType)}>
                <SelectTrigger id="seg-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`segments.categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seg-name">{t('segments.name')} *</Label>
              <Input
                id="seg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
          </div>

          {/* Headcount */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="seg-hc" className="flex items-center gap-1">
                {t('segments.headcount')} *
                <InfoHint hintKey="headcount" />
              </Label>
              <Input
                id="seg-hc"
                type="number"
                min={0}
                step={1}
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
                aria-invalid={!!errors.headcount}
              />
              {errors.headcount && <p className="text-xs text-destructive">{errors.headcount}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seg-ep" className="flex items-center gap-1">
                {t('segments.enabledPct')} %
                <InfoHint hintKey="enabledPct" />
              </Label>
              <Input
                id="seg-ep"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={enabledPct}
                onChange={(e) => setEnabledPct(e.target.value)}
                aria-invalid={!!errors.enabledPct}
              />
              {errors.enabledPct && <p className="text-xs text-destructive">{errors.enabledPct}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="seg-ap" className="flex items-center gap-1">
                {t('segments.activePct')} %
                <InfoHint hintKey="activePct" />
              </Label>
              <Input
                id="seg-ap"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={activePct}
                onChange={(e) => setActivePct(e.target.value)}
                aria-invalid={!!errors.activePct}
              />
              {errors.activePct && <p className="text-xs text-destructive">{errors.activePct}</p>}
            </div>
          </div>

          {/* Live preview */}
          {headcount && enabledPct && activePct && (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 border p-2 text-xs text-center">
              <div>
                <p className="text-muted-foreground">HC</p>
                <p className="font-bold">{Math.floor(Number(headcount)) || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('segments.enabledUsers')}</p>
                <p className="font-bold text-primary">
                  {Math.floor((Number(headcount) * Number(enabledPct)) / 100) || 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('segments.activeUsers')}</p>
                <p className="font-bold text-primary">
                  {Math.floor(((Number(headcount) * Number(enabledPct)) / 100) * (Number(activePct) / 100)) || 0}
                </p>
              </div>
            </div>
          )}

          {/* Profile + model */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1">
                {t('segments.usageProfile')} *
                <InfoHint hintKey="usageProfile" />
              </Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1">
                {t('segments.preferredModel')}
                <InfoHint hintKey="preferredModel" />
              </Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.filter((m) => m.isEnabled).map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task mix */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                {t('segments.taskMixMode')}
                <InfoHint hintKey="usageProfile" />
              </Label>
              <div className="flex gap-1">
                {(['profile', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTaskMixMode(mode)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      taskMixMode === mode
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(`segments.taskMix${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>
            {isCustomMix && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: t('segments.lightTasks'), val: lightTasks, set: setLightTasks },
                  { label: t('segments.mediumTasks'), val: mediumTasks, set: setMediumTasks },
                  { label: t('segments.heavyTasks'), val: heavyTasks, set: setHeavyTasks },
                ].map(({ label, val, set }) => (
                  <div key={label} className="grid gap-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min={0} value={val} onChange={(e) => set(e.target.value)} />
                  </div>
                ))}
              </div>
            )}
            {!isCustomMix && selectedProfile && (
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Light: <span className="font-medium text-foreground">{selectedProfile.lightTasksPerUserPerMonth}/mo</span></div>
                <div>Medium: <span className="font-medium text-foreground">{selectedProfile.mediumTasksPerUserPerMonth}/mo</span></div>
                <div>Heavy: <span className="font-medium text-foreground">{selectedProfile.heavyTasksPerUserPerMonth}/mo</span></div>
              </div>
            )}
          </div>

          {/* Include in calculation + rollout phase */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{t('segments.includeInCalc')}</p>
              {!includeInCalc && (
                <p className="text-xs text-muted-foreground">{t('segments.warnings.excluded')}</p>
              )}
            </div>
            <Switch checked={includeInCalc} onCheckedChange={setIncludeInCalc} />
          </div>

          {/* Advanced assumptions (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              {t('segments.advancedAssumptions')}
              {hasOverrides && <Badge variant="warning" className="text-[10px]">custom</Badge>}
            </button>

            {showAdvanced && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'contextFactor', val: ctxOverride, set: setCtxOverride },
                  { key: 'toolsFactor', val: toolsOverride, set: setToolsOverride },
                  { key: 'runtimeFactor', val: rtOverride, set: setRtOverride },
                  { key: 'browserFactor', val: brOverride, set: setBrOverride },
                  { key: 'imageFactor', val: imgOverride, set: setImgOverride },
                ].map(({ key, val, set }) => (
                  <div key={key} className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t(`segments.${key}`)}
                      <InfoHint hintKey="modelFactor" />
                    </Label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      placeholder="auto"
                    />
                  </div>
                ))}
                <div className="grid gap-1">
                  <Label className="text-xs">{t('segments.rolloutPhase')}</Label>
                  <Input
                    value={rolloutPhase}
                    onChange={(e) => setRolloutPhase(e.target.value)}
                    placeholder="Phase 1, Pilot..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Description + notes */}
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('segments.description')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('segments.notes')}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
