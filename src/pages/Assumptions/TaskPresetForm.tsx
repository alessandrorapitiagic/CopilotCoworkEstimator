import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { TaskPreset, TaskIntensity, ContextComplexity, ToolsUsage, RuntimeComplexity } from '@/types/domain'

const INTENSITY_OPTIONS: TaskIntensity[] = ['light', 'medium', 'heavy']
const CONTEXT_OPTIONS: ContextComplexity[] = ['low', 'medium', 'high']
const TOOLS_OPTIONS: ToolsUsage[] = ['none', 'light', 'heavy']
const RUNTIME_OPTIONS: RuntimeComplexity[] = ['fast', 'medium', 'slow']

const CATEGORIES = ['general', 'content', 'analysis', 'research', 'automation', 'support', 'sales', 'legal', 'creative']

interface Props {
  preset?: TaskPreset | null
  models: { id: string; name: string }[]
  onSave: (data: Omit<TaskPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onClose: () => void
}

export function TaskPresetForm({ preset, models, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const isNew = !preset

  const [name, setName] = useState(preset?.name ?? '')
  const [description, setDescription] = useState(preset?.description ?? '')
  const [intensity, setIntensity] = useState<TaskIntensity>(preset?.intensity ?? 'medium')
  const [credMin, setCredMin] = useState(String(preset?.defaultCreditsMin ?? 10))
  const [credMid, setCredMid] = useState(String(preset?.defaultCreditsMid ?? 20))
  const [credMax, setCredMax] = useState(String(preset?.defaultCreditsMax ?? 40))
  const [contextCx, setContextCx] = useState<ContextComplexity>(preset?.contextComplexity ?? 'medium')
  const [toolsU, setToolsU] = useState<ToolsUsage>(preset?.toolsUsage ?? 'none')
  const [runtimeCx, setRuntimeCx] = useState<RuntimeComplexity>(preset?.runtimeComplexity ?? 'medium')
  const [browserUsage, setBrowserUsage] = useState(preset?.browserUsage ?? false)
  const [imageUsage, setImageUsage] = useState(preset?.imageUsage ?? false)
  const [category, setCategory] = useState(preset?.category ?? 'general')
  const [notes, setNotes] = useState(preset?.notes ?? '')
  const [selectedModels, setSelectedModels] = useState<string[]>(preset?.recommendedModels ?? ['model-auto'])

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('common.required')
    if (Number(credMin) < 0 || Number(credMid) < 0 || Number(credMax) < 0) e.credits = 'I crediti non possono essere negativi'
    if (Number(credMin) > Number(credMid) || Number(credMid) > Number(credMax)) e.credits = 'I valori devono essere min ≤ mid ≤ max'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function toggleModel(id: string) {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  function handleSave() {
    if (!validate()) return
    onSave({
      ...(preset?.id ? { id: preset.id } : {}),
      name: name.trim(),
      description: description.trim() || null,
      intensity,
      defaultCreditsMin: Number(credMin) || 0,
      defaultCreditsMid: Number(credMid) || 0,
      defaultCreditsMax: Number(credMax) || 0,
      recommendedModels: selectedModels,
      contextComplexity: contextCx,
      toolsUsage: toolsU,
      runtimeComplexity: runtimeCx,
      browserUsage,
      imageUsage,
      notes: notes.trim() || null,
      category: category || null,
      isSystemDefault: false,
      isEditable: true,
      source: 'manual',
      metadata: {},
    })
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? t('assumptions.newPreset') : `${t('assumptions.editPreset')}: ${preset?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Name + intensity + category */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>{t('common.required') === 'Campo obbligatorio' ? 'Nome *' : 'Name *'}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>{t('assumptions.intensity')}</Label>
              <Select value={intensity} onValueChange={(v) => setIntensity(v as TaskIntensity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTENSITY_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>{t(`assumptions.intensity.${i}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t('assumptions.category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`assumptions.categories.${c}`) || c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Credits range */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Min', val: credMin, set: setCredMin },
              { label: 'Mid', val: credMid, set: setCredMid },
              { label: 'Max', val: credMax, set: setCredMax },
            ].map(({ label, val, set }) => (
              <div key={label} className="grid gap-1.5">
                <Label className="text-xs">{t('assumptions.creditsRange')} {label}</Label>
                <Input type="number" min={0} value={val} onChange={(e) => set(e.target.value)} />
              </div>
            ))}
          </div>
          {errors.credits && <p className="text-xs text-destructive">{errors.credits}</p>}

          {/* Context/tools/runtime */}
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('assumptions.contextComplexity')}</Label>
              <Select value={contextCx} onValueChange={(v) => setContextCx(v as ContextComplexity)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTEXT_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{t(`assumptions.contextLevels.${o}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('assumptions.toolsUsage')}</Label>
              <Select value={toolsU} onValueChange={(v) => setToolsU(v as ToolsUsage)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TOOLS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{t(`assumptions.toolsLevels.${o}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">{t('assumptions.runtimeComplexity')}</Label>
              <Select value={runtimeCx} onValueChange={(v) => setRuntimeCx(v as RuntimeComplexity)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RUNTIME_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{t(`assumptions.runtimeLevels.${o}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Browser + Image toggles */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`flex items-center justify-between rounded-lg border p-3 ${browserUsage ? 'border-amber-300 dark:border-amber-700' : ''}`}>
              <div>
                <p className="text-sm font-medium">{t('assumptions.browserUsage')}</p>
                {browserUsage && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                    <AlertTriangle className="size-2.5" />
                    {t('assumptions.browserWarning').slice(0, 40)}…
                  </p>
                )}
              </div>
              <Switch checked={browserUsage} onCheckedChange={setBrowserUsage} />
            </div>
            <div className={`flex items-center justify-between rounded-lg border p-3 ${imageUsage ? 'border-amber-300 dark:border-amber-700' : ''}`}>
              <div>
                <p className="text-sm font-medium">{t('assumptions.imageUsage')}</p>
                {imageUsage && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-0.5 mt-0.5">
                    <AlertTriangle className="size-2.5" />
                    {t('assumptions.imageWarning').slice(0, 40)}…
                  </p>
                )}
              </div>
              <Switch checked={imageUsage} onCheckedChange={setImageUsage} />
            </div>
          </div>

          {/* Recommended models */}
          <div className="grid gap-1.5">
            <Label className="text-sm">Modelli consigliati</Label>
            <div className="flex flex-wrap gap-1">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleModel(m.id)}
                  className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                    selectedModels.includes(m.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground hover:border-foreground/40'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Description + notes */}
          <div className="grid gap-1.5">
            <Label className="text-xs">{t('companies.description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
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
