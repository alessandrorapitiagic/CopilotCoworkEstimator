import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store/appStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Assumptions() {
  const { t } = useTranslation()
  const { assumptionPacks, modelAssumptions } = useAppStore()

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">{t('nav.assumptions')}</h1>

      <Tabs defaultValue="packs">
        <TabsList>
          <TabsTrigger value="packs">{t('assumptions.packs')}</TabsTrigger>
          <TabsTrigger value="models">{t('assumptions.models')}</TabsTrigger>
        </TabsList>

        <TabsContent value="packs" className="flex flex-col gap-4">
          {assumptionPacks.map((pack) => (
            <Card key={pack.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{pack.name}</CardTitle>
                  <Badge variant="secondary">v{pack.version}</Badge>
                  {pack.isSystemDefault && <Badge>{t('assumptions.systemDefault')}</Badge>}
                </div>
                <CardDescription>{pack.description}</CardDescription>
                {pack.source && (
                  <p className="text-xs text-muted-foreground">
                    {t('assumptions.source')}: {pack.source}
                    {pack.sourceDate ? ` · ${pack.sourceDate}` : ''}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Credit bands */}
                <div>
                  <p className="text-sm font-semibold mb-2">{t('assumptions.creditBands')}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {(['light', 'medium', 'heavy'] as const).map((int) => (
                      <div key={int} className="rounded-lg border p-3 bg-muted/30">
                        <p className="font-semibold capitalize text-sm mb-1">{t(`profiles.${int}`)}</p>
                        <p className="text-muted-foreground">Min: <span className="text-foreground font-medium">{pack.creditBands[`${int}Min` as keyof typeof pack.creditBands]}</span></p>
                        <p className="text-muted-foreground">Mid: <span className="text-foreground font-medium">{pack.creditBands[`${int}Mid` as keyof typeof pack.creditBands]}</span></p>
                        <p className="text-muted-foreground">Max: <span className="text-foreground font-medium">{pack.creditBands[`${int}Max` as keyof typeof pack.creditBands]}</span></p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factors */}
                <div>
                  <p className="text-sm font-semibold mb-2">{t('assumptions.factors')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {Object.entries(pack.factors).map(([key, value]) => (
                      <div key={key} className="rounded border px-2 py-1.5 flex justify-between">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-semibold">{value}×</span>
                      </div>
                    ))}
                  </div>
                </div>

                {pack.disclaimer && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{pack.disclaimer}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="models" className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modelAssumptions.map((model) => (
              <Card key={model.id} className={!model.isEnabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">{model.name}</CardTitle>
                    <Badge variant="secondary">{model.modelClass}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{model.provider}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-xs">
                  {model.description && (
                    <p className="text-muted-foreground">{model.description}</p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('assumptions.modelFactor')}</span>
                    <span className="font-bold">{model.modelFactor}×</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {model.isOfficiallyDocumented ? (
                      <Badge variant="success">{t('assumptions.isOfficial')}</Badge>
                    ) : (
                      <Badge variant="warning">{t('assumptions.notOfficial')}</Badge>
                    )}
                  </div>
                  {model.availabilityNotes && (
                    <p className="text-muted-foreground italic">{model.availabilityNotes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
