import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'

import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WizardStepper } from './WizardStepper'
import { WizardExitGuardDialog, DraftRecoveryDialog } from './WizardDialogs'
import { useWizard, type WizardStepId } from './useWizard'
import { ScenarioSetupStep } from './steps/ScenarioSetupStep'
import { CompanyInfoStep } from './steps/CompanyInfoStep'
import { WorkforceStep } from './steps/WorkforceStep'
import { UsageProfilesStep } from './steps/UsageProfilesStep'
import { ModelsAssumptionsStep } from './steps/ModelsAssumptionsStep'
import { FundingBudgetStep } from './steps/FundingBudgetStep'
import { ReviewCalculationStep } from './steps/ReviewCalculationStep'
import { SaveShareStep } from './steps/SaveShareStep'



export default function ScenarioWizardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id: editScenarioId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const preselectedCompanyId = searchParams.get('companyId') ?? ''


  const store = useAppStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedScenarioId, setSavedScenarioId] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'draft' | 'reviewed'; at: string } | null>(null)
  const recalcTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editInitialized = useRef(false)

  // Determine initial overrides from query params
  const initialOverrides = preselectedCompanyId
    ? { companyId: preselectedCompanyId, companyMode: 'existing' as const }
    : {}

  const wizard = useWizard(initialOverrides)
  const { state, update, initialize, recalculate, goNext, goPrev, goToStep, getCurrentStepIndex,
    getVisibleStepsList, savedDraft, resumeDraft, discardDraft,
    showExitGuard, requestExit, confirmExitDiscard, confirmExitSaveDraft, cancelExit } = wizard

  const visibleSteps = getVisibleStepsList()
  const currentIndex = getCurrentStepIndex()
  const isFirstStep = currentIndex === 0

  // Initialize wizard from an existing scenario when opened from /scenarios/:id/edit.
  // This makes "Edit" an upsert workflow: saving updates the same scenario.
  useEffect(() => {
    if (!editScenarioId || editInitialized.current) return
    const scenario = store.scenarios.find((s) => s.id === editScenarioId)
    if (!scenario) return

    const funding = store.fundingPlans.find((f) => f.scenarioId === scenario.id)
    initialize({
      source: 'manual',
      currentStep: 'scenarioSetup',
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      scenarioDescription: scenario.description ?? '',
      companyMode: 'existing',
      companyId: scenario.companyId,
      segments: scenario.segments,
      assumptionPackId: scenario.assumptionPackId,
      defaultModelId: scenario.segments[0]?.preferredModelId ?? 'model-auto',
      fundingMode: funding?.mode ?? 'payg',
      pricePerCredit: String(funding?.paygPricePerCredit ?? state.pricePerCredit),
      existingCredits: String(funding?.existingMonthlyCredits ?? 0),
      prepaidCredits: String(funding?.prepaidCredits ?? 0),
      prepaidEffectivePrice: String(funding?.prepaidEffectivePricePerCredit ?? state.prepaidEffectivePrice),
      discountPct: String(funding?.discountPercentage ?? 0),
      budgetMonthly: funding?.budgetMonthly != null ? String(funding.budgetMonthly) : '',
      budgetAnnual: funding?.budgetAnnual != null ? String(funding.budgetAnnual) : '',
      currency: funding?.currency ?? state.currency,
      calculationResult: scenario.calculationResult,
    })
    setSavedScenarioId(scenario.id)
    editInitialized.current = true
  }, [editScenarioId, initialize, state.currency, state.prepaidEffectivePrice, state.pricePerCredit, store.fundingPlans, store.scenarios])

  // Debounced recalculation
  function scheduleRecalculate() {
    if (recalcTimer.current) clearTimeout(recalcTimer.current)
    recalcTimer.current = setTimeout(() => recalculate(), 300)
  }

  useEffect(() => {
    scheduleRecalculate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.segments, state.assumptionPackId, state.fundingMode, state.pricePerCredit,
     state.existingCredits, state.prepaidCredits, state.discountPct])

  // Validate current step before advancing
  function validateStep(step: WizardStepId): boolean {
    const e: Record<string, string> = {}

    if (step === 'scenarioSetup') {
      if (!state.scenarioName.trim()) e.scenarioName = t('errors.scenarioNameRequired')
      if (state.companyMode === 'existing' && !state.companyId) {
        e.companyId = 'Seleziona un\'azienda.'
      }
    }

    if (step === 'companyInfo') {
      if (!state.newCompanyName.trim()) e.newCompanyName = t('errors.companyNameRequired')
      const emp = Number(state.newCompanyEmployees)
      if (!state.newCompanyEmployees || isNaN(emp) || emp <= 0) {
        e.newCompanyEmployees = t('errors.employeesRequired')
      }
    }

    if (step === 'workforce') {
      const included = state.segments.filter((s) => s.includeInCalculation)
      if (included.length === 0) e.segments = t('wizard.noSegments')
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validateStep(state.currentStep)) return
    goNext()
    window.scrollTo(0, 0)
  }

  function handlePrev() {
    setErrors({})
    goPrev()
    window.scrollTo(0, 0)
  }

  function getOrCreateCompanyId(): string {
    // Create company if needed
    let companyId = state.companyId
    if (state.companyMode === 'new' && !companyId) {
      const company = store.addCompany({
        name: state.newCompanyName.trim() || 'Bozza azienda',
        legalName: null, industry: state.newCompanyIndustry as import('@/types/domain').Industry || null,
        country: state.newCompanyCountry.trim() || null,
        region: null, totalEmployees: Number(state.newCompanyEmployees) || 1,
        estimatedKnowledgeWorkers: null, status: 'active', source: 'manual',
        description: null, notes: null, ownerNotes: null, tags: [],
        currency: null, defaultAssumptionPackId: null, archivedAt: null,
        metadata: {}, baselineSegments: [],
      })
      companyId = company.id
      update({ companyId })
    }

    return companyId
  }

  function saveScenario(status: 'draft' | 'reviewed'): string {
    const companyId = getOrCreateCompanyId()
    const existingId = savedScenarioId ?? state.scenarioId
    const existingScenario = store.scenarios.find((s) => s.id === existingId)

    const scenarioPayload = {
      companyId,
      name: state.scenarioName.trim() || (status === 'draft' ? 'Bozza scenario' : 'Scenario'),
      description: state.scenarioDescription.trim() || null,
      assumptionPackId: state.assumptionPackId,
      fundingPlanId: null,
      segments: state.segments.map((seg) => ({ ...seg, companyId })),
      status,
      tags: [] as string[],
    }

    if (existingScenario) {
      store.updateScenario(existingScenario.id, scenarioPayload)
      upsertFundingPlan(existingScenario.id)
      store.recalculateScenario(existingScenario.id)
      setSavedScenarioId(existingScenario.id)
      update({ scenarioId: existingScenario.id, companyId, isDirty: false })
      return existingScenario.id
    }

    const scenario = store.addScenario({
      ...scenarioPayload,
    })

    upsertFundingPlan(scenario.id)
    store.recalculateScenario(scenario.id)
    setSavedScenarioId(scenario.id)
    update({ scenarioId: scenario.id, companyId, isDirty: false })
    return scenario.id
  }

  function handleSaveDraft() {
    saveScenario('draft')
    setSaveFeedback({ type: 'draft', at: new Date().toISOString() })
  }

  function handleSaveReviewed() {
    const id = saveScenario('reviewed')
    setSaveFeedback({ type: 'reviewed', at: new Date().toISOString() })
    setSavedScenarioId(id)
    goToStep('saveShare')
  }

  function upsertFundingPlan(scenarioId: string) {
    store.upsertFundingPlan({
      scenarioId,
      mode: state.fundingMode,
      paygPricePerCredit: Number(state.pricePerCredit) || 0.01,
      prepaidCredits: Number(state.prepaidCredits) || 0,
      prepaidEffectivePricePerCredit: Number(state.prepaidEffectivePrice) || Number(state.pricePerCredit) || 0.01,
      existingMonthlyCredits: Number(state.existingCredits) || 0,
      discountPercentage: Number(state.discountPct) || 0,
      currency: state.currency,
      budgetMonthly: state.budgetMonthly ? Number(state.budgetMonthly) : null,
      budgetAnnual: state.budgetAnnual ? Number(state.budgetAnnual) : null,
      notes: null,
    })
  }

  function handleExportCSV() {
    const result = state.calculationResult
    if (!result) return
    const rows = [
      ['Scenario', 'Segmento', 'Attivi', 'Crediti/mo mid', 'Costo/mo mid'],
      ...result.breakdownBySegment.map((b) => [
        state.scenarioName, b.segmentName, b.activeUsers,
        Math.round(b.monthlyCredits.mid), b.monthlyCost.mid.toFixed(2),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wizard-${state.scenarioName}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify({ state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wizard-${state.scenarioName || 'draft'}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 'scenarioSetup':
        return <ScenarioSetupStep state={state} update={update} errors={errors} />
      case 'companyInfo':
        return <CompanyInfoStep state={state} update={update} errors={errors} />
      case 'workforce':
        return <WorkforceStep state={state} update={update} errors={errors} />
      case 'usageProfiles':
        return <UsageProfilesStep state={state} update={update} />
      case 'modelsAssumptions':
        return <ModelsAssumptionsStep state={state} update={update} onRecalculate={scheduleRecalculate} />
      case 'fundingBudget':
        return <FundingBudgetStep state={state} update={update} onRecalculate={scheduleRecalculate} />
      case 'review':
        return <ReviewCalculationStep state={state} currency={state.currency} onGoToStep={(s) => goToStep(s as WizardStepId)} />
      case 'saveShare':
        return (
          <SaveShareStep
            state={state}
            savedScenarioId={savedScenarioId}
            currency={state.currency}
            onSaveDraft={handleSaveDraft}
            onSaveReviewed={handleSaveReviewed}
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
          />
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Wizard header */}
      <div className="border-b bg-background px-4 py-3 flex items-center gap-3" data-tour="wizard-header">
        <Button
          variant="ghost" size="icon"
          onClick={() => requestExit(() => navigate(-1))}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-sm font-semibold truncate">{t('wizard.title')}</h1>
          {saveFeedback ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {saveFeedback.type === 'draft' ? t('wizard.draftExplicitSaved') : t('wizard.reviewedExplicitSaved')}{' '}
              {new Date(saveFeedback.at).toLocaleTimeString()}
            </p>
          ) : state.isAutosaved && state.lastAutosave && (
            <p className="text-xs text-muted-foreground">
              {t('wizard.draftSaved')} {new Date(state.lastAutosave).toLocaleTimeString()}
            </p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0">
          {t('wizard.step', { current: currentIndex + 1, total: visibleSteps.length })}
        </Badge>
      </div>

      {/* Stepper */}
      <div className="border-b px-4 py-3 overflow-x-auto">
        <WizardStepper
          steps={visibleSteps}
          currentStep={state.currentStep}
          onStepClick={(step, i) => i < currentIndex && goToStep(step)}
          completedUpTo={currentIndex - 1}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-2xl">
          {renderStep()}
        </div>
      </div>

      {/* Navigation footer */}
      {state.currentStep !== 'saveShare' && (
        <div className="border-t bg-background px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            size="sm"
          >
            <Save className="size-4" />
            {t('wizard.saveDraft')}
          </Button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button variant="outline" onClick={handlePrev}>
                <ArrowLeft className="size-4" /> {t('common.back')}
              </Button>
            )}
            {state.currentStep === 'review' ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveDraft}>
                  <Save className="size-4" /> {t('wizard.saveDraft')}
                </Button>
                <Button onClick={handleSaveReviewed}
                  disabled={!!state.calculationResult?.warnings.some((w) => w.severity === 'error')}>
                  <ArrowRight className="size-4" /> {t('wizard.saveReviewed')}
                </Button>
              </div>
            ) : (
              <Button onClick={handleNext}>
                {t('common.next')} <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <WizardExitGuardDialog
        open={showExitGuard}
        onSaveDraft={() => confirmExitSaveDraft()}
        onDiscard={confirmExitDiscard}
        onCancel={cancelExit}
      />

      <DraftRecoveryDialog
        open={!!savedDraft}
        draftDate={savedDraft?.lastAutosave ?? null}
        onResume={resumeDraft}
        onDiscard={discardDraft}
      />
    </div>
  )
}
