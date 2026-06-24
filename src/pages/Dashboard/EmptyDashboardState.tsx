import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Upload, FlaskConical, Cpu } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { storageService } from '@/services/storageService'
import { useAppStore } from '@/store/appStore'

interface Props {
  hasCompanies: boolean
  onImportDone: () => void
}

export function EmptyDashboardState({ hasCompanies, onImportDone }: Props) {
  const { t } = useTranslation()
  const { hydrate } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)

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

  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center gap-6 py-14 px-6 text-center">
        {/* Icon */}
        <div className="rounded-2xl bg-primary/10 p-5">
          <Cpu className="size-10 text-primary" />
        </div>

        {/* Text */}
        <div className="max-w-md">
          <h2 className="text-xl font-bold">
            {hasCompanies
              ? t('dashboard.emptyState.title')
              : 'Benvenuto nel Copilot Cowork Estimator'}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {hasCompanies
              ? t('dashboard.emptyState.description')
              : 'Stima il consumo di crediti Microsoft Copilot Cowork per la tua organizzazione. Configura aziende, segmenti workforce e scenari di utilizzo per ottenere una stima range-based trasparente.'}
          </p>
          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <span className="inline-block size-1.5 rounded-full bg-green-500"></span>
            I dati restano nel browser — nessun server, nessun login.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button asChild className="flex-1">
            <Link to="/companies/new">
              <Building2 className="size-4" />
              {t('companies.new')}
            </Link>
          </Button>

          {hasCompanies && (
            <Button asChild variant="outline" className="flex-1">
              <Link to="/scenarios/new">
                <FlaskConical className="size-4" />
                {t('scenarios.new')}
              </Link>
            </Button>
          )}

          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            {t('dashboard.actions.importJson')}
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </CardContent>
    </Card>
  )
}
