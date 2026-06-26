/**
 * Sharing service — FP-016
 * Serialize a scenario into a shareable URL fragment.
 *
 * Default (new): compact pipe-separated serializer with only important values,
 * then double base64 URL-safe encoding: base64(base64(pipeText)).
 * Fragment: #q=<encoded>
 *
 * Fallback (legacy): full LZ-compressed JSON payload in #data=<compressed>
 * when custom dependencies are needed.
 *
 * Max safe URL length is ~8 KB for most messengers/email clients.
 * If the payload exceeds the soft limit, we warn the user to use JSON export.
 */

import LZString from 'lz-string'

import type {
  Scenario,
  Company,
  AssumptionPack,
  FundingPlan,
  UsageProfile,
  TaskPreset,
  ModelAssumption,
} from '@/types/domain'
import { STORAGE_SCHEMA_VERSION } from '@/types/domain'

const PAYLOAD_SOFT_LIMIT_CHARS = 6000  // ~8 KB URL → warn above this
const PAYLOAD_HARD_LIMIT_CHARS = 9000  // definitely too long

export interface SharePayload {
  schemaVersion: string
  createdAt: string
  scenario: Scenario
  company: Company | null
  customPacks: AssumptionPack[]
  customProfiles: UsageProfile[]
  customPresets: TaskPreset[]
  customModels: ModelAssumption[]
  fundingPlan: FundingPlan | null
}

export type ShareLinkResult =
  | { ok: true; url: string; lengthWarning: false }
  | { ok: true; url: string; lengthWarning: true; chars: number }
  | { ok: false; tooLong: true; chars: number }

// ---- Compact serializer ----------------------------------------

const COMPACT_VERSION = 'Q1'

function enc(v: unknown): string {
  return encodeURIComponent(String(v ?? ''))
}

