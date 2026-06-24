import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import {
  ArrowLeft, Plus, Layers, Save, AlertTriangle, Info,
  Copy, Trash2, EyeOff, Eye, Edit, RefreshCw, Users,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoHint } from '@/components/shared/InfoHint'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { SYSTEM_ASSUMPTION_PACK } from '@/lib/systemData'
import { SegmentForm } from './SegmentForm'
import { SegmentTemplateSelector } from './SegmentTemplateSelector'
import { useWorkforceSummary } from './useWorkforceSummary'
import type { WorkforceSegment } from '@/types/domain'

export default function WorkforceSegmentation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const [searchParams] = useSearchParams()
  const companyIdParam = searchParams.get('companyId')

  const {
    scenarios, companies, usageProfiles, modelAssumptions, assumptionPacks,
    addSegment, updateSegment, deleteSegment, updateCompany,
    saveBaselineFromScenario, copyBaselineToScenario, preferences,
  } = useAppStore()

  const scenario = scenarioId ? scenarios.find((s) => s.id === scenarioId) : null
  const companyId = scenario?.companyId ?? companyIdParam ?? ''
  const company = companies.find((c) => c.id === companyId)
  const pack = (scenario ? assumptionPacks.find((p) => p.id === scenario.assumptionPackId) : null)
    ?? SYSTEM_ASSUMPTION_PACK
  const pricePerCredit = pack.fundingDefaults.paygPricePerCredit

  const segments = scenario?.segments ?? []
  const isBaseline = !scenario && !!company

  // Company baseline mode: segments come from company.baselineSegments
  const baselineSegments = company?.baselineSegments ?? []
  const workingSegments = isBaseline ? baselineSegments : segments

  const defaultProfileId = usageProfiles.find((p) => p.isSystemDefault && p.name === 'Medium')?.id ?? usageProfiles[0]?.id ?? ''
  const defaultModelId = 'model-auto'

  const [showSegmentForm, setShowSegmentForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingSegment, setEditingSegment] = useState<WorkforceSegment | null>(null)

  const { summary, segmentResults } = useWorkforceSummary(
    workingSegments,
    company?.totalEmployees ?? 0,
    pack,
    usageProfiles,
    pricePerCredit,
  )

  function getSegmentResult(segId: string) {
    return segmentResults.find((r) => r.segmentId === segId)
  }

  function handleSaveSegment(data: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    if (isBaseline) {
      // Baseline mode: modify company.baselineSegments directly
      const now = new Date().toISOString()
      if (data.id) {
        const updated = baselineSegments.map((s) =>
          s.id === data.id ? { ...s, ...data, updatedAt: now } : s,
        )
        updateCompany(companyId, { baselineSegments: updated })
      } else {
        const newSeg: WorkforceSegment = {
          ...data,
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
        }
        updateCompany(companyId, { baselineSegments: [...baselineSegments, newSeg] })
      }
    } else if (scenarioId) {
      if (data.id) {
        updateSegment(scenarioId, data.id, data)
      } else {
        addSegment(scenarioId, data)
      }
    }
    setShowSegmentForm(false)
    setEditingSegment(null)
  }

  function handleDeleteSegment(seg: WorkforceSegment) {
    if (!confirm(t('segments.deleteConfirm', { name: seg.name }))) return
    if (isBaseline) {
      updateCompany(companyId, { baselineSegments: baselineSegments.filter((s) => s.id !== seg.id) })
    } else if (scenarioId) {
      deleteSegment(scenarioId, seg.id)
    }
  }

  function handleDuplicate(seg: WorkforceSegment) {
    const now = new Date().toISOString()
    const copy: WorkforceSegment = {
      ...seg,
      id: nanoid(),
      name: `Copy of ${seg.name}`,
      source: 'copied',
      createdAt: now,
      updatedAt: now,
    }
    if (isBaseline) {
      updateCompany(companyId, { baselineSegments: [...baselineSegments, copy] })
    } else if (scenarioId) {
      addSegment(scenarioId, copy)
    }
  }

  function handleToggleInclude(seg: WorkforceSegment) {
    const update = { includeInCalculation: !seg.includeInCalculation }
    if (isBaseline) {
      updateCompany(companyId, {
        baselineSegments: baselineSegments.map((s) =>
          s.id === seg.id ? { ...s, ...update, updatedAt: new Date().toISOString() } : s,
        ),
      })
    } else if (scenarioId) {
      updateSegment(scenarioId, seg.id, update)
    }
  }

  function handleApplyTemplate(segs: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'>[]) {
    const now = new Date().toISOString()
    if (isBaseline) {
      const newSegs = segs.map((s) => ({ ...s, id: nanoid(), createdAt: now, updatedAt: now }))
      updateCompany(companyId, { baselineSegments: newSegs })
    } else if (scenarioId) {
      for (const s of segs) addSegment(scenarioId, s)
    }
  }

  function handleSaveAsBaseline() {
    if (!scenarioId || !companyId) return
    if (!confirm('Aggiornare la baseline workforce dell\'azienda con questi segmenti?')) return
    saveBaselineFromScenario(companyId, scenarioId)
  }

  function handleCopyBaseline() {
    if (!scenarioId || !companyId) return
    if (!company?.baselineSegments.length) return
    if (!confirm('Sostituire i segmenti correnti con la baseline aziendale?')) return
    copyBaselineToScenario(companyId, scenarioId)
  }

  if (!company && !scenario) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> {t('common.back')}
        </Button>
        <p className="mt-4 text-muted-foreground">{t('common.noData')}</p>
      </div>
    )
  }

  const hasBaseline = (company?.baselineSegments.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3" data-tour="segments-header">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            {t('scenarios.segments')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {company?.name}
            {scenario ? ` · ${scenario.name}` : ' · Baseline'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setShowTemplates(true)} data-tour="segments-template">
            <Layers className="size-4" />
            {t('segments.addFromTemplate')}
          </Button>
          <Button size="sm" onClick={() => { setEditingSegment(null); setShowSegmentForm(true) }} data-tour="segments-add">
            <Plus className="size-4" />
            {t('segments.addSegment')}
          </Button>
          {scenario && (
            <>
              <Button size="sm" variant="outline" onClick={handleSaveAsBaseline}>
                <Save className="size-4" />
                {t('segments.saveAsBaseline')}
              </Button>
              {hasBaseline && (
                <Button size="sm" variant="outline" onClick={handleCopyBaseline}>
                  <RefreshCw className="size-4" />
                  {t('segments.copyFromBaseline')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" data-tour="segments-summary">
        {[
          { label: t('companies.totalEmployees'), val: formatNumber(company?.totalEmployees ?? 0), hint: 'totalEmployees' },
          { label: 'Segmentati', val: formatNumber(summary.totalSegmentedHeadcount) },
          {
            label: t('segments.unclassified'),
            val: formatNumber(summary.unclassifiedEmployees),
            warn: summary.segmentUnderTotal && summary.unclassifiedEmployees > 0,
            error: summary.segmentOverTotal,
          },
          { label: t('segments.enabledUsers'), val: formatNumber(summary.totalEnabledUsers), hint: 'enabledPct' },
          { label: t('segments.activeUsers'), val: formatNumber(summary.totalActiveUsers), hint: 'activePct' },
          {
            label: t('results.monthlyCredits'),
            val: formatNumber(Math.round(summary.monthlyCredits.mid)),
            hint: 'monthlyCredits',
            accent: true,
          },
          {
            label: t('results.monthlyCost'),
            val: formatCurrency(summary.monthlyCost.mid, preferences.currency),
            hint: 'monthlyCost',
            accent: true,
          },
        ].map((item, i) => (
          <Card key={i} className={item.accent ? 'border-primary/30 bg-primary/5 col-span-1' : 'col-span-1'}>
            <CardContent className="pt-3 pb-2">
              <p className={`text-xs text-muted-foreground flex items-center gap-0.5 ${item.error ? 'text-destructive' : item.warn ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                {item.label}
                {item.hint && <InfoHint hintKey={item.hint} size={11} />}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${item.accent ? 'text-primary' : item.error ? 'text-destructive' : ''}`}>
                {item.val}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Headcount warnings */}
      {summary.segmentOverTotal && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {t('segments.overTotal')}
        </div>
      )}
      {summary.segmentUnderTotal && summary.unclassifiedEmployees > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          <Info className="size-4 shrink-0" />
          {t('segments.underTotal', { n: summary.unclassifiedEmployees })}
        </div>
      )}

      {/* Segments table */}
      {workingSegments.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Users className="size-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">Nessun segmento ancora</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aggiungi segmenti manualmente o usa un template predefinito.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowTemplates(true)} variant="outline">
                <Layers className="size-4" /> {t('segments.addFromTemplate')}
              </Button>
              <Button onClick={() => { setEditingSegment(null); setShowSegmentForm(true) }}>
                <Plus className="size-4" /> {t('segments.addSegment')}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card data-tour="segments-table">
          <CardContent className="p-0">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                    <th className="px-3 py-2.5 text-left">Segmento</th>
                    <th className="px-3 py-2.5 text-right">HC</th>
                    <th className="px-3 py-2.5 text-right">En%</th>
                    <th className="px-3 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-0.5">
                        {t('segments.enabledUsers')} <InfoHint hintKey="enabledPct" size={11} />
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-right">Act%</th>
                    <th className="px-3 py-2.5 text-right">
                      <span className="flex items-center justify-end gap-0.5">
                        {t('segments.activeUsers')} <InfoHint hintKey="activePct" size={11} />
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-left">Profilo</th>
                    <th className="px-3 py-2.5 text-right">Crediti/mo</th>
                    <th className="px-3 py-2.5 text-right">Costo/mo</th>
                    <th className="px-3 py-2.5 text-right">Peso</th>
                    <th className="px-3 py-2.5 text-center">⚠</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {workingSegments.map((seg) => {
                    const res = getSegmentResult(seg.id)
                    const profile = usageProfiles.find((p) => p.id === seg.usageProfileId)
                    const isExcluded = !seg.includeInCalculation
                    return (
                      <tr
                        key={seg.id}
                        className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${isExcluded ? 'opacity-50' : ''}`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[140px]">{seg.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t(`segments.categories.${seg.categoryType}`)}
                              </p>
                            </div>
                            {isExcluded && (
                              <Badge variant="outline" className="text-[10px]">{t('segments.excluded')}</Badge>
                            )}
                            {(seg.taskMixMode === 'custom' || seg.contextFactorOverride != null) && (
                              <Badge variant="warning" className="text-[10px]">{t('segments.customLabel')}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{seg.headcount}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{seg.enabledPercentage}%</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{res?.enabledUsers ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{seg.activeUsagePercentage}%</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{res?.activeUsers ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs">{profile?.name ?? '—'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {res ? formatNumber(Math.round(res.monthlyCredits.mid)) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-primary">
                          {res ? formatCurrency(res.monthlyCost.mid, preferences.currency) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground text-xs">
                          {res ? `${res.weightPct.toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {res && res.warnings.length > 0 ? (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="size-3.5 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {res.warnings.map((w) => t(`segments.warnings.${w}`)).join(' · ')}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground/30 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7"
                                  onClick={() => { setEditingSegment(seg); setShowSegmentForm(true) }}>
                                  <Edit className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('common.edit')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7"
                                  onClick={() => handleDuplicate(seg)}>
                                  <Copy className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('segments.duplicateSegment')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7"
                                  onClick={() => handleToggleInclude(seg)}>
                                  {isExcluded ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isExcluded ? t('segments.includeInCalc') : t('segments.excluded')}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteSegment(seg)}>
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('common.delete')}</TooltipContent>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col divide-y">
              {workingSegments.map((seg) => {
                const res = getSegmentResult(seg.id)
                const profile = usageProfiles.find((p) => p.id === seg.usageProfileId)
                const isExcluded = !seg.includeInCalculation
                return (
                  <div key={seg.id} className={`p-4 ${isExcluded ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-medium">{seg.name}</p>
                          {isExcluded && <Badge variant="outline" className="text-[10px]">{t('segments.excluded')}</Badge>}
                          {seg.taskMixMode === 'custom' && <Badge variant="warning" className="text-[10px]">custom</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{t(`segments.categories.${seg.categoryType}`)} · {profile?.name}</p>
                      </div>
                      <div className="text-right">
                        {res && (
                          <>
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(res.monthlyCost.mid, preferences.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground">{res.weightPct.toFixed(1)}%</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                      <div><p className="text-muted-foreground">HC</p><p className="font-medium">{seg.headcount}</p></div>
                      <div><p className="text-muted-foreground">En%</p><p className="font-medium">{seg.enabledPercentage}%</p></div>
                      <div><p className="text-muted-foreground">Abilitati</p><p className="font-medium">{res?.enabledUsers ?? 0}</p></div>
                      <div><p className="text-muted-foreground">Attivi</p><p className="font-medium">{res?.activeUsers ?? 0}</p></div>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="size-7"
                        onClick={() => { setEditingSegment(seg); setShowSegmentForm(true) }}>
                        <Edit className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7"
                        onClick={() => handleDuplicate(seg)}>
                        <Copy className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7"
                        onClick={() => handleToggleInclude(seg)}>
                        {isExcluded ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSegment(seg)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showSegmentForm && (
        <SegmentForm
          segment={editingSegment}
          companyId={companyId}
          scenarioId={scenario?.id ?? null}
          profiles={usageProfiles}
          models={modelAssumptions}
          defaultProfileId={defaultProfileId}
          defaultModelId={defaultModelId}
          onSave={handleSaveSegment}
          onClose={() => { setShowSegmentForm(false); setEditingSegment(null) }}
        />
      )}

      {showTemplates && (
        <SegmentTemplateSelector
          profiles={usageProfiles}
          models={modelAssumptions}
          companyId={companyId}
          scenarioId={scenario?.id ?? null}
          totalEmployees={company?.totalEmployees ?? 100}
          onApply={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  )
}
