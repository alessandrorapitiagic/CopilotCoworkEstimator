import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Archive, ArchiveRestore, Trash2, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InfoHint } from '@/components/shared/InfoHint'
import { CompanyDeleteDialog } from './CompanyDeleteDialog'
import type { Industry } from '@/types/domain'

const INDUSTRIES: Industry[] = [
  'technology', 'finance', 'healthcare', 'retail', 'manufacturing',
  'professional_services', 'education', 'government', 'energy', 'media', 'other',
]

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD']

export default function CompanyForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { companies, addCompany, updateCompany } = useAppStore()

  const existing = id ? companies.find((c) => c.id === id) : null
  const isEdit = !!existing
  const isArchived = existing?.status === 'archived'

  const [name, setName] = useState(existing?.name ?? '')
  const [industry, setIndustry] = useState<string>(existing?.industry ?? '')
  const [country, setCountry] = useState(existing?.country ?? '')
  const [totalEmployees, setTotalEmployees] = useState(String(existing?.totalEmployees ?? ''))
  const [coworkUsers, setCoworkUsers] = useState(String(existing?.estimatedKnowledgeWorkers ?? ''))
  const [currency, setCurrency] = useState(existing?.currency ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nameDuplicate, setNameDuplicate] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const trimmed = name.trim()
    if (!trimmed) { setNameDuplicate(false); return }
    setNameDuplicate(companies.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase() && c.id !== existing?.id,
    ))
  }, [name, companies, existing?.id])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('errors.companyNameRequired')
    const emp = Number(totalEmployees)
    if (!totalEmployees || isNaN(emp) || emp <= 0) e.totalEmployees = t('errors.employeesRequired')
    const cowork = coworkUsers ? Number(coworkUsers) : null
    if (cowork !== null && (isNaN(cowork) || cowork < 0)) e.coworkUsers = t('errors.headcountInvalid')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      legalName: null,
      industry: (industry as Industry) || null,
      country: country.trim() || null,
      region: null,
      totalEmployees: Number(totalEmployees),
      estimatedKnowledgeWorkers: coworkUsers ? Number(coworkUsers) : null,
      currency: currency || null,
      description: null,
      notes: null,
      ownerNotes: null,
      tags: [],
    }

    if (isEdit && existing) {
      updateCompany(existing.id, payload)
      navigate(`/companies/${existing.id}`)
    } else {
      const company = addCompany({
        ...payload,
        status: 'active',
        source: 'manual',
        archivedAt: null,
        defaultAssumptionPackId: null,
        metadata: {},
        baselineSegments: [],
      })
      navigate(`/companies/${company.id}`)
    }
  }

  function handleArchiveToggle() {
    if (!existing) return
    updateCompany(existing.id, existing.status === 'active'
      ? { status: 'archived', archivedAt: new Date().toISOString() }
      : { status: 'active', archivedAt: null })
    navigate(`/companies/${existing.id}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-2xl font-bold">{isEdit ? t('companies.edit') : t('companies.new')}</h1>
          {isArchived && <Badge variant="secondary">{t('companies.status.archived')}</Badge>}
        </div>
      </div>

      {isArchived && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {t('companies.messages.archivedNoEdit')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('companies.detail')}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="name">{t('companies.name')} *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} disabled={isArchived} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              {nameDuplicate && !errors.name && (
                <p className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-3" /> {t('companies.messages.nameDuplicate')}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="employees" className="flex items-center gap-1">
                {t('companies.totalEmployees')} * <InfoHint hintKey="totalEmployees" />
              </Label>
              <Input id="employees" type="number" min={1} value={totalEmployees} onChange={(e) => setTotalEmployees(e.target.value)} aria-invalid={!!errors.totalEmployees} disabled={isArchived} />
              {errors.totalEmployees && <p className="text-xs text-destructive">{errors.totalEmployees}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="coworkUsers" className="flex items-center gap-1">
                {t('companies.estimatedKnowledgeWorkers')} <InfoHint hintKey="estimatedKnowledgeWorkers" />
              </Label>
              <Input id="coworkUsers" type="number" min={0} value={coworkUsers} onChange={(e) => setCoworkUsers(e.target.value)} aria-invalid={!!errors.coworkUsers} disabled={isArchived} />
              {errors.coworkUsers && <p className="text-xs text-destructive">{errors.coworkUsers}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="industry">{t('companies.industry')}</Label>
              <Select value={industry} onValueChange={setIndustry} disabled={isArchived}>
                <SelectTrigger id="industry"><SelectValue placeholder={t('common.optional')} /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{t(`industries.${i}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="country">{t('companies.country')}</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} disabled={isArchived} />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="currency" className="flex items-center gap-1">
                {t('companies.currency')} <InfoHint hintKey="companyCurrency" />
              </Label>
              <Select value={currency} onValueChange={setCurrency} disabled={isArchived}>
                <SelectTrigger id="currency"><SelectValue placeholder={t('common.optional')} /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {isEdit && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={handleArchiveToggle}>
                  {isArchived ? <><ArchiveRestore className="size-4" />{t('common.restore')}</> : <><Archive className="size-4" />{t('common.archive')}</>}
                </Button>
                <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="size-4" /> {t('common.delete')}
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
            {!isArchived && <Button type="submit"><Save className="size-4" />{t('common.save')}</Button>}
          </div>
        </div>
      </form>

      {showDeleteDialog && existing && (
        <CompanyDeleteDialog company={existing} onClose={() => setShowDeleteDialog(false)} navigateAfter />
      )}
    </div>
  )
}
