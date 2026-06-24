import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTour } from './TourProvider'
import { cn } from '@/lib/utils'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8
const CARD_WIDTH = 320
const CARD_GAP = 14

export function TourOverlay() {
  const { t } = useTranslation()
  const { isActive, currentStep, steps, next, prev, stop } = useTour()
  const [rect, setRect] = useState<Rect | null>(null)
  const [, forceTick] = useState(0)

  const step = steps[currentStep]

  // Measure the target element of the current step
  useLayoutEffect(() => {
    if (!isActive || !step) return

    function measure() {
      if (!step.target) {
        setRect(null)
        return
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (!el) {
        setRect(null)
        return
      }
      // Bring into view if needed
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    measure()
    const id = window.setTimeout(measure, 120) // after potential scroll/layout
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [isActive, step, currentStep])

  // Re-render on viewport changes to keep card positioned
  useEffect(() => {
    if (!isActive) return
    const onResize = () => forceTick((x) => x + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isActive])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') stop()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, next, prev, stop])

  if (!isActive || !step) return null

  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Compute card position
  let cardStyle: React.CSSProperties

  if (!rect) {
    // Centered card (welcome / no target)
    cardStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: Math.min(CARD_WIDTH, vw - 32),
    }
  } else {
    const spaceRight = vw - (rect.left + rect.width)
    const spaceBelow = vh - (rect.top + rect.height)
    const width = Math.min(CARD_WIDTH, vw - 32)

    let top: number
    let left: number

    if (spaceRight > width + CARD_GAP + 16) {
      // place to the right
      left = rect.left + rect.width + CARD_GAP
      top = Math.max(16, Math.min(rect.top, vh - 220))
    } else if (spaceBelow > 200) {
      // place below
      top = rect.top + rect.height + CARD_GAP
      left = Math.max(16, Math.min(rect.left, vw - width - 16))
    } else {
      // place above
      top = Math.max(16, rect.top - 200 - CARD_GAP)
      left = Math.max(16, Math.min(rect.left, vw - width - 16))
    }

    cardStyle = { top, left, width }
  }

  const overlay = (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Dim background with a spotlight hole using box-shadow */}
      {rect ? (
        <div
          className="absolute rounded-lg transition-all duration-200 pointer-events-none"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            outline: '2px solid var(--color-primary)',
            outlineOffset: '2px',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Click-catcher to allow closing by clicking the dim area */}
      <div className="absolute inset-0" onClick={stop} />

      {/* Tour card */}
      <div
        className={cn(
          'absolute z-[101] rounded-xl border bg-popover p-4 shadow-2xl animate-in fade-in-0 zoom-in-95',
        )}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-popover-foreground">
            {t(step.titleKey)}
          </h3>
          <button
            onClick={stop}
            className="text-muted-foreground hover:text-foreground transition-colors -mt-0.5 -mr-0.5"
            aria-label={t('tour.skip')}
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {t(step.bodyKey)}
        </p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-4 mb-3">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === currentStep ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t('tour.stepOf', { current: currentStep + 1, total: steps.length })}
          </span>
          <div className="flex items-center gap-1.5">
            {isFirst ? (
              <Button variant="ghost" size="sm" onClick={stop}>
                {t('tour.skip')}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={prev}>
                <ArrowLeft className="size-3.5" />
                {t('tour.prev')}
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? (
                <>
                  <Check className="size-3.5" />
                  {t('tour.finish')}
                </>
              ) : (
                <>
                  {t('tour.next')}
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(overlay, document.body)
}
