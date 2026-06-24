import { Link } from 'react-router-dom'
import { AlertTriangle, Info, XCircle, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { DashboardAlert } from './useDashboardSummary'

interface Props {
  alerts: DashboardAlert[]
}

const SEVERITY_STYLES = {
  info: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
  warning: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20',
  critical: 'border-destructive/40 bg-destructive/5',
}

const SEVERITY_TEXT = {
  info: 'text-blue-700 dark:text-blue-300',
  warning: 'text-amber-700 dark:text-amber-400',
  critical: 'text-destructive',
}

const SEVERITY_ICON = {
  info: Info,
  warning: AlertTriangle,
  critical: XCircle,
}

export function DashboardAlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) return null

  // Sort: critical first, then warning, then info
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })

  return (
    <Card className="border-amber-200/60 dark:border-amber-800/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          Avvisi e segnalazioni
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {alerts.length} avvis{alerts.length === 1 ? 'o' : 'i'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sorted.map((alert) => {
          const Icon = SEVERITY_ICON[alert.severity]
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-lg border p-3 ${SEVERITY_STYLES[alert.severity]}`}
            >
              <Icon className={`size-4 shrink-0 mt-0.5 ${SEVERITY_TEXT[alert.severity]}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${SEVERITY_TEXT[alert.severity]}`}>
                  {alert.message}
                </p>
                {alert.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                )}
              </div>
              {alert.actionLabel && alert.actionPath && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`shrink-0 h-7 text-xs ${SEVERITY_TEXT[alert.severity]} hover:bg-transparent`}
                  asChild
                >
                  <Link to={alert.actionPath}>
                    {alert.actionLabel}
                    <ChevronRight className="size-3 ml-0.5" />
                  </Link>
                </Button>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
