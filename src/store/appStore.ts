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

  // Usage Profiles (custom management)
  addUsageProfile: (profile: Omit<UsageProfile, 'id' | 'createdAt' | 'updatedAt'>) => UsageProfile
  updateUsageProfile: (id: string, updates: Partial<UsageProfile>) => void
  duplicateUsageProfile: (id: string) => UsageProfile | null
  deleteUsageProfile: (id: string) => { success: boolean; reason?: string }
  isProfileInUse: (id: string) => boolean

  // Task Presets (custom management)
  addTaskPreset: (preset: Omit<TaskPreset, 'id' | 'createdAt' | 'updatedAt'>) => TaskPreset
  updateTaskPreset: (id: string, updates: Partial<TaskPreset>) => void
  duplicateTaskPreset: (id: string) => TaskPreset | null
  deleteTaskPreset: (id: string) => { success: boolean; reason?: string }

  // Model Assumptions (enable/disable + factor edit)
  updateModelAssumption: (id: string, updates: Partial<ModelAssumption>) => void
  toggleModelEnabled: (id: string) => void

  // Assumption Packs (CRUD custom + set default + deprecate)
  addAssumptionPack: (pack: Omit<AssumptionPack, 'id' | 'createdAt' | 'updatedAt'>) => AssumptionPack
  updateAssumptionPack: (id: string, updates: Partial<AssumptionPack>) => void
  duplicateAssumptionPack: (id: string) => AssumptionPack | null
  deleteAssumptionPack: (id: string) => { success: boolean; reason?: string }
  setDefaultAssumptionPack: (id: string) => void
  deprecateAssumptionPack: (id: string, reason: string) => void
  isPackInUse: (id: string) => boolean

  // Preferences
  updatePreferences: (prefs: Partial<UIPreferences>) => void

  // Reset
  resetAll: () => void
}

function now() {
  return new Date().toISOString()
}

