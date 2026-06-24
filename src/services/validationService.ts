/**
 * Validation service — FP-019
 * Centralized validation for scenarios, segments, companies, assumption packs.
 * Produces typed ValidationResult with errors, warnings and infos.
 */

import type {
  Scenario,
  WorkforceSegment,
  Company,
  AssumptionPack,
  FundingPlan,
  CalculationResult,
} from '@/types/domain'

export type ValidationSeverity = 'error' | 'warning' | 'info'
export type ValidationScope = 'scenario' | 'segment' | 'company' | 'pack' | 'funding' | 'result'

export interface ValidationItem {
  code: string
  severity: ValidationSeverity
  scope: ValidationScope
  message: string
  messageEn?: string
  fix?: string                // suggested action
  affectedId?: string
}

export interface ValidationResult {
  isValid: boolean             // no blocking errors
  isComplete: boolean          // can be calculated
  errors: ValidationItem[]
  warnings: ValidationItem[]
  infos: ValidationItem[]
  all: ValidationItem[]
}

// ---- Company validation ----------------------------------------

export function validateCompany(company: Company): ValidationItem[] {
  const items: ValidationItem[] = []
  if (!company.name.trim()) {
    items.push({ code: 'COMPANY_NO_NAME', severity: 'error', scope: 'company', message: 'Il nome azienda è obbligatorio.', fix: 'Inserisci il nome.' })
  }
  if (company.totalEmployees <= 0) {
    items.push({ code: 'COMPANY_INVALID_EMPLOYEES', severity: 'error', scope: 'company', message: 'Il numero di dipendenti deve essere maggiore di zero.', fix: 'Correggi il numero dipendenti.' })
  }
  return items
}

// ---- Segment validation ----------------------------------------

export function validateSegment(seg: WorkforceSegment, _company: Company | null): ValidationItem[] {
  void _company
  const items: ValidationItem[] = []
  if (!seg.name.trim()) {
    items.push({ code: 'SEG_NO_NAME', severity: 'error', scope: 'segment', message: `Segmento senza nome.`, affectedId: seg.id, fix: 'Inserisci un nome.' })
  }
  if (seg.headcount < 0) {
    items.push({ code: 'SEG_NEGATIVE_HC', severity: 'error', scope: 'segment', message: `Segmento "${seg.name}": headcount negativo.`, affectedId: seg.id })
  }
  if (!Number.isInteger(seg.headcount)) {
    items.push({ code: 'SEG_DECIMAL_HC', severity: 'error', scope: 'segment', message: `Segmento "${seg.name}": headcount deve essere intero.`, affectedId: seg.id })
  }
  if (seg.enabledPercentage < 0 || seg.enabledPercentage > 100) {
    items.push({ code: 'SEG_INVALID_ENABLED_PCT', severity: 'error', scope: 'segment', message: `Segmento "${seg.name}": % abilitati fuori range (0–100).`, affectedId: seg.id })
  }
  if (seg.activeUsagePercentage < 0 || seg.activeUsagePercentage > 100) {
    items.push({ code: 'SEG_INVALID_ACTIVE_PCT', severity: 'error', scope: 'segment', message: `Segmento "${seg.name}": % attivi fuori range (0–100).`, affectedId: seg.id })
  }
  if (seg.headcount === 0 && seg.includeInCalculation) {
    items.push({ code: 'SEG_ZERO_HC', severity: 'warning', scope: 'segment', message: `Segmento "${seg.name}": headcount zero, nessun consumo.`, affectedId: seg.id })
  }
  if (!seg.includeInCalculation) {
    items.push({ code: 'SEG_EXCLUDED', severity: 'info', scope: 'segment', message: `Segmento "${seg.name}": escluso dal calcolo.`, affectedId: seg.id })
  }
  if (seg.taskMixMode === 'custom' || seg.contextFactorOverride != null || seg.toolsFactorOverride != null) {
    items.push({ code: 'SEG_CUSTOM_ASSUMPTIONS', severity: 'info', scope: 'segment', message: `Segmento "${seg.name}": usa assunzioni personalizzate.`, affectedId: seg.id })
  }
  return items
}

// ---- Scenario-level segment validation -------------------------

export function validateWorkforceSegmentation(
  segments: WorkforceSegment[],
  company: Company | null,
): ValidationItem[] {
  const items: ValidationItem[] = []
  const included = segments.filter((s) => s.includeInCalculation)

  if (included.length === 0) {
    items.push({ code: 'SCENARIO_NO_INCLUDED_SEGMENTS', severity: 'error', scope: 'scenario', message: 'Nessun segmento incluso nel calcolo.', fix: 'Includi almeno un segmento.' })
  }

  if (company) {
    const total = segments.reduce((sum, s) => sum + s.headcount, 0)
    if (total > company.totalEmployees) {
      items.push({ code: 'SEGS_OVER_TOTAL', severity: 'warning', scope: 'segment', message: `La somma dei segmenti (${total}) supera il totale dipendenti (${company.totalEmployees}).`, fix: 'Riduci gli headcount dei segmenti.' })
    } else if (total < company.totalEmployees) {
      items.push({ code: 'SEGS_UNDER_TOTAL', severity: 'info', scope: 'segment', message: `${company.totalEmployees - total} dipendenti non classificati in segmenti.` })
    }
  }

  return items
}

