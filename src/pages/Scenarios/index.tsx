import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FlaskConical, Search, Trash2, Copy, Archive } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { Scenario } from '@/types/domain'

export default function Scenarios() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { scenarios, companies, deleteScenario, updateScenario, addScenario, preferences } = useAppStore()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  const filtered = scenarios.filter((s) => {
    if (!showArchived && s.status === 'archived') return false
    const company = companies.find((c) => c.id === s.companyId)
    const q = search.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || (company?.name ?? '').toLowerCase().includes(q)
  })

  function handleDuplicate(s: Scenario) {
    addScenario({
      companyId: s.companyId,
      name: `${s.name} (copy)`,
      description: s.description,
      assumptionPackId: s.assumptionPackId,
      fundingPlanId: null,
      segments: s.segments.map((seg) => ({ ...seg })),
      status: 'draft',
      tags: s.tags,
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.scenarios')}</h1>
        <Button asChild>
          <Link to="/scenarios/new">
            <Plus className="size-4" />
            {t('scenarios.new')}
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
            <FlaskConical className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
            <Button asChild>
              <Link to="/scenarios/new">
                <Plus className="size-4" /> {t('scenarios.new')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((s) => {
            const company = companies.find((c) => c.id === s.companyId)
            const result = s.calculationResult
            return (
              <Card
                key={s.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/scenarios/${s.id}`)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{s.name}</p>
                      <Badge variant={s.status === 'draft' ? 'secondary' : s.status === 'archived' ? 'outline' : 'success'}>
                        {t(`scenarios.status.${s.status}`)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {company?.name ?? '—'} · {s.segments.length} segmenti
                    </p>
                  </div>

                  {result && (
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(result.monthlyCost.mid, preferences.currency)}/mo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(result.annualCost.mid, preferences.currency)}/yr
                      </p>
                    </div>
                  )}

                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDuplicate(s)}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() =>
                        updateScenario(s.id, {
                          status: s.status === 'archived' ? 'draft' : 'archived',
                        })
                      }
                    >
                      <Archive className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Eliminare lo scenario?')) deleteScenario(s.id)
                      }}
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
