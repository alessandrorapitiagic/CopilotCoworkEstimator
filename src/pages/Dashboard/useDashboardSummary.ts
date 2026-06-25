import { useMemo } from 'react'
import type { Company, Scenario, AssumptionPack, CalculationWarning } from '@/types/domain'

export type RangeMode = 'min' | 'mid' | 'max'

export interface DashboardKpi {
  totalCompanies: number
  activeCompanies: number
  archivedCompanies: number
  totalScenarios: number
  activeScenarios: number
  draftScenarios: number
  sharedScenarios: number
  archivedScenarios: number
  monthlyCredits: { min: number; mid: number; max: number }
  annualCredits: { min: number; mid: number; max: number }
  monthlyCost: { min: number; mid: number; max: number }
  annualCost: { min: number; mid: number; max: number }
}

export interface DashboardAlert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  type:
    | 'outdated_pack'
    | 'custom_pack'
    | 'no_result'
    | 'budget_exceeded'
    | 'storage_warning'
    | 'storage_unavailable'
    | 'data_corrupted'
    | 'no_companies'
    | 'no_scenarios'
    | 'all_archived'
  message: string
  detail?: string
  scenarioIds?: string[]
  actionLabel?: string
  actionPath?: string
}

export interface RecentScenarioRow {
  id: string
  name: string
  companyId: string
  companyName: string
  status: Scenario['status']
  monthlyCredits: { min: number; mid: number; max: number } | null
  monthlyCost: { min: number; mid: number; max: number } | null
  assumptionPackName: string
  assumptionPackVersion: string
  warningCount: number
  warningMaxSeverity: CalculationWarning['severity'] | null
  updatedAt: string
}

export interface StorageStatus {
  available: boolean
  approximateUsageBytes: number
  approximateUsageKb: number
  isNearLimit: boolean
  lastExportDate: string | null
}

export interface DashboardSummary {
  kpi: DashboardKpi
  alerts: DashboardAlert[]
  recentScenarios: RecentScenarioRow[]
  mostExpensiveScenario: RecentScenarioRow | null
  lastModifiedScenario: RecentScenarioRow | null
  storageStatus: StorageStatus
  hasData: boolean
  hasCompanies: boolean
  hasActiveScenarios: boolean
  allArchived: boolean
}

function getStorageStatus(): StorageStatus {
  try {
    const test = '__sz__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)

    // Estimate storage usage
    let total = 0
    for (const key of Object.keys(localStorage)) {
      total += (localStorage.getItem(key)?.length ?? 0) * 2 // UTF-16 = 2 bytes/char
    }
    const isNearLimit = total > 4 * 1024 * 1024 // warn above 4 MB

    const lastExport = localStorage.getItem('copilot_cowork_last_export') ?? null

    return {
      available: true,
      approximateUsageBytes: total,
      approximateUsageKb: Math.round(total / 1024),
      isNearLimit,
      lastExportDate: lastExport,
    }
  } catch {
    return {
      available: false,
      approximateUsageBytes: 0,
      approximateUsageKb: 0,
      isNearLimit: false,
      lastExportDate: null,
    }
  }
}

