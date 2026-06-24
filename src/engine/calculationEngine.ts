import type {
  WorkforceSegment,
  Scenario,
  AssumptionPack,
  FundingPlan,
  UsageProfile,
  ModelAssumption,
  CreditsRange,
  CostRange,
  SegmentBreakdown,
  CalculationResult,
  CalculationWarning,
  TaskIntensity,
} from '@/types/domain'

// ---- Core computation helpers ------------------------------

function bandRange(
  intensity: TaskIntensity,
  pack: AssumptionPack,
): { min: number; mid: number; max: number } {
  const b = pack.creditBands
  if (intensity === 'light') return { min: b.lightMin, mid: b.lightMid, max: b.lightMax }
  if (intensity === 'medium') return { min: b.mediumMin, mid: b.mediumMid, max: b.mediumMax }
  return { min: b.heavyMin, mid: b.heavyMid, max: b.heavyMax }
}

function modelFactor(modelId: string, pack: AssumptionPack): number {
  return pack.modelFactors[modelId] ?? 1.0
}

function computeAdjustedCredits(
  baseCredits: CreditsRange,
  profile: UsageProfile,
  pack: AssumptionPack,
  _modelId: string,
): CreditsRange {
  const contextF =
    profile.contextFactor > 1.5
      ? pack.factors.contextHigh
      : profile.contextFactor > 1.1
        ? pack.factors.contextMedium
        : pack.factors.contextLow

  const toolsF =
    profile.toolsFactor > 1.4
      ? pack.factors.toolsHeavy
      : profile.toolsFactor > 1.1
        ? pack.factors.toolsLight
        : pack.factors.toolsNone

  const runtimeF =
    profile.runtimeFactor > 1.5
      ? pack.factors.runtimeSlow
      : profile.runtimeFactor > 1.1
        ? pack.factors.runtimeMedium
        : pack.factors.runtimeFast

  const browserF = profile.browserFactor > 1.1 ? pack.factors.browserMultiplier : 1.0
  const imageF = profile.imageFactor > 1.1 ? pack.factors.imageMultiplier : 1.0
  const mFactor = modelFactor(_modelId, pack)

  const adj = contextF * toolsF * runtimeF * browserF * imageF * mFactor
  return {
    min: baseCredits.min * adj,
    mid: baseCredits.mid * adj,
    max: baseCredits.max * adj,
  }
}

// ---- Segment calculation -----------------------------------

function calculateSegmentCredits(
  segment: WorkforceSegment,
  profile: UsageProfile,
  pack: AssumptionPack,
): { credits: CreditsRange; enabledUsers: number; activeUsers: number; warnings: CalculationWarning[] } {
  const warnings: CalculationWarning[] = []

  const enabledUsers = Math.floor((segment.headcount * segment.enabledPercentage) / 100)
  const activeUsers = Math.floor((enabledUsers * segment.activeUsagePercentage) / 100)

  if (activeUsers === 0) {
    return {
      credits: { min: 0, mid: 0, max: 0 },
      enabledUsers,
      activeUsers,
      warnings: [
        {
          code: 'ZERO_ACTIVE_USERS',
          severity: 'info',
          message: `Segmento "${segment.name}": nessun utente attivo, contributo zero.`,
          segmentId: segment.id,
        },
      ],
    }
  }

  // Sum credits across task mix intensities
  const lightBand = bandRange('light', pack)
  const mediumBand = bandRange('medium', pack)
  const heavyBand = bandRange('heavy', pack)

  const monthlyLightTasks = activeUsers * profile.lightTasksPerUserPerMonth
  const monthlyMediumTasks = activeUsers * profile.mediumTasksPerUserPerMonth
  const monthlyHeavyTasks = activeUsers * profile.heavyTasksPerUserPerMonth

  const rawCredits: CreditsRange = {
    min: monthlyLightTasks * lightBand.min + monthlyMediumTasks * mediumBand.min + monthlyHeavyTasks * heavyBand.min,
    mid: monthlyLightTasks * lightBand.mid + monthlyMediumTasks * mediumBand.mid + monthlyHeavyTasks * heavyBand.mid,
    max: monthlyLightTasks * lightBand.max + monthlyMediumTasks * mediumBand.max + monthlyHeavyTasks * heavyBand.max,
  }

  const adjustedCredits = computeAdjustedCredits(rawCredits, profile, pack, segment.preferredModelId)

  if (profile.heavyTasksPerUserPerMonth > 30) {
    warnings.push({
      code: 'HIGH_HEAVY_USAGE',
      severity: 'warning',
      message: `Segmento "${segment.name}": heavy tasks/utente molto elevati (${profile.heavyTasksPerUserPerMonth}/mese).`,
      segmentId: segment.id,
    })
  }

  return { credits: adjustedCredits, enabledUsers, activeUsers, warnings }
}

