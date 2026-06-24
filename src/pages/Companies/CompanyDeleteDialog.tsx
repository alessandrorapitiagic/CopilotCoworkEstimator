import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import type { Company } from '@/types/domain'

interface Props {
  company: Company
  onClose: () => void
  /** If true, navigate to /companies after deletion */
  navigateAfter?: boolean
}

export function CompanyDeleteDialog({ company, onClose, navigateAfter }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { scenarios, deleteCompany } = useAppStore()
  const [confirmName, setConfirmName] = useState('')

  const linkedScenarios = scenarios.filter((s) => s.companyId === company.id)
  const hasScenarios = linkedScenarios.length > 0
  const canDelete = !hasScenarios || confirmName.trim() === company.name.trim()

  function handleDelete() {
    if (!canDelete) return
    deleteCompany(company.id)
    onClose()
    if (navigateAfter) navigate('/companies')
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            {t('companies.deleteDialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-semibold mb-1">{company.name}</p>
            {hasScenarios ? (
              <p className="text-muted-foreground">
                {t('companies.deleteDialog.bodyWithScenarios', {
                  count: linkedScenarios.length,
                })}
              </p>
            ) : (
              <p className="text-muted-foreground">
                {t('companies.deleteDialog.bodyNoScenarios')}
              </p>
            )}
          </div>

          {hasScenarios && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-name" className="text-sm">
                {t('companies.deleteDialog.typeToConfirm')}
              </Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={company.name}
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {t('companies.deleteDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
