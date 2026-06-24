import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Plus, FlaskConical, Trash2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatCurrency } from '@/lib/utils'

export default function CompanyDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { companies, scenarios, deleteScenario, preferences } = useAppStore()

  const company = companies.find((c) => c.id === id)
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

  const cScenarios = scenarios.filter((s) => s.companyId === company.id)
  const totalMonthlyCost = cScenarios.reduce(
    (sum, s) => sum + (s.calculationResult?.monthlyCost.mid ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.industry ? t(`industries.${company.industry}`) : '—'}
            {company.country ? ` · ${company.country}` : ''}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={`/companies/${company.id}/edit`}>
            <Edit className="size-4" /> {t('common.edit')}
          </Link>
        </Button>
      </div>

      {/* Company info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('companies.totalEmployees')}</p>
            <p className="text-2xl font-bold">{formatNumber(company.totalEmployees)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('nav.scenarios')}</p>
            <p className="text-2xl font-bold">{cScenarios.length}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{t('dashboard.kpi.monthlyCost')}</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalMonthlyCost, preferences.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {company.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{company.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Scenarios */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('companies.scenarios')}</CardTitle>
            <Button asChild size="sm">
              <Link to={`/scenarios/new?companyId=${company.id}`}>
                <Plus className="size-4" /> {t('scenarios.new')}
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cScenarios.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <FlaskConical className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('companies.noScenarios')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cScenarios.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted transition-colors"
                >
                  <Link to={`/scenarios/${s.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.segments.length} segmenti ·{' '}
                      {s.calculationResult
                        ? formatCurrency(s.calculationResult.monthlyCost.mid, preferences.currency) + '/mo'
                        : 'non calcolato'}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === 'draft' ? 'secondary' : 'success'}>
                      {t(`scenarios.status.${s.status}`)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm('Eliminare lo scenario?')) deleteScenario(s.id)
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