// ---- Cost calculation from credits -------------------------

function calculateCostFromCredits(
  credits: CreditsRange,
  funding: FundingPlan,
): { cost: CostRange; spilloverCredits: number; coverageByExisting: number } {
  const existingCapacity = funding.existingMonthlyCredits
  const pricePerCredit = funding.paygPricePerCredit * (1 - funding.discountPercentage / 100)

  const spillover = Math.max(0, credits.mid - existingCapacity)
  const coverage = Math.min(credits.mid, existingCapacity)

  const calcCost = (totalCredits: number): number => {
    const excess = Math.max(0, totalCredits - existingCapacity)
    if (funding.mode === 'existing_capacity') {
      return excess * pricePerCredit
    }
    if (funding.mode === 'prepaid') {
      const prepaidRemaining = Math.max(0, funding.prepaidCredits - existingCapacity)
      const afterPrepaid = Math.max(0, excess - prepaidRemaining)
      const prepaidCost = Math.min(excess, prepaidRemaining) * funding.prepaidEffectivePricePerCredit
      const paygCost = afterPrepaid * pricePerCredit
      return prepaidCost + paygCost
    }
    // payg default
    return excess * pricePerCredit
  }

  return {
    cost: {
      min: calcCost(credits.min),
      mid: calcCost(credits.mid),
      max: calcCost(credits.max),
    },
    spilloverCredits: spillover,
    coverageByExisting: coverage,
  }
}

// ---- Main calculation entry point --------------------------

