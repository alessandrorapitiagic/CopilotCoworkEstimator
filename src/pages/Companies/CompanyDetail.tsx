import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit, Plus, FlaskConical, Copy, Archive,
  ArchiveRestore, Trash2, Download, AlertTriangle, TrendingUp,
  CalendarDays,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoHint } from '@/components/shared/InfoHint'
import { CompanyDeleteDialog } from './CompanyDeleteDialog'
import { CompanyDuplicateDialog } from './CompanyDuplicateDialog'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function CompanyDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { companies, scenarios, updateCompany, preferences } = useAppStore()

  const [showDelete, setShowDelete] = useState(false)
  const [showDuplicate, setShowDuplicate] = useState(false)

  const company = companies.find((c) => c.id === id) ?? null

  if (!company) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" /> {t('common.back')}
        </Button>
        <p className="mt-4 text-muted-foreground">{t('common.noData')}</p>
      </div>
    )
  }

  // company is narrowed to non-null after the early return above
  const co = company
  const isArchived = co.status === 'archived'
  const cScenarios = scenarios.filter((s) => s.companyId === co.id)
  const activeScenarios = cScenarios.filter((s) => s.status !== 'archived')

  const monthlyCostMid = activeScenarios.reduce(
    (sum, s) => sum + (s.calculationResult?.monthlyCost.mid ?? 0), 0,
  )
  const annualCostMid = monthlyCostMid * 12

  function handleArchiveToggle() {
    if (isArchived) {
      updateCompany(co.id, { status: 'active', archivedAt: null })
    } else {
      updateCompany(co.id, { status: 'archived', archivedAt: new Date().toISOString() })
    }
  }

  function handleExport() {
    const relatedScenarios = scenarios.filter((s) => s.companyId === co.id)
    const payload = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      companies: [company],
      scenarios: relatedScenarios,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `company-${co.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{co.name}</h1>
            <Badge variant={isArchived ? 'secondary' : 'success'}>
              {t(`companies.status.${co.status}`)}
            </Badge>
            {co.source !== 'manual' && (
              <Badge variant="outline">{t(`companies.source.${co.source}`)}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {co.industry ? t(`industries.${co.industry}`) : '—'}
            {co.country ? ` · ${co.country}` : ''}
            {co.region ? ` · ${co.region}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 shrink-0">
          {!isArchived && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/companies/${co.id}/edit`}>
                <Edit className="size-4" /> {t('common.edit')}
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowDuplicate(true)}>
            <Copy className="size-4" /> {t('common.duplicate')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" /> {t('common.export')}
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={handleArchiveToggle}
          >
            {isArchived
              ? <><ArchiveRestore className="size-4" />{t('common.restore')}</>
              : <><Archive className="size-4" />{t('common.archive')}</>}
          </Button>
          <Button
            variant="outline" size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Archived notice */}
      {isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          {t('companies.messages.archivedNoEdit')}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4" data-tour="company-kpi">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {t('companies.totalEmployees')}
              <InfoHint hintKey="totalEmployees" />
            </p>
            <p className="text-2xl font-bold mt-0.5">{formatNumber(co.totalEmployees)}</p>
            {co.estimatedKnowledgeWorkers != null && (
              <p className="text-xs text-muted-foreground mt-0.5">
                ~{formatNumber(co.estimatedKnowledgeWorkers)} KW
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{t('companies.kpi.activeScenarios')}</p>
            <p className="text-2xl font-bold mt-0.5">{activeScenarios.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cScenarios.length} {t('common.total').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="size-3" />
              {t('companies.kpi.monthlyCost')}
              <InfoHint hintKey="companyMonthlyCost" />
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">
              {formatCurrency(monthlyCostMid, co.currency ?? preferences.currency)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="size-3" />
              {t('companies.kpi.annualCost')}
              <InfoHint hintKey="companyAnnualCost" />
            </p>
            <p className="text-2xl font-bold text-primary mt-0.5">
              {formatCurrency(annualCostMid, co.currency ?? preferences.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scenarios table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('companies.scenarios')}</CardTitle>
            {!isArchived && (
              <Button asChild size="sm" data-tour="company-new-scenario">
                <Link to={`/scenarios/new?companyId=${co.id}`}>
                  <Plus className="size-4" /> {t('scenarios.new')}
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {cScenarios.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <FlaskConical className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('companies.noScenarios')}</p>
              {!isArchived && (
                <Button asChild size="sm">
                  <Link to={`/scenarios/new?companyId=${co.id}`}>
                    <Plus className="size-4" /> {t('scenarios.new')}
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {cScenarios.map((s) => {
                const result = s.calculationResult
                return (
                  <Link
                    key={s.id}
                    to={`/scenarios/${s.id}`}
                    className="flex items-center gap-3 py-2.5 hover:text-primary transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.segments.length} segmenti · {new Date(s.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result && (
                        <span className="text-sm font-semibold text-primary">
                          {formatCurrency(result.monthlyCost.mid, co.currency ?? preferences.currency)}/mo
                        </span>
                      )}
                      <Badge variant={s.status === 'draft' ? 'secondary' : s.status === 'archived' ? 'outline' : 'success'}>
                        {t(`scenarios.status.${s.status}`)}
                      </Badge>
                      {(s.calculationResult?.warnings.filter((w) => w.severity !== 'info').length ?? 0) > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="size-3.5 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {s.calculationResult?.warnings.filter((w) => w.severity !== 'info').length} warning
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showDelete && (
        <CompanyDeleteDialog
          company={company}
          onClose={() => setShowDelete(false)}
          navigateAfter
        />
      )}
      {showDuplicate && (
        <CompanyDuplicateDialog
          company={company}
          onClose={() => setShowDuplicate(false)}
        />
      )}
    </div>
  )
}
