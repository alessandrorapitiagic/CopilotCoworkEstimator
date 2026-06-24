import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Copy, Edit, Trash2, AlertTriangle, Search,
  Zap, BookOpen, Cpu, Star, StarOff,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { InfoHint } from '@/components/shared/InfoHint'
import { TaskPresetForm } from './TaskPresetForm'
import { AssumptionPackForm } from './AssumptionPackForm'

import type { TaskPreset, ModelAssumption, AssumptionPack } from '@/types/domain'

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
    taskPresets, modelAssumptions, assumptionPacks, scenarios,
    addTaskPreset, updateTaskPreset, duplicateTaskPreset, deleteTaskPreset,
    updateModelAssumption, toggleModelEnabled,
    addAssumptionPack, updateAssumptionPack, duplicateAssumptionPack,
    deleteAssumptionPack, setDefaultAssumptionPack, deprecateAssumptionPack, isPackInUse,
  } = useAppStore()

  const [search, setSearch] = useState('')
  const [filterIntensity, setFilterIntensity] = useState<string>('all')
  const [formTarget, setFormTarget] = useState<TaskPreset | null | 'new'>(null)
  const [packFormTarget, setPackFormTarget] = useState<AssumptionPack | null | 'new'>(null)
  const [editingModel, setEditingModel] = useState<string | null>(null)
  const [editingFactor, setEditingFactor] = useState<string>('')
  const [comparePackA, setComparePackA] = useState<string | null>(null)
  const [comparePackB, setComparePackB] = useState<string | null>(null)
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

  // ---- Pack handlers ----
  function handlePackSave(data: Omit<AssumptionPack, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    if (data.id) {
      updateAssumptionPack(data.id, data)
      showToast('Pack salvato.')
    } else {
      addAssumptionPack(data)
      showToast('Pack creato.')
    }
    setPackFormTarget(null)
  }

  function handlePackDelete(pack: AssumptionPack) {
    if (pack.isSystemDefault) { showToast('I pack di sistema non possono essere eliminati.'); return }
    if (isPackInUse(pack.id)) { showToast('Questo pack è usato da scenari. Migrali prima di eliminarlo.'); return }
    if (!confirm(`Eliminare il pack "${pack.name}"?`)) return
    deleteAssumptionPack(pack.id)
    showToast('Pack eliminato.')
  }

  function handleComparePackSelect(id: string) {
    if (comparePackA === id) { setComparePackA(null); return }
    if (comparePackB === id) { setComparePackB(null); return }
    if (!comparePackA) setComparePackA(id)
    else if (!comparePackB) setComparePackB(id)
  }

  const packA = assumptionPacks.find((p) => p.id === comparePackA)
  const packB = assumptionPacks.find((p) => p.id === comparePackB)

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
          {/* Header with create + compare */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {t('app.disclaimer')}
            </p>
            <Button size="sm" onClick={() => setPackFormTarget('new')}>
              <Plus className="size-4" /> Nuovo pack
            </Button>
          </div>

          {/* Pack compare selection banner */}
          {(comparePackA || comparePackB) && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary flex items-center justify-between">
              <span>
                Confronto: {[comparePackA, comparePackB].filter(Boolean).map((id) =>
                  assumptionPacks.find((p) => p.id === id)?.name ?? id).join(' ↔ ')}
              </span>
              <Button variant="ghost" size="sm" className="h-6" onClick={() => { setComparePackA(null); setComparePackB(null) }}>
                Annulla
              </Button>
            </div>
          )}

          {/* Pack compare view */}
          {packA && packB && (
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              {[packA, packB].map((p) => (
                <Card key={p.id} className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{p.name} <span className="text-muted-foreground">v{p.version}</span></CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {(['light', 'medium', 'heavy'] as const).map((int) => (
                      <div key={int} className="flex justify-between items-center">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${INTENSITY_COLORS[int]}`}>{int}</span>
                        <span>
                          {p.creditBands[`${int}Min` as keyof typeof p.creditBands]}–
                          {p.creditBands[`${int}Mid` as keyof typeof p.creditBands]}–
                          {p.creditBands[`${int}Max` as keyof typeof p.creditBands]}
                        </span>
                      </div>
                    ))}
                    <Separator className="my-1" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">PAYG price</span>
                      <span className="font-medium">{p.fundingDefaults.paygPricePerCredit} {p.fundingDefaults.currency}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* All packs */}
          {assumptionPacks.map((pack) => {
            const usedBy = scenarios.filter((sc) => sc.assumptionPackId === pack.id).length
            const isSelected = comparePackA === pack.id || comparePackB === pack.id
            return (
              <Card key={pack.id} className={isSelected ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{pack.name}</CardTitle>
                        <Badge variant="secondary">v{pack.version}</Badge>
                        {pack.isSystemDefault && <Badge>{t('assumptions.systemDefault')}</Badge>}
                        {!pack.isSystemDefault && <Badge variant="outline">{t('assumptions.custom')}</Badge>}
                        {pack.isCurrentDefault && <Badge variant="success">Default</Badge>}
                        {pack.isDeprecated && <Badge variant="destructive">Deprecated</Badge>}
                      </div>
                      {pack.sourceName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('assumptions.source')}: {pack.sourceName}
                          {pack.sourceDate ? ` · ${pack.sourceDate}` : ''}
                        </p>
                      )}
                      {usedBy > 0 && (
                        <p className="text-xs text-muted-foreground">{usedBy} scenari collegati</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant={isSelected ? 'default' : 'ghost'} size="icon" className="size-7"
                            onClick={() => handleComparePackSelect(pack.id)}>
                            ⇄
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Seleziona per confronto</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7"
                            onClick={() => duplicateAssumptionPack(pack.id) && showToast('Pack duplicato.')}>
                            <Copy className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplica</TooltipContent>
                      </Tooltip>
                      {!pack.isSystemDefault && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-7"
                                onClick={() => setPackFormTarget(pack)}>
                                <Edit className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Modifica</TooltipContent>
                          </Tooltip>
                          {!pack.isCurrentDefault && !pack.isDeprecated && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7"
                                  onClick={() => { setDefaultAssumptionPack(pack.id); showToast('Pack impostato come default.') }}>
                                  <Star className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Imposta come default</TooltipContent>
                            </Tooltip>
                          )}
                          {!pack.isDeprecated && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7 text-amber-500 hover:text-amber-600"
                                  onClick={() => {
                                    const reason = prompt('Motivo obsolescenza:') ?? 'Versione superata'
                                    deprecateAssumptionPack(pack.id, reason)
                                    showToast('Pack deprecato.')
                                  }}>
                                  <StarOff className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Depreca</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon"
                                className={`size-7 ${!isPackInUse(pack.id) ? 'text-destructive hover:text-destructive' : 'opacity-30 cursor-not-allowed'}`}
                                onClick={() => !isPackInUse(pack.id) && handlePackDelete(pack)}>
                                <Trash2 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isPackInUse(pack.id) ? 'Pack in uso' : 'Elimina'}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>
                  {pack.description && (
                    <CardDescription>{pack.description}</CardDescription>
                  )}
                  {pack.isDeprecated && pack.deprecatedReason && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="size-3" />
                      {pack.deprecatedReason}
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
                          <p className="font-semibold text-sm mb-1">
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
            )
          })}
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

      {/* Assumption Pack Form */}
      {packFormTarget !== null && (
        <AssumptionPackForm
          pack={packFormTarget === 'new' ? null : packFormTarget}
          onSave={handlePackSave}
          onClose={() => setPackFormTarget(null)}
        />
      )}
    </div>
  )
}
