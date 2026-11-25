/**
 * v2 scenario → engine inputs: hand-built states and pinned payable_tax_bdt fixtures.
 * Values were recorded once from calculateTaxForYear on 2026-27, general, investments 200k, tds 0.
 */
import {
  createInitialState,
  computeTax,
  buildScenario,
  addJobToChain,
  canAddJobToChain,
  pickJobMonth,
  clampJobChain,
  BONUS_TYPES,
} from '../../apps/web-v2/src/lib/scenario.js';

const FY = '2026-27';

function baseState() {
  const s = createInitialState();
  s.year = FY;
  s.investments = 200_000;
  s.tds = 0;
  return s;
}

function answered(s, flags) {
  s.raise = flags.raise ?? false;
  s.job = flags.job ?? false;
  s.missed = flags.missed ?? false;
  s.bonus = flags.bonus ?? false;
}

describe('v2 scenario fixtures (pinned payables)', () => {
  test('missed Oct+Nov only at 85,000/mo → 850,000 salary', () => {
    const s = baseState();
    answered(s, { missed: true });
    s.salary = 85_000;
    s.missedSet = [3, 4];
    const { actual, result } = computeTax(s);
    expect(actual.salaryTotal).toBe(850_000);
    expect(result.payable_tax_bdt).toBe(5_000);
  });

  test.each([
    [0, 1_608_000, 71_600],
    [6, 1_314_000, 36_400],
    [11, 1_069_000, 11_900],
  ])('raise start month %i', (raiseMonth, salaryTotal, payable) => {
    const s = baseState();
    answered(s, { raise: true });
    s.salary = 85_000;
    s.raiseAfter = 134_000;
    s.raiseMonth = raiseMonth;
    const { actual, result } = computeTax(s);
    expect(actual.salaryTotal).toBe(salaryTotal);
    expect(result.payable_tax_bdt).toBe(payable);
  });

  test('combo salary 1,080,000 + festival 100,000 + performance 60,000', () => {
    const s = baseState();
    answered(s, { bonus: true });
    s.salary = 90_000;
    s.items = [
      { type: 'festival', amount: 100_000, month: 3 },
      { type: 'performance', amount: 60_000, month: 8 },
    ];
    const { actual, result } = computeTax(s);
    expect(actual.salaryTotal).toBe(1_080_000);
    expect(actual.extra.bonus).toBe(100_000);
    expect(actual.extra.bonus2).toBe(60_000);
    expect(actual.extra.additional_income).toBe(0);
    expect(result.payable_tax_bdt).toBe(29_000);
  });

  test('overtime/arrears/other map to additional_income only', () => {
    const s = baseState();
    answered(s, { bonus: true });
    s.salary = 85_000;
    s.items = [
      { type: 'festival', amount: 40_000, month: 1 },
      { type: 'overtime', amount: 50_000, month: 2 },
      { type: 'arrears', amount: 30_000, month: 4 },
      { type: 'other', amount: 20_000, month: 5 },
    ];
    const { actual } = computeTax(s);
    expect(actual.extra.bonus).toBe(40_000);
    expect(actual.extra.bonus2).toBe(0);
    expect(actual.extra.additional_income).toBe(50_000 + 30_000 + 20_000);
    BONUS_TYPES.filter((t) => t.field === 'additional_income').forEach((t) => {
      const item = s.items.find((i) => i.type === t.id);
      if (item) expect(actual.extra.additional_income).toBeGreaterThanOrEqual(item.amount);
    });
  });
});