// ---- Assumption pack validation --------------------------------

export function validateAssumptionPack(pack: AssumptionPack | null): ValidationItem[] {
  const items: ValidationItem[] = []
  if (!pack) {
    items.push({ code: 'NO_PACK', severity: 'error', scope: 'pack', message: 'Assumption pack mancante.', fix: 'Seleziona un assumption pack.' })
    return items
  }
  if (pack.isDeprecated) {
    items.push({ code: 'PACK_DEPRECATED', severity: 'warning', scope: 'pack', message: `L'assumption pack "${pack.name}" è obsoleto. I risultati potrebbero non essere aggiornati.`, fix: 'Usa un pack più recente o creane una copia.' })
  }
  if (!pack.isSystemDefault && !pack.isCurrentDefault) {
    items.push({ code: 'PACK_CUSTOM', severity: 'info', scope: 'pack', message: `Lo scenario usa un assumption pack personalizzato: "${pack.name}".` })
  }
  const b = pack.creditBands
  if (b.lightMin > b.lightMid || b.lightMid > b.lightMax) {
    items.push({ code: 'PACK_INVALID_LIGHT', severity: 'error', scope: 'pack', message: 'Credit bands Light non valide: min ≤ mid ≤ max.' })
  }
  if (b.mediumMin > b.mediumMid || b.mediumMid > b.mediumMax) {
    items.push({ code: 'PACK_INVALID_MEDIUM', severity: 'error', scope: 'pack', message: 'Credit bands Medium non valide: min ≤ mid ≤ max.' })
  }
  if (b.heavyMin > b.heavyMid || b.heavyMid > b.heavyMax) {
    items.push({ code: 'PACK_INVALID_HEAVY', severity: 'error', scope: 'pack', message: 'Credit bands Heavy non valide: min ≤ mid ≤ max.' })
  }
  return items
}

// ---- Funding validation ----------------------------------------

export function validateFundingPlan(funding: FundingPlan | null): ValidationItem[] {
  const items: ValidationItem[] = []
  if (!funding) {
    items.push({ code: 'NO_FUNDING', severity: 'warning', scope: 'funding', message: 'Nessun funding plan configurato. Verrà usato il PAYG default.', fix: 'Configura un funding plan per valorizzare i crediti.' })
    return items
  }
  if (funding.paygPricePerCredit <= 0) {
    items.push({ code: 'FUNDING_INVALID_PRICE', severity: 'error', scope: 'funding', message: 'Il prezzo per credito deve essere maggiore di zero.' })
  }
  return items
}

// ---- Result validation -----------------------------------------

export function validateCalculationResult(
  result: CalculationResult | null,
  funding: FundingPlan | null,
): ValidationItem[] {
  const items: ValidationItem[] = []
  if (!result) {
    items.push({ code: 'NO_RESULT', severity: 'error', scope: 'result', message: 'Nessun risultato calcolato.', fix: 'Ricalcola lo scenario.' })
    return items
  }
  // Propagate engine warnings that are errors/warnings (not info)
  for (const w of result.warnings) {
    if (w.severity !== 'info') {
      items.push({
        code: w.code,
        severity: w.severity,
        scope: 'result',
        message: w.message,
        affectedId: w.segmentId,
      })
    }
  }
  // Budget check
  if (funding?.budgetMonthly) {
    const budget = funding.budgetMonthly
    if (result.monthlyCost.min > budget) {
      items.push({ code: 'BUDGET_CRITICAL', severity: 'error', scope: 'result', message: `Il costo stimato (anche il minimo) supera il budget mensile di ${budget}.`, fix: "Riduci l'uso o aumenta il budget." })
    } else if (result.monthlyCost.max > budget) {
      items.push({ code: 'BUDGET_WARNING', severity: 'warning', scope: 'result', message: `Il costo massimo stimato supera il budget mensile di ${budget}. Il midpoint è entro budget.` })
    }
  }
  return items
}

// ---- Full scenario validation ----------------------------------

export function validateScenario(
  scenario: Scenario,
  company: Company | null,
  pack: AssumptionPack | null,
  funding: FundingPlan | null,
): ValidationResult {
  const allItems: ValidationItem[] = []

  if (company) allItems.push(...validateCompany(company))
  for (const seg of scenario.segments) {
    allItems.push(...validateSegment(seg, company))
  }
  allItems.push(...validateWorkforceSegmentation(scenario.segments, company))
  allItems.push(...validateAssumptionPack(pack))
  allItems.push(...validateFundingPlan(funding))
  allItems.push(...validateCalculationResult(scenario.calculationResult, funding))

  const errors = allItems.filter((i) => i.severity === 'error')
  const warnings = allItems.filter((i) => i.severity === 'warning')
  const infos = allItems.filter((i) => i.severity === 'info')

  return {
    isValid: errors.length === 0,
    isComplete: errors.length === 0 && scenario.calculationResult !== null,
    errors,
    warnings,
    infos,
    all: allItems,
  }
}