function dec(v: string): string {
  return decodeURIComponent(v)
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function doubleEncode(text: string): string {
  return base64UrlEncode(base64UrlEncode(text))
}

function doubleDecode(text: string): string {
  return base64UrlDecode(base64UrlDecode(text))
}

function serializeCompact(
  scenario: Scenario,
  company: Company | null,
  fundingPlan: FundingPlan | null,
): string {
  const header = [
    COMPACT_VERSION,
    enc(scenario.name),
    enc(scenario.description ?? ''),
    enc(company?.name ?? ''),
    enc(company?.industry ?? ''),
    company?.totalEmployees ?? 0,
    enc(scenario.assumptionPackId),
    enc(scenario.calculationMode ?? 'officialGuide'),
    enc(scenario.workloadType ?? 'cowork'),
    enc(fundingPlan?.mode ?? 'payg'),
    fundingPlan?.paygPricePerCredit ?? 0.01,
    fundingPlan?.budgetMonthly ?? '',
    enc(fundingPlan?.currency ?? 'USD'),
  ].join('|')

  const segments = scenario.segments.map((s) => [
    enc(s.name),
    enc(s.categoryType),
    s.headcount,
    s.enabledPercentage,
    s.activeUsagePercentage,
    enc(s.usageProfileId),
    enc(s.preferredModelId),
    s.includeInCalculation ? 1 : 0,
  ].join('|')).join('~')

  return `${header}\n${segments}`
}

function compactToPayload(text: string): SharePayload | null {
  const [headerLine, segmentLine = ''] = text.split('\n')
  const h = headerLine.split('|')
  if (h[0] !== COMPACT_VERSION) return null
  const now = new Date().toISOString()

  const scenarioName = dec(h[1] ?? '') || 'Shared quick scenario'
  const scenarioDescription = dec(h[2] ?? '') || null
  const companyName = dec(h[3] ?? '') || 'Shared company'
  const industry = dec(h[4] ?? '') as Company['industry']
  const totalEmployees = Number(h[5]) || 1
  const assumptionPackId = dec(h[6] ?? '') || 'microsoft-copilot-credits-guide-2026-06'
  const calculationMode = dec(h[7] ?? '') as Scenario['calculationMode'] || 'officialGuide'
  const workloadType = dec(h[8] ?? '') as Scenario['workloadType'] || 'cowork'
  const fundingMode = dec(h[9] ?? '') as FundingPlan['mode'] || 'payg'
  const paygPrice = Number(h[10]) || 0.01
  const budgetMonthly = h[11] ? Number(h[11]) : null
  const currency = dec(h[12] ?? '') || 'USD'

  const companyId = 'shared-company'
  const scenarioId = 'shared-scenario'
  const segments = segmentLine
    ? segmentLine.split('~').filter(Boolean).map((row, index) => {
      const c = row.split('|')
      return {
        id: `shared-segment-${index + 1}`,
        companyId,
        scenarioId,
        name: dec(c[0] ?? '') || `Segment ${index + 1}`,
        description: null,
        categoryType: (dec(c[1] ?? '') || 'custom') as import('@/types/domain').SegmentCategoryType,
        headcount: Number(c[2]) || 0,
        enabledPercentage: Number(c[3]) || 0,
        activeUsagePercentage: Number(c[4]) || 0,
        usageProfileId: dec(c[5] ?? '') || 'profile-medium',
        preferredModelId: dec(c[6] ?? '') || 'model-auto',
        taskMixMode: 'profile' as const,
        customTaskMix: null,
        taskMix: [],
        contextFactorOverride: null,
        toolsFactorOverride: null,
        runtimeFactorOverride: null,
        browserFactorOverride: null,
        imageFactorOverride: null,
        rolloutPhase: null,
        includeInCalculation: c[7] !== '0',
        notes: null,
        source: 'imported' as const,
        metadata: { compactShare: true },
        createdAt: now,
        updatedAt: now,
      }
    })
    : []

  const company: Company = {
    id: companyId,
    name: companyName,
    legalName: null,
    industry: industry || null,
    country: null,
    region: null,
    description: null,
    totalEmployees,
    estimatedKnowledgeWorkers: null,
    status: 'active',
    source: 'shared',
    tags: ['shared'],
    notes: null,
    ownerNotes: null,
    currency,
    defaultAssumptionPackId: assumptionPackId,
    archivedAt: null,
    metadata: { compactShare: true },
    baselineSegments: [],
    createdAt: now,
    updatedAt: now,
  }

  const scenario: Scenario = {
    id: scenarioId,
    companyId,
    name: scenarioName,
    description: scenarioDescription,
    assumptionPackId,
    fundingPlanId: null,
    segments,
    calculationResult: null,
    status: 'draft',
    tags: ['shared', 'compact-share'],
    calculationMode,
    workloadType,
    createdAt: now,
    updatedAt: now,
  }

  const fundingPlan: FundingPlan = {
    id: 'shared-funding',
    scenarioId,
    mode: fundingMode,
    construct: fundingMode === 'prepaid' ? 'p3PrePurchase' : fundingMode === 'existing_capacity' ? 'existingCapacity' : fundingMode,
    paygPricePerCredit: paygPrice,
    prepaidCredits: 0,
    prepaidEffectivePricePerCredit: paygPrice,
    existingMonthlyCredits: 0,
    discountPercentage: 0,
    currency,
    budgetMonthly,
    budgetAnnual: budgetMonthly ? budgetMonthly * 12 : null,
    notes: 'Imported from compact share link.',
    p3: null,
    budgetEvaluationBasis: 'monthlyPayg',
    createdAt: now,
    updatedAt: now,
  }

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    createdAt: now,
    scenario,
    company,
    customPacks: [],
    customProfiles: [],
    customPresets: [],
    customModels: [],
    fundingPlan,
  }
}

/**
 * Build a share link for a given scenario.
 * Returns the full URL with the compressed payload in the fragment.
 */
