import { taka } from '../lib/scenario'

type Props = {
  value: number
  onChange: (v: number) => void
  label: string
  min?: number
  max?: number
  step?: number
  format?: (n: number) => string
}

export function PaySlider({
  value,
  onChange,
  label,
  min = 20000,
  max = 300000,
  step = 1000,
  format = taka,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="ps">
      <span className="top">
        <em>{label}</em>
        <b>{format(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{ '--p': `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="lim">
        <i>{format(min)}</i>
        <i>{format(max)}</i>
      </span>
    </label>
  )
}