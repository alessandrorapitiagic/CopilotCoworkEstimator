import { useTranslation } from 'react-i18next'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ExitGuardProps {
  open: boolean
  onSaveDraft: () => void
  onDiscard: () => void
  onCancel: () => void
}

export function WizardExitGuardDialog({ open, onSaveDraft, onDiscard, onCancel }: ExitGuardProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('wizard.exitTitle')}</DialogTitle>
          <DialogDescription>{t('wizard.exitBody')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel}>{t('wizard.exitCancel')}</Button>
          <Button variant="outline" onClick={onDiscard} className="text-destructive border-destructive hover:bg-destructive/10">
            {t('wizard.exitDiscard')}
          </Button>
          <Button onClick={onSaveDraft}>{t('wizard.exitSaveDraft')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DraftRecoveryProps {
  open: boolean
  draftDate: string | null
  onResume: () => void
  onDiscard: () => void
}

export function DraftRecoveryDialog({ open, draftDate, onResume, onDiscard }: DraftRecoveryProps) {
  const { t } = useTranslation()
  const dateStr = draftDate ? new Date(draftDate).toLocaleDateString() : '—'
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDiscard()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('wizard.draftRecoveryTitle')}</DialogTitle>
          <DialogDescription>
            {t('wizard.draftRecoveryBody', { date: dateStr })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDiscard}>{t('wizard.draftRecoveryDiscard')}</Button>
          <Button onClick={onResume}>{t('wizard.draftRecoveryResume')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
