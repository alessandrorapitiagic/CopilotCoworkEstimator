import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Copy, Archive, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import type { RecentScenarioRow, RangeMode } from './useDashboardSummary'

interface Props {
  rows: RecentScenarioRow[]
  range: RangeMode
  currency: string
  mostExpensive: RecentScenarioRow | null
}

const STATUS_VARIANT = {
  draft: 'secondary',
  reviewed: 'success',
  shared: 'success',
  archived: 'outline',
} as const

export function RecentScenariosTable({ rows, range, currency, mostExpensive }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addScenario, scenarios, updateScenario } = useAppStore()

  function handleDuplicate(row: RecentScenarioRow) {
    const original = scenarios.find((s) => s.id === row.id)
    if (!original) return
    addScenario({
      companyId: original.companyId,
      name: `${original.name} (copy)`,
      description: original.description,
      assumptionPackId: original.assumptionPackId,
      fundingPlanId: null,
      segments: original.segments.map((s) => ({ ...s })),
      status: 'draft',
      tags: original.tags,
    })
  }

  function handleArchive(row: RecentScenarioRow) {
    updateScenario(row.id, { status: row.status === 'archived' ? 'draft' : 'archived' })
  }

  if (rows.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('dashboard.recentScenarios')}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/scenarios">{t('common.total')} →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Scenario</th>
                <th className="px-4 py-2.5 text-left font-medium">Azienda</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Crediti/mo</th>
                <th className="px-4 py-2.5 text-right font-medium">Costo/mo</th>
                <th className="px-4 py-2.5 text-left font-medium">Pack</th>
                <th className="px-4 py-2.5 text-center font-medium">⚠</th>
                <th className="px-4 py-2.5 text-left font-medium">Aggiornato</th>
                <th className="px-4 py-2.5 text-right font-medium">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isExpensive = mostExpensive?.id === row.id
                return (
                  <tr
                    key={row.id}
                    className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${isExpensive ? 'bg-primary/3' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {isExpensive && (
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-amber-500 text-xs">★</span>
                            </TooltipTrigger>
                            <TooltipContent>Scenario più costoso</TooltipContent>
                          </Tooltip>
                        )}
                        <Link
                          to={`/scenarios/${row.id}`}
                          className="font-medium hover:text-primary transition-colors truncate max-w-[180px] block"
                        >
                          {row.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]">
                      {row.companyName}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={STATUS_VARIANT[row.status] as 'secondary' | 'success' | 'outline'}>
                        {t(`scenarios.status.${row.status}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {row.monthlyCredits
                        ? formatNumber(Math.round(row.monthlyCredits[range]))
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-primary">
                      {row.monthlyCost
                        ? formatCurrency(row.monthlyCost[range], currency)
                        : <span className="text-muted-foreground font-normal">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-muted-foreground truncate block max-w-[100px]">
                        {row.assumptionPackName} <span className="text-muted-foreground/60">v{row.assumptionPackVersion}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.warningCount > 0 ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                row.warningMaxSeverity === 'error'
                                  ? 'text-destructive'
                                  : 'text-amber-500'
                              }`}
                            >
                              <AlertTriangle className="size-3" />
                              {row.warningCount}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{row.warningCount} warning attivi</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(row.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => navigate(`/scenarios/${row.id}`)}
                            >
                              <ExternalLink className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Apri</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleDuplicate(row)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplica</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => handleArchive(row)}
                            >
                              <Archive className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{row.status === 'archived' ? 'Ripristina' : 'Archivia'}</TooltipContent>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col divide-y">
          {rows.map((row) => (
            <div
              key={row.id}
              className="px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer"
              onClick={() => navigate(`/scenarios/${row.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.companyName}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={STATUS_VARIANT[row.status] as 'secondary' | 'success' | 'outline'}>
                    {t(`scenarios.status.${row.status}`)}
                  </Badge>
                  {row.warningCount > 0 && (
                    <AlertTriangle className="size-3.5 text-amber-500" />
                  )}
                </div>
              </div>
              {row.monthlyCost && (
                <p className="text-sm font-semibold text-primary mt-1">
                  {formatCurrency(row.monthlyCost[range], currency)}/mo
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