describe('v2 employer months (no double count)', () => {
  test('+ Add employer chains after prior job; salary counted once per month', () => {
    const s = baseState();
    answered(s, { job: true });
    s.jobs[1].to = 10;
    clampJobChain(s.jobs);
    addJobToChain(s.jobs);
    const after = buildScenario(s).salaryTotal;
    expect(after).toBeLessThan(1_584_000);
    expect(after).toBe(1_038_000);
    expect(s.jobs[2].from).toBe(11);
    expect(s.jobs[1].to).toBe(10);
  });

  test('overlapping ranges count each calendar month at most once', () => {
    const s = baseState();
    answered(s, { job: true });
    s.jobs = [
      { name: 'A', customName: true, from: 0, to: 11, pay: 100_000 },
      { name: 'B', customName: true, from: 6, to: 11, pay: 50_000 },
    ];
    const { pays, salaryTotal } = buildScenario(s);
    pays.forEach((p) => {
      expect(p).toBeLessThanOrEqual(100_000);
    });
    expect(salaryTotal).toBe(12 * 100_000);
    expect(salaryTotal).not.toBe(12 * 100_000 + 6 * 50_000);
  });

  test('pickJobMonth on edge moves neighbor boundary', () => {
    const s = baseState();
    s.jobs = [
      { name: 'Previous job', customName: false, from: 0, to: 5, pay: 80_000 },
      { name: 'Current job', customName: false, from: 6, to: 11, pay: 90_000 },
    ];
    clampJobChain(s.jobs);
    pickJobMonth(s.jobs, 0, 7);
    expect(s.jobs[0].to).toBe(7);
    expect(s.jobs[1].from).toBe(8);
  });

  test('three-job chain: May tap on first employer drops clamped June duplicates', () => {
    const s = baseState();
    answered(s, { job: true });
    s.jobs = [
      { name: 'A', customName: true, from: 0, to: 5, pay: 78_000 },
      { name: 'B', customName: true, from: 6, to: 8, pay: 96_000 },
      { name: 'C', customName: true, from: 9, to: 11, pay: 90_000 },
    ];
    clampJobChain(s.jobs);
    pickJobMonth(s.jobs, 0, 10);
    expect(s.jobs).toHaveLength(2);
    expect(s.jobs[0].from).toBe(0);
    expect(s.jobs[0].to).toBe(10);
    expect(s.jobs[1].from).toBe(11);
    expect(s.jobs[1].to).toBe(11);
    expect(s.jobs[1].pay).toBe(96_000);
    const { salaryTotal, pays } = buildScenario(s);
    expect(pays.filter((p) => p === 90_000)).toHaveLength(0);
    expect(salaryTotal).toBe(11 * 78_000 + 96_000);
  });

  test('tapping June on first employer drops later jobs (no 11–11 overlap)', () => {
    const s = baseState();
    answered(s, { job: true });
    pickJobMonth(s.jobs, 0, 11);
    expect(s.jobs).toHaveLength(1);
    expect(s.jobs[0].from).toBe(0);
    expect(s.jobs[0].to).toBe(11);
    expect(buildScenario(s).salaryTotal).toBe(12 * 78_000);
  });

  test('add employer when chain ends in June is a no-op', () => {
    const s = baseState();
    answered(s, { job: true });
    pickJobMonth(s.jobs, 0, 11);
    expect(canAddJobToChain(s.jobs)).toBe(false);
    const before = s.jobs.length;
    addJobToChain(s.jobs);
    expect(s.jobs).toHaveLength(before);
    expect(buildScenario(s).salaryTotal).toBe(12 * 78_000);
  });

  test.each([
    [[{ from: 0, to: 11, pay: 85_000 }], 1],
    [
      [
        { from: 0, to: 5, pay: 78_000 },
        { from: 6, to: 11, pay: 96_000 },
      ],
      2,
    ],
    [
      [
        { from: 0, to: 5, pay: 78_000 },
        { from: 6, to: 8, pay: 96_000 },
        { from: 9, to: 11, pay: 90_000 },
      ],
      3,
    ],
  ])('month taps keep disjoint FY months (%i employers)', (templateJobs, employerCount) => {
    expect(templateJobs).toHaveLength(employerCount)
    const expectedTaps = templateJobs.length * 12
    let taps = 0
    for (let jobIndex = 0; jobIndex < templateJobs.length; jobIndex++) {
      for (let month = 0; month < 12; month++) {
        taps += 1
        const jobs = templateJobs.map((j, i) => ({
          name: String(i),
          customName: true,
          from: j.from,
          to: j.to,
          pay: j.pay,
        }))
        clampJobChain(jobs)
        pickJobMonth(jobs, jobIndex, month)
        for (let i = 1; i < jobs.length; i++) {
          expect(jobs[i].from).toBeGreaterThan(jobs[i - 1].to)
        }
        const covered = new Set()
        jobs.forEach((j) => {
          expect(j.from).toBeLessThanOrEqual(j.to)
          expect(j.from).toBeLessThanOrEqual(11)
          for (let m = j.from; m <= j.to; m++) {
            expect(covered.has(m)).toBe(false)
            covered.add(m)
          }
        })
        const state = {
          job: true,
          missed: false,
          raise: false,
          bonus: false,
          missedSet: [],
          items: [],
          jobs,
        }
        const { pays, segments } = buildScenario(state)
        jobs.forEach((j, ei) => {
          const contrib = segments.filter((seg) => seg.employer === ei).reduce((a, seg) => a + seg.amount, 0)
          expect(contrib).toBeGreaterThan(0)
        })
        for (let m = 0; m < 12; m++) {
          if (covered.has(m)) expect(pays[m]).toBeGreaterThan(0)
        }
      }
    }
    expect(taps).toBe(expectedTaps)
  })
});