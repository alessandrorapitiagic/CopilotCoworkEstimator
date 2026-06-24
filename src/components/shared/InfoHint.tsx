import { HelpCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface InfoHintProps {
  /** i18n key under "hints.*" — e.g. "monthlyCredits" */
  hintKey?: string
  /** Or pass raw text directly (already translated) */
  text?: string
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Visual size of the icon */
  size?: number
}

/**
 * Small contextual help icon. On hover/focus it shows an i18n explanation.
 * Accessible: focusable button with aria-label.
 */
export function InfoHint({
  hintKey,
  text,
  className,
  side = 'top',
  size = 13,
}: InfoHintProps) {
  const { t } = useTranslation()
  const content = text ?? (hintKey ? t(`hints.${hintKey}`) : '')
  if (!content) return null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={content}
          className={cn(
            'inline-flex items-center justify-center text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none align-middle',
            className,
          )}
          onClick={(e) => e.preventDefault()}
        >
          <HelpCircle style={{ width: size, height: size }} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
