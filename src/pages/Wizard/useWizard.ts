import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import type {
  WorkforceSegment,
  FundingMode,
  FundingPlan,
  CalculationResult,
  Industry,
} from '@/types/domain'
import { useAppStore } from '@/store/appStore'
import { calculateScenario } from '@/engine/calculationEngine'

const DRAFT_KEY = 'copilot_cowork_wizard_draft_v1'

export type WizardStepId =
  | 'scenarioSetup'
  | 'companyInfo'
  | 'workforce'
  | 'usageProfiles'
  | 'modelsAssumptions'
  | 'fundingBudget'
  | 'review'
  | 'saveShare'

export type CompanyMode = 'existing' | 'new'

export interface WizardState {
  wizardId: string
  source: 'manual' | 'duplicate' | 'imported'
  currentStep: WizardStepId
  isDirty: boolean
  isAutosaved: boolean
  lastAutosave: string | null

  // Step 1 — Scenario setup
  scenarioName: string
  scenarioDescription: string
  companyMode: CompanyMode
  companyId: string     // existing company id
  scenarioId: string    // will be the saved scenario id

  // Step 2 — Company info (only if companyMode = 'new')
  newCompanyName: string
  newCompanyEmployees: string
  newCompanyIndustry: Industry | ''
  newCompanyCountry: string

  // Step 3 — Workforce
  segments: WorkforceSegment[]

  // Step 5 — Models & Assumptions
  assumptionPackId: string
  modelSelectionMode: 'global' | 'per-segment'
  defaultModelId: string

  // Step 6 — Funding & Budget
  fundingMode: FundingMode
  pricePerCredit: string
  existingCredits: string
  prepaidCredits: string
  prepaidEffectivePrice: string
  discountPct: string
  budgetMonthly: string
  budgetAnnual: string
  currency: string

  // Calculated
  calculationResult: CalculationResult | null
}

export function defaultWizardState(overrides: Partial<WizardState> = {}): WizardState {
  const store = useAppStore.getState()
  const defaultPack = store.assumptionPacks.find((p) => p.isCurrentDefault) ?? store.assumptionPacks.find((p) => p.isSystemDefault)
  return {
    wizardId: nanoid(),
    source: 'manual',
    currentStep: 'scenarioSetup',
    isDirty: false,
    isAutosaved: false,
    lastAutosave: null,
    scenarioName: '',
    scenarioDescription: '',
    companyMode: 'existing',
    companyId: '',
    scenarioId: nanoid(),
    newCompanyName: '',
    newCompanyEmployees: '',
    newCompanyIndustry: '',
    newCompanyCountry: '',
    segments: [],
    assumptionPackId: defaultPack?.id ?? '',
    modelSelectionMode: 'global',
    defaultModelId: 'model-auto',
    fundingMode: 'payg',
    pricePerCredit: String(defaultPack?.fundingDefaults.paygPricePerCredit ?? 0.01),
    existingCredits: '0',
    prepaidCredits: '0',
    prepaidEffectivePrice: String(defaultPack?.fundingDefaults.paygPricePerCredit ?? 0.01),
    discountPct: '0',
    budgetMonthly: '',
    budgetAnnual: '',
    currency: useAppStore.getState().preferences.currency,
    calculationResult: null,
    ...overrides,
  }
}

export const WIZARD_STEPS: WizardStepId[] = [
  'scenarioSetup',
  'companyInfo',
  'workforce',
  'usageProfiles',
  'modelsAssumptions',
  'fundingBudget',
  'review',
  'saveShare',
]

export function getVisibleSteps(state: WizardState): WizardStepId[] {
  if (state.companyMode === 'new') return WIZARD_STEPS
  return WIZARD_STEPS.filter((s) => s !== 'companyInfo')
}

function serializeDraft(state: WizardState): string {
  return JSON.stringify(state)
}