export function calculateScenario(
  scenario: Scenario,
  profiles: UsageProfile[],
  models: ModelAssumption[],
  pack: AssumptionPack,
  funding: FundingPlan | null,
): CalculationResult {
  const warnings: CalculationWarning[] = []
  const breakdownBySegment: SegmentBreakdown[] = []
  const breakdownByModel: Record<string, CreditsRange> = {}
  const breakdownByIntensity: Record<TaskIntensity, CreditsRange> = {
    light: { min: 0, mid: 0, max: 0 },
    medium: { min: 0, mid: 0, max: 0 },
    heavy: { min: 0, mid: 0, max: 0 },
  }

  let totalMonthly: CreditsRange = { min: 0, mid: 0, max: 0 }

  const profilesMap = new Map(profiles.map((p) => [p.id, p]))
  const modelsMap = new Map(models.map((m) => [m.id, m]))

  if (scenario.segments.length === 0) {
    warnings.push({
      code: 'NO_SEGMENTS',
      severity: 'error',
      message: 'Lo scenario non ha segmenti configurati.',
    })
  }

  for (const segment of scenario.segments) {
    const profile = profilesMap.get(segment.usageProfileId)
    if (!profile) {
      warnings.push({
        code: 'MISSING_PROFILE',
        severity: 'warning',
        message: `Segmento "${segment.name}": profilo di utilizzo non trovato, ignorato.`,
        segmentId: segment.id,
      })
      continue
    }

    const model = modelsMap.get(segment.preferredModelId)
    if (!model) {
      warnings.push({
        code: 'MISSING_MODEL',
        severity: 'warning',
        message: `Segmento "${segment.name}": modello non trovato, uso Auto.`,
        segmentId: segment.id,
      })
    }

    const { credits, enabledUsers, activeUsers, warnings: segWarnings } = calculateSegmentCredits(
      segment,
      profile,
      pack,
    )
    warnings.push(...segWarnings)

    // Estimate montly cost per segment for display (use default funding if not set)
    const dummyCost: CostRange = { min: 0, mid: 0, max: 0 }

    breakdownBySegment.push({
      segmentId: segment.id,
      segmentName: segment.name,
      enabledUsers,
      activeUsers,
      monthlyCredits: credits,
      monthlyCost: dummyCost,
      warnings: segWarnings.map((w) => w.message),
    })

    // Accumulate totals
    totalMonthly = {
      min: totalMonthly.min + credits.min,
      mid: totalMonthly.mid + credits.mid,
      max: totalMonthly.max + credits.max,
    }

    // Per model breakdown
    const mId = segment.preferredModelId
    if (!breakdownByModel[mId]) {
      breakdownByModel[mId] = { min: 0, mid: 0, max: 0 }
    }
    breakdownByModel[mId] = {
      min: breakdownByModel[mId].min + credits.min,
      mid: breakdownByModel[mId].mid + credits.mid,
      max: breakdownByModel[mId].max + credits.max,
    }

    // Per intensity breakdown (proportional split by tasks)
    const totalTasks =
      profile.lightTasksPerUserPerMonth +
      profile.mediumTasksPerUserPerMonth +
      profile.heavyTasksPerUserPerMonth || 1

    const lightShare = profile.lightTasksPerUserPerMonth / totalTasks
    const mediumShare = profile.mediumTasksPerUserPerMonth / totalTasks
    const heavyShare = profile.heavyTasksPerUserPerMonth / totalTasks;

    (['light', 'medium', 'heavy'] as TaskIntensity[]).forEach((intensity) => {
      const share = intensity === 'light' ? lightShare : intensity === 'medium' ? mediumShare : heavyShare
      breakdownByIntensity[intensity] = {
        min: breakdownByIntensity[intensity].min + credits.min * share,
        mid: breakdownByIntensity[intensity].mid + credits.mid * share,
        max: breakdownByIntensity[intensity].max + credits.max * share,
      }
    })
  }

  const annualCredits: CreditsRange = {
    min: totalMonthly.min * 12,
    mid: totalMonthly.mid * 12,
    max: totalMonthly.max * 12,
  }

  // Cost calculation
  const defaultFunding: FundingPlan = funding ?? {
    id: 'default',
    scenarioId: scenario.id,
    mode: 'payg',
    paygPricePerCredit: pack.fundingDefaults.paygPricePerCredit,
    prepaidCredits: 0,
    prepaidEffectivePricePerCredit: pack.fundingDefaults.paygPricePerCredit,
    existingMonthlyCredits: 0,
    discountPercentage: 0,
    currency: pack.fundingDefaults.currency,
    budgetMonthly: null,
    budgetAnnual: null,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { cost: monthlyCost, spilloverCredits, coverageByExisting } = calculateCostFromCredits(
    totalMonthly,
    defaultFunding,
  )

  const annualCost: CostRange = {
    min: monthlyCost.min * 12,
    mid: monthlyCost.mid * 12,
    max: monthlyCost.max * 12,
  }

  // Update segment breakdown with actual costs
  for (const s of breakdownBySegment) {
    const totalMid = totalMonthly.mid || 1
    const segShare = s.monthlyCredits.mid / totalMid
    s.monthlyCost = {
      min: monthlyCost.min * segShare,
      mid: monthlyCost.mid * segShare,
      max: monthlyCost.max * segShare,
    }
  }

  // Total enabled/active users for per-user cost
  const totalEnabled = breakdownBySegment.reduce((s, b) => s + b.enabledUsers, 0)
  const totalActive = breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0)

  const costPerEnabledUser: CostRange = {
    min: totalEnabled > 0 ? monthlyCost.min / totalEnabled : 0,
    mid: totalEnabled > 0 ? monthlyCost.mid / totalEnabled : 0,
    max: totalEnabled > 0 ? monthlyCost.max / totalEnabled : 0,
  }
  const costPerActiveUser: CostRange = {
    min: totalActive > 0 ? monthlyCost.min / totalActive : 0,
    mid: totalActive > 0 ? monthlyCost.mid / totalActive : 0,
    max: totalActive > 0 ? monthlyCost.max / totalActive : 0,
  }

  // Budget warnings
  if (defaultFunding.budgetMonthly !== null) {
    if (monthlyCost.min > defaultFunding.budgetMonthly) {
      warnings.push({
        code: 'OVER_BUDGET_CRITICAL',
        severity: 'error',
        message: `Il costo mensile stimato (anche minimo) supera il budget mensile impostato.`,
      })
    } else if (monthlyCost.max > defaultFunding.budgetMonthly) {
      warnings.push({
        code: 'OVER_BUDGET_WARNING',
        severity: 'warning',
        message: `Il costo massimo stimato supera il budget mensile. Il midpoint è entro budget.`,
      })
    }
  }

  return {
    scenarioId: scenario.id,
    monthlyCredits: totalMonthly,
    annualCredits,
    monthlyCost,
    annualCost,
    costPerEnabledUser,
    costPerActiveUser,
    breakdownBySegment,
    breakdownByModel,
    breakdownByIntensity,
    coverageByExistingCapacity: coverageByExisting,
    spilloverCredits,
    warnings,
    calculatedAt: new Date().toISOString(),
    assumptionPackId: pack.id,
    isRangeBased: true,
  }
}
