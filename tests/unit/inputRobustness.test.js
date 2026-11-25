import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import breakdownStore from '@/store/breakdown';
import { parseAmount, MAX_AMOUNT } from '@/utils/parseAmount';

function makeStore() {
  return createStore({
    modules: {
      salaries: { ...salariesStore, namespaced: false },
      breakdown: { ...breakdownStore, namespaced: false },
    },
  });
}

describe('parseAmount', () => {
  test.each([
    ['', 0],
    ['   ', 0],
    [null, 0],
    [undefined, 0],
    ['abc', 0],
    ['12abc', 0],
    [NaN, 0],
    ['-5000', 0],
    [-5000, 0],
    ['50000', 50000],
    [50000, 50000],
    ['1234.5', 1234.5],
    ['50,000', 50000],
    ['1,00,000', 100000],
    ['৳ 25,000', 25000],
    ['৫০০০০', 50000],
    ['১,২৫,০০০', 125000],
    ['১২.৫', 12.5],
    ['1e400', MAX_AMOUNT],
    [Infinity, MAX_AMOUNT],
    ['Infinity', MAX_AMOUNT],
    ['99999999999999999999999', MAX_AMOUNT],
  ])('parseAmount(%p) -> %p', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });
});

describe('salary store input handling', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });

  test('monthly salary accepts Bangla digits and commas', () => {
    store.commit('changeSubsequentSalaries', { index: 0, value: '৫০,০০০' });
    expect(store.state.salaries.months[0].salary).toBe(50000);
    expect(store.state.salaries.months[11].salary).toBe(50000);
    expect(store.getters.totalSalary).toBe(600000);
  });

  test('non-numeric bonus does not turn the total into NaN', () => {
    store.commit('changeSubsequentSalaries', { index: 0, value: 10000 });
    store.commit('changeBonus', 'abc');
    expect(store.state.salaries.bonus).toBe(0);
    expect(store.getters.totalSalary).toBe(120000);
    expect(Number.isFinite(store.getters.taxableSalary)).toBe(true);
  });

  test('negative income values are clamped to zero', () => {
    store.commit('changeSubsequentSalaries', { index: 0, value: '-10000' });
    store.commit('changeSubsequentTds', { index: 0, value: '-500' });
    store.commit('changeOthers', '-2000');
    store.commit('changeBonus2', -1);
    store.commit('changeParts', { index: 0, part: 'basic', value: '-3000' });
    expect(store.getters.totalSalary).toBe(0);
    expect(store.getters.totalTds).toBe(0);
    expect(store.state.salaries.others).toBe(0);
    expect(store.state.salaries.bonus2).toBe(0);
    expect(store.state.salaries.months[0].breakdown.basic).toBe(0);
  });

  test('salary breakdown parts accept comma-grouped values', () => {
    store.commit('changeParts', { index: 0, part: 'basic', value: '30,000' });
    store.commit('changeParts', { index: 0, part: 'house', value: '১৫,০০০' });
    expect(store.state.salaries.months[0].salary).toBe(45000);
    expect(store.getters.totalSalary).toBe(540000);
  });

  test('huge values stay finite through the tax calculation', () => {
    store.commit('changeOthers', '1e400');
    expect(store.state.salaries.others).toBe(MAX_AMOUNT);
    expect(Number.isFinite(store.getters.totalSalary)).toBe(true);
    expect(Number.isFinite(store.getters.taxableSalary)).toBe(true);
  });

  test('investment amounts are sanitised', () => {
    store.commit('changeInvestment', { index: 0, value: '' });
    expect(store.state.salaries.investments[0].amount).toBe(0);
    store.commit('changeInvestment', { index: 0, value: '1,00,000' });
    expect(store.state.salaries.investments[0].amount).toBe(100000);
    store.commit('changeInvestment', { index: 0, value: '-100' });
    expect(store.state.salaries.investments[0].amount).toBe(0);
    store.commit('changeInvestment', { index: 0, value: 'abc' });
    expect(store.getters.totalInvestment).toBe(0);
  });

  test('FA 2026 extra fields accept Bangla digits and commas', () => {
    store.commit('setSolarElectricityBill', '১২,০০০');
    store.commit('setZakatDonation', '5,000');
    store.commit('setGroupInsuranceReimbursement', '৳ 2,500');
    store.commit('setEarlyRedemptionRebateRepayable', 'Infinity');
    expect(store.state.salaries.solarElectricityBill).toBe(12000);
    expect(store.state.salaries.zakatDonation).toBe(5000);
    expect(store.state.salaries.groupInsuranceReimbursement).toBe(2500);
    expect(store.state.salaries.earlyRedemptionRebateRepayable).toBe(MAX_AMOUNT);
  });
});

