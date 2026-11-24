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
});
