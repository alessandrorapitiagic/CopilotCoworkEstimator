import { useMemo } from 'react'
import type { WorkforceSegment, AssumptionPack, WorkforceSummary } from '@/types/domain'

export interface SegmentLiveResult {
  segmentId: string
  enabledUsers: number
  activeUsers: number
  monthlyCredits: { min: number; mid: number; max: number }
  monthlyCost: { min: number; mid: number; max: number }
  weightPct: number
  warnings: string[]
}

function bandMid(intensity: 'light' | 'medium' | 'heavy', pack: AssumptionPack) {
  return {
    min: pack.creditBands[`${intensity}Min` as keyof typeof pack.creditBands] as number,
    mid: pack.creditBands[`${intensity}Mid` as keyof typeof pack.creditBands] as number,
    max: pack.creditBands[`${intensity}Max` as keyof typeof pack.creditBands] as number,
  }
}

export function useWorkforceSummary(
  segments: WorkforceSegment[],
  totalEmployees: number,
  pack: AssumptionPack,
  profiles: { id: string; lightTasksPerUserPerMonth: number; mediumTasksPerUserPerMonth: number; heavyTasksPerUserPerMonth: number; contextFactor: number; toolsFactor: number; runtimeFactor: number; browserFactor: number; imageFactor: number }[],
  pricePerCredit: number,
): { summary: WorkforceSummary; segmentResults: SegmentLiveResult[] } {
  return useMemo(() => {
    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    let totalEnabledUsers = 0
    let totalActiveUsers = 0
    let totalCredits = { min: 0, mid: 0, max: 0 }
    let totalSegmentedHeadcount = 0
    const segmentResults: SegmentLiveResult[] = []

    for (const seg of segments) {
      totalSegmentedHeadcount += seg.headcount

      if (!seg.includeInCalculation) {
        segmentResults.push({
          segmentId: seg.id,
          enabledUsers: 0,
          activeUsers: 0,
          monthlyCredits: { min: 0, mid: 0, max: 0 },
          monthlyCost: { min: 0, mid: 0, max: 0 },
          weightPct: 0,
          warnings: ['excluded'],
        })
        continue
      }

      const profile = profileMap.get(seg.usageProfileId)
      const enabled = Math.floor((seg.headcount * seg.enabledPercentage) / 100)
      const active = Math.floor((enabled * seg.activeUsagePercentage) / 100)
      totalEnabledUsers += enabled
      totalActiveUsers += active

      if (!profile || active === 0) {
        segmentResults.push({
          segmentId: seg.id,
          enabledUsers: enabled,
          activeUsers: active,
          monthlyCredits: { min: 0, mid: 0, max: 0 },
          monthlyCost: { min: 0, mid: 0, max: 0 },
          weightPct: 0,
          warnings: active === 0 ? ['zeroHeadcount'] : ['missingProfile'],
        })
        continue
      }

      // Task counts
      const lightPU = seg.taskMixMode === 'custom' && seg.customTaskMix
        ? seg.customTaskMix.lightTasksPerUserPerMonth
        : profile.lightTasksPerUserPerMonth
      const mediumPU = seg.taskMixMode === 'custom' && seg.customTaskMix
        ? seg.customTaskMix.mediumTasksPerUserPerMonth
        : profile.mediumTasksPerUserPerMonth
      const heavyPU = seg.taskMixMode === 'custom' && seg.customTaskMix
        ? seg.customTaskMix.heavyTasksPerUserPerMonth
        : profile.heavyTasksPerUserPerMonth

      const lightB = bandMid('light', pack)
      const mediumB = bandMid('medium', pack)
      const heavyB = bandMid('heavy', pack)

      const rawCr = {
        min: active * lightPU * lightB.min + active * mediumPU * mediumB.min + active * heavyPU * heavyB.min,
        mid: active * lightPU * lightB.mid + active * mediumPU * mediumB.mid + active * heavyPU * heavyB.mid,
        max: active * lightPU * lightB.max + active * mediumPU * mediumB.max + active * heavyPU * heavyB.max,
      }

      // Model factor
      const mf = pack.modelFactors[seg.preferredModelId] ?? 1.0

      // Factors from profile with overrides
      const ctxF = seg.contextFactorOverride ?? profile.contextFactor
      const toolsF = seg.toolsFactorOverride ?? profile.toolsFactor
      const rtF = seg.runtimeFactorOverride ?? profile.runtimeFactor
      const brF = seg.browserFactorOverride ?? profile.browserFactor
      const imgF = seg.imageFactorOverride ?? profile.imageFactor

      const adj = mf * ctxF * toolsF * rtF * brF * imgF

      const credits = { min: rawCr.min * adj, mid: rawCr.mid * adj, max: rawCr.max * adj }
      const cost = { min: credits.min * pricePerCredit, mid: credits.mid * pricePerCredit, max: credits.max * pricePerCredit }

      totalCredits = {
        min: totalCredits.min + credits.min,
        mid: totalCredits.mid + credits.mid,
        max: totalCredits.max + credits.max,
      }

      const warns: string[] = []
      if (heavyPU > 30) warns.push('highHeavy')
      if (seg.taskMixMode === 'custom') warns.push('customTaskMix')
      if (seg.contextFactorOverride != null || seg.toolsFactorOverride != null) warns.push('customFactors')

      segmentResults.push({ segmentId: seg.id, enabledUsers: enabled, activeUsers: active, monthlyCredits: credits, monthlyCost: cost, weightPct: 0, warnings: warns })
    }

    // Compute weight percentages
    const totalMid = totalCredits.mid || 1
    for (const r of segmentResults) {
      r.weightPct = (r.monthlyCredits.mid / totalMid) * 100
    }

    const totalCost = {
      min: totalCredits.min * pricePerCredit,
      mid: totalCredits.mid * pricePerCredit,
      max: totalCredits.max * pricePerCredit,
    }
    const unclassified = totalEmployees - totalSegmentedHeadcount

    const summary: WorkforceSummary = {
      totalEmployees,
      totalSegmentedHeadcount,
      unclassifiedEmployees: Math.max(0, unclassified),
      totalEnabledUsers,
      totalActiveUsers,
      monthlyCredits: totalCredits,
      monthlyCost: totalCost,
      segmentOverTotal: totalSegmentedHeadcount > totalEmployees,
      segmentUnderTotal: totalSegmentedHeadcount < totalEmployees,
    }

    return { summary, segmentResults }
  }, [segments, totalEmployees, pack, profiles, pricePerCredit])
}
