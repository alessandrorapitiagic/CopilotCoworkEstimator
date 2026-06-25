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
  baselineSegments: WorkforceSegment[]
}

// ----- Workforce Segment ------------------------------------

export type TaskIntensity = 'light' | 'medium' | 'heavy'
export type SegmentCategoryType = 'manager' | 'whiteCollar' | 'blueCollar' | 'sales' | 'customerCare' | 'legal' | 'finance' | 'hr' | 'it' | 'operations' | 'fieldWorkers' | 'custom'
export type TaskMixMode = 'profile' | 'custom'
export type SegmentSource = 'manual' | 'imported' | 'copied' | 'demo'

export interface CustomTaskMix {
  lightTasksPerUserPerMonth: number
  mediumTasksPerUserPerMonth: number
  heavyTasksPerUserPerMonth: number
}

export interface TaskMixItem {
  taskPresetId: ID
  intensity: TaskIntensity
  tasksPerMonth: number
}

export interface WorkforceSegment extends Auditable {
  companyId: ID
  scenarioId: ID | null
  name: string
  description: string | null
  categoryType: SegmentCategoryType
  headcount: number
  enabledPercentage: number     // 0–100
  activeUsagePercentage: number // 0–100
  usageProfileId: ID
  preferredModelId: ID
  taskMixMode: TaskMixMode
  customTaskMix: CustomTaskMix | null
  taskMix: TaskMixItem[]
  contextFactorOverride: number | null
  toolsFactorOverride: number | null
  runtimeFactorOverride: number | null
  browserFactorOverride: number | null
  imageFactorOverride: number | null
  rolloutPhase: string | null
  includeInCalculation: boolean
  notes: string | null
  source: SegmentSource
  metadata: Record<string, unknown>
}

// ----- Usage Profile -----------------------------------------

export type UsageLevel = 'light' | 'medium' | 'heavy' | 'custom'
export type UsageProfileSource = 'system' | 'manual' | 'imported' | 'copied' | 'shared'

export interface UsageProfile extends Auditable {
  name: string
  description: string | null
  usageLevel: UsageLevel
  lightTasksPerUserPerMonth: number
  mediumTasksPerUserPerMonth: number
  heavyTasksPerUserPerMonth: number
  defaultModelId: ID
  contextFactor: number
  toolsFactor: number
  runtimeFactor: number
  browserFactor: number
  imageFactor: number
  recommendedFor: string[]
  examples: string[]
  notes: string | null
  isSystemDefault: boolean
  isEditable: boolean
  source: UsageProfileSource
  assumptionPackId: string | null
  metadata: Record<string, unknown>
}

// Computed impact of a profile on one active user
export interface UsageProfileImpact {
  totalTasksPerUserPerMonth: number
  lightTaskWeight: number
  mediumTaskWeight: number
  heavyTaskWeight: number
  creditsPerActiveUserMin: number
  creditsPerActiveUserMid: number
  creditsPerActiveUserMax: number
  costPerActiveUserMin: number
  costPerActiveUserMid: number
  costPerActiveUserMax: number
}

// ----- Task Preset -------------------------------------------

export type ContextComplexity = 'low' | 'medium' | 'high'
export type ToolsUsage = 'none' | 'light' | 'heavy'
export type RuntimeComplexity = 'fast' | 'medium' | 'slow'
export type TaskPresetSource = 'system' | 'manual' | 'imported' | 'copied'

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
  isEditable: boolean
  source: TaskPresetSource
  category: string | null   // e.g. "research", "legal", "sales", "content"
  metadata: Record<string, unknown>
}

// ----- Model Assumption --------------------------------------

export type ModelClass = 'standard' | 'advanced' | 'frontier' | 'image' | 'auto'
export type ModelSource = 'system' | 'manual' | 'imported'

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
  source: ModelSource
  metadata: Record<string, unknown>
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

export type AssumptionPackSourceType = 'system' | 'officialGuide' | 'custom' | 'imported' | 'shared' | 'legacy'

export interface AssumptionPack extends Auditable {
  name: string
  version: string
  // Legacy field (source name/URL text) — kept for compat
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
  // New fields per FP-008
  sourceType: AssumptionPackSourceType
  sourceName: string | null
  sourceUrl: string | null
  isCurrentDefault: boolean
  isEditable: boolean
  isDeprecated: boolean
  deprecatedReason: string | null
  notes: string | null
  metadata: Record<string, unknown>
  sourceGuideName: string | null
  sourceGuideVersion: string | null
  heavyDefaults: {
    openEnded: boolean
    defaultMax: number | null
    planningCap: number | null
    notes: string | null
  }
}

// ----- Funding Plan ------------------------------------------

export type FundingMode = 'payg' | 'prepaid' | 'existing_capacity' | 'blended'
export type FundingConstruct = 'payg' | 'p3PrePurchase' | 'existingCapacity' | 'blended' | 'custom'
export type P3SpilloverMode = 'payg' | 'additionalPurchase' | 'blocked'
export type BudgetEvaluationBasis = 'monthlyPayg' | 'annualP3Commitment' | 'monthlyP3Allocation'

export interface FundingPlan extends Auditable {
  scenarioId: ID
  mode: FundingMode
  construct?: FundingConstruct
  paygPricePerCredit: number
  prepaidCredits: number
  prepaidEffectivePricePerCredit: number
  existingMonthlyCredits: number
  discountPercentage: number
  currency: string
  budgetMonthly: number | null
  budgetAnnual: number | null
  notes: string | null
  p3?: {
    tier: number
    annualPrepaidCredits: number
    discountPercentage: number
    annualPrepaidCost: number
    effectivePricePerCredit: number
    unusedCreditsExpire: boolean
    spilloverMode: P3SpilloverMode
  } | null
  budgetEvaluationBasis?: BudgetEvaluationBasis
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
  calculationMode?: CalculationMode
  workloadType?: WorkloadType
  sourceGuideName?: string | null
  sourceGuideVersion?: string | null
  usesOfficialGuideRanges?: boolean
  usesAdvancedFactors?: boolean
  hasOpenEndedHeavyRange?: boolean
  heavyPlanningCap?: number | null
  maxIsOpenEnded?: boolean
  usesCustomPlanningLogic?: boolean
}

// ----- Scenario ----------------------------------------------

export type ScenarioStatus = 'draft' | 'reviewed' | 'shared' | 'archived'
export type CalculationMode = 'officialGuide' | 'advancedDriverAdjusted' | 'customPlanning'
export type WorkloadType = 'cowork' | 'workIqApi' | 'copilotStudio' | 'businessApplications' | 'other'

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
  calculationMode?: CalculationMode
  workloadType?: WorkloadType
}

// ----- Workforce Summary (computed, not stored) ---------------

export interface WorkforceSummary {
  totalEmployees: number
  totalSegmentedHeadcount: number
  unclassifiedEmployees: number
  totalEnabledUsers: number
  totalActiveUsers: number
  monthlyCredits: { min: number; mid: number; max: number }
  monthlyCost: { min: number; mid: number; max: number }
  segmentOverTotal: boolean  // sum > totalEmployees
  segmentUnderTotal: boolean // sum < totalEmployees
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
