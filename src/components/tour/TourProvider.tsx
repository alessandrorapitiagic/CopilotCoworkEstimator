import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const TOUR_SEEN_KEY = 'copilot_cowork_tour_seen_v1'

export interface TourStep {
  /** Matches a `data-tour="<id>"` attribute in the DOM. If omitted, the step is shown centered. */
  target?: string
  titleKey: string
  bodyKey: string
}

interface TourContextValue {
  isActive: boolean
  currentStep: number
  steps: TourStep[]
  start: () => void
  stop: () => void
  next: () => void
  prev: () => void
  goTo: (i: number) => void
  hasSeenTour: boolean
}

const TourContext = createContext<TourContextValue | null>(null)

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  { titleKey: 'tour.welcome.title', bodyKey: 'tour.welcome.body' },
  { target: 'nav', titleKey: 'tour.nav.title', bodyKey: 'tour.nav.body' },
  { target: 'nav-companies', titleKey: 'tour.companies.title', bodyKey: 'tour.companies.body' },
  { target: 'company-new-btn', titleKey: 'tour.companyNew.title', bodyKey: 'tour.companyNew.body' },
  { target: 'nav-scenarios', titleKey: 'tour.scenarios.title', bodyKey: 'tour.scenarios.body' },
  { target: 'wizard-header', titleKey: 'tour.wizardHeader.title', bodyKey: 'tour.wizardHeader.body' },
  { target: 'segments-add', titleKey: 'tour.segmentsAdd.title', bodyKey: 'tour.segmentsAdd.body' },
  { target: 'segments-table', titleKey: 'tour.segmentsTable.title', bodyKey: 'tour.segmentsTable.body' },
  { target: 'theme-toggle', titleKey: 'tour.theme.title', bodyKey: 'tour.theme.body' },
  { target: 'nav-help', titleKey: 'tour.help.title', bodyKey: 'tour.help.body' },
  { target: 'start-tour-button', titleKey: 'tour.restartStep.title', bodyKey: 'tour.restartStep.body' },
]

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(true)

  const steps = DEFAULT_TOUR_STEPS

  // Determine whether the user has seen the tour (first-run detection)
  useEffect(() => {
    try {
      const seen = localStorage.getItem(TOUR_SEEN_KEY)
      setHasSeenTour(seen === '1')
    } catch {
      setHasSeenTour(true)
    }
  }, [])

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // ignore storage errors
    }
    setHasSeenTour(true)
  }, [])

  const start = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    markSeen()
  }, [markSeen])

  const next = useCallback(() => {
    setCurrentStep((s) => {
      if (s >= steps.length - 1) {
        setIsActive(false)
        markSeen()
        return s
      }
      return s + 1
    })
  }, [steps.length, markSeen])

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const goTo = useCallback(
    (i: number) => {
      setCurrentStep(Math.min(Math.max(0, i), steps.length - 1))
    },
    [steps.length],
  )

  const value = useMemo(
    () => ({ isActive, currentStep, steps, start, stop, next, prev, goTo, hasSeenTour }),
    [isActive, currentStep, steps, start, stop, next, prev, goTo, hasSeenTour],
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTour must be used within a TourProvider')
  return ctx
}
