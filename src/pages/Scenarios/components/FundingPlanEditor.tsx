import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { InfoHint } from '@/components/shared/InfoHint'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { FundingPlan, FundingMode, CalculationResult } from '@/types/domain'

const FUNDING_MODES: FundingMode[] = ['payg', 'prepaid', 'existing_capacity', 'blended']
const P3_TIERS = [
  { tier: 1, annualCredits: 300_000, discount: 5 },
  { tier: 2, annualCredits: 1_500_000, discount: 6 },
  { tier: 3, annualCredits: 3_000_000, discount: 7 },
  { tier: 4, annualCredits: 15_000_000, discount: 8 },
  { tier: 5, annualCredits: 30_000_000, discount: 10 },
  { tier: 6, annualCredits: 75_000_000, discount: 12 },
  { tier: 7, annualCredits: 150_000_000, discount: 14 },
  { tier: 8, annualCredits: 225_000_000, discount: 17 },
  { tier: 9, annualCredits: 300_000_000, discount: 20 },
]

interface FundingKpi {
  totalCredits: number
  creditsCovered: number
  billableCredits: number
  spilloverCredits: number
  monthlyCostMin: number
  monthlyCostMid: number
  monthlyCostMax: number
  annualCostMid: number
  savedVsPayg: number | null
  budgetStatus: 'ok' | 'warning' | 'critical' | null
}

function computeFundingKpi(
  result: CalculationResult | null,
  funding: Partial<FundingPlan>,
  _currency: string,
): FundingKpi | null {
  void _currency
  if (!result) return null

  const totalMid = result.monthlyCredits.mid
  const existing = Number(funding.existingMonthlyCredits) || 0
  const prepaid = Number(funding.prepaidCredits) || 0
  const price = Number(funding.paygPricePerCredit) || 0.01
  const discount = Number(funding.discountPercentage) || 0
  const effectivePrice = price * (1 - discount / 100)
  const prepaidPrice = Number(funding.prepaidEffectivePricePerCredit) || effectivePrice

  if ((funding.construct ?? funding.mode) === 'p3PrePurchase' && funding.p3) {
    const annualMid = totalMid * 12
    const annualPrepaidCredits = funding.p3.annualPrepaidCredits
    const annualPrepaidCost = funding.p3.annualPrepaidCost
    const annualSpillover = Math.max(annualMid - annualPrepaidCredits, 0)
    const monthlyCostMid = (annualPrepaidCost + annualSpillover * price) / 12
    const calcMonthly = (monthlyCredits: number) => {
      const annualCredits = monthlyCredits * 12
      const annualOverflow = Math.max(annualCredits - annualPrepaidCredits, 0)
      return (annualPrepaidCost + annualOverflow * price) / 12
    }
    const savedVsPayg = totalMid * price - monthlyCostMid
    return {
      totalCredits: totalMid,
      creditsCovered: Math.min(annualMid, annualPrepaidCredits) / 12,
      billableCredits: annualSpillover / 12,
      spilloverCredits: annualSpillover / 12,
      monthlyCostMin: calcMonthly(result.monthlyCredits.min),
      monthlyCostMid,
      monthlyCostMax: calcMonthly(result.monthlyCredits.max),
      annualCostMid: monthlyCostMid * 12,
      savedVsPayg,
      budgetStatus: null,
    }
  }

  const covered = Math.min(totalMid, existing)
  const afterExisting = Math.max(0, totalMid - existing)
  const prepaidUsed = Math.min(afterExisting, prepaid)
  const billable = Math.max(0, afterExisting - prepaidUsed)
  const spillover = Math.max(0, totalMid - existing - prepaid)

  const calcCost = (credits: number) => {
    const c = Math.max(0, credits - existing)
    const prep = Math.min(c, prepaid)
    const payg = Math.max(0, c - prep)
    return prep * prepaidPrice + payg * effectivePrice
  }

  const paygCostMid = totalMid * effectivePrice
  const monthlyCostMid = calcCost(totalMid)
  const savedVsPayg = funding.mode !== 'payg' ? paygCostMid - monthlyCostMid : null

  let budgetStatus: 'ok' | 'warning' | 'critical' | null = null
  const budget = Number(funding.budgetMonthly) || null
  if (budget !== null && budget > 0) {
    const costMin = calcCost(result.monthlyCredits.min)
    const costMax = calcCost(result.monthlyCredits.max)
    if (costMin > budget) budgetStatus = 'critical'
    else if (costMax > budget) budgetStatus = 'warning'
    else budgetStatus = 'ok'
  }

  return {
    totalCredits: totalMid,
    creditsCovered: covered,
    billableCredits: billable,
    spilloverCredits: spillover,
    monthlyCostMin: calcCost(result.monthlyCredits.min),
    monthlyCostMid,
    monthlyCostMax: calcCost(result.monthlyCredits.max),
    annualCostMid: monthlyCostMid * 12,
    savedVsPayg,
    budgetStatus,
  }
}

