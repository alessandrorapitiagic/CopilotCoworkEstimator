import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Copy, Edit, Trash2, AlertTriangle, Zap, TrendingUp,
  ChevronDown, ChevronRight, Search,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UsageProfileForm } from './UsageProfileForm'
import { computeProfileImpact } from './profileImpact'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { SYSTEM_ASSUMPTION_PACK } from '@/lib/systemData'
import type { UsageProfile } from '@/types/domain'

const LEVEL_COLORS = {
  light: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  heavy: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  custom: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

export default function UsageProfilesPage() {
  const { t } = useTranslation()
  const { usageProfiles, modelAssumptions, assumptionPacks,
    addUsageProfile, updateUsageProfile, duplicateUsageProfile, deleteUsageProfile,
    isProfileInUse, preferences } = useAppStore()

  const [search, setSearch] = useState('')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [formTarget, setFormTarget] = useState<UsageProfile | null | 'new'>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareA, setCompareA] = useState<string | null>(null)
  const [compareB, setCompareB] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const pack = assumptionPacks.find((p) => p.isSystemDefault) ?? SYSTEM_ASSUMPTION_PACK
  const pricePerCredit = pack.fundingDefaults.paygPricePerCredit

  const filtered = usageProfiles.filter((p) => {
    if (showCustomOnly && p.isSystemDefault) return false
    const q = search.trim().toLowerCase()
    return !q || p.name.toLowerCase().includes(q)
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function handleSave(data: Omit<UsageProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
    if (data.id) {
      updateUsageProfile(data.id, data)
      showToast(t('profiles.new') + ' salvato')
    } else {
      addUsageProfile(data)
      showToast(t('profiles.new') + ' creato')
    }
    setFormTarget(null)
  }

  function handleDuplicate(profile: UsageProfile) {
    duplicateUsageProfile(profile.id)
    showToast('Profilo duplicato.')
  }

  function handleDelete(profile: UsageProfile) {
    if (profile.isSystemDefault) { showToast(t('profiles.deleteSystemError')); return }
    if (isProfileInUse(profile.id)) { showToast(t('profiles.deleteInUseError')); return }
    if (!confirm('Eliminare il profilo "' + profile.name + '"?')) return
    deleteUsageProfile(profile.id)
    showToast('Profilo eliminato.')
  }

  function handleCompareSelect(profileId: string) {
    if (compareA === profileId) { setCompareA(null); return }
    if (compareB === profileId) { setCompareB(null); return }
    if (!compareA) setCompareA(profileId)
    else if (!compareB) setCompareB(profileId)
  }

  const compA = usageProfiles.find((p) => p.id === compareA)
  const compB = usageProfiles.find((p) => p.id === compareB)
  const impactA = compA ? computeProfileImpact(compA, pack, pricePerCredit) : null
  const impactB = compB ? computeProfileImpact(compB, pack, pricePerCredit) : null

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 text-sm shadow">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3" data-tour="profiles-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('profiles.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Definisci l'intensità d'uso mensile per categorie di utenti.
          </p>
        </div>
        <Button onClick={() => setFormTarget('new')} data-tour="profiles-new">
          <Plus className="size-4" />
          {t('profiles.new')}
        </Button>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">{t('profiles.title')}</TabsTrigger>
          <TabsTrigger value="compare">
            {t('profiles.compareTitle')}
            {(compareA || compareB) && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {[compareA, compareB].filter(Boolean).length}/2
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showCustomOnly ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowCustomOnly(!showCustomOnly)}
            >
              Custom only
            </Button>
          </div>

          {/* Profiles grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="profiles-list">
            {filtered.map((profile) => {
              const impact = computeProfileImpact(profile, pack, pricePerCredit)
              const totalTasks = impact.totalTasksPerUserPerMonth
              const inUse = isProfileInUse(profile.id)
              const isExpanded = expandedId === profile.id
              const isSelected = compareA === profile.id || compareB === profile.id

              return (
                <Card
                  key={profile.id}
                  className={`transition-shadow hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-sm flex items-center gap-1.5 flex-wrap">
                          {profile.name}
                          {profile.isSystemDefault && (
                            <Badge variant="secondary" className="text-[10px]">{t('profiles.sources.system')}</Badge>
                          )}
                          {!profile.isSystemDefault && (
                            <Badge className="text-[10px]">Custom</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${LEVEL_COLORS[profile.usageLevel] ?? LEVEL_COLORS.custom}`}>
                            {t(`profiles.levels.${profile.usageLevel}`)}
                          </span>
                          {inUse && <Badge variant="success" className="text-[10px]">{t('profiles.inUse')}</Badge>}
                        </div>
                      </div>
                    </div>
                    {profile.description && (
                      <CardDescription className="text-xs mt-1">{profile.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3">
                    {/* Task distribution */}
                    <div className="grid grid-cols-3 gap-1.5 text-xs text-center">
                      {[
                        { label: 'Light', val: profile.lightTasksPerUserPerMonth, color: 'bg-emerald-100 dark:bg-emerald-900/30' },
                        { label: 'Medium', val: profile.mediumTasksPerUserPerMonth, color: 'bg-blue-100 dark:bg-blue-900/30' },
                        { label: 'Heavy', val: profile.heavyTasksPerUserPerMonth, color: 'bg-purple-100 dark:bg-purple-900/30' },
                      ].map(({ label, val, color }) => (
                        <div key={label} className={`rounded p-1.5 ${color}`}>
                          <p className="text-muted-foreground text-[10px]">{label}</p>
                          <p className="font-bold">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Impact preview */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="rounded border px-2 py-1">
                        <p className="text-muted-foreground flex items-center gap-0.5">
                          <Zap className="size-2.5" />{t('profiles.impactCredits')}
                        </p>
                        <p className="font-semibold">{formatNumber(Math.round(impact.creditsPerActiveUserMid))}</p>
                      </div>
                      <div className="rounded border px-2 py-1">
                        <p className="text-muted-foreground flex items-center gap-0.5">
                          <TrendingUp className="size-2.5" />{t('profiles.impactCost')}
                        </p>
                        <p className="font-semibold text-primary">{formatCurrency(impact.costPerActiveUserMid, preferences.currency)}</p>
                      </div>
                    </div>

                    {/* Warnings */}
                    {totalTasks === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="size-3" />
                        {t('profiles.zeroTasksWarning')}
                      </p>
                    )}

                    {/* Expandable details */}
                    {isExpanded && (
                      <div className="text-xs flex flex-col gap-1.5 border-t pt-2">
                        <p className="text-muted-foreground">
                          {t('profiles.totalTasks')}: <span className="text-foreground font-medium">{totalTasks}/mo</span>
                        </p>
                        {profile.recommendedFor.length > 0 && (
                          <p className="text-muted-foreground">
                            {t('profiles.recommendedFor')}: <span className="text-foreground">{profile.recommendedFor.join(', ')}</span>
                          </p>
                        )}
                        {profile.examples.length > 0 && (
                          <p className="text-muted-foreground">
                            {t('profiles.examples')}: <span className="text-foreground">{profile.examples.join(', ')}</span>
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-1 mt-1">
                          {[
                            { k: 'Ctx', v: profile.contextFactor },
                            { k: 'Tools', v: profile.toolsFactor },
                            { k: 'RT', v: profile.runtimeFactor },
                          ].map(({ k, v }) => (
                            <div key={k} className="rounded bg-muted/50 px-1.5 py-1 text-center">
                              <p className="text-muted-foreground text-[10px]">{k}</p>
                              <p className="font-medium">{v}×</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 border-t pt-1">
                          {t('app.disclaimer')}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
                        {isExpanded ? 'Meno' : 'Dettagli'}
                      </button>

                      <div className="flex gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isSelected ? 'default' : 'ghost'}
                              size="icon"
                              className="size-7"
                              onClick={() => handleCompareSelect(profile.id)}
                            >
                              ⇄
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('profiles.compareTitle')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7"
                              onClick={() => handleDuplicate(profile)}>
                              <Copy className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('common.duplicate')}</TooltipContent>
                        </Tooltip>
                        {!profile.isSystemDefault && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7"
                                  onClick={() => setFormTarget(profile)}>
                                  <Edit className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('common.edit')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="icon"
                                  className={`size-7 ${!inUse ? 'text-destructive hover:text-destructive' : 'opacity-30 cursor-not-allowed'}`}
                                  onClick={() => !inUse && handleDelete(profile)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {inUse ? t('profiles.deleteInUseError') : t('common.delete')}
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="compare" className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Seleziona due profili dalla lista (pulsante ⇄) per confrontarli.
          </p>

          {compA && compB && impactA && impactB ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { profile: compA, impact: impactA },
                { profile: compB, impact: impactB },
              ].map(({ profile, impact }) => (
                <Card key={profile.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{profile.name}</CardTitle>
                    <div className={`text-[10px] w-fit px-1.5 py-0.5 rounded-full font-medium ${LEVEL_COLORS[profile.usageLevel] ?? LEVEL_COLORS.custom}`}>
                      {t(`profiles.levels.${profile.usageLevel}`)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <div className="grid grid-cols-3 gap-1 text-xs text-center">
                      {[
                        { l: 'L', v: profile.lightTasksPerUserPerMonth },
                        { l: 'M', v: profile.mediumTasksPerUserPerMonth },
                        { l: 'H', v: profile.heavyTasksPerUserPerMonth },
                      ].map(({ l, v }) => (
                        <div key={l} className="rounded bg-muted/40 p-1">
                          <p className="text-muted-foreground text-[10px]">{l}</p>
                          <p className="font-bold">{v}</p>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Task totali</span>
                      <span className="font-medium">{impact.totalTasksPerUserPerMonth}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Crediti/utente/mo</span>
                      <span className="font-medium">{formatNumber(Math.round(impact.creditsPerActiveUserMid))}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Costo/utente/mo</span>
                      <span className="font-semibold text-primary">{formatCurrency(impact.costPerActiveUserMid, preferences.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('profiles.impact100')}</span>
                      <span className="font-semibold text-primary">{formatCurrency(impact.costPerActiveUserMid * 100, preferences.currency)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {(!compareA || !compareB) && 'Seleziona ancora ' + (compareA ? '1' : '2') + ' profil' + (!compareA ? 'i' : 'o') + ' dalla lista.'}
            </p>
          )}
        </TabsContent>
      </Tabs>

      {/* Form dialog */}
      {formTarget !== null && (
        <UsageProfileForm
          profile={formTarget === 'new' ? null : formTarget}
          models={modelAssumptions.filter((m) => m.isEnabled)}
          onSave={handleSave}
          onClose={() => setFormTarget(null)}
        />
      )}
    </div>
  )
}
