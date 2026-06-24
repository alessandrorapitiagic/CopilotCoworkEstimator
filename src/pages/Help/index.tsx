import { useTranslation } from 'react-i18next'
import {
  Rocket,
  Lightbulb,
  Building2,
  FlaskConical,
  ListChecks,
  ShieldCheck,
  PlayCircle,
  HelpCircle,
  Sparkles,
  Layers,
  SlidersHorizontal,
  BookOpen,
  Users,
  GitCompareArrows,
  DatabaseZap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useTour } from '@/components/tour/TourProvider'
import { APP_VERSION, BUILD_DATE } from '@/lib/appInfo'

function SectionAnchor({ id }: { id: string }) {
  return <span id={id} className="block -mt-20 pt-20" aria-hidden />
}

export default function Help() {
  const { t } = useTranslation()
  const { start } = useTour()

  const quickSteps = [
    { icon: Building2, titleKey: 'help.quickstart.step1Title', bodyKey: 'help.quickstart.step1Body' },
    { icon: FlaskConical, titleKey: 'help.quickstart.step2Title', bodyKey: 'help.quickstart.step2Body' },
    { icon: SlidersHorizontal, titleKey: 'help.quickstart.step3Title', bodyKey: 'help.quickstart.step3Body' },
    { icon: ListChecks, titleKey: 'help.quickstart.step4Title', bodyKey: 'help.quickstart.step4Body' },
  ]

  const concepts = [
    { icon: Sparkles, titleKey: 'help.concepts.creditsTitle', bodyKey: 'help.concepts.creditsBody' },
    { icon: SlidersHorizontal, titleKey: 'help.concepts.rangeTitle', bodyKey: 'help.concepts.rangeBody' },
    { icon: Layers, titleKey: 'help.concepts.profileTitle', bodyKey: 'help.concepts.profileBody' },
    { icon: BookOpen, titleKey: 'help.concepts.assumptionTitle', bodyKey: 'help.concepts.assumptionBody' },
  ]

  const faqs = [
    { q: 'help.faq.q1', a: 'help.faq.a1' },
    { q: 'help.faq.q2', a: 'help.faq.a2' },
    { q: 'help.faq.q3', a: 'help.faq.a3' },
    { q: 'help.faq.q4', a: 'help.faq.a4' },
  ]

  const toc = [
    { id: 'intro', icon: Lightbulb, label: t('help.intro.title') },
    { id: 'quickstart', icon: Rocket, label: t('help.quickstart.title') },
    { id: 'companies', icon: Building2, label: t('nav.companies') },
    { id: 'segments', icon: Users, label: t('scenarios.segments') },
    { id: 'wizard', icon: Rocket, label: t('help.wizard.title') },
    { id: 'profiles', icon: SlidersHorizontal, label: t('help.profiles.title') },
    { id: 'taskPresets', icon: BookOpen, label: t('help.taskPresets.title') },
    { id: 'assumptionPacks', icon: BookOpen, label: t('help.assumptionPacks.title') },
    { id: 'fundingCalculation', icon: FlaskConical, label: t('help.fundingCalculation.title') },
    { id: 'compareScenarios', icon: GitCompareArrows, label: t('help.compareScenarios.title') },
    { id: 'localStorage', icon: ShieldCheck, label: t('help.localStorage.title') },
    { id: 'concepts', icon: Sparkles, label: t('help.concepts.title') },
    { id: 'privacy', icon: ShieldCheck, label: t('help.dataPrivacy.title') },
    { id: 'faq', icon: HelpCircle, label: t('help.faqTitle') },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('help.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('help.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {t('help.version')} {APP_VERSION}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t('help.build')}: {new Date(BUILD_DATE).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button onClick={start}>
          <PlayCircle className="size-4" />
          {t('help.startTour')}
        </Button>
      </div>

      {/* Table of contents */}
      <div className="mt-6 flex flex-wrap gap-2">
        {toc.map(({ id, icon: Icon, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Icon className="size-3.5" />
            {label}
          </a>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {/* Intro */}
        <SectionAnchor id="intro" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-primary" />
              {t('help.intro.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('help.intro.body')}</p>
          </CardContent>
        </Card>

        {/* Quick start */}
        <SectionAnchor id="quickstart" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="size-4 text-primary" />
              {t('help.quickstart.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {quickSteps.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <div key={i} className="flex gap-3 rounded-lg border bg-muted/30 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(titleKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t(bodyKey)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Companies */}
        <SectionAnchor id="companies" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              {t('help.companies.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.companies.body')}</p>
            <Separator />
            {[
              { title: 'help.companies.createTitle', body: 'help.companies.createBody' },
              { title: 'help.companies.archiveTitle', body: 'help.companies.archiveBody' },
              { title: 'help.companies.deleteTitle', body: 'help.companies.deleteBody' },
              { title: 'help.companies.duplicateTitle', body: 'help.companies.duplicateBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Segments */}
        <SectionAnchor id="segments" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              {t('help.segments.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.segments.body')}</p>
            <Separator />
            {[
              { title: 'help.segments.addTitle', body: 'help.segments.addBody' },
              { title: 'help.segments.calcTitle', body: 'help.segments.calcBody' },
              { title: 'help.segments.baselineTitle', body: 'help.segments.baselineBody' },
              { title: 'help.segments.excludeTitle', body: 'help.segments.excludeBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Wizard */}
        <SectionAnchor id="wizard" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="size-4 text-primary" />
              {t('help.wizard.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.wizard.body')}</p>
            <Separator />
            {[
              { title: 'help.wizard.stepsTitle', body: 'help.wizard.stepsBody' },
              { title: 'help.wizard.draftTitle', body: 'help.wizard.draftBody' },
              { title: 'help.wizard.reviewTitle', body: 'help.wizard.reviewBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Profiles */}
        <SectionAnchor id="profiles" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4 text-primary" />
              {t('help.profiles.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.profiles.body')}</p>
            <Separator />
            {[
              { title: 'help.profiles.standardTitle', body: 'help.profiles.standardBody' },
              { title: 'help.profiles.customTitle', body: 'help.profiles.customBody' },
              { title: 'help.profiles.factorsTitle', body: 'help.profiles.factorsBody' },
              { title: 'help.profiles.impactTitle', body: 'help.profiles.impactBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Task Presets & Models */}
        <SectionAnchor id="taskPresets" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" />
              {t('help.taskPresets.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.taskPresets.body')}</p>
            <Separator />
            {[
              { title: 'help.taskPresets.presetTitle', body: 'help.taskPresets.presetBody' },
              { title: 'help.taskPresets.modelTitle', body: 'help.taskPresets.modelBody' },
              { title: 'help.taskPresets.packsTitle', body: 'help.taskPresets.packsBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Assumption Packs */}
        <SectionAnchor id="assumptionPacks" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" />
              {t('help.assumptionPacks.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.assumptionPacks.body')}</p>
            <Separator />
            {[
              { title: 'help.assumptionPacks.versionTitle', body: 'help.assumptionPacks.versionBody' },
              { title: 'help.assumptionPacks.customTitle', body: 'help.assumptionPacks.customBody' },
              { title: 'help.assumptionPacks.deprecationTitle', body: 'help.assumptionPacks.deprecationBody' },
              { title: 'help.assumptionPacks.compareTitle', body: 'help.assumptionPacks.compareBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Funding & Calculation */}
        <SectionAnchor id="fundingCalculation" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4 text-primary" />
              {t('help.fundingCalculation.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.fundingCalculation.body')}</p>
            <Separator />
            {[
              { title: 'help.fundingCalculation.fundingTitle', body: 'help.fundingCalculation.fundingBody' },
              { title: 'help.fundingCalculation.engineTitle', body: 'help.fundingCalculation.engineBody' },
              { title: 'help.fundingCalculation.budgetTitle', body: 'help.fundingCalculation.budgetBody' },
            ].map(({ title, body }, i) => (
              <div key={i}>
                <p className="font-semibold">{t(title)}</p>
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compare Scenarios */}
        <SectionAnchor id="compareScenarios" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitCompareArrows className="size-4 text-primary" />
              {t('help.compareScenarios.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.compareScenarios.body')}</p>
            <Separator />
            {[
              { title: 'help.compareScenarios.metricsTitle', body: 'help.compareScenarios.metricsBody' },
              { title: 'help.compareScenarios.rangeTitle', body: 'help.compareScenarios.rangeBody' },
              { title: 'help.compareScenarios.diffPackTitle', body: 'help.compareScenarios.diffPackBody' },
            ].map(({ title, body }, i) => (
              <div key={i}><p className="font-semibold">{t(title)}</p><p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p></div>
            ))}
          </CardContent>
        </Card>

        {/* Local Storage */}
        <SectionAnchor id="localStorage" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseZap className="size-4 text-primary" />
              {t('help.localStorage.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">{t('help.localStorage.body')}</p>
            <Separator />
            {[
              { title: 'help.localStorage.backupTitle', body: 'help.localStorage.backupBody' },
              { title: 'help.localStorage.migrationTitle', body: 'help.localStorage.migrationBody' },
              { title: 'help.localStorage.storageTitle', body: 'help.localStorage.storageBody' },
            ].map(({ title, body }, i) => (
              <div key={i}><p className="font-semibold">{t(title)}</p><p className="text-muted-foreground mt-0.5 leading-relaxed">{t(body)}</p></div>
            ))}
          </CardContent>
        </Card>

        {/* Concepts */}
        <SectionAnchor id="concepts" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              {t('help.concepts.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {concepts.map(({ icon: Icon, titleKey, bodyKey }, i) => (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">{t(titleKey)}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-6 leading-relaxed">{t(bodyKey)}</p>
                {i < concepts.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <SectionAnchor id="privacy" />
        <Card className="border-emerald-200/60 dark:border-emerald-900/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              {t('help.dataPrivacy.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('help.dataPrivacy.body')}</p>
          </CardContent>
        </Card>

        {/* FAQ */}
        <SectionAnchor id="faq" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="size-4 text-primary" />
              {t('help.faqTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {faqs.map(({ q, a }, i) => (
              <div key={i}>
                <p className="text-sm font-semibold">{t(q)}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t(a)}</p>
                {i < faqs.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-muted/40">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground leading-relaxed">{t('app.disclaimer')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
