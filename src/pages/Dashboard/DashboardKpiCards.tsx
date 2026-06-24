import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2, FlaskConical, Zap, TrendingUp, CalendarDays, AlertTriangle, ArchiveIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { DashboardKpi, RangeMode } from './useDashboardSummary'

interface Props {
  kpi: DashboardKpi
  range: RangeMode
  currency: string
  totalWarnings: number
  maxWarningSeverity: 'info' | 'warning' | 'error' | null
}

export function DashboardKpiCards({ kpi, range, currency, totalWarnings, maxWarningSeverity }: Props) {
  const { t } = useTranslation()

  const credits = kpi.monthlyCredits[range]
  const annualCredits = kpi.annualCredits[range]
  const cost = kpi.monthlyCost[range]
  const annualCost = kpi.annualCost[range]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Companies */}
      <Card className="col-span-1">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardDescription>{t('dashboard.kpi.companies')}</CardDescription>
            <Building2 className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Link to="/companies" className="block group">
            <p className="text-3xl font-bold group-hover:text-primary transition-colors">
              {kpi.activeCompanies}
            </p>
          </Link>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {kpi.archivedCompanies > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <ArchiveIcon className="size-2.5 mr-0.5" />
                {kpi.archivedCompanies} arch.
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <Card className="col-span-1">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardDescription>{t('dashboard.kpi.scenarios')}</CardDescription>
            <FlaskConical className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Link to="/scenarios" className="block group">
            <p className="text-3xl font-bold group-hover:text-primary transition-colors">
              {kpi.activeScenarios}
            </p>
          </Link>
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {kpi.draftScenarios > 0 && (
              <Badge variant="secondary" className="text-[10px]">{kpi.draftScenarios} draft</Badge>
            )}
            {kpi.sharedScenarios > 0 && (
              <Badge variant="success" className="text-[10px]">{kpi.sharedScenarios} shared</Badge>
            )}
            {kpi.archivedScenarios > 0 && (
              <Badge variant="outline" className="text-[10px]">{kpi.archivedScenarios} arch.</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Credits */}
      <Card className="col-span-1">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardDescription>
              {t('results.monthlyCredits')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1 cursor-help text-muted-foreground">ⓘ</span>
                </TooltipTrigger>
                <TooltipContent>
                  Somma dei crediti mensili di tutti gli scenari attivi ({range.toUpperCase()})
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <Zap className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatNumber(Math.round(credits))}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(Math.round(kpi.monthlyCredits.min))}
            {' – '}
            {formatNumber(Math.round(kpi.monthlyCredits.max))}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Cost */}
      <Card className="col-span-1 border-primary/30 bg-primary/5">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardDescription>{t('results.monthlyCost')}</CardDescription>
            <TrendingUp className="size-4 text-primary/70" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(cost, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(kpi.monthlyCost.min, currency)}
            {' – '}
            {formatCurrency(kpi.monthlyCost.max, currency)}
          </p>
        </CardContent>
      </Card>

      {/* Annual Cost */}
      <Card className="col-span-1 border-primary/20 bg-primary/3">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardDescription>{t('results.annualCost')}</CardDescription>
            <CalendarDays className="size-4 text-primary/70" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(annualCost, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(Math.round(annualCredits))} crediti/anno
          </p>
        </CardContent>
      </Card>

      {/* Warnings */}
      <Card
        className={`col-span-1 ${
          maxWarningSeverity === 'error'
            ? 'border-destructive/40 bg-destructive/5'
            : maxWarningSeverity === 'warning'
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10'
              : ''
        }`}
      >
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardDescription>{t('results.warnings')}</CardDescription>
            <AlertTriangle
              className={`size-4 ${
                maxWarningSeverity === 'error'
                  ? 'text-destructive'
                  : maxWarningSeverity === 'warning'
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
              }`}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p
            className={`text-3xl font-bold ${
              maxWarningSeverity === 'error'
                ? 'text-destructive'
                : maxWarningSeverity === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : ''
            }`}
          >
            {totalWarnings}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalWarnings === 0
              ? t('results.noWarnings')
              : maxWarningSeverity === 'error'
                ? 'Critici presenti'
                : 'Verificare'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
