import { createStore } from 'vuex';
import salariesStore from '@/store/salaries';
import {
  calculateGroupInsuranceExclusion,
  calculateZakatDonationExclusion,
} from '@/utils/fa2026Rules';

const makeStore = (year) => {
  const store = createStore({ modules: { salaries: { ...salariesStore, namespaced: false } } });
  store.commit('setCurrentYear', year);
  store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });
  return store;
};

describe('group-insurance medical exclusion (booklet s.1.11)', () => {
  test('applies in FY 2025-26 and FY 2026-27, capped at salary', () => {
    for (const year of ['2025-26', '2026-27']) {
      expect(calculateGroupInsuranceExclusion(50000, year, 1000000)).toBe(50000);
      expect(calculateGroupInsuranceExclusion(5000000, year, 1000000)).toBe(1000000);
    }
  });

  test('FY 2024-25 and earlier are unchanged', () => {
    expect(calculateGroupInsuranceExclusion(50000, '2024-25', 1000000)).toBe(0);
    expect(calculateGroupInsuranceExclusion(50000, '2023-24', 1000000)).toBe(0);
  });

  test('negative and garbage input is zero', () => {
    expect(calculateGroupInsuranceExclusion(-5, '2025-26', 1000)).toBe(0);
    expect(calculateGroupInsuranceExclusion('x', '2025-26', 1000)).toBe(0);
  });

  test('store lowers taxable salary only in the covered years', () => {
    const base = {};
    for (const year of ['2024-25', '2025-26', '2026-27']) {
      const store = makeStore(year);
      base[year] = store.getters.taxableSalary;
      store.commit('setGroupInsuranceReimbursement', 40000);
      const delta = base[year] - store.getters.taxableSalary;
      expect(store.getters.totalSalary).toBeGreaterThan(1000000);
      expect(delta).toBe(year === '2024-25' ? 0 : 40000);
    }
  });
});

describe('Zakat Management donation exclusion', () => {
  test('applies in FY 2026-27 only, capped at remaining income', () => {
    expect(calculateZakatDonationExclusion(30000, '2026-27', 500000)).toBe(30000);
    expect(calculateZakatDonationExclusion(900000, '2026-27', 500000)).toBe(500000);
    expect(calculateZakatDonationExclusion(30000, '2025-26', 500000)).toBe(0);
    expect(calculateZakatDonationExclusion(30000, '2024-25', 500000)).toBe(0);
  });

  test('store: no effect outside FY 2026-27, reduces taxable salary inside it', () => {
    for (const year of ['2025-26', '2026-27']) {
      const store = makeStore(year);
      const before = store.getters.taxableSalary;
      store.commit('setZakatDonation', 20000);
      expect(before).toBeGreaterThan(20000);
      const expected = year === '2026-27' ? 20000 : 0;
      expect(before - store.getters.taxableSalary).toBe(expected);
    }
  });
});