export function useDashboardSummary(
  companies: Company[],
  scenarios: Scenario[],
  assumptionPacks: AssumptionPack[],
): DashboardSummary {
  return useMemo(() => {
    const storageStatus = getStorageStatus()

    // ---- Company counts ----
    const activeCompanies = companies.filter((c) => c.status === 'active')
    const archivedCompanies = companies.filter((c) => c.status === 'archived')

    // ---- Scenario counts ----
    const activeScenarios = scenarios.filter((s) => s.status !== 'archived')
    const draftScenarios = activeScenarios.filter((s) => s.status === 'draft')
    const sharedScenarios = activeScenarios.filter((s) => s.status === 'shared')
    const archivedScenarios = scenarios.filter((s) => s.status === 'archived')

    // ---- KPI aggregation (active scenarios only) ----
    let monthlyCredits = { min: 0, mid: 0, max: 0 }
    let monthlyCost = { min: 0, mid: 0, max: 0 }

    for (const s of activeScenarios) {
      const r = s.calculationResult
      if (!r) continue
      monthlyCredits = {
        min: monthlyCredits.min + r.monthlyCredits.min,
        mid: monthlyCredits.mid + r.monthlyCredits.mid,
        max: monthlyCredits.max + r.monthlyCredits.max,
      }
      monthlyCost = {
        min: monthlyCost.min + r.monthlyCost.min,
        mid: monthlyCost.mid + r.monthlyCost.mid,
        max: monthlyCost.max + r.monthlyCost.max,
      }
    }

    const annualCredits = {
      min: monthlyCredits.min * 12,
      mid: monthlyCredits.mid * 12,
      max: monthlyCredits.max * 12,
    }
    const annualCost = {
      min: monthlyCost.min * 12,
      mid: monthlyCost.mid * 12,
      max: monthlyCost.max * 12,
    }

    // ---- Build recent scenario rows ----
    const currentSystemPack = assumptionPacks.find((p) => p.isCurrentDefault) ?? assumptionPacks.find((p) => p.isSystemDefault)

    const rows: RecentScenarioRow[] = activeScenarios.map((s) => {
      const company = companies.find((c) => c.id === s.companyId)
      const pack = assumptionPacks.find((p) => p.id === s.assumptionPackId)
      const r = s.calculationResult
      const allWarnings = r?.warnings ?? []
      const nonInfoWarnings = allWarnings.filter((w) => w.severity !== 'info')
      const maxSev: CalculationWarning['severity'] | null =
        nonInfoWarnings.some((w) => w.severity === 'error')
          ? 'error'
          : nonInfoWarnings.some((w) => w.severity === 'warning')
            ? 'warning'
            : nonInfoWarnings.length > 0
              ? 'info'
              : null

      return {
        id: s.id,
        name: s.name,
        companyId: s.companyId,
        companyName: company?.name ?? '—',
        status: s.status,
        monthlyCredits: r ? { min: r.monthlyCredits.min, mid: r.monthlyCredits.mid, max: r.monthlyCredits.max } : null,
        monthlyCost: r ? { min: r.monthlyCost.min, mid: r.monthlyCost.mid, max: r.monthlyCost.max } : null,
        assumptionPackName: pack?.name ?? '—',
        assumptionPackVersion: pack?.version ?? '—',
        warningCount: nonInfoWarnings.length,
        warningMaxSeverity: maxSev,
        updatedAt: s.updatedAt,
      }
    })

    const recentScenarios = [...rows]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 10)

    const mostExpensiveScenario =
      rows.length > 0
        ? [...rows].sort(
            (a, b) => (b.monthlyCost?.mid ?? 0) - (a.monthlyCost?.mid ?? 0),
          )[0]
        : null

    const lastModifiedScenario = recentScenarios[0] ?? null

    // ---- Alerts ----
    const alerts: DashboardAlert[] = []

    // No localStorage
    if (!storageStatus.available) {
      alerts.push({
        id: 'storage_unavailable',
        severity: 'critical',
        type: 'storage_unavailable',
        message:
          'Il salvataggio locale non è disponibile. Puoi usare l\'app, ma dovrai esportare i dati per non perderli.',
        actionLabel: 'Esporta JSON',
        actionPath: '/settings',
      })
    }

    // Storage near limit
    if (storageStatus.available && storageStatus.isNearLimit) {
      alerts.push({
        id: 'storage_warning',
        severity: 'warning',
        type: 'storage_warning',
        message: `Lo spazio locale del browser è quasi pieno (${storageStatus.approximateUsageKb} KB). Ti consigliamo di esportare un backup.`,
        actionLabel: 'Esporta backup',
        actionPath: '/settings',
      })
    }

    // No companies
    if (companies.length === 0) {
      alerts.push({
        id: 'no_companies',
        severity: 'info',
        type: 'no_companies',
        message: 'Non hai ancora creato aziende o scenari. Crea una nuova simulazione o importa un file JSON.',
      })
    }

    // Companies but no scenarios
    if (companies.length > 0 && scenarios.length === 0) {
      alerts.push({
        id: 'no_scenarios',
        severity: 'info',
        type: 'no_scenarios',
        message: 'Hai creato almeno un\'azienda, ma non hai ancora scenari di stima.',
        actionLabel: 'Nuovo scenario',
        actionPath: '/scenarios/new',
      })
    }

    // All archived
    if (scenarios.length > 0 && activeScenarios.length === 0) {
      alerts.push({
        id: 'all_archived',
        severity: 'info',
        type: 'all_archived',
        message: 'Tutti gli scenari sono archiviati. I totali mostrano zero. Ripristina uno scenario per vederlo nei KPI.',
        actionLabel: 'Vai agli scenari',
        actionPath: '/scenarios',
      })
    }

    // Scenarios without result
    const noResultScenarios = activeScenarios.filter((s) => !s.calculationResult)
    if (noResultScenarios.length > 0) {
      alerts.push({
        id: 'no_result',
        severity: 'warning',
        type: 'no_result',
        message: `${noResultScenarios.length} scenario${noResultScenarios.length > 1 ? 'i' : ''} non ${noResultScenarios.length > 1 ? 'hanno' : 'ha'} un risultato calcolato e ${noResultScenarios.length > 1 ? 'sono stati esclusi' : 'è stato escluso'} dai totali.`,
        scenarioIds: noResultScenarios.map((s) => s.id),
        actionLabel: 'Ricalcola',
        actionPath: '/scenarios',
      })
    }

    // Outdated assumption packs
    if (currentSystemPack) {
      const outdated = activeScenarios.filter((s) => {
        const pack = assumptionPacks.find((p) => p.id === s.assumptionPackId)
        return pack && pack.isSystemDefault && pack.version < currentSystemPack.version
      })
      if (outdated.length > 0) {
        alerts.push({
          id: 'outdated_pack',
          severity: 'warning',
          type: 'outdated_pack',
          message: `${outdated.length} scenario${outdated.length > 1 ? 'i usano' : ' usa'} un assumption pack non aggiornato. Verifica se vuoi mantenere la stima storica o aggiornarla.`,
          scenarioIds: outdated.map((s) => s.id),
          actionLabel: 'Vedi assunzioni',
          actionPath: '/assumptions',
        })
      }
    }

    // Custom assumption packs
    const customPackScenarios = activeScenarios.filter((s) => {
      const pack = assumptionPacks.find((p) => p.id === s.assumptionPackId)
      return pack && !pack.isSystemDefault
    })
    if (customPackScenarios.length > 0) {
      alerts.push({
        id: 'custom_pack',
        severity: 'info',
        type: 'custom_pack',
        message: `${customPackScenarios.length} scenario${customPackScenarios.length > 1 ? 'i usano' : ' usa'} assunzioni personalizzate. I risultati potrebbero non riflettere i valori di default.`,
        scenarioIds: customPackScenarios.map((s) => s.id),
      })
    }

    // Budget exceeded
    const budgetExceeded = activeScenarios.filter((s) => {
      const warnings = s.calculationResult?.warnings ?? []
      return warnings.some((w) => w.code === 'OVER_BUDGET_CRITICAL' || w.code === 'OVER_BUDGET_WARNING')
    })
    if (budgetExceeded.length > 0) {
      alerts.push({
        id: 'budget_exceeded',
        severity: 'warning',
        type: 'budget_exceeded',
        message: `${budgetExceeded.length} scenario${budgetExceeded.length > 1 ? 'i hanno' : ' ha'} il costo stimato che supera il budget impostato.`,
        scenarioIds: budgetExceeded.map((s) => s.id),
      })
    }

    // ---- Final ----
    const kpi: DashboardKpi = {
      totalCompanies: companies.length,
      activeCompanies: activeCompanies.length,
      archivedCompanies: archivedCompanies.length,
      totalScenarios: scenarios.length,
      activeScenarios: activeScenarios.length,
      draftScenarios: draftScenarios.length,
      sharedScenarios: sharedScenarios.length,
      archivedScenarios: archivedScenarios.length,
      monthlyCredits,
      annualCredits,
      monthlyCost,
      annualCost,
    }

    return {
      kpi,
      alerts,
      recentScenarios,
      mostExpensiveScenario,
      lastModifiedScenario,
      storageStatus,
      hasData: companies.length > 0 || scenarios.length > 0,
      hasCompanies: companies.length > 0,
      hasActiveScenarios: activeScenarios.length > 0,
      allArchived: scenarios.length > 0 && activeScenarios.length === 0,
    }
  }, [companies, scenarios, assumptionPacks])
}
