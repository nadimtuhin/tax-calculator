import { createStore } from 'vuex';
import { mount } from '@vue/test-utils';
import TaxpayerProfile from '@/components/TaxpayerProfile.vue';
import salariesStore from '@/store/salaries';
import { migratePersistedState } from '@/store/index';
import { getDefaultFiscalYear, resolveDefaultFiscalYear } from '@/utils/fiscalYear';
import {
  DEFAULT_COMPARISON_FROM_YEAR,
  DEFAULT_COMPARISON_TO_YEAR,
  DEFAULT_FISCAL_YEAR,
  FISCAL_YEAR_OPTIONS,
  SUPPORTED_FISCAL_YEARS,
  normalizeFiscalYear,
} from '@/utils/taxEngine';

/**
 * Local calendar dates. Month is 0-based so July is 6 and November is 10.
 * @param {number} year
 * @param {number} monthIndex
 * @param {number} day
 * @param {number} [hours]
 * @param {number} [minutes]
 * @param {number} [seconds]
 * @param {number} [ms]
 */
function at(year, monthIndex, day, hours = 12, minutes = 0, seconds = 0, ms = 0) {
  return new Date(year, monthIndex, day, hours, minutes, seconds, ms);
}

describe('getDefaultFiscalYear', () => {
  test('on 5 Nov 2026 selects completed FY 2025-26 (the 2025-2026 income year)', () => {
    expect(getDefaultFiscalYear(at(2026, 10, 5))).toBe('2025-26');
    expect(normalizeFiscalYear('2025-2026')).toBe(getDefaultFiscalYear(at(2026, 10, 5)));
    expect(getDefaultFiscalYear(at(2026, 10, 1))).toBe('2025-26');
    expect(getDefaultFiscalYear(at(2026, 10, 30, 23, 59, 59, 999))).toBe('2025-26');
  });

  test('rolls forward on 1 July, the morning after the fiscal year closes', () => {
    expect(getDefaultFiscalYear(at(2026, 5, 30, 23, 59, 59, 999))).toBe('2024-25');
    expect(getDefaultFiscalYear(at(2026, 6, 1, 0, 0, 0, 0))).toBe('2025-26');
    expect(getDefaultFiscalYear(at(2027, 5, 30, 23, 59, 59, 999))).toBe('2025-26');
    expect(getDefaultFiscalYear(at(2027, 6, 1, 0, 0, 0, 0))).toBe('2026-27');
    expect(normalizeFiscalYear('2026-2027')).toBe(getDefaultFiscalYear(at(2027, 6, 1)));
    expect(getDefaultFiscalYear(at(2027, 6, 15))).toBe('2026-27');
  });

  test('January through June stay on the fiscal year that ended the previous June', () => {
    expect(getDefaultFiscalYear(at(2026, 0, 1, 0, 0, 0, 0))).toBe('2024-25');
    expect(getDefaultFiscalYear(at(2026, 0, 31))).toBe('2024-25');
    expect(getDefaultFiscalYear(at(2026, 5, 1))).toBe('2024-25');
    expect(getDefaultFiscalYear(at(2027, 0, 15))).toBe('2025-26');
    expect(getDefaultFiscalYear(at(2027, 2, 31))).toBe('2025-26');
  });

  test('December stays on the fiscal year that ended the previous June', () => {
    expect(getDefaultFiscalYear(at(2026, 11, 31, 23, 59, 59, 999))).toBe('2025-26');
    expect(getDefaultFiscalYear(at(2025, 11, 31))).toBe('2024-25');
  });

  test('keeps computing later years instead of freezing 2025-26', () => {
    expect(getDefaultFiscalYear(at(2028, 6, 1))).toBe('2027-28');
    expect(getDefaultFiscalYear(at(2028, 5, 30))).toBe('2026-27');
    expect(getDefaultFiscalYear(at(2030, 10, 5))).toBe('2029-30');
    expect(getDefaultFiscalYear(at(2024, 6, 1))).toBe('2023-24');
  });

  test('uses the provided date, and the current date when omitted', () => {
    const now = new Date();
    expect(getDefaultFiscalYear()).toBe(getDefaultFiscalYear(now));
    expect(getDefaultFiscalYear(at(2026, 10, 5))).not.toBe(getDefaultFiscalYear(at(2027, 6, 1)));
  });

  test('rejects an invalid date', () => {
    expect(() => getDefaultFiscalYear(new Date(NaN))).toThrow(TypeError);
    expect(() => getDefaultFiscalYear('2026-11-05')).toThrow(TypeError);
  });
});

