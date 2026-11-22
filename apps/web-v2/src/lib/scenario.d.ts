export const YEARS: { id: string; label: string }[]
export const MONTHS: string[]
export const BAND_COLORS: string[]
export const BONUS_TYPES: { id: string; label: string; field: string }[]
export function taka(n: number): string
export function employerLabel(index: number, total: number): string
export function syncEmployerNames(jobs: Job[]): void
export function createInitialState(): ScenarioState
export function isAnswered(s: ScenarioState): boolean
export function scenarioOf(s: ScenarioState): string
export function buildScenario(s: ScenarioState, withRaise?: boolean): BuiltScenario
export function computeTax(s: ScenarioState): TaxBundle
export function presetScenario(s: ScenarioState, id: string): void
export function raiseRangeFor(s: ScenarioState): [number, number]

export type Job = {
  name: string
  customName?: boolean
  from: number
  to: number
  pay: number
}

export type ScenarioState = {
  year: string
  raise: boolean | null
  job: boolean | null
  missed: boolean | null
  bonus: boolean | null
  items: { type: string; amount: number; month: number }[]
  salary: number
  raiseAfter: number
  raiseMonth: number
  jobs: Job[]
  missedSet: number[]
  investments: number
  tds: number
  editing?: boolean
}

export type BuiltScenario = {
  pays: number[]
  segments: Array<Record<string, unknown>>
  salaryTotal: number
  extra: { bonus: number; bonus2: number; additional_income: number }
  total: number
}

export type TaxBundle = {
  actual: BuiltScenario
  baseline: BuiltScenario
  result: Record<string, unknown> & {
    payable_tax_bdt: number
    taxable_income_bdt: number
    gross_tax_bdt: number
    total_tax_bdt: number
    rebate_bdt: number
    tds_bdt: number
    label: string
    is_minimum_tax_applied?: boolean
    slab_breakdown: Array<{ rate_percent: number; taxable_amount_bdt: number; tax_bdt: number }>
    income_summary: { exemptions_bdt: { total: number } }
  }
  baselineResult: TaxBundle['result']
  bands: Array<{ rate_percent: number; taxable_amount_bdt: number; tax_bdt: number; color: string }>
}