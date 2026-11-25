import { MONTHS } from '../lib/scenario'

type Props = {
  from: number
  to: number
  label: string
  min?: number
  max?: number
  onPick: (i: number) => void
}

export function MonthChips({ from, to, label, min = 0, max = 11, onPick }: Props) {
  return (
    <div className="mc" role="group" aria-label={label}>
      {MONTHS.map((m, i) => (
        <button
          key={m}
          type="button"
          disabled={i < min || i > max}
          aria-pressed={i >= from && i <= to}
          className={[i >= from && i <= to ? 'on' : '', i === from || i === to ? 'edge' : ''].filter(Boolean).join(' ')}
          onClick={() => onPick(i)}
        >
          {m}
        </button>
      ))}
    </div>
  )
}