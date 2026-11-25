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

describe('year separation in comparison getters', () => {
  test('exclusions entered in FY 2026-27 do not leak into FY 2024-25 or FY 2025-26 columns', () => {
    const store = makeStore('2026-27');
    const before = {
      y24: store.getters.taxBreakdown2024,
      y25: store.getters.payableTax2025,
      y26: store.getters.payableTax2026,
    };
    store.commit('setGroupInsuranceReimbursement', 40000);
    store.commit('setZakatDonation', 20000);
    expect(store.getters.taxBreakdown2024).toEqual(before.y24);
    expect(store.getters.taxableSalary2024).toBe(store.getters.taxableSalaryBeforeExclusions);
    expect(store.getters.taxableSalary2025).toBe(store.getters.taxableSalaryBeforeExclusions - 40000);
    expect(store.getters.taxableSalary2026).toBe(store.getters.taxableSalaryBeforeExclusions - 60000);
    expect(store.getters.taxableSalary).toBe(store.getters.taxableSalary2026);
    expect(store.getters.payableTax2026).toBeLessThanOrEqual(before.y26);
    expect(store.getters.payableTax2025).toBeLessThanOrEqual(before.y25);
  });
});

describe('persistence', () => {
  test('migratePersistedState keeps and clamps both inputs', async () => {
    const { migratePersistedState } = await import('@/store');
    const out = migratePersistedState({
      salaries: { groupInsuranceReimbursement: '5000', zakatDonation: -3 },
    });
    expect(out.salaries.groupInsuranceReimbursement).toBe(5000);
    expect(out.salaries.zakatDonation).toBe(0);
  });
});
