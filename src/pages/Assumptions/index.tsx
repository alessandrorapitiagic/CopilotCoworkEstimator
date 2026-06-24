import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Copy, Edit, Trash2, AlertTriangle, Search,
  Zap, BookOpen, Cpu,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { InfoHint } from '@/components/shared/InfoHint'
import { TaskPresetForm } from './TaskPresetForm'

import type { TaskPreset, ModelAssumption } from '@/types/domain'

const INTENSITY_COLORS = {
  light: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  heavy: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

const MODEL_CLASS_COLORS: Record<string, string> = {
  auto: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  standard: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  advanced: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  frontier: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  image: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
}

export default function Assumptions() {
  const { t } = useTranslation()
  const {
    taskPresets, modelAssumptions, assumptionPacks,
    addTaskPreset, updateTaskPreset, duplicateTaskPreset, deleteTaskPreset,
    updateModelAssumption, toggleModelEnabled,
  } = useAppStore()

  const [search, setSearch] = useState('')
  const [filterIntensity, setFilterIntensity] = useState<string>('all')
  const [formTarget, setFormTarget] = useState<TaskPreset | null | 'new'>(null)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editingFactor, setEditingFactor] = useState<string>('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handlePresetSave(data: Omit<TaskPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    if (data.id) {
      updateTaskPreset(data.id, data)
      showToast(t('assumptions.presetSaved'))
    } else {
      addTaskPreset(data)
      showToast(t('assumptions.presetSaved'))
    }
    setFormTarget(null)
  }

  function handlePresetDelete(preset: TaskPreset) {
    if (preset.isSystemDefault) { showToast(t('assumptions.deletePresetError')); return }
    if (!confirm(`Eliminare il preset "${preset.name}"?`)) return
    const res = deleteTaskPreset(preset.id)
    if (res.success) showToast(t('assumptions.presetDeleted'))
  }

  function handleModelFactorSave(model: ModelAssumption) {
    const factor = parseFloat(editingFactor)
    if (isNaN(factor) || factor < 0) return
    updateModelAssumption(model.id, { modelFactor: factor })
    setEditingModel(null)
    showToast(t('assumptions.modelFactorUpdated'))
  }

  // ---- Filtered presets ----
  const filteredPresets = taskPresets.filter((p) => {
    const q = search.trim().toLowerCase()
    if (filterIntensity !== 'all' && p.intensity !== filterIntensity) return false
    return !q || p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 text-sm shadow">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('nav.assumptions')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Task preset, modelli AI e assumption pack per il calcolo dei crediti.
        </p>
      </div>

      <Tabs defaultValue="tasks" data-tour="assumptions-tabs">
        <TabsList>
          <TabsTrigger value="tasks">
            <Zap className="size-4 mr-1.5" />
            {t('assumptions.taskPresets')}
          </TabsTrigger>
          <TabsTrigger value="models">
            <Cpu className="size-4 mr-1.5" />
            {t('assumptions.models')}
          </TabsTrigger>
          <TabsTrigger value="packs">
            <BookOpen className="size-4 mr-1.5" />
            {t('assumptions.packs')}
          </TabsTrigger>
        </TabsList>

        {/* ---- TASK PRESETS tab ---- */}
        <TabsContent value="tasks" className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <div className="flex gap-1">
                {['all', 'light', 'medium', 'heavy'].map((f) => (
                  <Button
                    key={f}
                    variant={filterIntensity === f ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterIntensity(f)}
                  >
                    {f === 'all' ? 'Tutti' : t(`assumptions.intensity.${f}`)}
                  </Button>
                ))}
              </div>
            </div>
            <Button size="sm" onClick={() => setFormTarget('new')} data-tour="tasks-new">
              <Plus className="size-4" />
              {t('assumptions.newPreset')}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-tour="tasks-list">
            {filteredPresets.map((preset) => (
              <Card key={preset.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm flex items-center gap-1.5 flex-wrap">
                        {preset.name}
                        {preset.isSystemDefault && (
                          <Badge variant="secondary" className="text-[10px]">System</Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${INTENSITY_COLORS[preset.intensity]}`}>
                          {t(`assumptions.intensity.${preset.intensity}`)}
                        </span>
                        {preset.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {t(`assumptions.categories.${preset.category}`) || preset.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {preset.description && (
                    <CardDescription className="text-xs mt-1">{preset.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {/* Credits range */}
                  <div className="grid grid-cols-3 gap-1 text-xs text-center">
                    {[
                      { label: 'Min', val: preset.defaultCreditsMin },
                      { label: 'Mid', val: preset.defaultCreditsMid },
                      { label: 'Max', val: preset.defaultCreditsMax },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded bg-muted/40 p-1">
                        <p className="text-muted-foreground text-[10px]">{label}</p>
                        <p className="font-bold">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Drivers */}
                  <div className="flex flex-wrap gap-1">
                    {preset.contextComplexity !== 'low' && (
                      <Badge variant="outline" className="text-[10px]">
                        ctx: {t(`assumptions.contextLevels.${preset.contextComplexity}`)}
                      </Badge>
                    )}
                    {preset.toolsUsage !== 'none' && (
                      <Badge variant="outline" className="text-[10px]">
                        tools: {t(`assumptions.toolsLevels.${preset.toolsUsage}`)}
                      </Badge>
                    )}
                    {preset.browserUsage && (
                      <Badge variant="warning" className="text-[10px]">browser</Badge>
                    )}
                    {preset.imageUsage && (
                      <Badge variant="warning" className="text-[10px]">image</Badge>
                    )}
                  </div>

                  {/* Browser/image warnings */}
                  {preset.browserUsage && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <AlertTriangle className="size-2.5" />
                      {t('assumptions.browserWarning')}
                    </p>
                  )}
                  {preset.imageUsage && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <AlertTriangle className="size-2.5" />
                      {t('assumptions.imageWarning')}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-0.5 pt-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7"
                          onClick={() => duplicateTaskPreset(preset.id) && showToast(t('assumptions.presetDuplicated'))}>
                          <Copy className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('common.duplicate')}</TooltipContent>
                    </Tooltip>
                    {!preset.isSystemDefault && (
                      <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7"
                              onClick={() => setFormTarget(preset)}>
                              <Edit className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('common.edit')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                              onClick={() => handlePresetDelete(preset)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('common.delete')}</TooltipContent>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---- MODELS tab ---- */}
        <TabsContent value="models" className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            I model factor sono assunzioni indicative e non rappresentano pricing ufficiale Microsoft.
            <InfoHint hintKey="modelFactor" />
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-tour="models-list">
            {modelAssumptions.map((model) => (
              <Card key={model.id} className={!model.isEnabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm">{model.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{model.provider}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MODEL_CLASS_COLORS[model.modelClass] ?? ''}`}>
                        {model.modelClass}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Switch
                              checked={model.isEnabled}
                              onCheckedChange={() => {
                                toggleModelEnabled(model.id)
                                showToast(model.isEnabled ? t('assumptions.modelDisabled') : t('assumptions.modelEnabled'))
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {model.isEnabled ? 'Disabilita modello' : 'Abilita modello'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {model.description && (
                    <p className="text-xs text-muted-foreground">{model.description}</p>
                  )}

                  {/* Model factor (editable if model.isEditable) */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {t('assumptions.modelFactor')}
                      <InfoHint hintKey="modelFactor" size={11} />
                    </span>
                    {editingModel === model.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step={0.1}
                          min={0}
                          value={editingFactor}
                          onChange={(e) => setEditingFactor(e.target.value)}
                          className="h-7 w-20 text-xs"
                        />
                        <Button size="icon" className="size-7" onClick={() => handleModelFactorSave(model)}>✓</Button>
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditingModel(null)}>✕</Button>
                      </div>
                    ) : (
                      <button
                        className={`text-sm font-bold text-primary ${model.isEditable ? 'hover:underline cursor-pointer' : ''}`}
                        onClick={() => {
                          if (!model.isEditable) return
                          setEditingModel(model.id)
                          setEditingFactor(String(model.modelFactor))
                        }}
                      >
                        {model.modelFactor}×
                        {model.isEditable && <Edit className="inline size-2.5 ml-0.5 opacity-50" />}
                      </button>
                    )}
                  </div>

                  {/* Official/unofficial badge */}
                  <div className="flex items-center gap-1">
                    {model.isOfficiallyDocumented ? (
                      <Badge variant="success" className="text-[10px]">{t('assumptions.isOfficial')}</Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">{t('assumptions.notOfficial')}</Badge>
                    )}
                  </div>

                  {model.availabilityNotes && (
                    <p className="text-[10px] text-muted-foreground italic">{model.availabilityNotes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ---- ASSUMPTION PACKS tab ---- */}
        <TabsContent value="packs" className="flex flex-col gap-4">
          {assumptionPacks.map((pack) => (
            <Card key={pack.id}>
              <CardHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-base">{pack.name}</CardTitle>
                  <Badge variant="secondary">v{pack.version}</Badge>
                  {pack.isSystemDefault && <Badge>{t('assumptions.systemDefault')}</Badge>}
                </div>
                <CardDescription>{pack.description}</CardDescription>
                {pack.source && (
                  <p className="text-xs text-muted-foreground">
                    {t('assumptions.source')}: {pack.source}
                    {pack.sourceDate ? ` · ${pack.sourceDate}` : ''}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Credit bands */}
                <div>
                  <p className="text-sm font-semibold mb-2">{t('assumptions.creditBands')}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['light', 'medium', 'heavy'] as const).map((int) => (
                      <div key={int} className="rounded-lg border p-3 bg-muted/30">
                        <p className={`font-semibold text-sm mb-1 capitalize`}>
                          <span className={`px-1.5 py-0.5 rounded-full ${INTENSITY_COLORS[int]}`}>
                            {t(`assumptions.intensity.${int}`)}
                          </span>
                        </p>
                        <p className="text-muted-foreground">Min: <span className="text-foreground font-medium">{pack.creditBands[`${int}Min` as keyof typeof pack.creditBands]}</span></p>
                        <p className="text-muted-foreground">Mid: <span className="text-foreground font-medium">{pack.creditBands[`${int}Mid` as keyof typeof pack.creditBands]}</span></p>
                        <p className="text-muted-foreground">Max: <span className="text-foreground font-medium">{pack.creditBands[`${int}Max` as keyof typeof pack.creditBands]}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factors */}
                <div>
                  <p className="text-sm font-semibold mb-2">{t('assumptions.factors')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(pack.factors).map(([key, value]) => (
                      <div key={key} className="rounded border px-2 py-1.5 flex justify-between">
                        <span className="text-muted-foreground truncate">{key}</span>
                        <span className="font-semibold ml-2">{value}×</span>
                      </div>
                    ))}
                  </div>
                </div>

                {pack.disclaimer && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{pack.disclaimer}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Task Preset Form */}
      {formTarget !== null && (
        <TaskPresetForm
          preset={formTarget === 'new' ? null : formTarget}
          models={modelAssumptions.filter((m) => m.isEnabled)}
          onSave={handlePresetSave}
          onClose={() => setFormTarget(null)}
        />
      )}
    </div>
  )
}
