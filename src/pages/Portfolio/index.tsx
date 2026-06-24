import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2, Download, Search, ArrowUpDown, AlertTriangle,
  TrendingUp, CalendarDays, Zap, ExternalLink, Filter,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoHint } from '@/components/shared/InfoHint'
import { exportPortfolioCsv } from '@/services/exportService'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Industry } from '@/types/domain'

type SortKey = 'name' | 'monthlyCost' | 'updatedAt' | 'employees' | 'scenarios'

const INDUSTRIES: Array<Industry | 'all'> = ['all', 'technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'professional_services', 'education', 'government', 'energy', 'media', 'other']

export default function PortfolioPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { companies, scenarios, fundingPlans, assumptionPacks, preferences } = useAppStore()

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [industryFilter, setIndustryFilter] = useState<Industry | 'all'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('monthlyCost')
  const currency = preferences.currency

  // Compute per-company summary
  const companySummaries = useMemo(() => {
    return companies
      .filter((c) => {
        if (!showArchived && c.status === 'archived') return false
        const q = search.trim().toLowerCase()
        if (q && !c.name.toLowerCase().includes(q) && !(c.country ?? '').toLowerCase().includes(q)) return false
        if (industryFilter !== 'all' && c.industry !== industryFilter) return false
        return true
      })
      .map((company) => {
        const cScenarios = scenarios.filter((s) => s.companyId === company.id && s.status !== 'archived')
        const monthlyCostMid = cScenarios.reduce((sum, s) => sum + (s.calculationResult?.monthlyCost.mid ?? 0), 0)
        const monthlyCredits = cScenarios.reduce((sum, s) => sum + (s.calculationResult?.monthlyCredits.mid ?? 0), 0)
        const totalWarnings = cScenarios.reduce((sum, s) => sum + (s.calculationResult?.warnings.filter((w) => w.severity !== 'info').length ?? 0), 0)
        const hasResult = cScenarios.some((s) => s.calculationResult !== null)
        const budgetExceeded = cScenarios.some((s) => {
          const fp = fundingPlans.find((f) => f.scenarioId === s.id)
          if (!fp?.budgetMonthly || !s.calculationResult) return false
          return s.calculationResult.monthlyCost.min > fp.budgetMonthly
        })

        return {
          company,
          scenarioCount: cScenarios.length,
          monthlyCostMid,
          monthlyCredits,
          annualCostMid: monthlyCostMid * 12,
          totalWarnings,
          hasResult,
          budgetExceeded,
          updatedAt: Math.max(...cScenarios.map((s) => new Date(s.updatedAt).getTime()), new Date(company.updatedAt).getTime()),
        }
      })
      .sort((a, b) => {
        if (sortKey === 'name') return a.company.name.localeCompare(b.company.name)
        if (sortKey === 'monthlyCost') return b.monthlyCostMid - a.monthlyCostMid
        if (sortKey === 'updatedAt') return b.updatedAt - a.updatedAt
        if (sortKey === 'employees') return b.company.totalEmployees - a.company.totalEmployees
        if (sortKey === 'scenarios') return b.scenarioCount - a.scenarioCount
        return 0
      })
  }, [companies, scenarios, fundingPlans, search, showArchived, industryFilter, sortKey])

  // Portfolio totals (active companies only)
  const totals = useMemo(() => {
    const active = companySummaries.filter((s) => s.company.status === 'active')
    return {
      companies: active.length,
      scenarios: active.reduce((sum, s) => sum + s.scenarioCount, 0),
      monthlyCost: active.reduce((sum, s) => sum + s.monthlyCostMid, 0),
      monthlyCredits: active.reduce((sum, s) => sum + s.monthlyCredits, 0),
      warnings: active.reduce((sum, s) => sum + s.totalWarnings, 0),
    }
  }, [companySummaries])

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3" data-tour="portfolio-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vista aggregata di tutte le aziende e i relativi scenari di stima.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportPortfolioCsv(scenarios, companies, assumptionPacks, currency)}>
            <Download className="size-4" />
            {t('export.csvTypes.portfolio_summary')}
          </Button>
          <Button asChild size="sm">
            <Link to="/companies/new">
              <Building2 className="size-4" />
              {t('companies.new')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Portfolio KPI */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5" data-tour="portfolio-kpi">
        {[
          { label: t('dashboard.kpi.companies'), val: totals.companies, icon: Building2 },
          { label: t('dashboard.kpi.scenarios'), val: totals.scenarios, icon: Filter },
          { label: t('results.monthlyCredits'), val: formatNumber(Math.round(totals.monthlyCredits)), icon: Zap, hint: 'monthlyCredits' },
          { label: t('results.monthlyCost'), val: formatCurrency(totals.monthlyCost, currency), icon: TrendingUp, accent: true, hint: 'monthlyCost' },
          { label: t('results.annualCost'), val: formatCurrency(totals.monthlyCost * 12, currency), icon: CalendarDays, accent: true, hint: 'annualCost' },
        ].map(({ label, val, icon: Icon, accent, hint }) => (
          <Card key={label} className={accent ? 'border-primary/30 bg-primary/5' : ''}>
            <CardContent className="pt-3 pb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Icon className="size-3" />
                {label}
                {hint && <InfoHint hintKey={hint} size={11} />}
              </p>
              <p className={`text-xl font-bold mt-0.5 ${accent ? 'text-primary' : ''}`}>{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={industryFilter} onValueChange={(v) => setIndustryFilter(v as Industry | 'all')}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Settore" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i settori</SelectItem>
            {INDUSTRIES.slice(1).map((i) => (
              <SelectItem key={i} value={i}>{t(`industries.${i}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-40 h-9">
            <ArrowUpDown className="size-3.5 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['monthlyCost', 'name', 'updatedAt', 'employees', 'scenarios'] as SortKey[]).map((k) => (
              <SelectItem key={k} value={k}>{t(`companies.sortOptions.${k === 'scenarios' ? 'name' : k}`) || k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant={showArchived ? 'secondary' : 'outline'} size="sm" onClick={() => setShowArchived(!showArchived)}>
          {t('common.archive')}
        </Button>
      </div>

      {/* Empty state */}
      {companySummaries.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Building2 className="size-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">{t('companies.emptyState.title')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('companies.emptyState.body')}</p>
            </div>
            <Button asChild><Link to="/companies/new"><Building2 className="size-4" />{t('companies.new')}</Link></Button>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      {companySummaries.length > 0 && (
        <Card className="hidden md:block overflow-hidden" data-tour="portfolio-table">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">{t('companies.name')}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t('companies.industry')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('companies.totalEmployees')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('nav.scenarios')}</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    <span className="flex items-center justify-end gap-1">
                      {t('results.monthlyCost')} <InfoHint hintKey="companyMonthlyCost" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium">{t('results.annualCost')}</th>
                  <th className="px-4 py-2.5 text-center font-medium">⚠ Budget</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {companySummaries.map(({ company, scenarioCount, monthlyCostMid, annualCostMid, totalWarnings, budgetExceeded }) => (
                  <tr key={company.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/companies/${company.id}`)}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium truncate max-w-[160px]">{company.name}</p>
                      {company.country && <p className="text-xs text-muted-foreground">{company.country}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {company.industry ? t(`industries.${company.industry}`) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(company.totalEmployees)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{scenarioCount}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-primary">
                      {monthlyCostMid > 0 ? formatCurrency(monthlyCostMid, currency) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {annualCostMid > 0 ? formatCurrency(annualCostMid, currency) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {budgetExceeded ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="size-4 text-destructive inline" />
                          </TooltipTrigger>
                          <TooltipContent>Budget superato in almeno uno scenario</TooltipContent>
                        </Tooltip>
                      ) : totalWarnings > 0 ? (
                        <span className="text-amber-500 text-xs font-semibold">{totalWarnings}⚠</span>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={company.status === 'active' ? 'success' : 'secondary'}>
                        {t(`companies.status.${company.status}`)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" asChild>
                            <Link to={`/companies/${company.id}`}><ExternalLink className="size-3.5" /></Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Apri</TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Mobile cards */}
      {companySummaries.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {companySummaries.map(({ company, scenarioCount, monthlyCostMid, budgetExceeded }) => (
            <Card key={company.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/companies/${company.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.industry ? t(`industries.${company.industry}`) : '—'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {budgetExceeded && <AlertTriangle className="size-4 text-destructive" />}
                    <Badge variant={company.status === 'active' ? 'success' : 'secondary'}>
                      {t(`companies.status.${company.status}`)}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">{t('common.headcount')}</p><p className="font-medium">{formatNumber(company.totalEmployees)}</p></div>
                  <div><p className="text-muted-foreground">{t('nav.scenarios')}</p><p className="font-medium">{scenarioCount}</p></div>
                  <div><p className="text-muted-foreground">/mo</p><p className="font-semibold text-primary">{monthlyCostMid > 0 ? formatCurrency(monthlyCostMid, currency) : '—'}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
