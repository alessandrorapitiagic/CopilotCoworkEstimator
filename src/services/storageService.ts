import type { AppStorageSchema, UIPreferences } from '@/types/domain'
import {
  SYSTEM_ASSUMPTION_PACK,
  SYSTEM_MODELS,
  SYSTEM_USAGE_PROFILES,
  SYSTEM_TASK_PRESETS,
  DEFAULT_PREFERENCES,
} from '@/lib/systemData'
import { STORAGE_SCHEMA_VERSION } from '@/types/domain'

const STORAGE_KEY = 'copilot_cowork_estimator_v1'

function getDefaultSchema(): AppStorageSchema {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    companies: [],
    scenarios: [],
    usageProfiles: [...SYSTEM_USAGE_PROFILES],
    taskPresets: [...SYSTEM_TASK_PRESETS],
    modelAssumptions: [...SYSTEM_MODELS],
    assumptionPacks: [SYSTEM_ASSUMPTION_PACK],
    fundingPlans: [],
    preferences: { ...DEFAULT_PREFERENCES },
  }
}

function loadRaw(): AppStorageSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultSchema()
    const parsed = JSON.parse(raw) as Partial<AppStorageSchema>
    // Merge with defaults to handle schema evolution
    const defaults = getDefaultSchema()
    return {
      schemaVersion: parsed.schemaVersion ?? defaults.schemaVersion,
      companies: migrateCompanies(parsed.companies ?? defaults.companies),
      scenarios: migrateScenarios(parsed.scenarios ?? defaults.scenarios),
      usageProfiles: mergeSystemItems(parsed.usageProfiles ?? [], defaults.usageProfiles),
      taskPresets: mergeSystemItems(parsed.taskPresets ?? [], defaults.taskPresets),
      modelAssumptions: mergeSystemItems(parsed.modelAssumptions ?? [], defaults.modelAssumptions),
      assumptionPacks: mergeSystemItems(parsed.assumptionPacks ?? [], defaults.assumptionPacks),
      fundingPlans: parsed.fundingPlans ?? defaults.fundingPlans,
      preferences: { ...defaults.preferences, ...(parsed.preferences ?? {}) },
    }
  } catch {
    return getDefaultSchema()
  }
}

function migrateCompanies(companies: unknown[]): import('@/types/domain').Company[] {
  return companies.map((c) => {
    const co = c as Record<string, unknown>
    return {
      ...co,
      legalName: co.legalName ?? null,
      region: co.region ?? null,
      estimatedKnowledgeWorkers: co.estimatedKnowledgeWorkers ?? null,
      source: co.source ?? 'manual',
      ownerNotes: co.ownerNotes ?? null,
      currency: co.currency ?? null,
      defaultAssumptionPackId: co.defaultAssumptionPackId ?? null,
      archivedAt: co.archivedAt ?? null,
      metadata: co.metadata ?? {},
      baselineSegments: migrateSegments((co.baselineSegments as unknown[]) ?? []),
    } as import('@/types/domain').Company
  })
}

function migrateSegments(segments: unknown[]): import('@/types/domain').WorkforceSegment[] {
  return segments.map((s) => {
    const seg = s as Record<string, unknown>
    return {
      ...seg,
      description: seg.description ?? null,
      categoryType: seg.categoryType ?? 'custom',
      taskMixMode: seg.taskMixMode ?? 'profile',
      customTaskMix: seg.customTaskMix ?? null,
      contextFactorOverride: seg.contextFactorOverride ?? null,
      toolsFactorOverride: seg.toolsFactorOverride ?? null,
      runtimeFactorOverride: seg.runtimeFactorOverride ?? null,
      browserFactorOverride: seg.browserFactorOverride ?? null,
      imageFactorOverride: seg.imageFactorOverride ?? null,
      rolloutPhase: seg.rolloutPhase ?? null,
      includeInCalculation: seg.includeInCalculation !== false,
      source: seg.source ?? 'manual',
      metadata: seg.metadata ?? {},
      taskMix: seg.taskMix ?? [],
    } as import('@/types/domain').WorkforceSegment
  })
}

function migrateScenarios(scenarios: unknown[]): import('@/types/domain').Scenario[] {
  return scenarios.map((s) => {
    const sc = s as Record<string, unknown>
    return {
      ...sc,
      segments: migrateSegments((sc.segments as unknown[]) ?? []),
    } as import('@/types/domain').Scenario
  })
}

function mergeSystemItems<T extends { id: string; isSystemDefault?: boolean }>(
  saved: T[],
  systemDefaults: T[],
): T[] {
  const map = new Map<string, T>()
  // Add system defaults first
  for (const item of systemDefaults) {
    map.set(item.id, item)
  }
  // Overlay saved items (custom ones, and override system if isSystemDefault = false)
  for (const item of saved) {
    if (!item.isSystemDefault) {
      map.set(item.id, item)
    }
    // System defaults: keep the bundled version (ignore stale saved copies)
  }
  return Array.from(map.values())
}

function saveRaw(schema: AppStorageSchema): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schema))
  } catch (e) {
    // Storage quota exceeded or not available
    console.error('[StorageService] Failed to save:', e)
    throw new Error('storage_quota_exceeded')
  }
}

// ---- Public API --------------------------------------------

class StorageService {
  private cache: AppStorageSchema | null = null

  load(): AppStorageSchema {
    if (!this.cache) {
      this.cache = loadRaw()
    }
    return this.cache
  }

  save(schema: AppStorageSchema): void {
    this.cache = schema
    saveRaw(schema)
  }

  getPreferences(): UIPreferences {
    return this.load().preferences
  }

  updatePreferences(prefs: Partial<UIPreferences>): void {
    const schema = this.load()
    schema.preferences = { ...schema.preferences, ...prefs }
    this.save(schema)
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY)
    this.cache = null
  }

  exportAll(): string {
    const schema = this.load()
    return JSON.stringify({ ...schema, exportedAt: new Date().toISOString() }, null, 2)
  }

  importAll(jsonString: string): { success: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonString) as Partial<AppStorageSchema>
      if (!parsed.schemaVersion) {
        return { success: false, error: 'Schema version mancante nel file.' }
      }
      const defaults = getDefaultSchema()
      const merged: AppStorageSchema = {
        schemaVersion: parsed.schemaVersion,
        companies: parsed.companies ?? defaults.companies,
        scenarios: parsed.scenarios ?? defaults.scenarios,
        usageProfiles: mergeSystemItems(parsed.usageProfiles ?? [], defaults.usageProfiles),
        taskPresets: mergeSystemItems(parsed.taskPresets ?? [], defaults.taskPresets),
        modelAssumptions: mergeSystemItems(parsed.modelAssumptions ?? [], defaults.modelAssumptions),
        assumptionPacks: mergeSystemItems(parsed.assumptionPacks ?? [], defaults.assumptionPacks),
        fundingPlans: parsed.fundingPlans ?? defaults.fundingPlans,
        preferences: { ...defaults.preferences, ...(parsed.preferences ?? {}) },
      }
      this.save(merged)
      return { success: true }
    } catch (e) {
      return { success: false, error: `Errore parsing JSON: ${String(e)}` }
    }
  }

  isAvailable(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}

export const storageService = new StorageService()
