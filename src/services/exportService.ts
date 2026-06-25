/**
 * Export service — FP-014
 * Multiple CSV export types: scenario summary, segment breakdown, portfolio, comparison.
 */

import type {
  Scenario,
  Company,
  AssumptionPack,
} from '@/types/domain'

// ---- Helpers ------------------------------------------------

function escape(v: unknown): string {
  const str = String(v ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(escape).join(',')).join('\n')
}

function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF' + csv, ], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function dateSlug(): string {
  return new Date().toISOString().slice(0, 10)
}

// ---- Export types -------------------------------------------

export type CsvExportType =
  | 'scenario_summary'
  | 'segment_breakdown'
  | 'model_breakdown'
  | 'intensity_breakdown'
  | 'funding_breakdown'
  | 'portfolio_summary'
  | 'comparison'

// ---- Scenario summary CSV -----------------------------------

export function exportScenarioSummaryCsv(
  scenario: Scenario,
  company: Company | undefined,
  pack: AssumptionPack | undefined,
  currency: string,
): void {
  const r = scenario.calculationResult
  const header = [
    'Company', 'Scenario', 'Status', 'Assumption Pack', 'Version',
    'calculation_mode', 'workload_type', 'source_guide_name', 'source_guide_version',
    'uses_official_guide_ranges', 'uses_advanced_factors', 'has_open_ended_heavy_range',
    'heavy_planning_cap', 'max_is_open_ended',
    'Monthly Credits Min', 'Monthly Credits Mid', 'Monthly Credits Max',
    'Annual Credits Mid',
    `Monthly Cost Min (${currency})`, `Monthly Cost Mid (${currency})`, `Monthly Cost Max (${currency})`,
    `Annual Cost Mid (${currency})`,
    `Cost/Enabled User Mid (${currency})`, `Cost/Active User Mid (${currency})`,
    'Segments', 'Total Enabled Users', 'Total Active Users',
    'Warnings',
  ]
  const enabledUsers = r?.breakdownBySegment.reduce((s, b) => s + b.enabledUsers, 0) ?? 0
  const activeUsers = r?.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0) ?? 0

  const row = [
    company?.name ?? '',
    scenario.name,
    scenario.status,
    pack?.name ?? '',
    pack?.version ?? '',
    r?.calculationMode ?? scenario.calculationMode ?? 'officialGuide',
    r?.workloadType ?? scenario.workloadType ?? 'cowork',
    r?.sourceGuideName ?? pack?.sourceGuideName ?? '',
    r?.sourceGuideVersion ?? pack?.sourceGuideVersion ?? '',
    String(r?.usesOfficialGuideRanges ?? false),
    String(r?.usesAdvancedFactors ?? false),
    String(r?.hasOpenEndedHeavyRange ?? pack?.heavyDefaults.openEnded ?? false),
    r?.heavyPlanningCap ?? pack?.heavyDefaults.planningCap ?? '',
    String(r?.maxIsOpenEnded ?? false),
    r ? Math.round(r.monthlyCredits.min) : '',
    r ? Math.round(r.monthlyCredits.mid) : '',
    r ? Math.round(r.monthlyCredits.max) : '',
    r ? Math.round(r.annualCredits.mid) : '',
    r ? r.monthlyCost.min.toFixed(2) : '',
    r ? r.monthlyCost.mid.toFixed(2) : '',
    r ? r.monthlyCost.max.toFixed(2) : '',
    r ? r.annualCost.mid.toFixed(2) : '',
    r ? r.costPerEnabledUser.mid.toFixed(2) : '',
    r ? r.costPerActiveUser.mid.toFixed(2) : '',
    scenario.segments.filter((s) => s.includeInCalculation).length,
    enabledUsers,
    activeUsers,
    r ? r.warnings.filter((w) => w.severity !== 'info').length : 0,
  ]
  downloadCsv(
    `scenario-${scenario.name.replace(/\s+/g, '-')}-${dateSlug()}.csv`,
    toCsv([header, row]),
  )
}

// ---- Segment breakdown CSV ----------------------------------

export function exportSegmentBreakdownCsv(
  scenario: Scenario,
  company: Company | undefined,
  pack: AssumptionPack | undefined,
  currency: string,
): void {
  const r = scenario.calculationResult
  if (!r) return

  const header = [
    'Company', 'Scenario', 'Assumption Pack',
    'Segment', 'Category', 'Headcount',
    'Enabled Users', 'Active Users',
    'Usage Profile', 'Preferred Model',
    'Monthly Credits Min', 'Monthly Credits Mid', 'Monthly Credits Max',
    `Monthly Cost Min (${currency})`, `Monthly Cost Mid (${currency})`, `Monthly Cost Max (${currency})`,
    `Annual Cost Mid (${currency})`, 'Weight %',
    'Warnings',
  ]

  const rows = r.breakdownBySegment.map((b) => {
    const seg = scenario.segments.find((s) => s.id === b.segmentId)
    const weight = r.monthlyCost.mid > 0
      ? ((b.monthlyCost.mid / r.monthlyCost.mid) * 100).toFixed(1)
      : '0'
    return [
      company?.name ?? '',
      scenario.name,
      pack?.name ?? '',
      b.segmentName,
      seg?.categoryType ?? '',
      seg?.headcount ?? '',
      b.enabledUsers,
      b.activeUsers,
      seg?.usageProfileId ?? '',
      seg?.preferredModelId ?? '',
      Math.round(b.monthlyCredits.min),
      Math.round(b.monthlyCredits.mid),
      Math.round(b.monthlyCredits.max),
      b.monthlyCost.min.toFixed(2),
      b.monthlyCost.mid.toFixed(2),
      b.monthlyCost.max.toFixed(2),
      (b.monthlyCost.mid * 12).toFixed(2),
      weight,
      b.warnings.join('; '),
    ]
  })

  downloadCsv(
    `segments-${scenario.name.replace(/\s+/g, '-')}-${dateSlug()}.csv`,
    toCsv([header, ...rows]),
  )
}