describe('breakdown store input handling', () => {
  let store;
  beforeEach(() => {
    store = makeStore();
  });

  test('clearing the only non-zero amount leaves a finite percentage', () => {
    store.commit('updateTotalSalary', 0);
    store.commit('changeBreakdownAmount', { part: 'basic', value: '' });
    expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(0);
    expect(Number.isFinite(store.state.breakdown.salaryBreakdown.basic.percentage)).toBe(true);
  });

  test('total salary accepts Bangla digits and rejects garbage', () => {
    store.commit('updateTotalSalary', '৩৫,০০০');
    expect(store.state.breakdown.totalSalary).toBe(35000);
    expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(21000);
    store.commit('updateTotalSalary', 'abc');
    expect(store.state.breakdown.totalSalary).toBe(0);
    expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(0);
  });

  test('percentage input ignores non-numeric and negative values', () => {
    store.commit('updateTotalSalary', 10000);
    store.commit('changeBreakdownPercentage', { part: 'basic', value: 'abc' });
    expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(0);
    store.commit('changeBreakdownPercentage', { part: 'house', value: '-10' });
    expect(store.state.breakdown.salaryBreakdown.house.percentage).toBe(0);
    expect(Number.isFinite(store.state.breakdown.totalSalary)).toBe(true);
  });

  test.each([0, 5, 10, 33.5, 60, 100, '0', '5', '33.5', '60', '100'])(
    'percentage %p is stored unchanged',
    (value) => {
      store.commit('updateTotalSalary', 80000);
      store.commit('changeBreakdownPercentage', { part: 'basic', value });
      expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(+value);
    }
  );

  test('a breakdown percentage above 100 is capped at 100', () => {
    store.commit('updateTotalSalary', 10000);
    store.commit('changeBreakdownPercentage', { part: 'basic', value: '150' });
    expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(100);
  });
});

// Amounts the old `+value` / `Number(value)` coercion already accepted. parseAmount must
// return that same number, so a salary the calculator already taxed cannot change.
const PREVIOUSLY_VALID_AMOUNTS = [
  0, 1, 0.01, 0.5, 10, 35000, 100000.25, 999999, 1e6, 1e9, 1e12,
];
const PREVIOUSLY_VALID_STRINGS = ['+8000', '5000.', '.5', '007', '1e6', '1e12', '0x10', '  5000  '];
const FISCAL_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];

const TAXED_PROFILE = {
  monthly: 150000,
  tds: 15000,
  bonus: 300000,
  bonus2: 50000,
  others: 25000,
  dps: 100000,
  life: 20000,
  policy: 500000,
  solar: 12000,
  zakat: 5000,
  group: 8000,
  early: 1000,
};

function applyProfile(store, values) {
  store.commit('changeSubsequentSalaries', { index: 0, value: values.monthly });
  store.commit('changeSubsequentTds', { index: 0, value: values.tds });
  store.commit('changeBonus', values.bonus);
  store.commit('changeBonus2', values.bonus2);
  store.commit('changeOthers', values.others);
  store.commit('changeInvestment', { index: 0, value: values.dps });
  store.commit('changeInvestment', { index: 1, value: values.life });
  store.commit('changeInvestmentPolicyValue', { index: 1, value: values.policy });
  store.commit('setSolarElectricityBill', values.solar);
  store.commit('setZakatDonation', values.zakat);
  store.commit('setGroupInsuranceReimbursement', values.group);
  store.commit('setEarlyRedemptionRebateRepayable', values.early);
}

function taxSnapshot(store) {
  return {
    totalSalary: store.getters.totalSalary,
    totalTds: store.getters.totalTds,
    taxableSalary: store.getters.taxableSalary,
    eligibleInvestment: store.getters.eligibleInvestment,
    investmentRebate: store.getters.investmentRebate,
    totalTax: store.getters.totalTax,
    payableTax: store.getters.payableTax,
    groupInsuranceExclusion: store.getters.groupInsuranceExclusion,
    zakatDonationExclusion: store.getters.zakatDonationExclusion,
    solarRebate: store.getters.solarRebate2026,
  };
}

describe('previously valid amounts are unchanged', () => {
  test.each(PREVIOUSLY_VALID_AMOUNTS)('number %p matches unary plus', (value) => {
    expect(parseAmount(value)).toBe(+value);
  });

  test.each(PREVIOUSLY_VALID_AMOUNTS)('canonical string of %p matches unary plus', (value) => {
    const text = String(value);
    expect(+text).toBe(value);
    expect(parseAmount(text)).toBe(+text);
    expect(parseAmount(`  ${text}  `)).toBe(+`  ${text}  `);
  });

  test.each(PREVIOUSLY_VALID_STRINGS)('numeric string %p matches unary plus', (value) => {
    const legacy = +value;
    expect(Number.isFinite(legacy)).toBe(true);
    expect(legacy).toBeGreaterThanOrEqual(0);
    expect(legacy).toBeLessThanOrEqual(MAX_AMOUNT);
    expect(parseAmount(value)).toBe(legacy);
  });

  test('only negatives and amounts above the cap differ from unary plus', () => {
    expect(parseAmount(-1)).toBe(0);
    expect(parseAmount('-1')).toBe(0);
    expect(+(-1)).toBe(-1);
    expect(parseAmount(MAX_AMOUNT)).toBe(MAX_AMOUNT);
    expect(parseAmount(MAX_AMOUNT + 1)).toBe(MAX_AMOUNT);
    expect(+(MAX_AMOUNT + 1)).toBe(MAX_AMOUNT + 1);
  });
});

