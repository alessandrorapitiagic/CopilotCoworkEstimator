import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import type { Industry } from '@/types/domain'

const INDUSTRIES: Industry[] = [
  'technology', 'finance', 'healthcare', 'retail', 'manufacturing',
  'professional_services', 'education', 'government', 'energy', 'media', 'other',
]

export default function CompanyForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const { companies, addCompany, updateCompany } = useAppStore()

  const existing = id ? companies.find((c) => c.id === id) : null

  const [name, setName] = useState(existing?.name ?? '')
  const [industry, setIndustry] = useState<Industry | ''>(existing?.industry ?? '')
  const [country, setCountry] = useState(existing?.country ?? '')
  const [totalEmployees, setTotalEmployees] = useState(String(existing?.totalEmployees ?? ''))
  const [description, setDescription] = useState(existing?.description ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('errors.companyNameRequired')
    const emp = Number(totalEmployees)
    if (!totalEmployees || isNaN(emp) || emp <= 0) e.totalEmployees = t('errors.employeesRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (existing) {
      updateCompany(existing.id, {
        name: name.trim(),
        industry: (industry as Industry) || null,
        country: country.trim() || null,
        totalEmployees: Number(totalEmployees),
        description: description.trim() || null,
        notes: notes.trim() || null,
      })
      navigate(`/companies/${existing.id}`)
    } else {
      const company = addCompany({
        name: name.trim(),
        industry: (industry as Industry) || null,
        country: country.trim() || null,
        totalEmployees: Number(totalEmployees),
        description: description.trim() || null,
        notes: notes.trim() || null,
        status: 'active',
        tags: [],
      })
      navigate(`/companies/${company.id}`)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {existing ? t('common.edit') : t('companies.new')}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('companies.detail')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('companies.name')} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="industry">{t('companies.industry')}</Label>
                <Select value={industry} onValueChange={(v) => setIndustry(v as Industry)}>
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

              <div className="grid gap-2">
                <Label htmlFor="country">{t('companies.country')}</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={t('common.optional')}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="employees">{t('companies.totalEmployees')} *</Label>
              <Input
                id="employees"
                type="number"
                min={1}
                value={totalEmployees}
                onChange={(e) => setTotalEmployees(e.target.value)}
                aria-invalid={!!errors.totalEmployees}
              />
              {errors.totalEmployees && (
                <p className="text-xs text-destructive">{errors.totalEmployees}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">{t('companies.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t('companies.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                <Save className="size-4" />
                {t('common.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
