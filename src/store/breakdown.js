import { parseAmount } from '../utils/parseAmount';

function getTotalSalary(salaryBreakdown) {
  const { basic, house, medical, lfa, transport } = salaryBreakdown;
  return Math.round(
    +basic.amount +
      +house.amount +
      +medical.amount +
      +lfa.amount +
      +transport.amount
  );
}

const breakdown = {
  state: () => ({
    totalSalary: 0,
    parts: ['basic', 'house', 'medical', 'transport', 'lfa'],
    salaryBreakdown: {
      basic: { amount: 0, percentage: 60 },
      house: { amount: 0, percentage: 25 },
      medical: { amount: 0, percentage: 10 },
      transport: { amount: 0, percentage: 5 },
      lfa: { amount: 0, percentage: 0 }
    }
  }),
  getters: {
    totalPercentage: (state) => {
      const { basic, house, medical, lfa, transport } = state.salaryBreakdown;
      return Math.round(
        +basic.percentage +
          +house.percentage +
          +medical.percentage +
          +lfa.percentage +
          +transport.percentage
      );
    }
  },
  mutations: {
    updateTotalSalary(state, totalSalary) {
      state.totalSalary = parseAmount(totalSalary);

      state.parts.forEach(part => {
        const amount = state.totalSalary * (state.salaryBreakdown[part].percentage / 100);
        state.salaryBreakdown[part].amount = Math.round(amount);
      });
    },

    changeBreakdownPercentage(state, { part, value }) {
      state.salaryBreakdown[part].percentage = Math.min(100, parseAmount(value));

      const amount = state.totalSalary * (state.salaryBreakdown[part].percentage / 100);
      state.salaryBreakdown[part].amount = Math.round(amount);
      state.totalSalary = getTotalSalary(state.salaryBreakdown);
    },

    changeBreakdownAmount(state, { part, value }) {
      state.salaryBreakdown[part].amount = parseAmount(value);

      state.totalSalary = getTotalSalary(state.salaryBreakdown);

      state.salaryBreakdown[part].percentage = state.totalSalary > 0
        ? (state.salaryBreakdown[part].amount * 100) / state.totalSalary
        : 0;

    },
  }
};

export default breakdown;
