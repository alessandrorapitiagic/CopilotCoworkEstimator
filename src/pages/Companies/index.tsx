import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Building2, Search, Archive, Trash2, Edit, Copy } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { Company } from '@/types/domain'

export default function Companies() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { companies, scenarios, updateCompany, deleteCompany, addCompany } = useAppStore()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const filtered = companies.filter((c) => {
    if (!showArchived && c.status === 'archived') return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleArchive(c: Company) {
    updateCompany(c.id, { status: c.status === 'archived' ? 'active' : 'archived' })
  }

  function handleDelete(c: Company) {
    if (confirm(t('companies.deleteConfirm'))) {
      deleteCompany(c.id)
    }
  }

  function handleDuplicate(c: Company) {
    addCompany({
      name: `${c.name} (copy)`,
      industry: c.industry,
      country: c.country,
      description: c.description,
      totalEmployees: c.totalEmployees,
      status: 'active',
      tags: c.tags,
      notes: c.notes,
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.companies')}</h1>
        <Button asChild>
          <Link to="/companies/new">
            <Plus className="size-4" />
            {t('companies.new')}
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={showArchived ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="size-4" />
          {t('common.archive')}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Building2 className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
            <Button asChild>
              <Link to="/companies/new">
                <Plus className="size-4" />
                {t('companies.new')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const cScenarios = scenarios.filter((s) => s.companyId === c.id)
            const totalCostMid = cScenarios.reduce(
              (sum, s) => sum + (s.calculationResult?.monthlyCost.mid ?? 0),
              0,
            )
            return (
              <Card
                key={c.id}
                className={`transition-shadow hover:shadow-md cursor-pointer ${c.status === 'archived' ? 'opacity-60' : ''}`}
                onClick={() => navigate(`/companies/${c.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.industry ? t(`industries.${c.industry}`) : '—'} · {c.country ?? '—'}
                      </p>
                    </div>
                    {c.status === 'archived' && (
                      <Badge variant="secondary">{t('companies.status.archived')}</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground text-xs">{t('common.headcount')}</p>
                      <p className="font-medium">{formatNumber(c.totalEmployees)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">{t('nav.scenarios')}</p>
                      <p className="font-medium">{cScenarios.length}</p>
                    </div>
                    {totalCostMid > 0 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">{t('dashboard.kpi.monthlyCost')}</p>
                        <p className="font-semibold text-primary">
                          €{formatNumber(totalCostMid, 2)}/mo
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className="flex gap-1 justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      asChild
                    >
                      <Link to={`/companies/${c.id}/edit`}>
                        <Edit className="size-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleDuplicate(c)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleArchive(c)}
                    >
                      <Archive className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(c)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
