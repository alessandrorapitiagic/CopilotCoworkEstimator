import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WizardStepId } from './useWizard'

interface Props {
  steps: WizardStepId[]
  currentStep: WizardStepId
  onStepClick?: (step: WizardStepId, index: number) => void
  completedUpTo?: number // index (inclusive) of last completed step
}

export function WizardStepper({ steps, currentStep, onStepClick, completedUpTo = -1 }: Props) {
  const { t } = useTranslation()
  const currentIndex = steps.indexOf(currentStep)

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const isActive = step === currentStep
        const isCompleted = i <= completedUpTo || i < currentIndex
        const isClickable = onStepClick && (isCompleted || isActive)

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(step, i)}
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                isActive && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background',
                isCompleted && !isActive && 'bg-primary text-primary-foreground',
                !isActive && !isCompleted && 'border-2 border-muted text-muted-foreground',
                isClickable && !isActive && 'cursor-pointer hover:bg-primary/80 hover:text-primary-foreground',
              )}
              aria-label={t(`wizard.steps.${step}`)}
              aria-current={isActive ? 'step' : undefined}
            >
              {isCompleted && !isActive ? (
                <Check className="size-3.5" />
              ) : (
                i + 1
              )}
            </button>

            {/* Step label — visible on sm+ */}
            <span
              className={cn(
                'ml-1.5 hidden text-xs font-medium sm:block truncate max-w-[72px]',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(`wizard.steps.${step}`)}
            </span>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'mx-2 h-px w-6 flex-shrink-0',
                  isCompleted ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