function persist(state: Omit<AppState, 'hydrate' | 'addCompany' | 'updateCompany' | 'deleteCompany' | 'duplicateCompany' | 'saveBaselineFromScenario' | 'copyBaselineToScenario' | 'addScenario' | 'updateScenario' | 'deleteScenario' | 'recalculateScenario' | 'addSegment' | 'updateSegment' | 'deleteSegment' | 'upsertFundingPlan' | 'addUsageProfile' | 'updateUsageProfile' | 'duplicateUsageProfile' | 'deleteUsageProfile' | 'isProfileInUse' | 'addTaskPreset' | 'updateTaskPreset' | 'duplicateTaskPreset' | 'deleteTaskPreset' | 'updateModelAssumption' | 'toggleModelEnabled' | 'addAssumptionPack' | 'updateAssumptionPack' | 'duplicateAssumptionPack' | 'deleteAssumptionPack' | 'setDefaultAssumptionPack' | 'deprecateAssumptionPack' | 'isPackInUse' | 'updatePreferences' | 'resetAll'>) {
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
      calculationMode: data.calculationMode ?? 'officialGuide',
      workloadType: data.workloadType ?? 'cowork',
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
      construct: data.construct ?? (data.mode === 'prepaid' ? 'p3PrePurchase' : data.mode === 'existing_capacity' ? 'existingCapacity' : data.mode),
      p3: data.p3 ?? null,
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

  // ---- Usage Profiles ----

  addUsageProfile(data) {
    const profile: UsageProfile = {
      ...data,
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
    }
    set((s) => {
      const usageProfiles = [...s.usageProfiles, profile]
      persist({ ...s, usageProfiles })
      return { usageProfiles }
    })
    return profile
  },

  updateUsageProfile(id, updates) {
    set((s) => {
      const usageProfiles = s.usageProfiles.map((p) =>
        p.id === id && !p.isSystemDefault ? { ...p, ...updates, updatedAt: now() } : p,
      )
      persist({ ...s, usageProfiles })
      return { usageProfiles }
    })
  },

  duplicateUsageProfile(id) {
    const s = get()
    const original = s.usageProfiles.find((p) => p.id === id)
    if (!original) return null
    const copy: UsageProfile = {
      ...original,
      id: nanoid(),
      name: `Copy of ${original.name}`,
      isSystemDefault: false,
      isEditable: true,
      source: 'copied',
      createdAt: now(),
      updatedAt: now(),
    }
    set((state) => {
      const usageProfiles = [...state.usageProfiles, copy]
      persist({ ...state, usageProfiles })
      return { usageProfiles }
    })
    return copy
  },

  deleteUsageProfile(id) {
    const s = get()
    const profile = s.usageProfiles.find((p) => p.id === id)
    if (!profile) return { success: false, reason: 'not_found' }
    if (profile.isSystemDefault) return { success: false, reason: 'system_profile' }
    // Check if in use
    const inUse = s.scenarios.some((sc) => sc.segments.some((seg) => seg.usageProfileId === id))
    if (inUse) return { success: false, reason: 'in_use' }
    set((state) => {
      const usageProfiles = state.usageProfiles.filter((p) => p.id !== id)
      persist({ ...state, usageProfiles })
      return { usageProfiles }
    })
    return { success: true }
  },

  isProfileInUse(id) {
    const s = get()
    return s.scenarios.some((sc) => sc.segments.some((seg) => seg.usageProfileId === id))
  },

  // ---- Task Presets ----

  addTaskPreset(data) {
    const preset: TaskPreset = { ...data, id: nanoid(), createdAt: now(), updatedAt: now() }
    set((s) => {
      const taskPresets = [...s.taskPresets, preset]
      persist({ ...s, taskPresets })
      return { taskPresets }
    })
    return preset
  },

  updateTaskPreset(id, updates) {
    set((s) => {
      const taskPresets = s.taskPresets.map((p) =>
        p.id === id && !p.isSystemDefault ? { ...p, ...updates, updatedAt: now() } : p,
      )
      persist({ ...s, taskPresets })
      return { taskPresets }
    })
  },

  duplicateTaskPreset(id) {
    const s = get()
    const original = s.taskPresets.find((p) => p.id === id)
    if (!original) return null
    const copy: TaskPreset = {
      ...original,
      id: nanoid(),
      name: `Copy of ${original.name}`,
      isSystemDefault: false,
      isEditable: true,
      source: 'copied',
      createdAt: now(),
      updatedAt: now(),
    }
    set((state) => {
      const taskPresets = [...state.taskPresets, copy]
      persist({ ...state, taskPresets })
      return { taskPresets }
    })
    return copy
  },

  deleteTaskPreset(id) {
    const s = get()
    const preset = s.taskPresets.find((p) => p.id === id)
    if (!preset) return { success: false, reason: 'not_found' }
    if (preset.isSystemDefault) return { success: false, reason: 'system_preset' }
    set((state) => {
      const taskPresets = state.taskPresets.filter((p) => p.id !== id)
      persist({ ...state, taskPresets })
      return { taskPresets }
    })
    return { success: true }
  },

  // ---- Model Assumptions ----

  updateModelAssumption(id, updates) {
    set((s) => {
      const modelAssumptions = s.modelAssumptions.map((m) =>
        m.id === id && m.isEditable ? { ...m, ...updates, updatedAt: now() } : m,
      )
      persist({ ...s, modelAssumptions })
      return { modelAssumptions }
    })
  },

  toggleModelEnabled(id) {
    const s = get()
    const model = s.modelAssumptions.find((m) => m.id === id)
    if (!model) return
    get().updateModelAssumption(id, { isEnabled: !model.isEnabled })
  },

  // ---- Assumption Packs ----

  addAssumptionPack(data) {
    const pack: AssumptionPack = { ...data, id: nanoid(), createdAt: now(), updatedAt: now() }
    set((s) => {
      const assumptionPacks = [...s.assumptionPacks, pack]
      persist({ ...s, assumptionPacks })
      return { assumptionPacks }
    })
    return pack
  },

  updateAssumptionPack(id, updates) {
    set((s) => {
      const assumptionPacks = s.assumptionPacks.map((p) =>
        p.id === id && !p.isSystemDefault ? { ...p, ...updates, updatedAt: now() } : p,
      )
      persist({ ...s, assumptionPacks })
      return { assumptionPacks }
    })
  },

  duplicateAssumptionPack(id) {
    const s = get()
    const original = s.assumptionPacks.find((p) => p.id === id)
    if (!original) return null
    const copy: AssumptionPack = {
      ...original,
      id: nanoid(),
      name: `Copy of ${original.name}`,
      version: '1.0.0',
      isSystemDefault: false,
      isCurrentDefault: false,
      isEditable: true,
      isDeprecated: false,
      deprecatedReason: null,
      sourceType: 'custom',
      createdAt: now(),
      updatedAt: now(),
    }
    set((state) => {
      const assumptionPacks = [...state.assumptionPacks, copy]
      persist({ ...state, assumptionPacks })
      return { assumptionPacks }
    })
    return copy
  },

  deleteAssumptionPack(id) {
    const s = get()
    const pack = s.assumptionPacks.find((p) => p.id === id)
    if (!pack) return { success: false, reason: 'not_found' }
    if (pack.isSystemDefault) return { success: false, reason: 'system_pack' }
    if (s.scenarios.some((sc) => sc.assumptionPackId === id)) {
      return { success: false, reason: 'in_use' }
    }
    set((state) => {
      const assumptionPacks = state.assumptionPacks.filter((p) => p.id !== id)
      persist({ ...state, assumptionPacks })
      return { assumptionPacks }
    })
    return { success: true }
  },

  setDefaultAssumptionPack(id) {
    set((s) => {
      const pack = s.assumptionPacks.find((p) => p.id === id)
      if (!pack || pack.isDeprecated) return s
      const assumptionPacks = s.assumptionPacks.map((p) => ({
        ...p,
        isCurrentDefault: p.id === id,
        updatedAt: p.id === id ? now() : p.updatedAt,
      }))
      persist({ ...s, assumptionPacks })
      return { assumptionPacks }
    })
  },

  deprecateAssumptionPack(id, reason) {
    const s = get()
    const pack = s.assumptionPacks.find((p) => p.id === id)
    if (!pack || pack.isSystemDefault) return
    get().updateAssumptionPack(id, {
      isDeprecated: true,
      deprecatedReason: reason,
      isCurrentDefault: false,
    })
  },

  isPackInUse(id) {
    return get().scenarios.some((sc) => sc.assumptionPackId === id)
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