describe('resolveDefaultFiscalYear', () => {
  test('returns the completed year when this build can calculate it', () => {
    expect(resolveDefaultFiscalYear(at(2026, 10, 5), SUPPORTED_FISCAL_YEARS)).toBe('2025-26');
    expect(resolveDefaultFiscalYear(at(2027, 6, 1), SUPPORTED_FISCAL_YEARS)).toBe('2026-27');
    expect(resolveDefaultFiscalYear(at(2026, 5, 30), SUPPORTED_FISCAL_YEARS)).toBe('2024-25');
  });

  test('clamps to the newest supported year after the catalog ends', () => {
    expect(resolveDefaultFiscalYear(at(2028, 6, 1), SUPPORTED_FISCAL_YEARS)).toBe('2026-27');
    expect(resolveDefaultFiscalYear(at(2031, 0, 1), SUPPORTED_FISCAL_YEARS)).toBe('2026-27');
  });

  test('clamps to the oldest supported year before the catalog starts', () => {
    expect(resolveDefaultFiscalYear(at(2024, 0, 15), SUPPORTED_FISCAL_YEARS)).toBe('2023-24');
    expect(resolveDefaultFiscalYear(at(2023, 5, 30), SUPPORTED_FISCAL_YEARS)).toBe('2023-24');
  });

  test('without a catalog returns the pure completed year', () => {
    expect(resolveDefaultFiscalYear(at(2028, 6, 1))).toBe('2027-28');
    expect(resolveDefaultFiscalYear(at(2026, 10, 5), [])).toBe('2025-26');
  });
});

