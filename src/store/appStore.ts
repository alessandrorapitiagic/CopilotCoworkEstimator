import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type {
  Company,
  Scenario,
  UsageProfile,
  TaskPreset,
  ModelAssumption,
  AssumptionPack,
  FundingPlan,
  UIPreferences,
  WorkforceSegment,
} from '@/types/domain'
import { storageService } from '@/services/storageService'
import { calculateScenario } from '@/engine/calculationEngine'

interface AppState {
  companies: Company[]
  scenarios: Scenario[]
  usageProfiles: UsageProfile[]
  taskPresets: TaskPreset[]
  modelAssumptions: ModelAssumption[]
  assumptionPacks: AssumptionPack[]
  fundingPlans: FundingPlan[]
  preferences: UIPreferences

  // Hydrate from storage
  hydrate: () => void

  // Companies
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Company
  updateCompany: (id: string, updates: Partial<Company>) => void
  deleteCompany: (id: string) => void
  duplicateCompany: (id: string, withScenarios: boolean) => Company | null
  saveBaselineFromScenario: (companyId: string, scenarioId: string) => void
  copyBaselineToScenario: (companyId: string, scenarioId: string) => void

  // Scenarios
  addScenario: (scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt' | 'calculationResult'>) => Scenario
  updateScenario: (id: string, updates: Partial<Scenario>) => void
  deleteScenario: (id: string) => void
  recalculateScenario: (id: string) => void

  // Segments (within scenario)
  addSegment: (scenarioId: string, segment: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSegment: (scenarioId: string, segmentId: string, updates: Partial<WorkforceSegment>) => void
  deleteSegment: (scenarioId: string, segmentId: string) => void

  // Funding plans
  upsertFundingPlan: (plan: Omit<FundingPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => FundingPlan

  // Preferences
  updatePreferences: (prefs: Partial<UIPreferences>) => void

  // Reset
  resetAll: () => void
}

function now() {
  return new Date().toISOString()
}

function persist(state: Omit<AppState, 'hydrate' | 'addCompany' | 'updateCompany' | 'deleteCompany' | 'addScenario' | 'updateScenario' | 'deleteScenario' | 'recalculateScenario' | 'addSegment' | 'updateSegment' | 'deleteSegment' | 'upsertFundingPlan' | 'updatePreferences' | 'resetAll'>) {
  storageService.save({
    schemaVersion: '1.0.0',
    companies: state.companies,
    scenarios: state.scenarios,
    usageProfiles: state.usageProfiles,
    taskPresets: state.taskPresets,
    modelAssumptions: state.modelAssumptions,
    assumptionPacks: state.assumptionPacks,
    fundingPlans: state.fundingPlans,
    preferences: state.preferences,
  })
}

export const useAppStore = create<AppState>((set, get) => ({
  companies: [],
  scenarios: [],
  usageProfiles: [],
  taskPresets: [],
  modelAssumptions: [],
  assumptionPacks: [],
  fundingPlans: [],
  preferences: storageService.getPreferences(),

  hydrate() {
    const schema = storageService.load()
    set({
      companies: schema.companies,
      scenarios: schema.scenarios,
      usageProfiles: schema.usageProfiles,
      taskPresets: schema.taskPresets,
      modelAssumptions: schema.modelAssumptions,
      assumptionPacks: schema.assumptionPacks,
      fundingPlans: schema.fundingPlans,
      preferences: schema.preferences,
    })
  },

  // ---- Companies ----

  addCompany(data) {
    const company: Company = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
    }
    set((s) => {
      const companies = [...s.companies, company]
      persist({ ...s, companies })
      return { companies }
    })
    return company
  },

  updateCompany(id, updates) {
    set((s) => {
      const companies = s.companies.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: now() } : c,
      )
      persist({ ...s, companies })
      return { companies }
    })
  },

  deleteCompany(id) {
    set((s) => {
      const companies = s.companies.filter((c) => c.id !== id)
      const scenarios = s.scenarios.filter((sc) => sc.companyId !== id)
      const fundingPlans = s.fundingPlans.filter((fp) =>
        !scenarios.find((sc) => sc.id === fp.scenarioId)
      )
      persist({ ...s, companies, scenarios, fundingPlans })
      return { companies, scenarios, fundingPlans }
    })
  },

  duplicateCompany(id, withScenarios) {
    const s = get()
    const original = s.companies.find((c) => c.id === id)
    if (!original) return null

    const newCompanyId = nanoid()
    const newCompany: Company = {
      ...original,
      id: newCompanyId,
      name: `Copy of ${original.name}`,
      source: 'manual',
      status: 'active',
      archivedAt: null,
      createdAt: now(),
      updatedAt: now(),
    }

    let newScenarios = s.scenarios
    if (withScenarios) {
      const originalScenarios = s.scenarios.filter((sc) => sc.companyId === id)
      const duplicated = originalScenarios.map((sc) => ({
        ...sc,
        id: nanoid(),
        companyId: newCompanyId,
        name: sc.name,
        status: 'draft' as const,
        calculationResult: null,
        createdAt: now(),
        updatedAt: now(),
        segments: sc.segments.map((seg) => ({
          ...seg,
          id: nanoid(),
          companyId: newCompanyId,
          createdAt: now(),
          updatedAt: now(),
        })),
      }))
      newScenarios = [...s.scenarios, ...duplicated]
    }

    const companies = [...s.companies, newCompany]
    set((state) => {
      persist({ ...state, companies, scenarios: newScenarios })
      return { companies, scenarios: newScenarios }
    })
    return newCompany
  },

  saveBaselineFromScenario(companyId, scenarioId) {
    const s = get()
    const scenario = s.scenarios.find((sc) => sc.id === scenarioId)
    if (!scenario) return
    const baselineSegments = scenario.segments.map((seg) => ({
      ...seg,
      id: nanoid(),
      scenarioId: null,
      source: 'copied' as const,
      createdAt: now(),
      updatedAt: now(),
    }))
    get().updateCompany(companyId, { baselineSegments })
  },

  copyBaselineToScenario(companyId, scenarioId) {
    const s = get()
    const company = s.companies.find((c) => c.id === companyId)
    if (!company || company.baselineSegments.length === 0) return
    // Replace scenario segments with copies of the baseline
    const copiedSegments = company.baselineSegments.map((seg) => ({
      ...seg,
      id: nanoid(),
      companyId,
      scenarioId,
      source: 'copied' as const,
      createdAt: now(),
      updatedAt: now(),
    }))
    set((state) => {
      const scenarios = state.scenarios.map((sc) =>
        sc.id === scenarioId
          ? { ...sc, segments: copiedSegments, updatedAt: now() }
          : sc,
      )
      persist({ ...state, scenarios })
      return { scenarios }
    })
    get().recalculateScenario(scenarioId)
  },

  // ---- Scenarios ----

  addScenario(data) {
    const scenario: Scenario = {
      ...data,
      id: nanoid(),
      calculationResult: null,
      createdAt: now(),
      updatedAt: now(),
    }
    set((s) => {
      const scenarios = [...s.scenarios, scenario]
      persist({ ...s, scenarios })
      return { scenarios }
    })
    return scenario
  },

  updateScenario(id, updates) {
    set((s) => {
      const scenarios = s.scenarios.map((sc) =>
        sc.id === id ? { ...sc, ...updates, updatedAt: now() } : sc,
      )
      persist({ ...s, scenarios })
      return { scenarios }
    })
  },

  deleteScenario(id) {
    set((s) => {
      const scenarios = s.scenarios.filter((sc) => sc.id !== id)
      const fundingPlans = s.fundingPlans.filter((fp) => fp.scenarioId !== id)
      persist({ ...s, scenarios, fundingPlans })
      return { scenarios, fundingPlans }
    })
  },

  recalculateScenario(id) {
    const s = get()
    const scenario = s.scenarios.find((sc) => sc.id === id)
    if (!scenario) return

    const pack = s.assumptionPacks.find((p) => p.id === scenario.assumptionPackId)
    if (!pack) return

    const funding = s.fundingPlans.find((fp) => fp.scenarioId === id) ?? null
    const result = calculateScenario(
      scenario,
      s.usageProfiles,
      s.modelAssumptions,
      pack,
      funding,
    )
    get().updateScenario(id, { calculationResult: result })
  },

  // ---- Segments ----

  addSegment(scenarioId, data) {
    const segment: WorkforceSegment = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
    }
    set((s) => {
      const scenarios = s.scenarios.map((sc) =>
        sc.id === scenarioId
          ? { ...sc, segments: [...sc.segments, segment], updatedAt: now() }
          : sc,
      )
      persist({ ...s, scenarios })
      return { scenarios }
    })
    // Recalculate after adding segment
    get().recalculateScenario(scenarioId)
  },

  updateSegment(scenarioId, segmentId, updates) {
    set((s) => {
      const scenarios = s.scenarios.map((sc) =>
        sc.id === scenarioId
          ? {
              ...sc,
              segments: sc.segments.map((seg) =>
                seg.id === segmentId ? { ...seg, ...updates, updatedAt: now() } : seg,
              ),
              updatedAt: now(),
            }
          : sc,
      )
      persist({ ...s, scenarios })
      return { scenarios }
    })
    get().recalculateScenario(scenarioId)
  },

  deleteSegment(scenarioId, segmentId) {
    set((s) => {
      const scenarios = s.scenarios.map((sc) =>
        sc.id === scenarioId
          ? {
              ...sc,
              segments: sc.segments.filter((seg) => seg.id !== segmentId),
              updatedAt: now(),
            }
          : sc,
      )
      persist({ ...s, scenarios })
      return { scenarios }
    })
    get().recalculateScenario(scenarioId)
  },

  // ---- Funding Plans ----

  upsertFundingPlan(data) {
    const s = get()
    const existingId = data.id ?? nanoid()
    const existing = s.fundingPlans.find((fp) => fp.id === existingId)
    const plan: FundingPlan = {
      ...data,
      id: existingId,
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    }
    set((state) => {
      const fundingPlans = existing
        ? state.fundingPlans.map((fp) => (fp.id === plan.id ? plan : fp))
        : [...state.fundingPlans, plan]
      persist({ ...state, fundingPlans })
      return { fundingPlans }
    })
    return plan
  },

  // ---- Preferences ----

  updatePreferences(prefs) {
    set((s) => {
      const preferences = { ...s.preferences, ...prefs }
      persist({ ...s, preferences })
      return { preferences }
    })
  },

  // ---- Reset ----

  resetAll() {
    storageService.reset()
    get().hydrate()
  },
}))
