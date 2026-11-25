import { taka } from '../lib/scenario'

type TaxResult = {
  taxable_income_bdt: number
  total_tax_bdt: number
  slab_breakdown: Array<{ id: string; rate_percent: number; taxable_amount_bdt: number; tax_bdt: number; color?: string }>
}

type Props = {
  before: TaxResult
  after: TaxResult
  bandsOf: (r: TaxResult) => Array<{ color: string; rate_percent: number; taxable_amount_bdt: number; id: string }>
  totals: { before: number; after: number }
}

export function BandBars({ before, after, bandsOf, totals }: Props) {
  const mk = (label: string, r: TaxResult, tot: number) => ({
    label,
    sub: taka(tot) + ' income',
    bands: bandsOf(r),
    total: r.taxable_income_bdt || 1,
    tax: r.total_tax_bdt,
  })
  const rows = [mk('Without the raise', before, totals.before), mk('With the raise', after, totals.after)]
  const delta = after.total_tax_bdt - before.total_tax_bdt
  return (
    <div className="bb">
      {rows.map((row) => (
        <div key={row.label} className="row">
          <div className="head">
            <b>{row.label}</b>
            <span>{row.sub}</span>
          </div>
          <div className="bar">
            {row.bands.map((b) => (
              <i
                key={b.id}
                style={{ flex: b.taxable_amount_bdt, background: b.color }}
                title={`${b.rate_percent}%`}
              >
                {b.taxable_amount_bdt / row.total > 0.12 ? <small>{b.rate_percent}%</small> : null}
              </i>
            ))}
          </div>
          <div className="foot">
            <span>Tax {taka(row.tax)}</span>
          </div>
        </div>
      ))}
      {delta !== 0 ? (
        <p className="delta">
          The raise {delta > 0 ? 'adds' : 'cuts'}{' '}
          <b>{taka(Math.abs(delta))}</b> a year in tax, about <b>{taka(Math.abs(delta) / 12)}</b> a month.
        </p>
      ) : null}
    </div>
  )
}