describe('fiscal year default wiring', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('engine default matches the resolved completed year for today', () => {
    const expected = resolveDefaultFiscalYear(new Date(), SUPPORTED_FISCAL_YEARS);
    expect(DEFAULT_FISCAL_YEAR).toBe(expected);
    expect(SUPPORTED_FISCAL_YEARS).toContain(DEFAULT_FISCAL_YEAR);
  });

  test('fresh store on 5 Nov 2026 selects FY 2025-26 and keeps the comparison pair', () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(2026, 10, 5, 10, 0, 0, 0));

    const state = salariesStore.state();
    expect(state.currentYear).toBe('2025-26');
    expect(state.comparisonFromYear).toBe('2025-26');
    expect(state.comparisonToYear).toBe('2026-27');
    expect(state.fiscalYearOptions.map((option) => option.value)).toEqual([
      '2024-25',
      '2025-26',
      '2026-27',
    ]);
    expect(DEFAULT_COMPARISON_FROM_YEAR).toBe('2025-26');
    expect(DEFAULT_COMPARISON_TO_YEAR).toBe('2026-27');
    expect(FISCAL_YEAR_OPTIONS.map((option) => option.value)).toEqual([
      '2024-25',
      '2025-26',
      '2026-27',
    ]);
  });

  test('fresh store rolls to FY 2026-27 on 1 July 2027 and not a day earlier', () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(2027, 5, 30, 23, 59, 59, 999));
    expect(salariesStore.state().currentYear).toBe('2025-26');

    jest.setSystemTime(at(2027, 6, 1, 0, 0, 0, 0));
    expect(salariesStore.state().currentYear).toBe('2026-27');
    expect(salariesStore.state().comparisonFromYear).toBe('2025-26');
    expect(salariesStore.state().comparisonToYear).toBe('2026-27');
  });

  test('profile select follows the fresh-store year on 5 Nov 2026', () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(2026, 10, 5, 10, 0, 0, 0));

    const store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false,
        },
      },
    });
    const wrapper = mount(TaxpayerProfile, {
      global: { plugins: [store] },
    });

    expect(wrapper.find('#profile-fiscal-year').element.value).toBe('2025-26');
    expect(store.state.salaries.currentYear).toBe('2025-26');
    const optionValues = wrapper.find('#profile-fiscal-year').findAll('option').map((option) => option.element.value);
    expect(optionValues).toEqual(['2024-25', '2025-26', '2026-27']);
    wrapper.unmount();
  });

  test('a saved fiscal year wins over the auto default', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(2026, 10, 5, 10, 0, 0, 0));

    const keptEarlier = migratePersistedState({
      salaries: { currentYear: '2024-25', bonus: 1000 },
    });
    expect(keptEarlier.salaries.currentYear).toBe('2024-25');
    expect(keptEarlier.salaries.bonus).toBe(1000);
    expect(keptEarlier.salaries.comparisonFromYear).toBe('2025-26');
    expect(keptEarlier.salaries.comparisonToYear).toBe('2026-27');

    const keptLater = migratePersistedState({
      salaries: { currentYear: '2026-27' },
    });
    expect(keptLater.salaries.currentYear).toBe('2026-27');

    const store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false,
        },
      },
    });
    store.commit('setCurrentYear', '2024-25');
    const wrapper = mount(TaxpayerProfile, {
      global: { plugins: [store] },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#profile-fiscal-year').element.value).toBe('2024-25');
    expect(store.state.salaries.currentYear).toBe('2024-25');
    wrapper.unmount();
  });

  test('a missing or blank saved year uses the auto default', () => {
    jest.useFakeTimers();
    jest.setSystemTime(at(2026, 10, 5, 10, 0, 0, 0));

    const missing = migratePersistedState({ salaries: { bonus: 10 } });
    expect(missing.salaries.currentYear).toBe('2025-26');
    expect(missing.salaries.comparisonFromYear).toBe('2025-26');
    expect(missing.salaries.comparisonToYear).toBe('2026-27');

    const blank = migratePersistedState({ salaries: { currentYear: '   ' } });
    expect(blank.salaries.currentYear).toBe('2025-26');

    const absentState = migratePersistedState({ salaries: {} });
    expect(absentState.salaries.currentYear).toBe('2025-26');
  });

  test('v0.8 migration still keeps an explicit saved FY 2025-26', () => {
    const legacySaved = {
      salaries: {
        taxpayerProfile: { category: 'female', age: 38, location: 'chittagong', parentOfDisabled: true },
        currentYear: '2025-26',
        bonus: 150000,
        months: Array.from({ length: 12 }, (_, idx) => ({
          id: `M${idx}`,
          salary: 80000,
          tds: 3000,
          breakdown: { basic: 48000, house: 20000, medical: 8000, transport: 4000, lfa: 0 },
        })),
        investments: [
          { name: 'DPS', amount: 110000, maximum: 120000 },
          { name: 'Life insurance premium', amount: 45000, maximum: 999999999 },
        ],
      },
    };

    const migrated = migratePersistedState(legacySaved);
    expect(migrated.salaries.currentYear).toBe('2025-26');
    expect(migrated.salaries.taxpayerProfile).toEqual({
      category: 'female',
      age: 38,
      location: 'chittagong',
      parentOfDisabled: true,
      firstTimeFiler: false,
    });
    expect(migrated.salaries.months[0].salary).toBe(80000);
    expect(migrated.salaries.investments[0].amount).toBe(110000);
    expect(migrated.salaries.investments[1].policyValue).toBeNull();
  });
});
