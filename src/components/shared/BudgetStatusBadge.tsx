import { useTranslation } from 'react-i18next'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { CalculationResult, FundingPlan } from '@/types/domain'

export type BudgetStatus = 'ok' | 'warning' | 'critical' | 'not_configured' | 'not_available'

export function computeBudgetStatus(
  result: CalculationResult | null,
  funding: FundingPlan | null,
): BudgetStatus {
  if (!result) return 'not_available'
  if (!funding?.budgetMonthly) return 'not_configured'
  const budget = funding.budgetMonthly
  if (result.monthlyCost.min > budget) return 'critical'
  if (result.monthlyCost.max > budget) return 'warning'
  return 'ok'
}

interface Props {
  result: CalculationResult | null
  funding: FundingPlan | null
  size?: 'sm' | 'md'
  className?: string
}

export function BudgetStatusBadge({ result, funding, size = 'sm', className }: Props) {
  const { t } = useTranslation()
  const status = computeBudgetStatus(result, funding)

  if (status === 'not_configured' || status === 'not_available') return null

  const config = {
    ok: {
      icon: CheckCircle,
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      label: t('funding.budgetOk'),
      tooltip: 'Il costo stimato è entro il budget mensile.',
    },
    warning: {
      icon: AlertTriangle,
      cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      label: t('funding.budgetWarning'),
      tooltip: 'Il costo massimo supera il budget. Il midpoint è entro budget.',
    },
    critical: {
      icon: XCircle,
      cls: 'bg-destructive/10 text-destructive border-destructive/30',
      label: t('funding.budgetCritical'),
      tooltip: 'Anche il costo minimo supera il budget mensile.',
    },
  } as const

  const { icon: Icon, cls, label, tooltip } = config[status as keyof typeof config]

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium',
            size === 'sm' ? 'text-[10px]' : 'text-xs',
            cls,
            className,
          )}
        >
          <Icon className={size === 'sm' ? 'size-2.5' : 'size-3.5'} />
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