// ---- Model breakdown CSV ------------------------------------

export function exportModelBreakdownCsv(
  scenario: Scenario,
  company: Company | undefined,
  _currency: string,
): void {
  void _currency
  const r = scenario.calculationResult
  if (!r) return

  const header = [
    'Company', 'Scenario', 'Model ID',
    'Monthly Credits Mid', 'Weight %',
  ]
  const rows = Object.entries(r.breakdownByModel).map(([modelId, cr]) => {
    const pct = r.monthlyCredits.mid > 0 ? ((cr.mid / r.monthlyCredits.mid) * 100).toFixed(1) : '0'
    return [company?.name ?? '', scenario.name, modelId, Math.round(cr.mid), pct]
  })
  downloadCsv(
    `model-breakdown-${scenario.name.replace(/\s+/g, '-')}-${dateSlug()}.csv`,
    toCsv([header, ...rows]),
  )
}

// ---- Portfolio summary CSV ----------------------------------

export function exportPortfolioCsv(
  scenarios: Scenario[],
  companies: Company[],
  packs: AssumptionPack[],
  currency: string,
): void {
  const header = [
    'Company', 'Industry', 'Country',
    'Scenario', 'Status',
    'Assumption Pack', 'Pack Version',
    'Segments',
    'Monthly Credits Mid', 'Annual Credits Mid',
    `Monthly Cost Mid (${currency})`, `Annual Cost Mid (${currency})`,
    `Cost/Enabled User Mid (${currency})`,
    'Warnings',
    'Updated',
  ]

  const activeScenarios = scenarios.filter((s) => s.status !== 'archived')
  const rows = activeScenarios.map((s) => {
    const co = companies.find((c) => c.id === s.companyId)
    const pk = packs.find((p) => p.id === s.assumptionPackId)
    const r = s.calculationResult
    return [
      co?.name ?? '',
      co?.industry ?? '',
      co?.country ?? '',
      s.name,
      s.status,
      pk?.name ?? '',
      pk?.version ?? '',
      s.segments.filter((seg) => seg.includeInCalculation).length,
      r ? Math.round(r.monthlyCredits.mid) : '',
      r ? Math.round(r.annualCredits.mid) : '',
      r ? r.monthlyCost.mid.toFixed(2) : '',
      r ? r.annualCost.mid.toFixed(2) : '',
      r ? r.costPerEnabledUser.mid.toFixed(2) : '',
      r ? r.warnings.filter((w) => w.severity !== 'info').length : 0,
      s.updatedAt.slice(0, 10),
    ]
  })
  downloadCsv(`portfolio-${dateSlug()}.csv`, toCsv([header, ...rows]))
}

// ---- Comparison CSV -----------------------------------------

export function exportComparisonCsv(
  scenA: Scenario,
  scenB: Scenario,
  _compA: Company | undefined,
  _compB: Company | undefined,
  currency: string,
): void {
  const rA = scenA.calculationResult
  const rB = scenB.calculationResult

  const delta = (a: number | undefined, b: number | undefined): string => {
    if (a == null || b == null || b === 0) return '—'
    return ((a - b) / Math.abs(b) * 100).toFixed(1) + '%'
  }

  const header = ['Metrica', `A: ${scenA.name}`, `B: ${scenB.name}`, 'Δ A vs B %']
  const metrics = [
    ['Monthly Credits Mid', rA?.monthlyCredits.mid, rB?.monthlyCredits.mid],
    ['Annual Credits Mid', rA?.annualCredits.mid, rB?.annualCredits.mid],
    [`Monthly Cost Mid (${currency})`, rA?.monthlyCost.mid, rB?.monthlyCost.mid],
    [`Annual Cost Mid (${currency})`, rA?.annualCost.mid, rB?.annualCost.mid],
    [`Cost/Enabled User Mid (${currency})`, rA?.costPerEnabledUser.mid, rB?.costPerEnabledUser.mid],
    [`Cost/Active User Mid (${currency})`, rA?.costPerActiveUser.mid, rB?.costPerActiveUser.mid],
    ['Enabled Users', rA?.breakdownBySegment.reduce((s, b) => s + b.enabledUsers, 0), rB?.breakdownBySegment.reduce((s, b) => s + b.enabledUsers, 0)],
    ['Active Users', rA?.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0), rB?.breakdownBySegment.reduce((s, b) => s + b.activeUsers, 0)],
  ] as const

  const rows = metrics.map(([label, a, b]) => [
    label,
    a != null ? (typeof a === 'number' ? a.toFixed(2) : a) : '—',
    b != null ? (typeof b === 'number' ? b.toFixed(2) : b) : '—',
    delta(a as number | undefined, b as number | undefined),
  ])

  downloadCsv(
    `comparison-${scenA.name}-vs-${scenB.name}-${dateSlug()}.csv`,
    toCsv([header, ...rows]),
  )
}
