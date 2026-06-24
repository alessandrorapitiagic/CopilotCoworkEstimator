import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Company } from '@/types/domain'

interface Props {
  company: Company
  onClose: () => void
}

export function CompanyDuplicateDialog({ company, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { scenarios, duplicateCompany } = useAppStore()
  const [withScenarios, setWithScenarios] = useState(false)

  const hasScenarios = scenarios.some((s) => s.companyId === company.id)

  function handleDuplicate() {
    const newCompany = duplicateCompany(company.id, withScenarios)
    onClose()
    if (newCompany) navigate(`/companies/${newCompany.id}`)
  }

  const options = [
    {
      value: false,
      title: t('companies.duplicateDialog.companyOnly'),
      desc: t('companies.duplicateDialog.companyOnlyDesc'),
    },
    {
      value: true,
      title: t('companies.duplicateDialog.withScenarios'),
      desc: t('companies.duplicateDialog.withScenariosDesc'),
      disabled: !hasScenarios,
    },
  ]

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-4" />
            {t('companies.duplicateDialog.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-1">
          <p className="text-sm text-muted-foreground">{company.name}</p>
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              disabled={opt.disabled}
              onClick={() => !opt.disabled && setWithScenarios(opt.value)}
              className={cn(
                'flex flex-col gap-0.5 rounded-lg border p-3 text-left text-sm transition-colors',
                withScenarios === opt.value && !opt.disabled
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-muted-foreground/30',
                opt.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <span className="font-medium">{opt.title}</span>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleDuplicate}>
            <Copy className="size-4" />
            {t('common.duplicate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
