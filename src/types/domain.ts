// ============================================================
// Core domain types for Copilot Cowork Credits Estimator
// ============================================================

// ----- Shared ------------------------------------------------

export type ID = string

export interface Auditable {
  id: ID
  createdAt: string
  updatedAt: string
}

// ----- Company -----------------------------------------------

export type Industry =
  | 'technology'
  | 'finance'
  | 'healthcare'
  | 'retail'
  | 'manufacturing'
  | 'professional_services'
  | 'education'
  | 'government'
  | 'energy'
  | 'media'
  | 'other'

export type CompanyStatus = 'active' | 'archived'
export type CompanySource = 'manual' | 'imported' | 'shared' | 'demo'

export interface Company extends Auditable {
  name: string
  legalName: string | null
  industry: Industry | null
  country: string | null
  region: string | null
  description: string | null
  totalEmployees: number
  estimatedKnowledgeWorkers: number | null
  status: CompanyStatus
  source: CompanySource
  tags: string[]
  notes: string | null
  ownerNotes: string | null
  currency: string | null
  defaultAssumptionPackId: string | null
  archivedAt: string | null
  metadata: Record<string, unknown>
}

// ----- Workforce Segment ------------------------------------

export type TaskIntensity = 'light' | 'medium' | 'heavy'

export interface TaskMixItem {
  taskPresetId: ID
  intensity: TaskIntensity
  tasksPerMonth: number
}

export interface WorkforceSegment extends Auditable {
  companyId: ID
  scenarioId: ID
  name: string
  headcount: number
  enabledPercentage: number    // 0–100
  activeUsagePercentage: number // 0–100
  usageProfileId: ID
  preferredModelId: ID
  taskMix: TaskMixItem[]
  notes: string | null
}

// ----- Usage Profile -----------------------------------------

export interface UsageProfile extends Auditable {
  name: string
  description: string | null
  lightTasksPerUserPerMonth: number
  mediumTasksPerUserPerMonth: number
  heavyTasksPerUserPerMonth: number
  defaultModelId: ID
  contextFactor: number
  toolsFactor: number
  runtimeFactor: number
  browserFactor: number
  imageFactor: number
  isSystemDefault: boolean
}

// ----- Task Preset -------------------------------------------

export type ContextComplexity = 'low' | 'medium' | 'high'
export type ToolsUsage = 'none' | 'light' | 'heavy'
export type RuntimeComplexity = 'fast' | 'medium' | 'slow'

export interface TaskPreset extends Auditable {
  name: string
  description: string | null
  intensity: TaskIntensity
  defaultCreditsMin: number
  defaultCreditsMid: number
  defaultCreditsMax: number
  recommendedModels: ID[]
  contextComplexity: ContextComplexity
  toolsUsage: ToolsUsage
  runtimeComplexity: RuntimeComplexity
  browserUsage: boolean
  imageUsage: boolean
  notes: string | null
  isSystemDefault: boolean
}

// ----- Model Assumption --------------------------------------

export type ModelClass = 'standard' | 'advanced' | 'frontier' | 'image' | 'auto'

export interface ModelAssumption extends Auditable {
  name: string
  provider: string
  description: string | null
  modelClass: ModelClass
  modelFactor: number
  inputWeight: number
  outputWeight: number
  recommendedFor: string[]
  availabilityNotes: string | null
  isOfficiallyDocumented: boolean
  isEditable: boolean
  isEnabled: boolean
}

// ----- Assumption Pack ---------------------------------------

export interface CreditBands {
  lightMin: number
  lightMid: number
  lightMax: number
  mediumMin: number
  mediumMid: number
  mediumMax: number
  heavyMin: number
  heavyMid: number
  heavyMax: number
}

export interface AssumptionPackFactors {
  contextLow: number
  contextMedium: number
  contextHigh: number
  toolsNone: number
  toolsLight: number
  toolsHeavy: number
  runtimeFast: number
  runtimeMedium: number
  runtimeSlow: number
  browserMultiplier: number
  imageMultiplier: number
}

export interface AssumptionPack extends Auditable {
  name: string
  version: string
  source: string | null
  sourceDate: string | null
  description: string | null
  creditBands: CreditBands
  modelFactors: Record<ID, number>
  factors: AssumptionPackFactors
  fundingDefaults: {
    paygPricePerCredit: number
    currency: string
  }
  isSystemDefault: boolean
  disclaimer: string | null
}

// ----- Funding Plan ------------------------------------------

export type FundingMode = 'payg' | 'prepaid' | 'existing_capacity' | 'blended'

export interface FundingPlan extends Auditable {
  scenarioId: ID
  mode: FundingMode
  paygPricePerCredit: number
  prepaidCredits: number
  prepaidEffectivePricePerCredit: number
  existingMonthlyCredits: number
  discountPercentage: number
  currency: string
  budgetMonthly: number | null
  budgetAnnual: number | null
  notes: string | null
}

// ----- Calculation Result ------------------------------------

export interface CreditsRange {
  min: number
  mid: number
  max: number
}

export interface CostRange {
  min: number
  mid: number
  max: number
}

export interface SegmentBreakdown {
  segmentId: ID
  segmentName: string
  enabledUsers: number
  activeUsers: number
  monthlyCredits: CreditsRange
  monthlyCost: CostRange
  warnings: string[]
}

export interface CalculationWarning {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  segmentId?: ID
}

export interface CalculationResult {
  scenarioId: ID
  monthlyCredits: CreditsRange
  annualCredits: CreditsRange
  monthlyCost: CostRange
  annualCost: CostRange
  costPerEnabledUser: CostRange
  costPerActiveUser: CostRange
  breakdownBySegment: SegmentBreakdown[]
  breakdownByModel: Record<ID, CreditsRange>
  breakdownByIntensity: Record<TaskIntensity, CreditsRange>
  coverageByExistingCapacity: number
  spilloverCredits: number
  warnings: CalculationWarning[]
  calculatedAt: string
  assumptionPackId: ID
  isRangeBased: boolean
}

// ----- Scenario ----------------------------------------------

export type ScenarioStatus = 'draft' | 'reviewed' | 'shared' | 'archived'

export interface Scenario extends Auditable {
  companyId: ID
  name: string
  description: string | null
  assumptionPackId: ID
  fundingPlanId: ID | null
  segments: WorkforceSegment[]
  calculationResult: CalculationResult | null
  status: ScenarioStatus
  tags: string[]
}

// ----- UI Preferences ----------------------------------------

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'it' | 'en'
export type DisplayMode = 'range' | 'point'
export type DefaultValueDisplay = 'min' | 'mid' | 'max'

export interface UIPreferences {
  theme: Theme
  language: Language
  displayMode: DisplayMode
  defaultValueDisplay: DefaultValueDisplay
  currency: string
}

// ----- Storage Schema ----------------------------------------

export const STORAGE_SCHEMA_VERSION = '1.0.0'

export interface AppStorageSchema {
  schemaVersion: string
  companies: Company[]
  scenarios: Scenario[]
  usageProfiles: UsageProfile[]
  taskPresets: TaskPreset[]
  modelAssumptions: ModelAssumption[]
  assumptionPacks: AssumptionPack[]
  fundingPlans: FundingPlan[]
  preferences: UIPreferences
  exportedAt?: string
}
