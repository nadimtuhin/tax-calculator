import { useCallback, useEffect, useMemo, useState } from 'react'
import { BandBars } from './components/BandBars'
import { BandFlow } from './components/BandFlow'
import { MonthChips } from './components/MonthChips'
import { MonthTimeline } from './components/MonthTimeline'
import { EmployerName } from './components/EmployerName'
import { PaySlider } from './components/PaySlider'
import {
  BONUS_TYPES,
  MONTHS,
  YEARS,
  addJobToChain,
  canAddJobToChain,
  computeTax,
  createInitialState,
  isAnswered,
  pickJobMonth,
  presetScenario,
  raiseRangeFor,
  scenarioOf,
  syncEmployerNames,
  taka,
} from './lib/scenario'
import './App.css'

const titles: Record<string, string> = {
  none: 'Salary',
  bonus: 'Salary and bonuses',
  raise: 'Salary and raise',
  jobchange: 'Employers',
  missed: 'Salary',
  combo: 'Income details',
  questions: '',
}

const flowTitles: Record<string, string> = {
  none: 'Salary to tax',
  bonus: 'Salary and bonuses to tax',
  raise: 'Raise to tax',
  jobchange: 'Employers to tax',
  missed: 'Pay received to tax',
  combo: 'All income to tax',
}

const QUESTIONS = [
  { n: 1, key: 'raise' as const, short: 'Raise', text: 'Did your salary increase this year?' },
  { n: 2, key: 'job' as const, short: 'Job change', text: 'Did you change jobs?' },
  { n: 3, key: 'missed' as const, short: 'Unpaid months', text: 'Were any months unpaid?' },
  { n: 4, key: 'bonus' as const, short: 'Bonus', text: 'Any bonus or other income?' },
]

function getScenarioFromUrl() {
  const p = new URLSearchParams(window.location.search).get('scenario')
  return p || 'questions'
}

