import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Calculator, Save, ExternalLink, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InfoHint } from '@/components/shared/InfoHint'
import { calculateScenario } from '@/engine/calculationEngine'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { FundingPlan, Industry, Scenario, WorkforceSegment } from '@/types/domain'

export default function QuickEstimatePage() {
  const { t } = useTranslation()
  const store = useAppStore()
  const [savedScenarioId, setSavedScenarioId] = useState<string | null>(null)

  const defaultPack = store.assumptionPacks.find((p) => p.isCurrentDefault) ?? store.assumptionPacks[0]
  const defaultProfile = store.usageProfiles.find((p) => p.name === 'Medium') ?? store.usageProfiles[0]

  const [estimateName, setEstimateName] = useState('Quick estimate')
  const [companyMode, setCompanyMode] = useState<'existing' | 'new'>(store.companies.length > 0 ? 'existing' : 'new')
  const [companyId, setCompanyId] = useState(store.companies[0]?.id ?? '')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState<Industry | ''>('')
  const [totalEmployees, setTotalEmployees] = useState('250')
  const [enabledPct, setEnabledPct] = useState('60')
  const [activePct, setActivePct] = useState('50')
  const [profileId, setProfileId] = useState(defaultProfile?.id ?? '')
  const [modelId, setModelId] = useState('model-auto')
  const [packId, setPackId] = useState(defaultPack?.id ?? '')
  const [pricePerCredit, setPricePerCredit] = useState(String(defaultPack?.fundingDefaults.paygPricePerCredit ?? 0.01))
  const [monthlyBudget, setMonthlyBudget] = useState('')

  const company = companyMode === 'existing'
    ? store.companies.find((c) => c.id === companyId) ?? null
    : null

  const pack = store.assumptionPacks.find((p) => p.id === packId) ?? defaultPack
  const profile = store.usageProfiles.find((p) => p.id === profileId) ?? defaultProfile
  const employees = companyMode === 'existing'
    ? (company?.totalEmployees ?? (Number(totalEmployees) || 0))
    : Number(totalEmployees) || 0

  const preview = useMemo(() => {
    if (!pack || !profile || employees <= 0) return null
    const scenarioId = 'quick-preview'
    const segment: WorkforceSegment = {
      id: 'quick-segment',
      companyId: company?.id ?? 'quick-company',
      scenarioId,
      name: t('quick.cohortName'),
      description: null,
      categoryType: 'whiteCollar',
      headcount: employees,
      enabledPercentage: Number(enabledPct) || 0,
      activeUsagePercentage: Number(activePct) || 0,
      usageProfileId: profile.id,
      preferredModelId: modelId,
      taskMixMode: 'profile',
      customTaskMix: null,
      taskMix: [],
      contextFactorOverride: null,
      toolsFactorOverride: null,
      runtimeFactorOverride: null,
      browserFactorOverride: null,
      imageFactorOverride: null,
      rolloutPhase: null,
      includeInCalculation: true,
      notes: null,
      source: 'manual',
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const scenario: Scenario = {
      id: scenarioId,
      companyId: company?.id ?? 'quick-company',
      name: estimateName || 'Quick estimate',
      description: t('quick.preliminary'),
      assumptionPackId: pack.id,
      fundingPlanId: null,
      segments: [segment],
      calculationResult: null,
      status: 'draft',
      tags: ['quick-estimate'],
      calculationMode: 'officialGuide',
      workloadType: 'cowork',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const funding: FundingPlan = {
      id: 'quick-funding',
      scenarioId,
      mode: 'payg',
      construct: 'payg',
      paygPricePerCredit: Number(pricePerCredit) || pack.fundingDefaults.paygPricePerCredit,
      prepaidCredits: 0,
      prepaidEffectivePricePerCredit: Number(pricePerCredit) || pack.fundingDefaults.paygPricePerCredit,
      existingMonthlyCredits: 0,
      discountPercentage: 0,
      currency: store.preferences.currency,
      budgetMonthly: monthlyBudget ? Number(monthlyBudget) : null,
      budgetAnnual: monthlyBudget ? Number(monthlyBudget) * 12 : null,
      notes: null,
      p3: null,
      budgetEvaluationBasis: 'monthlyPayg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return calculateScenario(scenario, store.usageProfiles, store.modelAssumptions, pack, funding)
  }, [activePct, company?.id, employees, enabledPct, estimateName, modelId, monthlyBudget, pack, pricePerCredit, profile, store.modelAssumptions, store.preferences.currency, store.usageProfiles, t])

  function handleSave() {
    if (!pack || !profile || employees <= 0) return

    let finalCompanyId = company?.id ?? ''
    if (companyMode === 'new') {
      const co = store.addCompany({
        name: companyName.trim() || estimateName || 'Quick company',
        legalName: null,
        industry: industry || null,
        country: null,
        region: null,
        description: null,
        totalEmployees: employees,
        estimatedKnowledgeWorkers: null,
        status: 'active',
        source: 'manual',
        tags: ['quick-estimate'],
        notes: null,
        ownerNotes: null,
        currency: null,
        defaultAssumptionPackId: pack.id,
        archivedAt: null,
        metadata: {},
        baselineSegments: [],
      })
      finalCompanyId = co.id
    }

    const scenario = store.addScenario({
      companyId: finalCompanyId,
      name: estimateName.trim() || 'Quick estimate',
      description: t('quick.preliminary'),
      assumptionPackId: pack.id,
      fundingPlanId: null,
      segments: [],
      status: 'draft',
      tags: ['quick-estimate'],
      calculationMode: 'officialGuide',
      workloadType: 'cowork',
    })

    store.addSegment(scenario.id, {
      companyId: finalCompanyId,
      scenarioId: scenario.id,
      name: t('quick.cohortName'),
      description: null,
      categoryType: 'whiteCollar',
      headcount: employees,
      enabledPercentage: Number(enabledPct) || 0,
      activeUsagePercentage: Number(activePct) || 0,
      usageProfileId: profile.id,
      preferredModelId: modelId,
      taskMixMode: 'profile',
      customTaskMix: null,
      taskMix: [],
      contextFactorOverride: null,
      toolsFactorOverride: null,
      runtimeFactorOverride: null,
      browserFactorOverride: null,
      imageFactorOverride: null,
      rolloutPhase: 'Quick estimate',
      includeInCalculation: true,
      notes: t('quick.preliminary'),
      source: 'manual',
      metadata: { quickEstimate: true },
    })

    store.upsertFundingPlan({
      scenarioId: scenario.id,
      mode: 'payg',
      construct: 'payg',
      paygPricePerCredit: Number(pricePerCredit) || pack.fundingDefaults.paygPricePerCredit,
      prepaidCredits: 0,
      prepaidEffectivePricePerCredit: Number(pricePerCredit) || pack.fundingDefaults.paygPricePerCredit,
      existingMonthlyCredits: 0,
      discountPercentage: 0,
      currency: store.preferences.currency,
      budgetMonthly: monthlyBudget ? Number(monthlyBudget) : null,
      budgetAnnual: monthlyBudget ? Number(monthlyBudget) * 12 : null,
      notes: t('quick.preliminary'),
      p3: null,
      budgetEvaluationBasis: 'monthlyPayg',
    })
    store.recalculateScenario(scenario.id)
    setSavedScenarioId(scenario.id)
  }

  const enabledUsers = Math.floor((employees * (Number(enabledPct) || 0)) / 100)
  const activeUsers = Math.floor((enabledUsers * (Number(activePct) || 0)) / 100)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-4 sm:p-6" data-tour="quick-estimate">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Calculator className="size-6 text-primary" />
          {t('quick.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('quick.subtitle')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader><CardTitle className="text-base">Input rapidi</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>{t('quick.estimateName')}</Label>
              <Input value={estimateName} onChange={(e) => setEstimateName(e.target.value)} />
            </div>

            <div className="grid gap-1.5 sm:col-span-2">
              <Label>{t('quick.companyMode')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['existing', 'new'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCompanyMode(mode)}
                    className={`rounded-lg border p-3 text-left text-sm font-medium transition-colors ${companyMode === mode ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'}`}
                  >
                    {mode === 'existing' ? t('quick.existingCompany') : t('quick.newCompany')}
                  </button>
                ))}
              </div>
            </div>

            {companyMode === 'existing' ? (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label>{t('companies.name')}</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder={t('wizard.scenarioSetup.selectCompany')} /></SelectTrigger>
                  <SelectContent>
                    {store.companies.filter((c) => c.status === 'active').map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {formatNumber(c.totalEmployees)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="grid gap-1.5">
                  <Label>{t('quick.companyName')}</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>{t('companies.industry')}</Label>
                  <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
                    <SelectTrigger><SelectValue placeholder={t('common.optional')} /></SelectTrigger>
                    <SelectContent>
                      {(['technology','finance','healthcare','retail','manufacturing','professional_services','education','government','energy','media','other'] as Industry[]).map((i) => (
                        <SelectItem key={i} value={i}>{t(`industries.${i}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1">{t('quick.totalEmployees')}<InfoHint hintKey="totalEmployees" /></Label>
              <Input type="number" min={1} value={String(employees || totalEmployees)} onChange={(e) => setTotalEmployees(e.target.value)} disabled={companyMode === 'existing'} />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1">{t('quick.enabledPct')}<InfoHint hintKey="enabledPct" /></Label>
              <Input type="number" min={0} max={100} value={enabledPct} onChange={(e) => setEnabledPct(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1">{t('quick.activePct')}<InfoHint hintKey="activePct" /></Label>
              <Input type="number" min={0} max={100} value={activePct} onChange={(e) => setActivePct(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t('quick.usageProfile')}</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{store.usageProfiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t('quick.model')}</Label>
              <Select value={modelId} onValueChange={setModelId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{store.modelAssumptions.filter((m) => m.isEnabled).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>{t('quick.assumptionPack')}</Label>
              <Select value={packId} onValueChange={setPackId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{store.assumptionPacks.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} v{p.version}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1">{t('quick.pricePerCredit')}<InfoHint hintKey="pricePerCredit" /></Label>
              <Input type="number" min={0} step={0.001} value={pricePerCredit} onChange={(e) => setPricePerCredit(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>{t('quick.monthlyBudget')}</Label>
              <Input type="number" min={0} value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-primary/30 bg-primary/5" data-tour="quick-preview">
          <CardHeader><CardTitle className="text-base">{t('quick.livePreview')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border bg-background/60 p-3"><p className="text-xs text-muted-foreground">{t('segments.enabledUsers')}</p><p className="text-xl font-bold">{formatNumber(enabledUsers)}</p></div>
              <div className="rounded-lg border bg-background/60 p-3"><p className="text-xs text-muted-foreground">{t('segments.activeUsers')}</p><p className="text-xl font-bold">{formatNumber(activeUsers)}</p></div>
              <div className="rounded-lg border bg-background/60 p-3"><p className="text-xs text-muted-foreground">{t('results.monthlyCredits')}</p><p className="text-xl font-bold">{preview ? formatNumber(Math.round(preview.monthlyCredits.mid)) : '—'}</p></div>
              <div className="rounded-lg border bg-background/60 p-3"><p className="text-xs text-muted-foreground">{t('results.monthlyCost')}</p><p className="text-xl font-bold text-primary">{preview ? formatCurrency(preview.monthlyCost.mid, store.preferences.currency) : '—'}</p></div>
            </div>

            {preview && monthlyBudget && preview.monthlyCost.max > Number(monthlyBudget) && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {t('funding.budgetWarning')}
              </div>
            )}

            <p className="text-xs text-muted-foreground">{t('quick.preliminary')}</p>

            <Button onClick={handleSave} disabled={!preview || employees <= 0}>
              <Save className="size-4" />
              {t('quick.saveScenario')}
            </Button>
            {savedScenarioId && (
              <Button variant="outline" asChild>
                <Link to={`/scenarios/${savedScenarioId}`}>
                  <ExternalLink className="size-4" />
                  {t('quick.openScenario')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
