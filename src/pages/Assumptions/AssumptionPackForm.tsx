import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { InfoHint } from '@/components/shared/InfoHint'
import type { AssumptionPack } from '@/types/domain'

interface Props {
  pack?: AssumptionPack | null
  onSave: (data: Omit<AssumptionPack, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
  onClose: () => void
}

type BandKey = 'light' | 'medium' | 'heavy'

export function AssumptionPackForm({ pack, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const isNew = !pack

  // Basic info
  const [name, setName] = useState(pack?.name ?? '')
  const [version, setVersion] = useState(pack?.version ?? '1.0.0')
  const [sourceDate, setSourceDate] = useState(pack?.sourceDate ?? new Date().toISOString().slice(0, 10))
  const [sourceName, setSourceName] = useState(pack?.sourceName ?? '')
  const [description, setDescription] = useState(pack?.description ?? '')
  const [disclaimer, setDisclaimer] = useState(pack?.disclaimer ?? 'Queste sono stime indicative e non rappresentano un prezzo ufficiale o contrattuale Microsoft.')
  const [notes, setNotes] = useState(pack?.notes ?? '')

  // Credit bands
  const [bands, setBands] = useState({
    lightMin: pack?.creditBands.lightMin ?? 1,
    lightMid: pack?.creditBands.lightMid ?? 5,
    lightMax: pack?.creditBands.lightMax ?? 10,
    mediumMin: pack?.creditBands.mediumMin ?? 11,
    mediumMid: pack?.creditBands.mediumMid ?? 20,
    mediumMax: pack?.creditBands.mediumMax ?? 40,
    heavyMin: pack?.creditBands.heavyMin ?? 41,
    heavyMid: pack?.creditBands.heavyMid ?? 75,
    heavyMax: pack?.creditBands.heavyMax ?? 200,
  })

  // PAYG price
  const [pricePerCredit, setPricePerCredit] = useState(String(pack?.fundingDefaults.paygPricePerCredit ?? 0.01))
  const [currency, setCurrency] = useState(pack?.fundingDefaults.currency ?? 'EUR')

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Il nome è obbligatorio'
    if (!version.trim()) e.version = 'La versione è obbligatoria'
    if (!sourceDate) e.sourceDate = 'La data è obbligatoria'
    // Check ranges
    const b = bands
    if (b.lightMin > b.lightMid || b.lightMid > b.lightMax) e.light = 'Range light non valido: min ≤ mid ≤ max'
    if (b.mediumMin > b.mediumMid || b.mediumMid > b.mediumMax) e.medium = 'Range medium non valido: min ≤ mid ≤ max'
    if (b.heavyMin > b.heavyMid || b.heavyMid > b.heavyMax) e.heavy = 'Range heavy non valido: min ≤ mid ≤ max'
    const allVals = Object.values(b) as number[]
    if (allVals.some((v) => v < 0)) e.negative = 'I valori di credito non possono essere negativi'
    const price = Number(pricePerCredit)
    if (isNaN(price) || price < 0) e.price = 'Il prezzo non può essere negativo'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const existing = pack
    onSave({
      ...(existing?.id ? { id: existing.id } : {}),
      name: name.trim(),
      version: version.trim(),
      source: sourceName.trim() || null,
      sourceDate,
      sourceName: sourceName.trim() || null,
      sourceUrl: null,
      description: description.trim() || null,
      disclaimer: disclaimer.trim() || null,
      notes: notes.trim() || null,
      creditBands: bands,
      modelFactors: existing?.modelFactors ?? {
        'model-auto': 1.0,
        'model-claude-sonnet': 1.2,
        'model-claude-opus': 2.0,
        'model-sonnet-opus-advisor': 1.6,
        'model-gpt5-frontier': 2.5,
        'model-imagen2': 1.8,
        'model-cowork1': 1.0,
      },
      factors: existing?.factors ?? {
        contextLow: 1.0, contextMedium: 1.3, contextHigh: 1.8,
        toolsNone: 1.0, toolsLight: 1.2, toolsHeavy: 1.6,
        runtimeFast: 1.0, runtimeMedium: 1.3, runtimeSlow: 1.8,
        browserMultiplier: 1.4, imageMultiplier: 1.5,
      },
      fundingDefaults: {
        paygPricePerCredit: Number(pricePerCredit),
        currency,
      },
      isSystemDefault: false,
      isCurrentDefault: false,
      isEditable: true,
      isDeprecated: false,
      deprecatedReason: null,
      sourceType: 'custom',
      sourceGuideName: existing?.sourceGuideName ?? 'Custom planning assumptions',
      sourceGuideVersion: existing?.sourceGuideVersion ?? version.trim(),
      heavyDefaults: existing?.heavyDefaults ?? {
        openEnded: false,
        defaultMax: bands.heavyMax,
        planningCap: bands.heavyMax,
        notes: null,
      },
      metadata: {},
    })
  }

  const bandRows: { key: BandKey; label: string }[] = [
    { key: 'light', label: 'Light' },
    { key: 'medium', label: 'Medium' },
    { key: 'heavy', label: 'Heavy' },
  ]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Nuovo Assumption Pack' : `Modifica: ${pack?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Basic info */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>Versione *</Label>
              <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" aria-invalid={!!errors.version} />
              {errors.version && <p className="text-xs text-destructive">{errors.version}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label>Data fonte *</Label>
              <Input type="date" value={sourceDate} onChange={(e) => setSourceDate(e.target.value)} aria-invalid={!!errors.sourceDate} />
              {errors.sourceDate && <p className="text-xs text-destructive">{errors.sourceDate}</p>}
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Nome fonte</Label>
              <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="es. Microsoft documentation" />
            </div>
          </div>

          {/* Credit Bands */}
          <Separator />
          <div>
            <p className="text-sm font-semibold mb-2">
              Credit Bands
              <InfoHint hintKey="creditBands" />
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left p-1">Intensità</th>
                  <th className="text-right p-1">Min</th>
                  <th className="text-right p-1">Mid</th>
                  <th className="text-right p-1">Max</th>
                </tr>
              </thead>
              <tbody>
                {bandRows.map(({ key, label }) => (
                  <tr key={key} className={errors[key] ? 'bg-destructive/5' : ''}>
                    <td className="p-1 font-medium">{label}</td>
                    {(['Min', 'Mid', 'Max'] as const).map((col) => {
                      const field = `${key}${col}` as keyof typeof bands
                      return (
                        <td key={col} className="p-1">
                          <Input
                            type="number"
                            min={0}
                            value={bands[field]}
                            onChange={(e) => setBands((b) => ({ ...b, [field]: Number(e.target.value) || 0 }))}
                            className="h-7 text-xs text-right w-20 ml-auto"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.entries(errors).filter(([k]) => ['light', 'medium', 'heavy', 'negative'].includes(k)).map(([k, v]) => (
              <p key={k} className="text-xs text-destructive mt-1 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {v}
              </p>
            ))}
          </div>

          {/* Funding defaults */}
          <Separator />
          <div>
            <p className="text-sm font-semibold mb-2">Funding Defaults</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="flex items-center gap-1">
                  Prezzo per credito (PAYG)
                  <InfoHint hintKey="pricePerCredit" />
                </Label>
                <Input type="number" step={0.001} min={0} value={pricePerCredit}
                  onChange={(e) => setPricePerCredit(e.target.value)}
                  aria-invalid={!!errors.price} />
                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
              </div>
              <div className="grid gap-1.5">
                <Label>Valuta</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="EUR" />
              </div>
            </div>
          </div>

          {/* Description + disclaimer + notes */}
          <Separator />
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Descrizione</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Disclaimer</Label>
              <Textarea value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} rows={2} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Note</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