function App() {
  const [s, setS] = useState(() => createInitialState())
  const [editing, setEditing] = useState(false)
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 390)

  useEffect(() => {
    document.title = 'Bangladesh income tax calculator (v2)'
  }, [])

  useEffect(() => {
    const id = getScenarioFromUrl()
    setS((prev) => {
      const next = { ...prev, ...createInitialState() }
      presetScenario(next, id)
      return next
    })
  }, [])

  useEffect(() => {
    const on = () => setVw(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const answered = isAnswered(s)
  const scenario = scenarioOf(s)
  const tax = useMemo(() => computeTax(s), [s])
  const { actual, baseline, result, baselineResult, bands, error: taxError } = tax
  const raiseRange = raiseRangeFor(s)

  useEffect(() => {
    const [a, b] = raiseRange
    if (s.raiseMonth < a) setS((st) => ({ ...st, raiseMonth: a }))
    else if (s.raiseMonth > b) setS((st) => ({ ...st, raiseMonth: b }))
  }, [raiseRange, s.raiseMonth])

  const W = vw < 560 ? 340 : 600
  const ghostTax = useMemo(() => computeTax({ ...s, raise: false, job: false, missed: false, bonus: false, items: [] }), [s.year, s.salary, s.investments, s.tds])

  const setAnswer = useCallback((key: 'raise' | 'job' | 'missed' | 'bonus', v: boolean) => {
    setS((st) => {
      const next = { ...st, [key]: v }
      if (key === 'bonus' && v && !next.items.length) {
        next.items = [{ type: 'other', amount: 50000, month: 5 }]
      }
      return next
    })
  }, [])

  const toggleMissed = (m: number) => {
    setS((st) => {
      const missedSet = [...st.missedSet]
      const i = missedSet.indexOf(m)
      if (i >= 0) missedSet.splice(i, 1)
      else missedSet.push(m)
      return { ...st, missedSet }
    })
  }

  const handlePickJobMonth = (index: number, k: number) => {
    setS((st) => {
      const jobs = st.jobs.map((j) => ({ ...j }))
      pickJobMonth(jobs, index, k)
      return { ...st, jobs }
    })
  }

  const addJob = () => {
    setS((st) => {
      if (!canAddJobToChain(st.jobs)) return st
      const jobs = st.jobs.map((j) => ({ ...j }))
      addJobToChain(jobs)
      return { ...st, jobs }
    })
  }

  const removeJob = (i: number) => {
    setS((st) => {
      if (st.jobs.length <= 1) return st
      const jobs = st.jobs.filter((_, idx) => idx !== i)
      syncEmployerNames(jobs)
      return { ...st, jobs }
    })
  }

  const typeLabel = (id: string) => (BONUS_TYPES.find((t) => t.id === id) || {}).label || ''
  const bonusSegs = actual.segments.filter((q: { kind?: string }) => q.kind === 'bonus')
  const paidMonths = actual.pays.filter((p) => p > 0).length

  const bandsOf = (r: typeof result) =>
    r
      ? r.slab_breakdown
          .filter((b) => b.taxable_amount_bdt > 0)
          .map((b) => ({
            ...b,
            color: bands.find((x) => x.rate_percent === b.rate_percent)?.color || '#cfe6d6',
            id: 'slab-' + b.rate_percent,
          }))
      : []

  const flowTitle = flowTitles[scenario] || ''
  const displayResult = answered ? result : ghostTax.result
  const displayActual = answered ? actual : ghostTax.actual
  const displayBands = answered ? bands : ghostTax.bands

  return (
    <div className="i3">
      <p className="banner">
        Mockup. Names and amounts are SAMPLE data. Tax figures come from the existing calculator. General information, not tax advice.
      </p>
      <header className="site-nav">
        <a className="brand" href="https://tax.nadimtuhin.com/" aria-label="BD Tax Calculator home">
          <span className="mark">tb</span>
        </a>
        <nav>
          <a href="/v2/" className="on">
            Calculator
          </a>
          <a href="https://tax.nadimtuhin.com/blog">Blog</a>
          <a href="https://tax.nadimtuhin.com/referrals">Lawyer Referral</a>
        </nav>
      </header>
      <main className="shell">
        <header className="top">
          <div>
            <p className="eyebrow">Income tax · sample data</p>
            <h1>Your income tax</h1>
          </div>
          <div className="seg" role="tablist" aria-label="Fiscal year">
            {YEARS.map((y) => (
              <button
                key={y.id}
                type="button"
                role="tab"
                aria-selected={s.year === y.id}
                className={s.year === y.id ? 'on' : ''}
                onClick={() => setS((st) => ({ ...st, year: y.id }))}
              >
                {y.label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid">
          <aside className="left">
            {answered && !editing ? (
              <section className="card sumq">
                <button type="button" className="chips" onClick={() => setEditing(true)} aria-label="Edit your answers">
                  {QUESTIONS.map((q) => (
                    <span key={q.key} className={s[q.key] ? 'y' : ''}>
                      {q.short}: {s[q.key] ? 'Yes' : 'No'}
                    </span>
                  ))}
                  <em>Edit</em>
                </button>
              </section>
            ) : (
              <section className="card qs">
                <h2>Your year</h2>
                {answered ? (
                  <button type="button" className="done" onClick={() => setEditing(false)}>
                    Done
                  </button>
                ) : null}
                <p className="sub">Answer yes to add details.</p>
                {QUESTIONS.map((q) => (
                  <div key={q.key} className={'q' + (s[q.key] === true ? ' yes' : '')}>
                    <span className="qn">{q.n}</span>
                    <span className="qt">{q.text}</span>
                    <span className="yn">
                      <button type="button" className={s[q.key] === true ? 'on' : ''} onClick={() => setAnswer(q.key, true)}>
                        Yes
                      </button>
                      <button type="button" className={s[q.key] === false ? 'on' : ''} onClick={() => setAnswer(q.key, false)}>
                        No
                      </button>
                    </span>
                  </div>
                ))}
              </section>
            )}

            {answered ? (
              <section className="card fields">
                <h2>{titles[scenario]}</h2>
                {!s.job ? (
                  <PaySlider
                    value={s.salary}
                    onChange={(v) => setS((st) => ({ ...st, salary: v }))}
                    label={s.raise ? 'Monthly salary before raise' : 'Monthly salary'}
                  />
                ) : null}
                {s.raise ? (
                  <>
                    <PaySlider
                      value={s.raiseAfter}
                      onChange={(v) => setS((st) => ({ ...st, raiseAfter: v }))}
                      label={'Monthly salary after raise' + (s.job ? ' (last employer)' : '')}
                      max={400000}
                    />
                    <p className="lbl">
                      Raise started in: <b>{MONTHS[s.raiseMonth]}</b>
                    </p>
                    <MonthChips
                      from={s.raiseMonth}
                      to={s.raiseMonth}
                      min={raiseRange[0]}
                      max={raiseRange[1]}
                      label="Raise month"
                      onPick={(i) => setS((st) => ({ ...st, raiseMonth: i }))}
                    />
                  </>
                ) : null}
                {s.job ? (
                  <>
                    {s.jobs.map((j, i) => (
                      <div key={i} className="emp">
                        <div className="eh">
                          <i style={{ background: ['#1f3d30', '#2f6a4f', '#4d8c6f', '#7fae96'][i % 4] }} />
                          <EmployerName
                            value={j.name}
                            onSave={(name) => {
                              j.name = name
                              j.customName = true
                              setS((st) => ({ ...st, jobs: [...st.jobs] }))
                            }}
                          />
                          <small>
                            {MONTHS[j.from]}–{MONTHS[j.to]}
                          </small>
                          {s.jobs.length > 1 ? (
                            <button type="button" className="x" onClick={() => removeJob(i)} aria-label="Remove employer">
                              ×
                            </button>
                          ) : null}
                        </div>
                        <p className="lbl">Months worked: tap first and last month</p>
                        <MonthChips from={j.from} to={j.to} label={j.name + ' months'} onPick={(k) => handlePickJobMonth(i, k)} />
                        <PaySlider value={j.pay} onChange={(v) => { j.pay = v; setS((st) => ({ ...st, jobs: [...st.jobs] })) }} label="Monthly salary" />
                      </div>
                    ))}
                    {canAddJobToChain(s.jobs) ? (
                      <button type="button" className="add" onClick={addJob}>
                        + Add employer
                      </button>
                    ) : null}
                  </>
                ) : null}
                {s.bonus ? (
                  <>
                    <p className="lbl sec">Bonus and other income</p>
                    {s.items.map((it, i) => (
                      <div key={i} className="emp bn">
                        <div className="eh">
                          <i style={{ background: '#c98a1b' }} />
                          <span className="nm">{typeLabel(it.type)}</span>
                          <small>{MONTHS[it.month]}</small>
                          <button type="button" className="x" onClick={() => setS((st) => ({ ...st, items: st.items.filter((_, idx) => idx !== i) }))} aria-label="Remove item">
                            ×
                          </button>
                        </div>
                        <div className="types">
                          {BONUS_TYPES.map((t) => (
                            <button key={t.id} type="button" className={it.type === t.id ? 'on' : ''} onClick={() => { it.type = t.id; setS((st) => ({ ...st, items: [...st.items] })) }}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                        <PaySlider
                          value={it.amount}
                          onChange={(v) => { it.amount = v; setS((st) => ({ ...st, items: [...st.items] })) }}
                          label="Amount"
                          min={0}
                          max={600000}
                          step={5000}
                        />
                        <p className="lbl">Month received</p>
                        <MonthChips from={it.month} to={it.month} label={typeLabel(it.type) + ' month'} onPick={(k) => { it.month = k; setS((st) => ({ ...st, items: [...st.items] })) }} />
                      </div>
                    ))}
                    <button type="button" className="add" onClick={() => setS((st) => ({ ...st, items: [...st.items, { type: 'other', amount: 50000, month: 5 }] }))}>
                      + Add bonus or income
                    </button>
                    <p className="fine">Type is a label only. The calculator adds every item to income.</p>
                  </>
                ) : null}
                {s.missed ? <p className="hint">Tap months to mark them unpaid.</p> : null}
                <details className="more">
                  <summary>Investment and tax already paid</summary>
                  <PaySlider value={s.investments} onChange={(v) => setS((st) => ({ ...st, investments: v }))} label="Eligible investment (per year)" min={0} max={1000000} step={10000} />
                  <PaySlider value={s.tds} onChange={(v) => setS((st) => ({ ...st, tds: v }))} label="Tax already deducted (TDS)" min={0} max={500000} step={5000} />
                </details>
              </section>
            ) : null}
            <a className="lawyer" href="https://tax.nadimtuhin.com/referrals">
              Ask a lawyer →
            </a>
          </aside>

          <section className="right">
            {taxError ? (
              <div className="card pad error" role="alert">
                <p>Tax calculation could not run.</p>
                <p className="err-detail">{taxError}</p>
              </div>
            ) : null}
            {displayResult ? (
              <>
                {!answered ? (
                  <div className="ghost-wrap">
                    <div className="ghost">
                      <BandFlow segments={displayActual.segments as never} result={displayResult as never} bands={displayBands} width={W} />
                    </div>
                    <div className="ghost-msg">
                      <b>Your tax breakdown appears here</b>
                      <span>Answer the four questions. Preview uses a sample salary.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="sum">
                      <div>
                        <p className="k">{displayResult.label} · estimated tax payable</p>
                        <p className="big">{taka(displayResult.payable_tax_bdt)}</p>
                      </div>
                      <dl>
                        <div>
                          <dt>Income received</dt>
                          <dd>{taka(actual.total)}</dd>
                        </div>
                        <div>
                          <dt>Taxable income</dt>
                          <dd>{taka(displayResult.taxable_income_bdt)}</dd>
                        </div>
                        <div>
                          <dt>Total tax</dt>
                          <dd>{taka(displayResult.total_tax_bdt)}</dd>
                        </div>
                      </dl>
                    </div>
                    {scenario !== 'none' ? (
                      <div className="card pad">
                        <h3>
                          {s.missed ? 'Salary by month' : 'Income by month'}
                          <small>Jul–Jun · sample</small>
                        </h3>
                        <MonthTimeline pays={actual.pays} gaps={s.missedSet} missedOn={!!s.missed} editable={!!s.missed} onToggle={toggleMissed} />
                        {s.missed ? <p className="note">{paidMonths} of 12 months paid. Tax is based on pay received.</p> : null}
                      </div>
                    ) : null}
                    <div className="card pad">
                      <h3>
                        {flowTitle}
                        <small>{s.year === '2025-26' ? 'FY 2025-26' : 'FY 2026-27'} </small>
                      </h3>
                      <BandFlow segments={actual.segments as never} result={displayResult as never} bands={displayBands} width={W} />
                      {bonusSegs.length ? (
                        <ul className="legend">
                          {bonusSegs.map((b) => {
                            const row = b as { id: string; name: string; range: string; amount: number }
                            return (
                            <li key={row.id}>
                              <i />
                              <span>
                                {row.name} · {row.range}
                              </span>
                              <b>{taka(row.amount)}</b>
                            </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                    {s.raise && baselineResult && result ? (
                      <div className="card pad">
                        <h3>
                          Tax with and without the raise
                          <small>Same year</small>
                        </h3>
                        <BandBars
                          before={baselineResult as never}
                          after={result as never}
                          bandsOf={bandsOf as never}
                          totals={{ before: baseline.total, after: actual.total }}
                        />
                      </div>
                    ) : null}
                    <div className="card pad lines">
                      <div>
                        <span>Tax before rebate</span>
                        <b>{taka(displayResult.gross_tax_bdt)}</b>
                      </div>
                      <div>
                        <span>Investment rebate</span>
                        <b>− {taka(displayResult.rebate_bdt)}</b>
                      </div>
                      <div>
                        <span>Tax already deducted</span>
                        <b>− {taka(displayResult.tds_bdt)}</b>
                      </div>
                      <div>
                        <span>Tax after rebate</span>
                        <b>{taka(displayResult.total_tax_bdt)}</b>
                      </div>
                      {displayResult.is_minimum_tax_applied ? (
                        <div className="mt">
                          <span>Minimum tax applied</span>
                        </div>
                      ) : null}
                      <div className="due">
                        <span>Tax payable</span>
                        <b>{taka(displayResult.payable_tax_bdt)}</b>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </section>
        </div>
      </main>
      {answered && result ? (
        <div className="bar">
          <span>Tax payable</span>
          <b>{taka(result.payable_tax_bdt)}</b>
        </div>
      ) : null}
    </div>
  )
}

export default App