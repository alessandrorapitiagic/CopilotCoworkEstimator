import { DatabaseZap, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { StorageStatus } from './useDashboardSummary'

interface Props {
  status: StorageStatus
}

export function StorageStatusBadge({ status }: Props) {
  if (!status.available) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
            <AlertTriangle className="size-3" />
            Storage non disponibile
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Il localStorage non è accessibile in questo browser o contesto (es. modalità privata con restrizioni).
        </TooltipContent>
      </Tooltip>
    )
  }

  if (status.isNearLimit) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="size-3" />
            {status.approximateUsageKb} KB — quasi pieno
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Lo spazio locale è quasi esaurito. Esporta un backup JSON per sicurezza.
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          <DatabaseZap className="size-3" />
          {status.approximateUsageKb} KB
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Spazio locale utilizzato da tutti i dati salvati.
        {status.lastExportDate
          ? ` Ultimo export: ${new Date(status.lastExportDate).toLocaleDateString()}`
          : ' Nessun export ancora effettuato.'}
      </TooltipContent>
    </Tooltip>
  )
}
