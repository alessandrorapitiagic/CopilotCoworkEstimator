import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Search, Building2,
  Archive, ArchiveRestore, Trash2, Copy, ExternalLink,
  ArrowUpDown,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { InfoHint } from '@/components/shared/InfoHint'
import { CompanyDeleteDialog } from './CompanyDeleteDialog'
import { CompanyDuplicateDialog } from './CompanyDuplicateDialog'
import type { Company } from '@/types/domain'

type SortKey = 'name' | 'updatedAt' | 'totalEmployees' | 'monthlyCost'

export default function Companies() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { companies, scenarios, updateCompany, preferences } = useAppStore()

  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<Company | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<Company | null>(null)

  // Compute per-company cost from scenarios
  function getCompanySummary(company: Company) {
    const cScenarios = scenarios.filter(
      (s) => s.companyId === company.id && s.status !== 'archived',
    )
    const monthlyCostMid = cScenarios.reduce(
      (sum, s) => sum + (s.calculationResult?.monthlyCost.mid ?? 0),
      0,
    )
    return { scenarioCount: cScenarios.length, monthlyCostMid }
  }

  const filtered = useMemo(() => {
    let list = companies.filter((c) => {
      if (!showArchived && c.status === 'archived') return false
      const q = search.trim().toLowerCase()
      return !q || c.name.toLowerCase().includes(q) || (c.country ?? '').toLowerCase().includes(q)
    })
    list = [...list].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'updatedAt') return b.updatedAt.localeCompare(a.updatedAt)
      if (sortKey === 'totalEmployees') return b.totalEmployees - a.totalEmployees
      if (sortKey === 'monthlyCost') {
        return getCompanySummary(b).monthlyCostMid - getCompanySummary(a).monthlyCostMid
      }
      return 0
    })
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, scenarios, search, showArchived, sortKey])

  function handleArchiveToggle(c: Company) {
    if (c.status === 'active') {
      setArchiveTarget(c)
    } else {
      updateCompany(c.id, {
        status: 'active',
        archivedAt: null,
      })
    }
  }

  function confirmArchive() {
    if (!archiveTarget) return
    updateCompany(archiveTarget.id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    })
    setArchiveTarget(null)
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" data-tour="companies-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('nav.companies')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('companies.emptyState.body')}
          </p>
        </div>
        <Button asChild data-tour="company-new-btn">
          <Link to="/companies/new">
            <Plus className="size-4" />
            {t('companies.new')}
          </Link>
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2" data-tour="companies-filters">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search') + '...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label={t('common.search')}
          />
        </div>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-44 h-9">
            <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['name', 'updatedAt', 'totalEmployees', 'monthlyCost'] as SortKey[]).map((k) => (
              <SelectItem key={k} value={k}>
                {t(`companies.sortOptions.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          aria-pressed={showArchived}
        >
          <Archive className="size-4" />
          {t('companies.status.archived')}
        </Button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="rounded-2xl bg-muted p-4">
              <Building2 className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{t('companies.emptyState.title')}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                {search
                  ? `Nessuna azienda trovata per "${search}"`
                  : t('companies.emptyState.body')}
              </p>
            </div>
            {!search && (
              <Button asChild>
                <Link to="/companies/new">
                  <Plus className="size-4" />
                  {t('companies.emptyState.createFirst')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <Card className="hidden md:block overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">{t('companies.name')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('companies.industry')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('companies.country')}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    <span className="flex items-center justify-end gap-1">
                      {t('companies.totalEmployees')}
                      <InfoHint hintKey="totalEmployees" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">{t('nav.scenarios')}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    <span className="flex items-center justify-end gap-1">
                      {t('companies.kpi.monthlyCost')}
                      <InfoHint hintKey="companyMonthlyCost" />
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">{t('common.total')}</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const { scenarioCount, monthlyCostMid } = getCompanySummary(c)
                  return (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/companies/${c.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium truncate max-w-[200px]">{c.name}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {c.industry ? t(`industries.${c.industry}`) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {c.country ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatNumber(c.totalEmployees)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{scenarioCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-primary">
                        {monthlyCostMid > 0
                          ? formatCurrency(monthlyCostMid, preferences.currency)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={c.status === 'active' ? 'success' : 'secondary'}>
                          {t(`companies.status.${c.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost" size="icon" className="size-8"
                            onClick={() => navigate(`/companies/${c.id}`)}
                            aria-label="Open"
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-8"
                            onClick={() => setDuplicateTarget(c)}
                            aria-label={t('common.duplicate')}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-8"
                            onClick={() => handleArchiveToggle(c)}
                            aria-label={c.status === 'active' ? t('common.archive') : t('common.restore')}
                          >
                            {c.status === 'active'
                              ? <Archive className="size-3.5" />
                              : <ArchiveRestore className="size-3.5" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 md:hidden">
          {filtered.map((c) => {
            const { scenarioCount, monthlyCostMid } = getCompanySummary(c)
            return (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/companies/${c.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.industry ? t(`industries.${c.industry}`) : '—'}
                        {c.country ? ` · ${c.country}` : ''}
                      </p>
                    </div>
                    <Badge variant={c.status === 'active' ? 'success' : 'secondary'}>
                      {t(`companies.status.${c.status}`)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <p className="text-muted-foreground">{t('common.headcount')}</p>
                      <p className="font-medium">{formatNumber(c.totalEmployees)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('nav.scenarios')}</p>
                      <p className="font-medium">{scenarioCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">/mo</p>
                      <p className="font-semibold text-primary">
                        {monthlyCostMid > 0 ? formatCurrency(monthlyCostMid, preferences.currency) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="size-7"
                      onClick={() => setDuplicateTarget(c)}>
                      <Copy className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7"
                      onClick={() => handleArchiveToggle(c)}>
                      {c.status === 'active' ? <Archive className="size-3.5" /> : <ArchiveRestore className="size-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Archive confirmation dialog */}
      <Dialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('companies.archiveDialog.title')}</DialogTitle>
            <DialogDescription className="pt-1">
              <strong>{archiveTarget?.name}</strong> — {t('companies.archiveDialog.body')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>{t('common.cancel')}</Button>
            <Button onClick={confirmArchive}>{t('companies.archiveDialog.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      {deleteTarget && (
        <CompanyDeleteDialog
          company={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Duplicate dialog */}
      {duplicateTarget && (
        <CompanyDuplicateDialog
          company={duplicateTarget}
          onClose={() => setDuplicateTarget(null)}
        />
      )}
    </div>
  )
}
