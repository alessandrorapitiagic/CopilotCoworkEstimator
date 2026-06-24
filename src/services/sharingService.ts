/**
 * Sharing service — FP-016
 * Serialize a scenario + dependencies into a URL-safe, LZ-compressed payload
 * stored in the URL fragment: #data=<compressed>
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

  const base = baseUrl ?? window.location.origin + window.location.pathname
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
