import type {
  Company,
  Scenario,
  SegmentCategoryType,
  UsageLevel,
} from '@/types/domain'
import { computeBudgetStatus } from '@/components/shared/BudgetStatusBadge'
import type { FundingPlan, Industry } from '@/types/domain'

export type InsightCategory =
  | 'executive'
  | 'valueDriver'
  | 'segment'
  | 'activity'
  | 'talkingPoint'
  | 'risk'
  | 'optimization'

export interface InsightTemplate {
  id: string
  category: InsightCategory
  industry?: Industry[]
  segmentCategory?: SegmentCategoryType[]
  usageLevel?: UsageLevel[]
  condition?: 'highCost' | 'budgetWarning' | 'budgetCritical' | 'customAssumptions' | 'heavyUsage'
  titleKey: string
  bodyKey: string
  priority: number
}

export interface GeneratedInsight {
  templateId: string
  category: InsightCategory
  titleKey: string
  bodyKey: string
  reason: string[]
  priority: number
}

export const INSIGHT_TEMPLATES: InsightTemplate[] = [
  {
    id: 'exec-default',
    category: 'executive',
    titleKey: 'insights.exec.default.title',
    bodyKey: 'insights.exec.default.body',
    priority: 10,
  },
  {
    id: 'exec-high-cost',
    category: 'risk',
    condition: 'highCost',
    titleKey: 'insights.exec.highCost.title',
    bodyKey: 'insights.exec.highCost.body',
    priority: 90,
  },
  {
    id: 'commercial-cost-why',
    category: 'talkingPoint',
    condition: 'highCost',
    titleKey: 'insights.commercial.costWhy.title',
    bodyKey: 'insights.commercial.costWhy.body',
    priority: 98,
  },
  {
    id: 'commercial-finance-objection',
    category: 'talkingPoint',
    condition: 'highCost',
    titleKey: 'insights.commercial.financeObjection.title',
    bodyKey: 'insights.commercial.financeObjection.body',
    priority: 97,
  },
  {
    id: 'commercial-value-frame',
    category: 'executive',
    titleKey: 'insights.commercial.valueFrame.title',
    bodyKey: 'insights.commercial.valueFrame.body',
    priority: 88,
  },
  {
    id: 'commercial-rollout-close',
    category: 'optimization',
    condition: 'highCost',
    titleKey: 'insights.commercial.rolloutClose.title',
    bodyKey: 'insights.commercial.rolloutClose.body',
    priority: 86,
  },
  {
    id: 'budget-warning',
    category: 'risk',
    condition: 'budgetWarning',
    titleKey: 'insights.risk.budgetWarning.title',
    bodyKey: 'insights.risk.budgetWarning.body',
    priority: 95,
  },
  {
    id: 'budget-critical',
    category: 'risk',
    condition: 'budgetCritical',
    titleKey: 'insights.risk.budgetCritical.title',
    bodyKey: 'insights.risk.budgetCritical.body',
    priority: 100,
  },
  {
    id: 'manufacturing-rollout',
    category: 'optimization',
    industry: ['manufacturing'],
    titleKey: 'insights.industry.manufacturing.title',
    bodyKey: 'insights.industry.manufacturing.body',
    priority: 60,
  },
  {
    id: 'finance-controls',
    category: 'valueDriver',
    industry: ['finance'],
    titleKey: 'insights.industry.finance.title',
    bodyKey: 'insights.industry.finance.body',
    priority: 60,
  },
  {
    id: 'professional-services-delivery',
    category: 'valueDriver',
    industry: ['professional_services'],
    titleKey: 'insights.industry.professionalServices.title',
    bodyKey: 'insights.industry.professionalServices.body',
    priority: 58,
  },
  {
    id: 'sales-value',
    category: 'segment',
    segmentCategory: ['sales'],
    usageLevel: ['medium', 'heavy'],
    titleKey: 'insights.segment.sales.title',
    bodyKey: 'insights.segment.sales.body',
    priority: 80,
  },
  {
    id: 'legal-heavy',
    category: 'segment',
    segmentCategory: ['legal'],
    usageLevel: ['heavy'],
    titleKey: 'insights.segment.legal.title',
    bodyKey: 'insights.segment.legal.body',
    priority: 82,
  },
  {
    id: 'hr-medium',
    category: 'segment',
    segmentCategory: ['hr'],
    usageLevel: ['medium', 'heavy'],
    titleKey: 'insights.segment.hr.title',
    bodyKey: 'insights.segment.hr.body',
    priority: 70,
  },
  {
    id: 'it-heavy',
    category: 'segment',
    segmentCategory: ['it'],
    usageLevel: ['medium', 'heavy'],
    titleKey: 'insights.segment.it.title',
    bodyKey: 'insights.segment.it.body',
    priority: 74,
  },
  {
    id: 'customer-care',
    category: 'segment',
    segmentCategory: ['customerCare'],
    usageLevel: ['medium', 'heavy'],
    titleKey: 'insights.segment.customerCare.title',
    bodyKey: 'insights.segment.customerCare.body',
    priority: 72,
  },
  {
    id: 'white-collar',
    category: 'activity',
    segmentCategory: ['whiteCollar'],
    usageLevel: ['medium'],
    titleKey: 'insights.segment.whiteCollar.title',
    bodyKey: 'insights.segment.whiteCollar.body',
    priority: 50,
  },
  {
    id: 'heavy-usage',
    category: 'talkingPoint',
    condition: 'heavyUsage',
    titleKey: 'insights.usage.heavy.title',
    bodyKey: 'insights.usage.heavy.body',
    priority: 76,
  },
  {
    id: 'custom-assumptions',
    category: 'risk',
    condition: 'customAssumptions',
    titleKey: 'insights.risk.customAssumptions.title',
    bodyKey: 'insights.risk.customAssumptions.body',
    priority: 66,
  },
  {
    id: 'optimization-default',
    category: 'optimization',
    titleKey: 'insights.optimization.default.title',
    bodyKey: 'insights.optimization.default.body',
    priority: 30,
  },
]

