import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
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
  Menu,
  X,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
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
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/companies', icon: Building2, label: t('nav.companies') },
    { to: '/scenarios', icon: FlaskConical, label: t('nav.scenarios') },
    { to: '/assumptions', icon: BookOpen, label: t('nav.assumptions') },
    { to: '/compare', icon: GitCompareArrows, label: t('nav.compare') },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col gap-1 p-3">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Cpu className="size-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight text-sidebar-foreground">
            Cowork
          </p>
          <p className="text-xs leading-tight text-muted-foreground">Estimator</p>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar (fixed) */}
      <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
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
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-9"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <Cpu className="size-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">Cowork Estimator</span>
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
