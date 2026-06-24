import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
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
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
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

  useEffect(() => {
    applyTheme(preferences.theme)
  }, [preferences.theme])

  useEffect(() => {
    if (i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language)
    }
  }, [preferences.language, i18n])

  function cycleTheme() {
    const order: Theme[] = ['light', 'dark', 'system']
    const current = preferences.theme
    const next = order[(order.indexOf(current) + 1) % order.length]
    updatePreferences({ theme: next })
  }

  function toggleLanguage() {
    updatePreferences({ language: preferences.language === 'it' ? 'en' : 'it' })
  }

  const ThemeIcon = preferences.theme === 'dark' ? Moon : preferences.theme === 'light' ? Sun : Monitor

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/companies', icon: Building2, label: t('nav.companies') },
    { to: '/scenarios', icon: FlaskConical, label: t('nav.scenarios') },
    { to: '/assumptions', icon: BookOpen, label: t('nav.assumptions') },
    { to: '/compare', icon: GitCompareArrows, label: t('nav.compare') },
  ]

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <aside className="flex w-16 flex-col items-center gap-2 border-r bg-sidebar py-4 lg:w-56 lg:items-start lg:px-3">
          {/* Logo */}
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Cpu className="size-4 text-primary-foreground" />
            </div>
            <span className="hidden text-sm font-semibold text-sidebar-foreground lg:block">
              Cowork Estimator
            </span>
          </div>

          <Separator className="hidden lg:block" />

          {/* Nav */}
          <nav className="flex flex-1 flex-col gap-1 w-full mt-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors lg:w-full
                      ${isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="hidden lg:block">{label}</span>
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  {label}
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>

          <Separator className="hidden lg:block" />

          {/* Bottom actions */}
          <div className="flex flex-col items-center gap-1 lg:w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cycleTheme}
                  className="size-9 lg:w-full lg:justify-start lg:gap-3 lg:px-2 lg:size-auto lg:py-2"
                  aria-label="Toggle theme"
                >
                  <ThemeIcon className="size-4 shrink-0" />
                  <span className="hidden text-sm font-medium lg:block">
                    {t(`settings.themes.${preferences.theme}`)}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {t('settings.theme')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLanguage}
                  className="size-9 lg:w-full lg:justify-start lg:gap-3 lg:px-2 lg:size-auto lg:py-2"
                  aria-label="Toggle language"
                >
                  <Languages className="size-4 shrink-0" />
                  <span className="hidden text-sm font-medium uppercase lg:block">
                    {preferences.language}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {t('settings.language')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `flex size-9 items-center justify-center rounded-md transition-colors lg:w-full lg:justify-start lg:gap-3 lg:px-2 lg:size-auto lg:py-2 text-sm font-medium
                    ${isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`
                  }
                >
                  <Settings className="size-4 shrink-0" />
                  <span className="hidden lg:block">{t('nav.settings')}</span>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {t('nav.settings')}
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