export function buildShareLink(
  scenario: Scenario,
  company: Company | null,
  allPacks: AssumptionPack[],
  allProfiles: UsageProfile[],
  allPresets: TaskPreset[],
  allModels: ModelAssumption[],
  allFundingPlans: FundingPlan[],
  baseUrl?: string,
): ShareLinkResult {
  const pack = allPacks.find((p) => p.id === scenario.assumptionPackId)
  const customPacks = pack && !pack.isSystemDefault ? [pack] : []

  const usedProfileIds = new Set(scenario.segments.map((s) => s.usageProfileId))
  const customProfiles = allProfiles.filter(
    (p) => !p.isSystemDefault && usedProfileIds.has(p.id),
  )

  const usedPresetIds = new Set(
    scenario.segments.flatMap((s) => s.taskMix.map((t) => t.taskPresetId)),
  )
  const customPresets = allPresets.filter(
    (p) => !p.isSystemDefault && usedPresetIds.has(p.id),
  )

  const usedModelIds = new Set(scenario.segments.map((s) => s.preferredModelId))
  const customModels = allModels.filter(
    (m) => usedModelIds.has(m.id) && m.source !== 'system',
  )

  const fundingPlan = allFundingPlans.find((f) => f.scenarioId === scenario.id) ?? null

  const hasCustomDependencies = customPacks.length > 0
    || customProfiles.length > 0
    || customPresets.length > 0
    || customModels.length > 0

  const base = baseUrl ?? window.location.origin + window.location.pathname

  if (!hasCustomDependencies) {
    const serialized = serializeCompact(scenario, company, fundingPlan)
    const encoded = doubleEncode(serialized)
    const url = `${base}#q=${encoded}`
    if (encoded.length > PAYLOAD_HARD_LIMIT_CHARS) return { ok: false, tooLong: true, chars: encoded.length }
    if (encoded.length > PAYLOAD_SOFT_LIMIT_CHARS) return { ok: true, url, lengthWarning: true, chars: encoded.length }
    return { ok: true, url, lengthWarning: false }
  }

  const payload: SharePayload = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    scenario,
    company,
    customPacks,
    customProfiles,
    customPresets,
    customModels,
    fundingPlan,
  }

  const json = JSON.stringify(payload)
  const compressed = LZString.compressToEncodedURIComponent(json)

  const url = `${base}#data=${compressed}`

  if (compressed.length > PAYLOAD_HARD_LIMIT_CHARS) {
    return { ok: false, tooLong: true, chars: compressed.length }
  }
  if (compressed.length > PAYLOAD_SOFT_LIMIT_CHARS) {
    return { ok: true, url, lengthWarning: true, chars: compressed.length }
  }
  return { ok: true, url, lengthWarning: false }
}

/**
 * Detect and decode a share payload from the current URL fragment.
 */
export function decodeSharePayloadFromUrl(hash: string): SharePayload | null {
  try {
    const compactMatch = hash.match(/[#&]q=([^&]*)/)
    if (compactMatch?.[1]) {
      const serialized = doubleDecode(compactMatch[1])
      return compactToPayload(serialized)
    }

    const match = hash.match(/[#&]data=([^&]*)/)
    if (!match) return null
    const compressed = match[1]
    if (!compressed) return null
    const json = LZString.decompressFromEncodedURIComponent(compressed)
    if (!json) return null
    const payload = JSON.parse(json) as Partial<SharePayload>
    if (!payload.scenario || !payload.schemaVersion) return null
    return payload as SharePayload
  } catch {
    return null
  }
}

/**
 * Collect all dependencies needed to build a sharable payload for a scenario.
 */
export function collectScenarioDependencies(scenario: Scenario) {
  const usedProfileIds = new Set(scenario.segments.map((s) => s.usageProfileId))
  const usedModelIds = new Set(scenario.segments.map((s) => s.preferredModelId))
  return { usedProfileIds, usedModelIds }
}
