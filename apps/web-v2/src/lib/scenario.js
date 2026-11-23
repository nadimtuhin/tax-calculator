import { calculateTaxForYear, DEFAULT_FISCAL_YEAR } from '../../../../src/utils/taxEngine.js'

export const YEARS = [
  { id: '2025-26', label: 'FY 2025-26' },
  { id: '2026-27', label: 'FY 2026-27' },
]
export const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
export const BAND_COLORS = ['#cfe6d6', '#8fcba7', '#e9c75f', '#e48d4b', '#cc4f3d', '#7b2b3d']

export const BONUS_TYPES = [
  { id: 'festival', label: 'Festival bonus', field: 'bonus' },
  { id: 'performance', label: 'Performance bonus', field: 'bonus2' },
  { id: 'overtime', label: 'Overtime', field: 'additional_income' },
  { id: 'arrears', label: 'Arrears', field: 'additional_income' },
  { id: 'other', label: 'Other earning', field: 'additional_income' },
]

export const taka = (n) => '৳' + Math.round(n || 0).toLocaleString('en-BD')

export function employerLabel(index, total) {
  if (total <= 1) return 'Salary'
  if (index === 0) return 'Previous job'
  if (index === total - 1) return 'Current job'
  return `Job ${index + 1}`
}

export function syncEmployerNames(jobs) {
  jobs.forEach((j, i) => {
    if (!j.customName) j.name = employerLabel(i, jobs.length)
  })
}

/** Keep employer month ranges ordered, gapless, and non-overlapping along the FY timeline. */
export function clampJobChain(jobs) {
  if (!jobs.length) return
  jobs[0].from = Math.max(0, Math.min(11, jobs[0].from))
  for (let i = 0; i < jobs.length; i++) {
    jobs[i].from = Math.max(0, Math.min(11, jobs[i].from))
    jobs[i].to = Math.max(jobs[i].from, Math.min(11, jobs[i].to))
    if (i > 0) {
      const prevEnd = jobs[i - 1].to
      if (jobs[i].from <= prevEnd) jobs[i].from = Math.min(prevEnd + 1, 11)
      jobs[i].to = Math.max(jobs[i].to, jobs[i].from)
    }
    if (i < jobs.length - 1 && jobs[i].to >= jobs[i + 1].from) {
      jobs[i].to = Math.max(jobs[i].from, jobs[i + 1].from - 1)
    }
  }
  jobs[jobs.length - 1].to = Math.min(11, jobs[jobs.length - 1].to)
}

export function pickJobMonth(jobs, index, k) {
  const j = jobs[index]
  if (k < j.from) {
    j.from = k
    if (index > 0) jobs[index - 1].to = k - 1
  } else if (k > j.to) {
    j.to = k
    if (index < jobs.length - 1) jobs[index + 1].from = k + 1
  } else if (k - j.from <= j.to - k) {
    j.from = k
  } else {
    j.to = k
  }
  clampJobChain(jobs)
}

export function addJobToChain(jobs) {
  const last = jobs[jobs.length - 1]
  const from = Math.min(last.to + 1, 11)
  jobs.push({ name: '', customName: false, from, to: 11, pay: 90000 })
  clampJobChain(jobs)
  syncEmployerNames(jobs)
}

const run = (year, annual, investments, tds, extra = {}) => {
  try {
    const data = calculateTaxForYear({
      year,
      income: {
        gross_salary: Math.max(0, annual),
        period: 'annual',
        bonus: extra.bonus || 0,
        bonus2: extra.bonus2 || 0,
        additional_income: extra.additional_income || 0,
      },
      investments: Number(investments) || 0,
      tds: Number(tds) || 0,
    })
    return { ok: true, data }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, message }
  }
}

export function createInitialState() {
  const jobs = [
    { name: 'Previous job', customName: false, from: 0, to: 5, pay: 78000 },
    { name: 'Current job', customName: false, from: 6, to: 11, pay: 96000 },
  ]
  clampJobChain(jobs)
  syncEmployerNames(jobs)
  return {
    year: DEFAULT_FISCAL_YEAR,
    raise: null,
    job: null,
    missed: null,
    bonus: null,
    items: [],
    salary: 85000,
    raiseAfter: 98000,
    raiseMonth: 6,
    jobs,
    missedSet: [3, 4],
    investments: 200000,
    tds: 0,
  }
}

export function isAnswered(s) {
  return s.raise !== null && s.job !== null && s.missed !== null && s.bonus !== null
}

