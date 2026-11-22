import { MONTHS } from '../lib/scenario'

type Props = {
  pays: number[]
  gaps: number[]
  missedOn: boolean
  editable: boolean
  onToggle: (i: number) => void
}

const short = (v: number) => (v >= 1000 ? Math.round(v / 100) / 10 + 'k' : String(v))

export function MonthTimeline({ pays, gaps, missedOn, editable, onToggle }: Props) {
  const max = Math.max(...pays, 1)
  return (
    <div className="tl" role="group" aria-label="Income by month">
      {MONTHS.map((m, i) => (
        <button
          key={m}
          type="button"
          className={['cell', gaps.includes(i) && missedOn ? 'gap' : '', !pays[i] && !gaps.includes(i) ? 'off' : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => editable && onToggle(i)}
          disabled={!editable}
        >
          <span className="col">
            <i style={{ height: pays[i] ? `${Math.max(14, (pays[i] / max) * 100)}%` : undefined }} />
          </span>
          <b>{m}</b>
          <em>{pays[i] ? short(pays[i]) : gaps.includes(i) && missedOn ? 'unpaid' : '–'}</em>
        </button>
      ))}
    </div>
  )
}