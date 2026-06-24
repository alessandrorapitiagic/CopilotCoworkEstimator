import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Calculator,
  Building2,
  FlaskConical,
  BookOpen,
  GitCompareArrows,
  Settings,
  Sun,
  Moon,
  Monitor,
  Languages,
  Cpu,
  BriefcaseBusiness,
  Menu,
  X,
  HelpCircle,
  PlayCircle,
  User,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useTour } from '@/components/tour/TourProvider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { APP_VERSION } from '@/lib/appInfo'
import type { Theme } from '@/types/domain'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

export default function Layout() {
  const { t, i18n } = useTranslation()
  const { preferences, updatePreferences } = useAppStore()
  const { start, hasSeenTour } = useTour()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    applyTheme(preferences.theme)
  }, [preferences.theme])

  useEffect(() => {
    if (preferences.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [preferences.theme])

  useEffect(() => {
    if (i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language)
    }
  }, [preferences.language, i18n])

  // Auto-start guided tour on very first run
  useEffect(() => {
    if (!hasSeenTour) {
      const id = window.setTimeout(() => start(), 600)
      return () => window.clearTimeout(id)
    }
  }, [hasSeenTour, start])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  function cycleTheme() {
    const order: Theme[] = ['light', 'dark', 'system']
    const current = preferences.theme
    const next = order[(order.indexOf(current) + 1) % order.length]
    updatePreferences({ theme: next })
  }

  function toggleLanguage() {
    updatePreferences({ language: preferences.language === 'it' ? 'en' : 'it' })
  }

  const ThemeIcon =
    preferences.theme === 'dark' ? Moon : preferences.theme === 'light' ? Sun : Monitor

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard'), tour: 'nav-dashboard' },
    { to: '/quick', icon: Calculator, label: t('nav.quick'), tour: 'nav-quick' },
    { to: '/companies', icon: Building2, label: t('nav.companies'), tour: 'nav-companies' },
    { to: '/portfolio', icon: BriefcaseBusiness, label: t('nav.portfolio'), tour: 'nav-portfolio' },
    { to: '/scenarios', icon: FlaskConical, label: t('nav.scenarios'), tour: 'nav-scenarios' },
    { to: '/profiles', icon: User, label: t('nav.profiles'), tour: 'nav-profiles' },
    { to: '/assumptions', icon: BookOpen, label: t('nav.assumptions'), tour: 'nav-assumptions' },
    { to: '/compare', icon: GitCompareArrows, label: t('nav.compare'), tour: 'nav-compare' },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col gap-1 p-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Cpu className="size-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-sidebar-foreground">Cowork</p>
          <p className="text-xs leading-tight text-muted-foreground">Estimator</p>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1" data-tour="nav">
        {navItems.map(({ to, icon: Icon, label, tour }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            data-tour={tour}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <Separator className="my-2" />

      {/* Bottom actions */}
      <div className="flex flex-col gap-1">
        <div data-tour="theme-toggle" className="flex flex-col gap-1">
          <button
            onClick={cycleTheme}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ThemeIcon className="size-[18px] shrink-0" />
            <span className="truncate">{t(`settings.themes.${preferences.theme}`)}</span>
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Languages className="size-[18px] shrink-0" />
            <span className="truncate">
              {preferences.language === 'it' ? 'Italiano' : 'English'}
            </span>
          </button>
        </div>

        <NavLink
          to="/help"
          data-tour="nav-help"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          }
        >
          <HelpCircle className="size-[18px] shrink-0" />
          <span className="truncate">{t('nav.help')}</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          }
        >
          <Settings className="size-[18px] shrink-0" />
          <span className="truncate">{t('nav.settings')}</span>
        </NavLink>

        {/* Version */}
        <p className="px-3 pt-2 text-[11px] text-muted-foreground/70">
          v{APP_VERSION}
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-sidebar shadow-xl animate-in slide-in-from-left">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-4" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Global top bar (all viewports) */}
        <header className="flex items-center gap-3 border-b bg-background px-4 py-2.5">
          {/* Mobile: hamburger + app name */}
          <Button
            variant="ghost"
            size="icon"
            className="size-9 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <Cpu className="size-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Cowork Estimator</span>
          </div>

          {/* Right-aligned actions: always-available Start tour */}
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={start}
              data-tour="start-tour-button"
              aria-label={t('tour.restart')}
            >
              <PlayCircle className="size-4" />
              <span className="hidden sm:inline">{t('tour.restart')}</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
