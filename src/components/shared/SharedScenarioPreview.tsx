import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Link2, Save, Eye, X, AlertTriangle, Info } from 'lucide-react'
import { nanoid } from 'nanoid'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { decodeSharePayloadFromUrl } from '@/services/sharingService'
import { useAppStore } from '@/store/appStore'
import type { SharePayload } from '@/services/sharingService'

export function SharedScenarioPreview() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addCompany, addScenario, addSegment, upsertFundingPlan, preferences, hydrate } = useAppStore()

  const [payload, setPayload] = useState<SharePayload | null>(null)
  const [corrupted, setCorrupted] = useState(false)


  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('data=')) return

    const p = decodeSharePayloadFromUrl(hash)
    if (!p) {
      setCorrupted(true)
      return
    }
    setPayload(p)
  }, [])

  function clearHash() {
    // Remove the #data= from URL without reload
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  function handleDiscard() {
    clearHash()
    setPayload(null)
    setCorrupted(false)
  }

  function handleSave() {
    if (!payload) return
    const now = new Date().toISOString()
    const src = payload.scenario

    // Save company (if provided and not duplicate)
    let companyId = src.companyId
    if (payload.company) {
      const co = {
        ...payload.company,
        id: nanoid(),
        name: `${payload.company.name} (shared)`,
        source: 'shared' as const,
        status: 'active' as const,
        createdAt: now,
        updatedAt: now,
      }
      const saved = addCompany(co)
      companyId = saved.id
    }

    // Save scenario
    const scenario = addScenario({
      companyId,
      name: `${src.name} (shared)`,
      description: src.description,
      assumptionPackId: src.assumptionPackId,
      fundingPlanId: null,
      segments: [],
      status: 'draft',
      tags: src.tags,
    })

    // Save segments
    for (const seg of src.segments) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _ca, updatedAt: _ua, ...segData } = seg
      addSegment(scenario.id, {
        ...segData,
        companyId,
        scenarioId: scenario.id,
        source: 'imported' as const,
      })
    }

    // Save funding plan
    if (payload.fundingPlan) {
      upsertFundingPlan({ ...payload.fundingPlan, scenarioId: scenario.id })
    }

    hydrate()
    clearHash()
    setPayload(null)

    navigate(`/scenarios/${scenario.id}`)
  }

  if (!payload && !corrupted) return null

  // Corrupted
  if (corrupted) {
    return (
      <Dialog open onOpenChange={handleDiscard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              {t('share.payloadCorrupted')}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleDiscard}>{t('common.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const s = payload!.scenario
  const r = s.calculationResult
  const currency = payload!.company?.currency ?? preferences.currency

  return (
    <Dialog open onOpenChange={handleDiscard}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            {t('share.previewTitle')}
          </DialogTitle>
          <DialogDescription>
            {s.name} {payload!.company ? `— ${payload!.company.name}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          {/* Key KPIs */}
          {r && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: t('results.monthlyCredits'), val: formatNumber(Math.round(r.monthlyCredits.mid)) },
                { label: t('results.monthlyCost'), val: formatCurrency(r.monthlyCost.mid, currency), accent: true },
                { label: t('results.annualCost'), val: formatCurrency(r.annualCost.mid, currency), accent: true },
                { label: t('scenarios.segments'), val: s.segments.filter((sg) => sg.includeInCalculation).length },
              ].map(({ label, val, accent }) => (
                <div key={label} className={`rounded-lg border p-2 text-center ${accent ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}>
                  <p className="text-muted-foreground text-[10px]">{label}</p>
                  <p className={`font-bold ${accent ? 'text-primary' : ''}`}>{val}</p>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <Info className="size-3.5 mt-0.5 shrink-0" />
            {t('app.disclaimer')}
          </div>

          <Separator />

          {/* Segments preview */}
          {s.segments.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1.5">Segmenti ({s.segments.length})</p>
              <div className="flex flex-wrap gap-1">
                {s.segments.map((seg) => (
                  <Badge key={seg.id} variant="secondary" className="text-[10px]">
                    {seg.name} ({seg.headcount})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t('share.savedFromShare').split('.')[1] ?? ''} Scegli se salvare nel browser o visualizzare senza salvare.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" onClick={handleDiscard}>
            <X className="size-4" />
            {t('share.previewDiscard')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            clearHash()
            setPayload(null)
          }}>
            <Eye className="size-4" />
            {t('share.previewView')}
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="size-4" />
            {t('share.previewSave')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
