import type { UsageProfile, AssumptionPack, UsageProfileImpact } from '@/types/domain'

export function computeProfileImpact(
  profile: UsageProfile,
  pack: AssumptionPack,
  pricePerCredit: number,
): UsageProfileImpact {
  const total = profile.lightTasksPerUserPerMonth
    + profile.mediumTasksPerUserPerMonth
    + profile.heavyTasksPerUserPerMonth

  const lightW = total > 0 ? profile.lightTasksPerUserPerMonth / total : 0
  const mediumW = total > 0 ? profile.mediumTasksPerUserPerMonth / total : 0
  const heavyW = total > 0 ? profile.heavyTasksPerUserPerMonth / total : 0

  // Credits per user using the pack's credit bands
  const lightB = { min: pack.creditBands.lightMin, mid: pack.creditBands.lightMid, max: pack.creditBands.lightMax }
  const mediumB = { min: pack.creditBands.mediumMin, mid: pack.creditBands.mediumMid, max: pack.creditBands.mediumMax }
  const heavyB = { min: pack.creditBands.heavyMin, mid: pack.creditBands.heavyMid, max: pack.creditBands.heavyMax }

  const mf = pack.modelFactors[profile.defaultModelId] ?? 1.0
  const adj = mf * profile.contextFactor * profile.toolsFactor * profile.runtimeFactor

  const credMin = (profile.lightTasksPerUserPerMonth * lightB.min + profile.mediumTasksPerUserPerMonth * mediumB.min + profile.heavyTasksPerUserPerMonth * heavyB.min) * adj
  const credMid = (profile.lightTasksPerUserPerMonth * lightB.mid + profile.mediumTasksPerUserPerMonth * mediumB.mid + profile.heavyTasksPerUserPerMonth * heavyB.mid) * adj
  const credMax = (profile.lightTasksPerUserPerMonth * lightB.max + profile.mediumTasksPerUserPerMonth * mediumB.max + profile.heavyTasksPerUserPerMonth * heavyB.max) * adj

  return {
    totalTasksPerUserPerMonth: total,
    lightTaskWeight: lightW,
    mediumTaskWeight: mediumW,
    heavyTaskWeight: heavyW,
    creditsPerActiveUserMin: credMin,
    creditsPerActiveUserMid: credMid,
    creditsPerActiveUserMax: credMax,
    costPerActiveUserMin: credMin * pricePerCredit,
    costPerActiveUserMid: credMid * pricePerCredit,
    costPerActiveUserMax: credMax * pricePerCredit,
  }
}
