import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload, Trash2, Moon, Sun, Monitor, Languages, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { storageService } from '@/services/storageService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Theme, Language } from '@/types/domain'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']

export default function Settings() {
  const { t } = useTranslation()
  const { preferences, updatePreferences, hydrate } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    const json = storageService.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `copilot-estimator-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
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
        alert(t('common.success'))
      } else {
        alert(`${t('errors.importInvalid')}: ${result.error}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
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
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.theme')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            {themes.map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={preferences.theme === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => updatePreferences({ theme: value })}
                className="flex-1"
              >
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.language')}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          {(['it', 'en'] as Language[]).map((lang) => (
            <Button
              key={lang}
              variant={preferences.language === lang ? 'default' : 'outline'}
              size="sm"
              onClick={() => updatePreferences({ language: lang })}
              className="gap-2"
            >
              <Languages className="size-4" />
              {lang === 'it' ? 'Italiano' : 'English'}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.currency')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={preferences.currency} onValueChange={(v) => updatePreferences({ currency: v })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.storage')}</CardTitle>
          <CardDescription>Esporta, importa o resetta tutti i dati locali.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" /> {t('settings.exportAll')}
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" /> {t('settings.importAll')}
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
          <div className="border-t pt-3">
            <Button variant="destructive" size="sm" onClick={handleReset}>
              <Trash2 className="size-4" /> {t('settings.resetAll')}
            </Button>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertTriangle className="size-3" />
              {t('settings.resetConfirm')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
