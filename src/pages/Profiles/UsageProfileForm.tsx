import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoHint } from '@/components/shared/InfoHint'
import type { UsageProfile, UsageLevel } from '@/types/domain'

const LEVELS: UsageLevel[] = ['light', 'medium', 'heavy', 'custom']

interface Props {
  profile?: UsageProfile | null
  models: { id: string; name: string }[]
  onSave: (data: Omit<UsageProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onClose: () => void
}

export function UsageProfileForm({ profile, models, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const isNew = !profile

  const [name, setName] = useState(profile?.name ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [usageLevel, setUsageLevel] = useState<UsageLevel>(profile?.usageLevel ?? 'custom')
  const [lightTasks, setLightTasks] = useState(String(profile?.lightTasksPerUserPerMonth ?? 30))
  const [mediumTasks, setMediumTasks] = useState(String(profile?.mediumTasksPerUserPerMonth ?? 10))
  const [heavyTasks, setHeavyTasks] = useState(String(profile?.heavyTasksPerUserPerMonth ?? 2))
  const [modelId, setModelId] = useState(profile?.defaultModelId ?? 'model-auto')
  const [notes, setNotes] = useState(profile?.notes ?? '')
  const [examples, setExamples] = useState((profile?.examples ?? []).join(', '))
  const [recommendedFor, setRecommendedFor] = useState((profile?.recommendedFor ?? []).join(', '))

  // Advanced factors
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [ctx, setCtx] = useState(String(profile?.contextFactor ?? 1))
  const [tools, setTools] = useState(String(profile?.toolsFactor ?? 1))
  const [runtime, setRuntime] = useState(String(profile?.runtimeFactor ?? 1))
  const [browser, setBrowser] = useState(String(profile?.browserFactor ?? 1))
  const [image, setImage] = useState(String(profile?.imageFactor ?? 1))

  const [errors, setErrors] = useState<Record<string, string>>({})

  const allZero = Number(lightTasks) === 0 && Number(mediumTasks) === 0 && Number(heavyTasks) === 0
  const totalTasks = (Number(lightTasks) || 0) + (Number(mediumTasks) || 0) + (Number(heavyTasks) || 0)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('errors.required') || 'Campo obbligatorio'
    if (Number(lightTasks) < 0 || Number(mediumTasks) < 0 || Number(heavyTasks) < 0) {
      e.tasks = t('profiles.zeroTasksWarning') || 'Task non possono essere negativi'
    }
    const factors = [ctx, tools, runtime, browser, image].map(Number)
    if (factors.some((f) => f < 0)) e.factors = 'I fattori non possono essere negativi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      ...(profile?.id ? { id: profile.id } : {}),
      name: name.trim(),
      description: description.trim() || null,
      usageLevel,
      lightTasksPerUserPerMonth: Number(lightTasks) || 0,
      mediumTasksPerUserPerMonth: Number(mediumTasks) || 0,
      heavyTasksPerUserPerMonth: Number(heavyTasks) || 0,
      defaultModelId: modelId,
      contextFactor: Number(ctx) || 1,
      toolsFactor: Number(tools) || 1,
      runtimeFactor: Number(runtime) || 1,
      browserFactor: Number(browser) || 1,
      imageFactor: Number(image) || 1,
      recommendedFor: recommendedFor.split(',').map((s) => s.trim()).filter(Boolean),
      examples: examples.split(',').map((s) => s.trim()).filter(Boolean),
      notes: notes.trim() || null,
      isSystemDefault: false,
      isEditable: true,
      source: 'manual',
      assumptionPackId: null,
      metadata: {},
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('profiles.new') : `${t('profiles.edit')}: ${profile?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name + level */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-1">
              <Label>{t('profiles.title') || 'Nome'} *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>{t('profiles.usageLevel')}</Label>
              <Select value={usageLevel} onValueChange={(v) => setUsageLevel(v as UsageLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{t(`profiles.levels.${l}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task counts */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t('profiles.lightTasks'), val: lightTasks, set: setLightTasks },
              { label: t('profiles.mediumTasks'), val: mediumTasks, set: setMediumTasks },
              { label: t('profiles.heavyTasks'), val: heavyTasks, set: setHeavyTasks },
            ].map(({ label, val, set }) => (
              <div key={label} className="grid gap-1.5">
                <Label className="text-xs">{label}</Label>
                <Input type="number" min={0} value={val} onChange={(e) => set(e.target.value)} />
              </div>
            ))}
          </div>

          {/* Total + warnings */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2">
            <span>{t('profiles.totalTasks')}: <strong className="text-foreground">{totalTasks}</strong>/mo</span>
            {allZero && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 ml-auto">
                <AlertTriangle className="size-3" />
                {t('profiles.zeroTasksWarning')}
              </span>
            )}
            {Number(heavyTasks) > 50 && (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5 ml-auto">
                <AlertTriangle className="size-3" />
                {t('profiles.highHeavyWarning')}
              </span>
            )}
          </div>

          {/* Model */}
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1">
              {t('segments.preferredModel')}
              <InfoHint hintKey="preferredModel" />
            </Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description + metadata */}
          <div className="grid gap-1.5">
            <Label className="text-xs">{t('companies.description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('profiles.recommendedFor')}</Label>
              <Input value={recommendedFor} onChange={(e) => setRecommendedFor(e.target.value)} placeholder="white collar, sales..." />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('profiles.examples')}</Label>
              <Input value={examples} onChange={(e) => setExamples(e.target.value)} placeholder="report, analisi..." />
            </div>
          </div>

          {/* Advanced factors (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              {t('profiles.advancedFactors')}
            </button>
            {showAdvanced && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'contextFactor', val: ctx, set: setCtx },
                  { key: 'toolsFactor', val: tools, set: setTools },
                  { key: 'runtimeFactor', val: runtime, set: setRuntime },
                  { key: 'browserFactor', val: browser, set: setBrowser },
                  { key: 'imageFactor', val: image, set: setImage },
                ].map(({ key, val, set }) => (
                  <div key={key} className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t(`segments.${key}`)}
                      <InfoHint hintKey="modelFactor" size={11} />
                    </Label>
                    <Input type="number" step={0.1} min={0} value={val} onChange={(e) => set(e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.factors && <p className="text-xs text-destructive">{errors.factors}</p>}

          <div className="grid gap-1.5">
            <Label className="text-xs">{t('companies.notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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