describe('valid money inputs do not change the tax result', () => {
  test('an empty life-insurance policy value stays null', () => {
    const store = makeStore();
    store.commit('changeInvestmentPolicyValue', { index: 1, value: '' });
    expect(store.state.salaries.investments[1].policyValue).toBeNull();
    store.commit('changeInvestmentPolicyValue', { index: 1, value: '2,00,000' });
    expect(store.state.salaries.investments[1].policyValue).toBe(200000);
  });

  test.each(FISCAL_YEARS)('%s canonical numeric strings match the same numbers', (year) => {
    const asNumbers = makeStore();
    const asStrings = makeStore();
    asNumbers.commit('setCurrentYear', year);
    asStrings.commit('setCurrentYear', year);
    applyProfile(asNumbers, TAXED_PROFILE);
    applyProfile(
      asStrings,
      Object.fromEntries(Object.entries(TAXED_PROFILE).map(([key, value]) => [key, String(value)]))
    );

    const numbers = taxSnapshot(asNumbers);
    // TDS can cover the whole bill, so payable may be zero. The liability itself must not be.
    expect(numbers.totalTax).toBeGreaterThan(0);
    expect(taxSnapshot(asStrings)).toEqual(numbers);
  });

  test.each([
    ['50,000', 50000],
    ['৫০,০০০', 50000],
    ['৳ 25,000', 25000],
    ['1,00,000', 100000],
    ['১,৫০,০০০', 150000],
  ])('monthly %p pays the same tax as %p', (raw, amount) => {
    for (const year of FISCAL_YEARS) {
      const formatted = makeStore();
      const plain = makeStore();
      formatted.commit('setCurrentYear', year);
      plain.commit('setCurrentYear', year);
      formatted.commit('changeSubsequentSalaries', { index: 0, value: raw });
      plain.commit('changeSubsequentSalaries', { index: 0, value: amount });
      expect(plain.getters.totalSalary).toBe(amount * 12);
      expect(formatted.getters.totalSalary).toBe(plain.getters.totalSalary);
      expect(formatted.getters.taxableSalary).toBe(plain.getters.taxableSalary);
      expect(formatted.getters.totalTax).toBe(plain.getters.totalTax);
      expect(formatted.getters.payableTax).toBe(plain.getters.payableTax);
    }
  });

  test('Bangla salary parts pay the same tax as the same ASCII amounts', () => {
    const formatted = makeStore();
    const plain = makeStore();
    formatted.commit('setCurrentYear', '2026-27');
    plain.commit('setCurrentYear', '2026-27');
    formatted.commit('changeParts', { index: 0, part: 'basic', value: '৩০,০০০' });
    formatted.commit('changeParts', { index: 0, part: 'house', value: '১৫,০০০' });
    plain.commit('changeParts', { index: 0, part: 'basic', value: 30000 });
    plain.commit('changeParts', { index: 0, part: 'house', value: 15000 });
    expect(plain.getters.totalSalary).toBe(540000);
    expect(taxSnapshot(formatted)).toEqual(taxSnapshot(plain));
  });

  test('FA 2026 strings pay the same rebate and exclusion as their numbers', () => {
    const formatted = makeStore();
    const plain = makeStore();
    formatted.commit('setCurrentYear', '2026-27');
    plain.commit('setCurrentYear', '2026-27');
    formatted.commit('changeSubsequentSalaries', { index: 0, value: 150000 });
    plain.commit('changeSubsequentSalaries', { index: 0, value: 150000 });
    formatted.commit('setSolarElectricityBill', '১২,০০০');
    formatted.commit('setZakatDonation', '5,000');
    formatted.commit('setGroupInsuranceReimbursement', '৳ 2,500');
    plain.commit('setSolarElectricityBill', 12000);
    plain.commit('setZakatDonation', 5000);
    plain.commit('setGroupInsuranceReimbursement', 2500);
    expect(plain.getters.totalTax).toBeGreaterThan(0);
    expect(taxSnapshot(formatted)).toEqual(taxSnapshot(plain));
  });

  test('a negative bonus is taxed as zero', () => {
    const clamped = makeStore();
    const zero = makeStore();
    clamped.commit('changeSubsequentSalaries', { index: 0, value: 150000 });
    zero.commit('changeSubsequentSalaries', { index: 0, value: 150000 });
    clamped.commit('changeBonus', '-10000');
    zero.commit('changeBonus', 0);
    expect(clamped.state.salaries.bonus).toBe(0);
    expect(clamped.getters.totalSalary).toBe(zero.getters.totalSalary);
    expect(clamped.getters.payableTax).toBe(zero.getters.payableTax);
  });
});
