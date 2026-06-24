import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Archive, ArchiveRestore, Trash2, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

  // Form state
  const [name, setName] = useState(existing?.name ?? '')
  const [legalName, setLegalName] = useState(existing?.legalName ?? '')
  const [industry, setIndustry] = useState<string>(existing?.industry ?? '')
  const [country, setCountry] = useState(existing?.country ?? '')
  const [region, setRegion] = useState(existing?.region ?? '')
  const [totalEmployees, setTotalEmployees] = useState(
    String(existing?.totalEmployees ?? ''),
  )
  const [estimatedKW, setEstimatedKW] = useState(
    String(existing?.estimatedKnowledgeWorkers ?? ''),
  )
  const [currency, setCurrency] = useState(existing?.currency ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [ownerNotes, setOwnerNotes] = useState(existing?.ownerNotes ?? '')
  const [tagsInput, setTagsInput] = useState((existing?.tags ?? []).join(', '))

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nameDuplicate, setNameDuplicate] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Check for duplicate name (non-blocking)
  useEffect(() => {
    const trimmed = name.trim()
    if (!trimmed) { setNameDuplicate(false); return }
    const dup = companies.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase() && c.id !== existing?.id,
    )
    setNameDuplicate(dup)
  }, [name, companies, existing?.id])

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('errors.companyNameRequired')
    else if (!name.trim().replace(/\s/g, '')) e.name = t('errors.companyNameRequired')
    const emp = Number(totalEmployees)
    if (!totalEmployees || isNaN(emp) || emp <= 0) e.totalEmployees = t('errors.employeesRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function parseTags(raw: string): string[] {
    return raw.split(',').map((t) => t.trim()).filter(Boolean)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      legalName: legalName.trim() || null,
      industry: (industry as Industry) || null,
      country: country.trim() || null,
      region: region.trim() || null,
      totalEmployees: Number(totalEmployees),
      estimatedKnowledgeWorkers: estimatedKW ? Number(estimatedKW) : null,
      currency: currency || null,
      description: description.trim() || null,
      notes: notes.trim() || null,
      ownerNotes: ownerNotes.trim() || null,
      tags: parseTags(tagsInput),
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
      })
      navigate(`/companies/${company.id}`)
    }
  }

  function handleArchiveToggle() {
    if (!existing) return
    if (existing.status === 'active') {
      updateCompany(existing.id, { status: 'archived', archivedAt: new Date().toISOString() })
    } else {
      updateCompany(existing.id, { status: 'active', archivedAt: null })
    }
    navigate(`/companies/${existing.id}`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">
            {isEdit ? t('companies.edit') : t('companies.new')}
          </h1>
          {isArchived && (
            <Badge variant="secondary">{t('companies.status.archived')}</Badge>
          )}
        </div>
      </div>

      {/* Archived warning */}
      {isArchived && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          {t('companies.messages.archivedNoEdit')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Required fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('common.required')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">
                {t('companies.name')} *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                disabled={isArchived}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
              {nameDuplicate && !errors.name && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="size-3" />
                  {t('companies.messages.nameDuplicate')}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="employees" className="flex items-center gap-1">
                {t('companies.totalEmployees')} *
                <InfoHint hintKey="totalEmployees" />
              </Label>
              <Input
                id="employees"
                type="number"
                min={1}
                value={totalEmployees}
                onChange={(e) => setTotalEmployees(e.target.value)}
                aria-invalid={!!errors.totalEmployees}
                disabled={isArchived}
              />
              {errors.totalEmployees && (
                <p className="text-xs text-destructive">{errors.totalEmployees}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Company profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('companies.detail')}</CardTitle>
            <CardDescription className="text-xs">{t('common.optional')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="legalName" className="flex items-center gap-1">
                {t('companies.legalName')}
                <InfoHint hintKey="legalName" />
              </Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                disabled={isArchived}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="industry">{t('companies.industry')}</Label>
                <Select value={industry} onValueChange={setIndustry} disabled={isArchived}>
                  <SelectTrigger id="industry">
                    <SelectValue placeholder={t('common.optional')} />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((i) => (
                      <SelectItem key={i} value={i}>{t(`industries.${i}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="country">{t('companies.country')}</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isArchived}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="region" className="flex items-center gap-1">
                  {t('companies.region')}
                  <InfoHint hintKey="region" />
                </Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  disabled={isArchived}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="kw" className="flex items-center gap-1">
                  {t('companies.estimatedKnowledgeWorkers')}
                  <InfoHint hintKey="estimatedKnowledgeWorkers" />
                </Label>
                <Input
                  id="kw"
                  type="number"
                  min={0}
                  value={estimatedKW}
                  onChange={(e) => setEstimatedKW(e.target.value)}
                  disabled={isArchived}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="description">{t('companies.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={isArchived}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="currency" className="flex items-center gap-1">
                  {t('companies.currency')}
                  <InfoHint hintKey="companyCurrency" />
                </Label>
                <Select value={currency} onValueChange={setCurrency} disabled={isArchived}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder={t('common.optional')} />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tags" className="flex items-center gap-1">
                  {t('companies.tags')}
                  <InfoHint hintKey="companyTags" />
                </Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  disabled={isArchived}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internal notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Note</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="notes">{t('companies.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                disabled={isArchived}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ownerNotes">{t('companies.ownerNotes')}</Label>
              <Textarea
                id="ownerNotes"
                value={ownerNotes}
                onChange={(e) => setOwnerNotes(e.target.value)}
                rows={2}
                disabled={isArchived}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            {isEdit && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleArchiveToggle}
                >
                  {isArchived ? (
                    <><ArchiveRestore className="size-4" />{t('common.restore')}</>
                  ) : (
                    <><Archive className="size-4" />{t('common.archive')}</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="size-4" />
                  {t('common.delete')}
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
            {!isArchived && (
              <Button type="submit">
                <Save className="size-4" />
                {t('common.save')}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Delete dialog */}
      {showDeleteDialog && existing && (
        <CompanyDeleteDialog
          company={existing}
          onClose={() => setShowDeleteDialog(false)}
          navigateAfter
        />
      )}
    </div>
  )
}
