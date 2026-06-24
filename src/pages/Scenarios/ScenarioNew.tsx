import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { InfoHint } from '@/components/shared/InfoHint'
import { formatNumber } from '@/lib/utils'

const STEPS = ['company', 'details', 'segments', 'review'] as const
type Step = (typeof STEPS)[number]

export default function ScenarioNew() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCompanyId = searchParams.get('companyId') ?? ''

  const { companies, assumptionPacks, usageProfiles, modelAssumptions, addScenario, addSegment } = useAppStore()

  const [step, setStep] = useState<Step>(preselectedCompanyId ? 'details' : 'company')
  const [companyId, setCompanyId] = useState(preselectedCompanyId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [packId, setPackId] = useState(assumptionPacks.find((p) => p.isSystemDefault)?.id ?? '')
  const [segments, setSegments] = useState<{ id: string; name: string; headcount: string; enabledPct: string; activePct: string; profileId: string; modelId: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const stepIndex = STEPS.indexOf(step)
  const company = companies.find((c) => c.id === companyId)
  const defaultModelId = modelAssumptions[0]?.id ?? ''

  function addSegmentRow() {
    setSegments((prev) => [
      ...prev,
      {
        id: nanoid(),
        name: '',
        headcount: '100',
        enabledPct: '60',
        activePct: '50',
        profileId: usageProfiles.find((p) => p.isSystemDefault && p.name === 'Medium')?.id ?? usageProfiles[0]?.id ?? '',
        modelId: defaultModelId,
      },
    ])
  }

  function removeSegmentRow(id: string) {
    setSegments((prev) => prev.filter((s) => s.id !== id))
  }

  function updateSegmentField(id: string, field: string, value: string) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  function handleFinish() {
    const scenario = addScenario({
      companyId,
      name: name.trim(),
      description: description.trim() || null,
      assumptionPackId: packId,
      fundingPlanId: null,
      segments: [],
      status: 'draft',
      tags: [],
    })

    for (const seg of segments) {
      if (!seg.name.trim()) continue
      addSegment(scenario.id, {
        companyId,
        scenarioId: scenario.id,
        name: seg.name.trim(),
        description: null,
        categoryType: 'custom',
        headcount: Number(seg.headcount) || 0,
        enabledPercentage: Number(seg.enabledPct) || 0,
        activeUsagePercentage: Number(seg.activePct) || 0,
        usageProfileId: seg.profileId,
        preferredModelId: seg.modelId,
        taskMixMode: 'profile',
        customTaskMix: null,
        taskMix: [],
        contextFactorOverride: null,
        toolsFactorOverride: null,
        runtimeFactorOverride: null,
        browserFactorOverride: null,
        imageFactorOverride: null,
        rolloutPhase: null,
        includeInCalculation: true,
        notes: null,
        source: 'manual',
        metadata: {},
      })
    }

    navigate(`/scenarios/${scenario.id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('scenarios.new')}</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors
                ${i < stepIndex ? 'bg-primary text-primary-foreground' : i === stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {i < stepIndex ? <Check className="size-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${i < stepIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Company */}
      {step === 'company' && (
        <Card>
          <CardHeader><CardTitle>{t('scenarios.company')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>{t('scenarios.company')}</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona azienda..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.filter((c) => c.status === 'active').map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (!companyId) { setErrors({ company: t('common.required') }); return }
                  setErrors({})
                  setStep('details')
                }}
              >
                {t('common.next')} <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Details */}
      {step === 'details' && (
        <Card>
          <CardHeader><CardTitle>{t('scenarios.name')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label>{t('scenarios.name')} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-2">
              <Label>{t('scenarios.description')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center gap-1">
                {t('scenarios.assumptionPack')}
                <InfoHint hintKey="assumptionPack" />
              </Label>
              <Select value={packId} onValueChange={setPackId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assumptionPacks.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} v{p.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('company')}>
                <ArrowLeft className="size-4" /> {t('common.back')}
              </Button>
              <Button onClick={() => {
                if (!name.trim()) { setErrors({ name: t('errors.scenarioNameRequired') }); return }
                setErrors({})
                setStep('segments')
              }}>
                {t('common.next')} <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Segments */}
      {step === 'segments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('scenarios.segments')}</CardTitle>
              <Button size="sm" variant="outline" onClick={addSegmentRow}>
                + {t('scenarios.addSegment')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {segments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aggiungi almeno un segmento per calcolare i crediti.
              </p>
            )}
            {segments.map((seg) => (
              <div key={seg.id} className="grid gap-2 rounded-lg border p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-1">
                    <Label className="text-xs">{t('segments.name')}</Label>
                    <Input
                      value={seg.name}
                      onChange={(e) => updateSegmentField(seg.id, 'name', e.target.value)}
                      placeholder="es. Sales"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t('segments.headcount')}
                      <InfoHint hintKey="headcount" />
                    </Label>
                    <Input
                      type="number"
                      value={seg.headcount}
                      onChange={(e) => updateSegmentField(seg.id, 'headcount', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t('segments.enabledPct')} %
                      <InfoHint hintKey="enabledPct" />
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={seg.enabledPct}
                      onChange={(e) => updateSegmentField(seg.id, 'enabledPct', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t('segments.activePct')} %
                      <InfoHint hintKey="activePct" />
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={seg.activePct}
                      onChange={(e) => updateSegmentField(seg.id, 'activePct', e.target.value)}
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t('segments.usageProfile')}
                      <InfoHint hintKey="usageProfile" />
                    </Label>
                    <Select value={seg.profileId} onValueChange={(v) => updateSegmentField(seg.id, 'profileId', v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {usageProfiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs flex items-center gap-1">
                      {t('segments.preferredModel')}
                      <InfoHint hintKey="preferredModel" />
                    </Label>
                    <Select value={seg.modelId} onValueChange={(v) => updateSegmentField(seg.id, 'modelId', v)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelAssumptions.filter((m) => m.isEnabled).map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeSegmentRow(seg.id)}
                  >
                    Rimuovi
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between mt-2">
              <Button variant="outline" onClick={() => setStep('details')}>
                <ArrowLeft className="size-4" /> {t('common.back')}
              </Button>
              <Button onClick={() => setStep('review')}>
                {t('common.next')} <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <Card>
          <CardHeader><CardTitle>{t('common.confirm')}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('scenarios.company')}</span>
                <span className="font-medium">{company?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('scenarios.name')}</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('scenarios.assumptionPack')}</span>
                <span className="font-medium">
                  {assumptionPacks.find((p) => p.id === packId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segmenti</span>
                <span className="font-medium">{segments.filter((s) => s.name.trim()).length}</span>
              </div>
              {segments.filter((s) => s.name.trim()).map((seg) => (
                <div key={seg.id} className="ml-4 flex justify-between text-xs text-muted-foreground">
                  <span>{seg.name || 'unnamed'}</span>
                  <Badge variant="secondary">
                    {formatNumber(Number(seg.headcount))} persone
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('segments')}>
                <ArrowLeft className="size-4" /> {t('common.back')}
              </Button>
              <Button onClick={handleFinish}>
                <Check className="size-4" /> {t('common.finish')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
