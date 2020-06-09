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
      basic: { amount: 0, percentage: 50 },
      house: { amount: 0, percentage: 25 },
      medical: { amount: 0, percentage: 10 },
      transport: { amount: 0, percentage: 5 },
      lfa: { amount: 0, percentage: 10 }
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
      state.totalSalary = +totalSalary;

      state.parts.forEach(part => {
        const amount = state.totalSalary * (state.salaryBreakdown[part].percentage / 100);
        state.salaryBreakdown[part].amount = Math.round(amount);
      });
    },

    changeBreakdownPercentage(state, { part, value }) {
      state.salaryBreakdown[part].percentage = +value;

      const amount = state.totalSalary * (state.salaryBreakdown[part].percentage / 100);
      state.salaryBreakdown[part].amount = Math.round(amount);
      state.totalSalary = getTotalSalary(state.salaryBreakdown);
    },

    changeBreakdownAmount(state, { part, value }) {
      state.salaryBreakdown[part].amount = +value;

      state.totalSalary = getTotalSalary(state.salaryBreakdown);

      state.salaryBreakdown[part].percentage =
        (state.salaryBreakdown[part].amount * 100) / state.totalSalary;

    },
  }
};

export default breakdown;
