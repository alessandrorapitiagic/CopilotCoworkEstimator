import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  exportScenarioSummaryCsv,
  exportSegmentBreakdownCsv,
  exportModelBreakdownCsv,
} from '@/services/exportService'
import type { Scenario, Company, AssumptionPack } from '@/types/domain'

interface Props {
  scenario: Scenario
  company: Company | undefined
  pack: AssumptionPack | undefined
  currency: string
}

export function CsvExportMenu({ scenario, company, pack, currency }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!scenario.calculationResult) return null

  const options = [
    {
      key: 'scenario_summary',
      label: t('export.csvTypes.scenario_summary'),
      fn: () => exportScenarioSummaryCsv(scenario, company, pack, currency),
    },
    {
      key: 'segment_breakdown',
      label: t('export.csvTypes.segment_breakdown'),
      fn: () => exportSegmentBreakdownCsv(scenario, company, pack, currency),
    },
    {
      key: 'model_breakdown',
      label: t('export.csvTypes.model_breakdown'),
      fn: () => exportModelBreakdownCsv(scenario, company, currency),
    },
  ]

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Download className="size-4" />
        {t('export.exportCsvLabel')}
        <ChevronDown className="size-3 ml-0.5" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-52 rounded-lg border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
            {options.map(({ key, label, fn }) => (
              <button
                key={key}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
                onClick={() => { fn(); setOpen(false) }}
              >
                <Download className="size-3.5 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