function deserializeDraft(): WizardState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WizardState
  } catch {
    return null
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

export function useWizard(initialOverrides?: Partial<WizardState>) {
  const [state, setState] = useState<WizardState>(() => defaultWizardState(initialOverrides))
  const [showExitGuard, setShowExitGuard] = useState(false)
  const [pendingExit, setPendingExit] = useState<(() => void) | null>(null)
  const [savedDraft, setSavedDraft] = useState<WizardState | null>(null)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const storeState = useAppStore()

  // Load saved draft on first mount
  useEffect(() => {
    const draft = deserializeDraft()
    if (draft && !initialOverrides?.wizardId) {
      setSavedDraft(draft)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Autosave whenever state changes (debounced 800ms)
  useEffect(() => {
    if (!state.isDirty) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, serializeDraft(state))
        setState((s) => ({
          ...s,
          isAutosaved: true,
          lastAutosave: new Date().toISOString(),
        }))
      } catch { /* quota exceeded */ }
    }, 800)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
  }, [state])

  // Compute calculation preview when conditions allow
  const recalculate = useCallback(() => {
    setState((s) => {
      const pack = storeState.assumptionPacks.find((p) => p.id === s.assumptionPackId)
      if (!pack) return s
      const hasSegments = s.segments.some((seg) => seg.includeInCalculation)
      if (!hasSegments) return { ...s, calculationResult: null }

      const fundingPlan: FundingPlan = {
        id: 'wizard-funding',
        scenarioId: s.scenarioId,
        mode: s.fundingMode,
        paygPricePerCredit: Number(s.pricePerCredit) || pack.fundingDefaults.paygPricePerCredit,
        prepaidCredits: Number(s.prepaidCredits) || 0,
        prepaidEffectivePricePerCredit: Number(s.prepaidEffectivePrice) || Number(s.pricePerCredit) || pack.fundingDefaults.paygPricePerCredit,
        existingMonthlyCredits: Number(s.existingCredits) || 0,
        discountPercentage: Number(s.discountPct) || 0,
        currency: s.currency,
        budgetMonthly: s.budgetMonthly ? Number(s.budgetMonthly) : null,
        budgetAnnual: s.budgetAnnual ? Number(s.budgetAnnual) : null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const mockScenario = {
        id: s.scenarioId,
        companyId: s.companyId,
        name: s.scenarioName,
        description: null,
        assumptionPackId: s.assumptionPackId,
        fundingPlanId: null,
        segments: s.segments,
        calculationResult: null,
        status: 'draft' as const,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = calculateScenario(
        mockScenario,
        storeState.usageProfiles,
        storeState.modelAssumptions,
        pack,
        fundingPlan,
      )

      return { ...s, calculationResult: result }
    })
  }, [storeState])

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch, isDirty: true, isAutosaved: false }))
  }

  function initialize(patch: Partial<WizardState>) {
    setState((s) => ({
      ...s,
      ...patch,
      isDirty: false,
      isAutosaved: false,
      lastAutosave: null,
    }))
  }

  function resumeDraft() {
    if (!savedDraft) return
    setState(savedDraft)
    setSavedDraft(null)
  }

  function discardDraft() {
    clearDraft()
    setSavedDraft(null)
  }

  function discardWizard() {
    clearDraft()
    setState(defaultWizardState(initialOverrides))
  }

  function getVisibleStepsList() {
    return getVisibleSteps(state)
  }

  function getCurrentStepIndex() {
    const visible = getVisibleStepsList()
    return Math.max(0, visible.indexOf(state.currentStep))
  }

  function goToStep(step: WizardStepId) {
    setState((s) => ({ ...s, currentStep: step }))
  }

  function goNext() {
    const visible = getVisibleStepsList()
    const idx = visible.indexOf(state.currentStep)
    if (idx < visible.length - 1) {
      goToStep(visible[idx + 1])
    }
  }

  function goPrev() {
    const visible = getVisibleStepsList()
    const idx = visible.indexOf(state.currentStep)
    if (idx > 0) goToStep(visible[idx - 1])
  }

  function requestExit(onConfirm: () => void) {
    if (!state.isDirty) { onConfirm(); return }
    setPendingExit(() => onConfirm)
    setShowExitGuard(true)
  }

  function confirmExitDiscard() {
    discardWizard()
    setShowExitGuard(false)
    pendingExit?.()
    setPendingExit(null)
  }

  function confirmExitSaveDraft(onAfterSave?: () => void) {
    // Keep autosave already done
    setShowExitGuard(false)
    onAfterSave?.()
    pendingExit?.()
    setPendingExit(null)
  }

  function cancelExit() {
    setShowExitGuard(false)
    setPendingExit(null)
  }

  return {
    state,
    update,
    initialize,
    recalculate,
    goToStep,
    goNext,
    goPrev,
    getCurrentStepIndex,
    getVisibleStepsList,
    resumeDraft,
    discardDraft,
    discardWizard,
    savedDraft,
    showExitGuard,
    requestExit,
    confirmExitDiscard,
    confirmExitSaveDraft,
    cancelExit,
  }
}