interface Props {
  scenarioId: string
  existingPlan: FundingPlan | null
  result: CalculationResult | null
  currency: string
  defaultPrice: number
  onSave: (plan: Omit<FundingPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
}

export function FundingPlanEditor({ scenarioId, existingPlan, result, currency, defaultPrice, onSave }: Props) {
  const { t } = useTranslation()

  const [mode, setMode] = useState<FundingMode>(existingPlan?.mode ?? 'payg')
  const [pricePerCredit, setPricePerCredit] = useState(String(existingPlan?.paygPricePerCredit ?? defaultPrice))
  const [existingCredits, setExistingCredits] = useState(String(existingPlan?.existingMonthlyCredits ?? 0))
  const [prepaidCredits, setPrepaidCredits] = useState(String(existingPlan?.prepaidCredits ?? 0))
  const [prepaidEffPrice, setPrepaidEffPrice] = useState(String(existingPlan?.prepaidEffectivePricePerCredit ?? defaultPrice))
  const [discount, setDiscount] = useState(String(existingPlan?.discountPercentage ?? 0))
  const [p3Tier, setP3Tier] = useState(String(existingPlan?.p3?.tier ?? 1))
  const [budgetMonthly, setBudgetMonthly] = useState(String(existingPlan?.budgetMonthly ?? ''))
  const [budgetAnnual, setBudgetAnnual] = useState(String(existingPlan?.budgetAnnual ?? ''))
  const [notes, setNotes] = useState(existingPlan?.notes ?? '')

  const selectedP3Preview = P3_TIERS.find((t) => String(t.tier) === p3Tier)
  const p3AnnualCreditsPreview = selectedP3Preview?.annualCredits ?? Number(prepaidCredits) * 12
  const p3DiscountPreview = selectedP3Preview?.discount ?? (Number(discount) || 0)
  const p3AnnualCostPreview = p3AnnualCreditsPreview * (Number(pricePerCredit) || defaultPrice) * (1 - p3DiscountPreview / 100)

  // Live preview
  const previewPlan: Partial<FundingPlan> = {
    mode,
    construct: mode === 'prepaid' ? 'p3PrePurchase' : mode === 'existing_capacity' ? 'existingCapacity' : mode,
    paygPricePerCredit: Number(pricePerCredit) || defaultPrice,
    existingMonthlyCredits: Number(existingCredits) || 0,
    prepaidCredits: Number(prepaidCredits) || 0,
    prepaidEffectivePricePerCredit: Number(prepaidEffPrice) || Number(pricePerCredit) || defaultPrice,
    discountPercentage: Number(discount) || 0,
    budgetMonthly: budgetMonthly ? Number(budgetMonthly) : null,
    budgetAnnual: budgetAnnual ? Number(budgetAnnual) : null,
    p3: mode === 'prepaid' ? {
      tier: Number(p3Tier),
      annualPrepaidCredits: p3AnnualCreditsPreview,
      discountPercentage: p3DiscountPreview,
      annualPrepaidCost: p3AnnualCostPreview,
      effectivePricePerCredit: p3AnnualCostPreview / p3AnnualCreditsPreview,
      unusedCreditsExpire: true,
      spilloverMode: 'payg',
    } : null,
  }

  const kpi = computeFundingKpi(result, previewPlan, currency)

  function handleSave() {
    const selectedP3 = P3_TIERS.find((t) => String(t.tier) === p3Tier)
    const p3AnnualCredits = selectedP3?.annualCredits ?? Number(prepaidCredits) * 12
    const p3Discount = selectedP3?.discount ?? (Number(discount) || 0)
    const p3AnnualCost = p3AnnualCredits * (Number(pricePerCredit) || defaultPrice) * (1 - p3Discount / 100)
    onSave({
      ...(existingPlan?.id ? { id: existingPlan.id } : {}),
      scenarioId,
      mode,
      construct: mode === 'prepaid' ? 'p3PrePurchase' : mode === 'existing_capacity' ? 'existingCapacity' : mode,
      paygPricePerCredit: Number(pricePerCredit) || defaultPrice,
      existingMonthlyCredits: Number(existingCredits) || 0,
      prepaidCredits: Number(prepaidCredits) || 0,
      prepaidEffectivePricePerCredit: Number(prepaidEffPrice) || Number(pricePerCredit) || defaultPrice,
      discountPercentage: Number(discount) || 0,
      currency,
      budgetMonthly: budgetMonthly ? Number(budgetMonthly) : null,
      budgetAnnual: budgetAnnual ? Number(budgetAnnual) : null,
      notes: notes.trim() || null,
      p3: mode === 'prepaid' ? {
        tier: Number(p3Tier),
        annualPrepaidCredits: p3AnnualCredits,
        discountPercentage: p3Discount,
        annualPrepaidCost: p3AnnualCost,
        effectivePricePerCredit: p3AnnualCost / p3AnnualCredits,
        unusedCreditsExpire: true,
        spilloverMode: 'payg',
      } : null,
    })
  }

  function handleP3TierChange(tier: string) {
    setP3Tier(tier)
    const selected = P3_TIERS.find((t) => String(t.tier) === tier)
    if (!selected) return
    setPrepaidCredits(String(Math.round(selected.annualCredits / 12)))
    setDiscount(String(selected.discount))
    const effective = (Number(pricePerCredit) || defaultPrice) * (1 - selected.discount / 100)
    setPrepaidEffPrice(String(effective))
  }

  const showExisting = mode === 'existing_capacity' || mode === 'blended'
  const showPrepaid = mode === 'prepaid' || mode === 'blended'

  return (
    <div className="flex flex-col gap-5" data-tour="funding-editor">
      {/* Mode selector */}
      <div className="grid gap-2">
        <Label className="flex items-center gap-1">
          {t('funding.title')}
          <InfoHint text={t('wizard.fundingBudget.modeLabel')} />
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {FUNDING_MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                mode === m ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'
              }`}
            >
              <p className="font-medium">{t(`funding.mode.${m}`)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(`funding.modeDesc.${m}`)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Price per credit */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="flex items-center gap-1">
            {t('funding.pricePerCredit')} ({currency})
            <InfoHint hintKey="pricePerCredit" />
          </Label>
          <Input type="number" step={0.001} min={0} value={pricePerCredit}
            onChange={(e) => setPricePerCredit(e.target.value)} />
        </div>
        {showPrepaid && (
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1">
              {t('funding.prepaidEffectivePrice')}
              <InfoHint hintKey="prepaidCredits" />
            </Label>
            <Input type="number" step={0.001} min={0} value={prepaidEffPrice}
              onChange={(e) => setPrepaidEffPrice(e.target.value)} />
          </div>
        )}
      </div>

      {/* Existing capacity */}
      {showExisting && (
        <div className="grid gap-1.5">
          <Label className="flex items-center gap-1">
            {t('funding.existingMonthly')}
            <InfoHint hintKey="existingCredits" />
          </Label>
          <Input type="number" min={0} value={existingCredits}
            onChange={(e) => setExistingCredits(e.target.value)} />
        </div>
      )}

      {/* Prepaid */}
      {showPrepaid && (
        <div className="grid gap-3 sm:grid-cols-2">
          {mode === 'prepaid' && (
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>P3 Pre-Purchase Plan (annual upfront pool)</Label>
              <Select value={p3Tier} onValueChange={handleP3TierChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {P3_TIERS.map((tier) => (
                    <SelectItem key={tier.tier} value={String(tier.tier)}>
                      Tier {tier.tier}: {tier.annualCredits.toLocaleString()} credits/year · {tier.discount}% discount
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">P3 is modeled as an annual upfront credit pool. Monthly cost is shown as a planning allocation.</p>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1">
              {t('funding.prepaidCredits')}
              <InfoHint hintKey="prepaidCredits" />
            </Label>
            <Input type="number" min={0} value={prepaidCredits}
              onChange={(e) => setPrepaidCredits(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="flex items-center gap-1">
              {t('funding.discount')}
              <InfoHint hintKey="discount" />
            </Label>
            <Input type="number" min={0} max={100} step={0.1} value={discount}
              onChange={(e) => setDiscount(e.target.value)} />
          </div>
        </div>
      )}

      {/* Budget */}
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="flex items-center gap-1">
            {t('funding.budgetMonthly')}
            <InfoHint hintKey="monthlyBudget" />
          </Label>
          <Input type="number" min={0} value={budgetMonthly}
            onChange={(e) => setBudgetMonthly(e.target.value)}
            placeholder={t('common.optional')} />
        </div>
        <div className="grid gap-1.5">
          <Label>{t('funding.budgetAnnual')}</Label>
          <Input type="number" min={0} value={budgetAnnual}
            onChange={(e) => setBudgetAnnual(e.target.value)}
            placeholder={t('common.optional')} />
        </div>
      </div>

      {/* Live KPI preview */}
      {kpi && (
        <>
          <Separator />
          <div className="flex flex-col gap-3" data-tour="funding-kpi">
            <p className="text-sm font-semibold">{t('results.fundingBreakdown')}</p>

            {/* Budget status banner */}
            {kpi.budgetStatus && (
              <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                kpi.budgetStatus === 'critical'
                  ? 'border-destructive/40 bg-destructive/5 text-destructive'
                  : kpi.budgetStatus === 'warning'
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400'
                    : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400'
              }`}>
                {kpi.budgetStatus === 'ok' ? <CheckCircle className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
                {t(`funding.budget${kpi.budgetStatus.charAt(0).toUpperCase() + kpi.budgetStatus.slice(1)}`)}
              </div>
            )}

            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 text-xs">
              {[
                { label: t('results.monthlyCredits'), val: formatNumber(Math.round(kpi.totalCredits)), hint: 'monthlyCredits' },
                { label: t('results.creditsCovered'), val: formatNumber(Math.round(kpi.creditsCovered)), color: kpi.creditsCovered > 0 ? 'text-emerald-600 dark:text-emerald-400' : '' },
                { label: t('results.creditsSpillover'), val: formatNumber(Math.round(kpi.spilloverCredits)), color: kpi.spilloverCredits > 0 ? 'text-amber-600 dark:text-amber-400' : '' },
                { label: t('results.monthlyCost') + ' (mid)', val: formatCurrency(kpi.monthlyCostMid, currency), accent: true },
                { label: t('results.annualCost') + ' (mid)', val: formatCurrency(kpi.annualCostMid, currency), accent: true },
                ...(kpi.savedVsPayg !== null && kpi.savedVsPayg > 0
                  ? [{ label: t('funding.savedVsPayg'), val: formatCurrency(kpi.savedVsPayg, currency), color: 'text-emerald-600 dark:text-emerald-400' }]
                  : []),
              ].map((item, i) => (
                <div key={i} className={`rounded-lg border p-2.5 ${item.accent ? 'border-primary/30 bg-primary/5' : 'bg-muted/30'}`}>
                  <p className={`text-muted-foreground mb-0.5 ${item.color ?? ''}`}>{item.label}</p>
                  <p className={`font-bold ${item.accent ? 'text-primary' : item.color ?? ''}`}>{item.val}</p>
                </div>
              ))}
            </div>

            {/* Min/mid/max range */}
            <div className="rounded-lg bg-muted/30 border p-3 text-xs">
              <p className="text-muted-foreground mb-1">{t('results.monthlyCost')} (range)</p>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(kpi.monthlyCostMin, currency)} min</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-bold text-primary">{formatCurrency(kpi.monthlyCostMid, currency)} mid</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-amber-600 dark:text-amber-400">{formatCurrency(kpi.monthlyCostMax, currency)} max</span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid gap-1.5">
        <Label className="text-xs">{t('companies.notes')}</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="size-4" />
          {t('common.save')}
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground flex items-start gap-1">
        <Info className="size-3 mt-0.5 shrink-0" />
        {t('app.disclaimer')}
      </p>
    </div>
  )
}
