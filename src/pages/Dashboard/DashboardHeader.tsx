import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Upload, Download, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { storageService } from '@/services/storageService'
import { useAppStore } from '@/store/appStore'
import type { StorageStatus } from './useDashboardSummary'

interface Props {
  storageStatus: StorageStatus
  lastUpdated: string
  onImportDone: () => void
}

export function DashboardHeader({ storageStatus, lastUpdated, onImportDone }: Props) {
  const { t } = useTranslation()
  const { hydrate } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = storageService.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copilot-estimator-portfolio-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('copilot_cowork_last_export', new Date().toISOString())
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      const result = storageService.importAll(content)
      if (result.success) {
        hydrate()
        onImportDone()
      } else {
        alert(`${t('errors.importInvalid')}: ${result.error}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const lastUpdatedFormatted = new Date(lastUpdated).toLocaleString()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('nav.dashboard')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('app.tagline')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Aggiornato: {lastUpdatedFormatted}
          {!storageStatus.available && (
            <span className="ml-2 text-destructive font-medium">· Salvataggio non disponibile</span>
          )}
          {storageStatus.available && (
            <span className="ml-2">· {storageStatus.approximateUsageKb} KB usati</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/companies/new">
            <Plus className="size-4" />
            {t('dashboard.actions.newCompany')}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/scenarios/new">
            <FlaskConical className="size-4" />
            {t('dashboard.actions.newScenario')}
          </Link>
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          {t('dashboard.actions.importJson')}
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          {t('dashboard.actions.exportPortfolio')}
        </Button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  )
}
