import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { WorkforceSegment, SegmentCategoryType } from '@/types/domain'

interface TemplateSegmentDef {
  name: string
  category: SegmentCategoryType
  enabledPct: number
  activePct: number
  profileName: 'Light' | 'Medium' | 'Heavy'
}

export const TEMPLATES: Record<string, { nameKey: string; descKey: string; segments: TemplateSegmentDef[] }> = {
  basic: {
    nameKey: 'segments.templates.basic',
    descKey: 'segments.templates.basicDesc',
    segments: [
      { name: 'Manager', category: 'manager', enabledPct: 80, activePct: 70, profileName: 'Heavy' },
      { name: 'White Collar', category: 'whiteCollar', enabledPct: 60, activePct: 50, profileName: 'Medium' },
      { name: 'Blue Collar', category: 'blueCollar', enabledPct: 20, activePct: 15, profileName: 'Light' },
    ],
  },
  office: {
    nameKey: 'segments.templates.office',
    descKey: 'segments.templates.officeDesc',
    segments: [
      { name: 'Executives', category: 'manager', enabledPct: 100, activePct: 80, profileName: 'Heavy' },
      { name: 'Sales', category: 'sales', enabledPct: 80, activePct: 65, profileName: 'Heavy' },
      { name: 'Finance', category: 'finance', enabledPct: 75, activePct: 60, profileName: 'Medium' },
      { name: 'HR', category: 'hr', enabledPct: 70, activePct: 55, profileName: 'Medium' },
      { name: 'IT', category: 'it', enabledPct: 100, activePct: 85, profileName: 'Heavy' },
      { name: 'Operations', category: 'operations', enabledPct: 40, activePct: 30, profileName: 'Light' },
    ],
  },
  manufacturing: {
    nameKey: 'segments.templates.manufacturing',
    descKey: 'segments.templates.manufacturingDesc',
    segments: [
      { name: 'Executives', category: 'manager', enabledPct: 100, activePct: 80, profileName: 'Heavy' },
      { name: 'Office Staff', category: 'whiteCollar', enabledPct: 70, activePct: 55, profileName: 'Medium' },
      { name: 'Plant Supervisors', category: 'operations', enabledPct: 50, activePct: 40, profileName: 'Medium' },
      { name: 'Field Workers', category: 'fieldWorkers', enabledPct: 25, activePct: 20, profileName: 'Light' },
      { name: 'Blue Collar', category: 'blueCollar', enabledPct: 15, activePct: 10, profileName: 'Light' },
    ],
  },
  service: {
    nameKey: 'segments.templates.service',
    descKey: 'segments.templates.serviceDesc',
    segments: [
      { name: 'Management', category: 'manager', enabledPct: 90, activePct: 75, profileName: 'Heavy' },
      { name: 'Customer Care', category: 'customerCare', enabledPct: 70, activePct: 60, profileName: 'Medium' },
      { name: 'Sales', category: 'sales', enabledPct: 80, activePct: 65, profileName: 'Heavy' },
      { name: 'Operations', category: 'operations', enabledPct: 40, activePct: 30, profileName: 'Light' },
      { name: 'Back Office', category: 'whiteCollar', enabledPct: 65, activePct: 50, profileName: 'Medium' },
    ],
  },
}

interface Props {
  profiles: { id: string; name: string }[]
  models: { id: string }[]
  companyId: string
  scenarioId: string | null
  totalEmployees: number
  onApply: (segments: Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'>[]) => void
  onClose: () => void
}

export function SegmentTemplateSelector({ profiles, companyId, scenarioId, totalEmployees, onApply, onClose }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string>('basic')

  const defaultModelId = 'model-auto'
  const getProfileId = (name: string) =>
    profiles.find((p) => p.name.toLowerCase() === name.toLowerCase())?.id ?? profiles[0]?.id ?? ''

  function handleApply() {
    const tpl = TEMPLATES[selected]
    if (!tpl) return
    const segs = tpl.segments.map((def): Omit<WorkforceSegment, 'id' | 'createdAt' | 'updatedAt'> => ({
      companyId,
      scenarioId,
      name: def.name,
      description: null,
      categoryType: def.category,
      headcount: Math.round(totalEmployees / tpl.segments.length),
      enabledPercentage: def.enabledPct,
      activeUsagePercentage: def.activePct,
      usageProfileId: getProfileId(def.profileName),
      preferredModelId: defaultModelId,
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
    }))
    onApply(segs)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="size-4" />
            {t('segments.templates.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {Object.entries(TEMPLATES).map(([key, tpl]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={cn(
                'flex flex-col gap-0.5 rounded-lg border p-3 text-left text-sm transition-colors',
                selected === key ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30',
              )}
            >
              <span className="font-medium">{t(tpl.nameKey)}</span>
              <span className="text-xs text-muted-foreground">
                {t(tpl.descKey)} · {tpl.segments.length} segmenti
              </span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleApply}>
            <Layers className="size-4" />
            {t('common.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
