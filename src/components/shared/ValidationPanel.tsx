import { useTranslation } from 'react-i18next'
import { AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { ValidationResult } from '@/services/validationService'

interface Props {
  result: ValidationResult
  className?: string
  /** If provided, show a link to the scenario for navigation from dashboard */
  scenarioId?: string
  compact?: boolean
}

const SEV_CONFIG = {
  error: {
    icon: XCircle,
    rowCls: 'bg-destructive/5 border-destructive/20 text-destructive',
    iconCls: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    rowCls: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400',
    iconCls: 'text-amber-500',
  },
  info: {
    icon: Info,
    rowCls: 'bg-muted/50 border-muted text-muted-foreground',
    iconCls: 'text-muted-foreground',
  },
} as const

export function ValidationPanel({ result, className, scenarioId, compact }: Props) {
  const { t } = useTranslation()

  const visible = [...result.errors, ...result.warnings, ...(compact ? [] : result.infos)]
  if (visible.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {visible.slice(0, compact ? 5 : undefined).map((item, i) => {
        const { icon: Icon, rowCls, iconCls } = SEV_CONFIG[item.severity]
        return (
          <div
            key={i}
            className={cn('flex items-start gap-2 rounded-lg border p-2.5 text-xs', rowCls)}
          >
            <Icon className={cn('size-3.5 mt-0.5 shrink-0', iconCls)} />
            <div className="flex-1 min-w-0">
              <p className="leading-relaxed">{item.message}</p>
              {item.fix && (
                <p className="mt-0.5 font-medium opacity-75">→ {item.fix}</p>
              )}
            </div>
            {scenarioId && item.severity === 'error' && (
              <Link to={`/scenarios/${scenarioId}`} className="shrink-0 flex items-center gap-0.5 font-medium hover:underline">
                {t('compare.metrics.segments')}
                <ChevronRight className="size-3" />
              </Link>
            )}
          </div>
        )
      })}
      {compact && visible.length > 5 && (
        <p className="text-xs text-muted-foreground text-right">+{visible.length - 5} altri</p>
      )}
    </div>
  )
}

/** Summary badge showing error/warning/info counts */
export function ValidationSummaryBadge({ result, className }: { result: ValidationResult; className?: string }) {
  const counts = [
    { count: result.errors.length, cls: 'text-destructive' },
    { count: result.warnings.length, cls: 'text-amber-600 dark:text-amber-400' },
  ].filter((c) => c.count > 0)

  if (counts.length === 0) return null

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs', className)}>
      {result.errors.length > 0 && (
        <span className="text-destructive font-bold">{result.errors.length}✕</span>
      )}
      {result.warnings.length > 0 && (
        <span className="text-amber-600 dark:text-amber-400 font-bold">{result.warnings.length}⚠</span>
      )}
    </span>
  )
}
