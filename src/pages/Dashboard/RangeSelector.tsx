import type { RangeMode } from './useDashboardSummary'

interface Props {
  value: RangeMode
  onChange: (v: RangeMode) => void
}

export function RangeSelector({ value, onChange }: Props) {
  const modes: RangeMode[] = ['min', 'mid', 'max']

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted p-0.5 gap-0.5">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wide transition-all
            ${value === m
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
            }`}
          aria-pressed={value === m}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
