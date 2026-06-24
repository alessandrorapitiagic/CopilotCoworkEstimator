import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Target,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { generateValueInsights, type InsightCategory } from '@/lib/valueInsights'
import type { Company, FundingPlan, Scenario, UsageProfile } from '@/types/domain'

interface Props {
  company: Company | null
  scenario: Scenario
  funding: FundingPlan | null
  usageProfiles: UsageProfile[]
}

const CATEGORY_CONFIG: Record<InsightCategory, { icon: React.ElementType; badge: string }> = {
  executive: { icon: Sparkles, badge: 'Executive' },
  valueDriver: { icon: Target, badge: 'Value driver' },
  segment: { icon: BriefcaseBusiness, badge: 'Segmento' },
  activity: { icon: CheckCircle, badge: 'Attività' },
  talkingPoint: { icon: MessageSquareText, badge: 'Talking point' },
  risk: { icon: AlertTriangle, badge: 'Caveat' },
  optimization: { icon: Lightbulb, badge: 'Ottimizzazione' },
}

export function ValueInsightsPanel({ company, scenario, funding, usageProfiles }: Props) {
  const { t } = useTranslation()
  const usageLevelsByProfileId = useMemo(
    () => Object.fromEntries(usageProfiles.map((p) => [p.id, p.usageLevel])),
    [usageProfiles],
  )
  const insights = useMemo(
    () => generateValueInsights({ company, scenario, funding, usageLevelsByProfileId }),
    [company, funding, scenario, usageLevelsByProfileId],
  )

  if (insights.length === 0) return null

  return (
    <Card data-tour="value-insights" className="border-primary/20 bg-primary/3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="size-4 text-primary" />
          {t('insights.title')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('insights.subtitle')}</p>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {insights.map((insight) => {
          const { icon: Icon, badge } = CATEGORY_CONFIG[insight.category]
          return (
            <div key={insight.templateId} className="rounded-xl border bg-background/60 p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">{t(insight.titleKey)}</p>
                </div>
                <Badge variant={insight.category === 'risk' ? 'warning' : 'secondary'} className="text-[10px]">
                  {badge}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(insight.bodyKey)}</p>
              {insight.reason.length > 0 && (
                <p className="mt-2 text-[10px] text-muted-foreground/70">
                  {t('insights.reason')}: {insight.reason.join(', ')}
                </p>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
