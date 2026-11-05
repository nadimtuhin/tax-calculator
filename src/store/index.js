import { createStore } from "vuex";
import createPersistedState from "vuex-persistedstate";

import salaries from "./salaries";

const appVersion = '0.8';

/**
 * Migrate and normalize persisted v0.8 state so existing users keep all entered
 * salary, TDS, investment, and profile values while gaining new statutory defaults.
 */
export function migratePersistedState(saved) {
  if (!saved || typeof saved !== 'object') return undefined;
  const freshSalaries = salaries.state();
  const persistedSalaries = saved.salaries && typeof saved.salaries === 'object' ? saved.salaries : {};

  const mergedMonths = Array.isArray(persistedSalaries.months) && persistedSalaries.months.length === 12
    ? persistedSalaries.months.map((m, idx) => ({
        ...freshSalaries.months[idx],
        ...m,
        salary: Number(m?.salary) || 0,
        tds: Number(m?.tds) || 0,
        breakdown: {
          basic: Number(m?.breakdown?.basic) || 0,
          house: Number(m?.breakdown?.house) || 0,
          medical: Number(m?.breakdown?.medical) || 0,
          transport: Number(m?.breakdown?.transport) || 0,
          others: Number(m?.breakdown?.others) || 0,
        },
      }))
    : freshSalaries.months;

  const mergedInvestments = freshSalaries.investments.map((freshInv, idx) => {
    const prev = Array.isArray(persistedSalaries.investments)
      ? persistedSalaries.investments.find((item) => item?.name === freshInv.name) || persistedSalaries.investments[idx]
      : undefined;
    if (!prev) return freshInv;
    return {
      ...freshInv,
      amount: Number(prev.amount) || 0,
      policyValue:
        prev.policyValue === null || prev.policyValue === undefined || prev.policyValue === ''
          ? null
          : Math.max(0, Number(prev.policyValue) || 0),
    };
  });

  return {
    ...saved,
    salaries: {
      ...freshSalaries,
      ...persistedSalaries,
      taxpayerProfile: {
        ...freshSalaries.taxpayerProfile,
        ...(persistedSalaries.taxpayerProfile || {}),
      },
      comparisonFromYear: persistedSalaries.comparisonFromYear || freshSalaries.comparisonFromYear,
      comparisonToYear: persistedSalaries.comparisonToYear || freshSalaries.comparisonToYear,
      months: mergedMonths,
      investments: mergedInvestments,
    },
  };
}

const store = createStore({
  plugins: [
    createPersistedState({
      key: appVersion,
      getState: (key, storage) => {
        try {
          const raw = storage.getItem(key);
          if (!raw) return undefined;
          return migratePersistedState(JSON.parse(raw));
        } catch {
          return undefined;
        }
      },
    }),
  ],
  modules: { salaries },
});

export default store;