interface GenerateArgs {
  company: Company | null
  scenario: Scenario
  usageLevelsByProfileId: Record<string, UsageLevel>
  funding: FundingPlan | null
}

function hasSegmentMatch(template: InsightTemplate, scenario: Scenario): boolean {
  if (!template.segmentCategory) return true
  return scenario.segments.some((s) => template.segmentCategory?.includes(s.categoryType))
}

function hasUsageMatch(template: InsightTemplate, scenario: Scenario, usageLevelsByProfileId: Record<string, UsageLevel>): boolean {
  if (!template.usageLevel) return true
  return scenario.segments.some((s) => template.usageLevel?.includes(usageLevelsByProfileId[s.usageProfileId] ?? 'custom'))
}

function hasCondition(template: InsightTemplate, args: GenerateArgs): boolean {
  const { scenario, funding } = args
  const result = scenario.calculationResult
  if (!template.condition) return true
  if (!result) return false
  if (template.condition === 'highCost') return result.monthlyCost.mid > 10000 || result.costPerActiveUser.mid > 100
  if (template.condition === 'budgetWarning') return computeBudgetStatus(result, funding) === 'warning'
  if (template.condition === 'budgetCritical') return computeBudgetStatus(result, funding) === 'critical'
  if (template.condition === 'customAssumptions') return scenario.segments.some((s) => s.taskMixMode === 'custom' || s.contextFactorOverride != null || s.toolsFactorOverride != null)
  if (template.condition === 'heavyUsage') return scenario.segments.some((s) => (args.usageLevelsByProfileId[s.usageProfileId] ?? 'custom') === 'heavy')
  return true
}

export function generateValueInsights(args: GenerateArgs): GeneratedInsight[] {
  const { company, scenario } = args
  const insights = INSIGHT_TEMPLATES
    .filter((template) => !template.industry || (company?.industry && template.industry.includes(company.industry)))
    .filter((template) => hasSegmentMatch(template, scenario))
    .filter((template) => hasUsageMatch(template, scenario, args.usageLevelsByProfileId))
    .filter((template) => hasCondition(template, args))
    .map((template) => {
      const reason: string[] = []
      if (template.industry) reason.push('industry')
      if (template.segmentCategory) reason.push('segment')
      if (template.usageLevel) reason.push('usage')
      if (template.condition) reason.push(template.condition)
      return {
        templateId: template.id,
        category: template.category,
        titleKey: template.titleKey,
        bodyKey: template.bodyKey,
        reason,
        priority: template.priority,
      }
    })
    .sort((a, b) => b.priority - a.priority)

  const byCategory = new Map<InsightCategory, GeneratedInsight[]>()
  for (const insight of insights) {
    const list = byCategory.get(insight.category) ?? []
    list.push(insight)
    byCategory.set(insight.category, list)
  }

  // Keep output compact and balanced: max 10 total, no more than 2 per category.
  const balanced: GeneratedInsight[] = []
  for (const category of ['talkingPoint', 'risk', 'executive', 'segment', 'valueDriver', 'activity', 'optimization'] as InsightCategory[]) {
    balanced.push(...(byCategory.get(category) ?? []).slice(0, 2))
  }
  return balanced.slice(0, 10)
}
