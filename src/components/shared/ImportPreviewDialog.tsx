import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle, FileJson } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { AppStorageSchema } from '@/types/domain'

interface Props {
  data: Partial<AppStorageSchema>
  onConfirm: () => void
  onClose: () => void
}

export function ImportPreviewDialog({ data, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  const [confirmed, setConfirmed] = useState(false)

  const companies = data.companies ?? []
  const scenarios = data.scenarios ?? []
  const profiles = (data.usageProfiles ?? []).filter((p) => !p.isSystemDefault)
  const packs = (data.assumptionPacks ?? []).filter((p) => !p.isSystemDefault)

  const isFuture = data.schemaVersion && data.schemaVersion > '1.0.0'

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="size-5 text-primary" />
            {t('import.previewTitle')}
          </DialogTitle>
          <DialogDescription>{t('import.previewBody')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Found items */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: t('import.companiesFound'), count: companies.length },
              { label: t('import.scenariosFound'), count: scenarios.length },
              { label: t('import.profilesFound'), count: profiles.length },
              { label: t('import.packsFound'), count: packs.length },
            ].map(({ label, count }) => (
              <div key={label} className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{label}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>

          {/* Schema version */}
          {data.schemaVersion && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('storage.schemaVersion')}: <strong className="text-foreground">{data.schemaVersion}</strong></span>
              {isFuture && (
                <Badge variant="warning" className="text-[10px]">{t('import.schemaFuture')}</Badge>
              )}
            </div>
          )}

          {/* Warnings */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-400">
            <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
            <span>{t('import.conflictWarning')}</span>
          </div>

          <Separator />

          {/* Confirmation */}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="size-4 rounded"
            />
            {t('import.mergeMode')}
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button disabled={!confirmed} onClick={onConfirm}>
            <CheckCircle className="size-4" />
            {t('import.confirmImport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
