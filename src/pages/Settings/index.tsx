import { useRef, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload, Trash2, Moon, Sun, Monitor, Languages, AlertTriangle, DatabaseZap } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { storageService } from '@/services/storageService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { APP_VERSION, BUILD_DATE } from '@/lib/appInfo'
import { STORAGE_SCHEMA_VERSION } from '@/types/domain'
import { ImportPreviewDialog } from '@/components/shared/ImportPreviewDialog'
import type { Theme, Language, AppStorageSchema } from '@/types/domain'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']
const MAX_STORAGE_BYTES = 5 * 1024 * 1024 // 5 MB rough browser limit

export default function Settings() {
  const { t } = useTranslation()
  const { preferences, updatePreferences, hydrate, companies, scenarios, usageProfiles, assumptionPacks } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<Partial<AppStorageSchema> | null>(null)
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null)

  const storageStatus = useMemo(() => storageService.isAvailable() ? (() => {
    let total = 0
    try {
      for (const key of Object.keys(localStorage)) {
        total += (localStorage.getItem(key)?.length ?? 0) * 2
      }
    } catch { /* ignore */ }
    const lastExport = localStorage.getItem('copilot_cowork_last_export')
    return {
      available: true,
      bytes: total,
      kb: Math.round(total / 1024),
      pct: Math.min(100, Math.round((total / MAX_STORAGE_BYTES) * 100)),
      isNearLimit: total > 4 * 1024 * 1024,
      lastExport: lastExport ? new Date(lastExport).toLocaleDateString() : null,
    }
  })() : { available: false, bytes: 0, kb: 0, pct: 0, isNearLimit: false, lastExport: null }, [])

  const customProfiles = usageProfiles.filter((p) => !p.isSystemDefault).length
  const customPacks = assumptionPacks.filter((p) => !p.isSystemDefault).length

  function handleExport() {
    const json = storageService.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copilot-estimator-backup-${new Date().toISOString().slice(0, 10)}.json`
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
      try {
        const parsed = JSON.parse(content) as Partial<AppStorageSchema>
        setPendingImportJson(content)
        setImportPreview(parsed)
      } catch {
        alert(t('import.importError'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmImport() {
    if (!pendingImportJson) return
    const result = storageService.importAll(pendingImportJson)
    if (result.success) {
      hydrate()
      setImportPreview(null)
      setPendingImportJson(null)
      alert(t('import.importSuccess'))
    } else {
      alert(`${t('import.importError')}: ${result.error}`)
    }
  }

  function handleReset() {
    if (confirm(t('settings.resetConfirm'))) {
      storageService.reset()
      hydrate()
    }
  }

  const themes: { value: Theme; icon: React.ElementType; label: string }[] = [
    { value: 'light', icon: Sun, label: t('settings.themes.light') },
    { value: 'dark', icon: Moon, label: t('settings.themes.dark') },
    { value: 'system', icon: Monitor, label: t('settings.themes.system') },
  ]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          v{APP_VERSION} · Build: {new Date(BUILD_DATE).toLocaleDateString()}
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('settings.theme')}</CardTitle></CardHeader>
        <CardContent>
          <div className="inline-grid grid-cols-3 gap-1 rounded-lg border bg-muted p-1 w-full max-w-sm">
            {themes.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => updatePreferences({ theme: value })}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  preferences.theme === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('settings.language')}</CardTitle></CardHeader>
        <CardContent>
          <div className="inline-grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1 w-full max-w-xs">
            {(['it', 'en'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => updatePreferences({ language: lang })}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  preferences.language === lang
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Languages className="size-4" />
                {lang === 'it' ? 'Italiano' : 'English'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t('settings.currency')}</CardTitle></CardHeader>
        <CardContent>
          <Select value={preferences.currency} onValueChange={(v) => updatePreferences({ currency: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Storage status */}
      <Card data-tour="settings-storage">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DatabaseZap className="size-4" />
            {t('storage.title')}
          </CardTitle>
          <CardDescription>{t('storage.backupSuggestion')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Status */}
          {!storageStatus.available ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              {t('storage.notAvailable')} — {t('storage.backupSuggestion')}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('storage.usedLabel')}</span>
                <span className="font-semibold">
                  {storageStatus.kb} KB
                  {storageStatus.isNearLimit && (
                    <Badge variant="warning" className="ml-2 text-[10px]">{t('storage.nearLimit')}</Badge>
                  )}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${storageStatus.isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
                  style={{ width: `${storageStatus.pct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{storageStatus.pct}% usato (stima su ~5 MB disponibili)</p>
            </div>
          )}

          {/* Data counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { label: t('storage.companiesCount'), val: companies.length },
              { label: t('storage.scenariosCount'), val: scenarios.length },
              { label: t('storage.profilesCount'), val: customProfiles },
              { label: t('storage.packsCount'), val: customPacks },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-lg border bg-muted/30 p-2 text-center">
                <p className="text-muted-foreground text-[10px]">{label}</p>
                <p className="font-bold text-sm">{val}</p>
              </div>
            ))}
          </div>

          {/* Schema + last export */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
            <span>{t('storage.schemaVersion')}: <strong className="text-foreground">{STORAGE_SCHEMA_VERSION}</strong></span>
            <span>{t('storage.lastExport')}: <strong className="text-foreground">{storageStatus.lastExport ?? t('storage.never')}</strong></span>
          </div>

          <Separator />

          {/* Export / Import */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" /> {t('settings.exportAll')}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {t('settings.importAll')}
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>

          {/* Reset */}
          <div className="flex flex-col gap-1.5">
            <Button variant="destructive" size="sm" className="w-fit" onClick={handleReset}>
              <Trash2 className="size-4" /> {t('settings.resetAll')}
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="size-3 shrink-0" />
              {t('storage.resetWarning')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import preview dialog */}
      {importPreview && (
        <ImportPreviewDialog
          data={importPreview}
          onConfirm={confirmImport}
          onClose={() => { setImportPreview(null); setPendingImportJson(null) }}
        />
      )}
    </div>
  )
}