export function scenarioOf(s) {
  if (!isAnswered(s)) return 'questions'
  const n = [s.raise, s.job, s.missed, s.bonus].filter(Boolean).length
  if (n === 0) return 'none'
  if (n > 1) return 'combo'
  if (s.raise) return 'raise'
  if (s.job) return 'jobchange'
  if (s.missed) return 'missed'
  return 'bonus'
}

function employers(s, withRaise) {
  const list = s.job
    ? s.jobs.map((j) => ({ ...j }))
    : [{ name: 'Salary', from: 0, to: 11, pay: s.salary }]
  return list.map((e, i) => ({ ...e, raise: withRaise && s.raise && i === list.length - 1 }))
}

export function buildScenario(s, withRaise = true) {
  const missed = s.missed ? s.missedSet : []
  const pays = Array(12).fill(0)
  const monthEmployer = Array(12).fill(-1)
  const segments = []

  employers(s, withRaise).forEach((e, ei) => {
    const cut = e.raise ? Math.min(Math.max(s.raiseMonth, e.from), e.to + 1) : e.to + 1
    const parts = [{ a: e.from, b: cut - 1, pay: e.pay, tag: e.raise && cut <= e.to ? 'before raise' : '' }]
    if (e.raise && cut <= e.to) parts.push({ a: cut, b: e.to, pay: s.raiseAfter, tag: 'after raise' })

    parts.forEach((p) => {
      let amt = 0
      for (let m = p.a; m <= p.b; m++) {
        if (missed.includes(m)) continue
        if (monthEmployer[m] !== -1 && monthEmployer[m] !== ei) continue
        monthEmployer[m] = ei
        pays[m] = p.pay
        amt += p.pay
      }
      if (p.b >= p.a && amt > 0) {
        segments.push({
          id: ei + '-' + p.a,
          name: e.name,
          range: MONTHS[p.a] + (p.b > p.a ? '–' + MONTHS[p.b] : ''),
          tag: p.tag,
          amount: amt,
          employer: ei,
        })
      }
    })
  })

  const salaryTotal = pays.reduce((a, b) => a + b, 0)
  const extra = { bonus: 0, bonus2: 0, additional_income: 0 }
  if (s.bonus) {
    s.items.forEach((it, k) => {
      const t = BONUS_TYPES.find((b) => b.id === it.type) || BONUS_TYPES[4]
      if (it.amount > 0) {
        extra[t.field] += it.amount
        pays[it.month] += it.amount
        segments.push({
          id: 'b' + k,
          kind: 'bonus',
          name: t.label,
          range: MONTHS[it.month],
          tag: '',
          amount: it.amount,
          employer: 4 + k,
        })
      }
    })
  }
  return {
    pays,
    segments,
    salaryTotal,
    extra,
    total: salaryTotal + extra.bonus + extra.bonus2 + extra.additional_income,
  }
}

export function computeTax(s) {
  const actual = buildScenario(s, true)
  const baseline = buildScenario(s, false)
  const resultWrap = run(s.year, actual.salaryTotal, s.investments, s.tds, actual.extra)
  const baselineWrap = run(s.year, baseline.salaryTotal, s.investments, s.tds, baseline.extra)
  const bands = (r) =>
    r
      ? r.slab_breakdown
          .filter((b) => b.taxable_amount_bdt > 0)
          .map((b) => ({
            ...b,
            color: BAND_COLORS[Math.min(r.slab_breakdown.indexOf(b), 5)],
          }))
      : []
  return {
    actual,
    baseline,
    result: resultWrap.ok ? resultWrap.data : null,
    baselineResult: baselineWrap.ok ? baselineWrap.data : null,
    error: resultWrap.ok ? null : resultWrap.message,
    bands: resultWrap.ok ? bands(resultWrap.data) : [],
  }
}

export function presetScenario(s, id) {
  const m = {
    questions: [null, null, null, null],
    none: [false, false, false, false],
    raise: [true, false, false, false],
    jobchange: [false, true, false, false],
    missed: [false, false, true, false],
    bonus: [false, false, false, true],
    combo: [true, true, false, true],
  }
  const v = m[id] || m.questions
  s.raise = v[0]
  s.job = v[1]
  s.missed = v[2]
  s.bonus = v[3]
  s.items = v[3]
    ? [
        { type: 'festival', amount: 100000, month: 3 },
        { type: 'performance', amount: 60000, month: 8 },
      ]
    : []
  if (id === 'combo') {
    s.raiseMonth = 9
    s.raiseAfter = 108000
  }
  clampJobChain(s.jobs)
  syncEmployerNames(s.jobs)
}

export function raiseRangeFor(s) {
  if (s.job && s.jobs.length) {
    const last = s.jobs[s.jobs.length - 1]
    return [last.from, last.to]
  }
  return [0, 11]
}