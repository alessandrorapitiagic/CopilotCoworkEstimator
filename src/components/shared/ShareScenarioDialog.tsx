import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link2, Copy, Check, AlertTriangle, ExternalLink, FileJson } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildShareLink } from '@/services/sharingService'
import { useAppStore } from '@/store/appStore'
import type { Scenario } from '@/types/domain'

interface Props {
  scenario: Scenario
  onClose: () => void
  onFallbackExport: () => void
}

export function ShareScenarioDialog({ scenario, onClose, onFallbackExport }: Props) {
  const { t } = useTranslation()
  const { companies, assumptionPacks, usageProfiles, taskPresets, modelAssumptions, fundingPlans } = useAppStore()

  const [result, setResult] = useState<ReturnType<typeof buildShareLink> | null>(null)
  const [copied, setCopied] = useState(false)

  const company = companies.find((c) => c.id === scenario.companyId) ?? null

  useEffect(() => {
    const r = buildShareLink(
      scenario,
      company,
      assumptionPacks,
      usageProfiles,
      taskPresets,
      modelAssumptions,
      fundingPlans,
      window.location.origin + window.location.pathname,
    )
    setResult(r)
  }, [scenario, company, assumptionPacks, usageProfiles, taskPresets, modelAssumptions, fundingPlans])

  async function handleCopy() {
    if (!result?.ok) return
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: select input
    }
  }

  function getTeamsUrl(url: string): string {
    return `https://teams.microsoft.com/l/chat/0/0?message=${encodeURIComponent(url)}`
  }

  function getWhatsAppUrl(url: string): string {
    return `https://wa.me/?text=${encodeURIComponent(url)}`
  }

  function getEmailUrl(url: string, scenarioName: string): string {
    const subject = `Copilot Cowork Estimator — ${scenarioName}`
    const body = `Clicca il link per aprire lo scenario:\n\n${url}\n\n${t('app.disclaimer')}`
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            {t('share.title')}
          </DialogTitle>
          <DialogDescription>{t('share.disclaimerNote')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {result === null && (
            <p className="text-sm text-muted-foreground">Generazione link in corso...</p>
          )}

          {result && !result.ok && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <div>
                <p>{t('share.payloadTooLong')}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-destructive"
                  onClick={() => { onFallbackExport(); onClose() }}
                >
                  <FileJson className="size-3.5 mr-1" />
                  {t('share.fallbackJson')}
                </Button>
              </div>
            </div>
          )}

          {result?.ok && (
            <>
              {result.lengthWarning && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-2.5 text-xs text-amber-800 dark:text-amber-400">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {t('share.payloadWarning')} ({result.chars} chars)
                </div>
              )}

              {/* URL input */}
              <div className="flex gap-2">
                <Input
                  value={result.url}
                  readOnly
                  className="flex-1 text-xs font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button size="icon" onClick={handleCopy} aria-label={t('share.copyLink')}>
                  {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="size-3" /> {t('share.copied')}
                </p>
              )}

              {/* Share buttons */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={getTeamsUrl(result.url)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    {t('share.shareTeams')}
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={getWhatsAppUrl(result.url)} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    {t('share.shareWhatsApp')}
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={getEmailUrl(result.url, scenario.name)}>
                    <ExternalLink className="size-4" />
                    {t('share.shareEmail')}
                  </a>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">{t('share.disclaimerNote')}</p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
