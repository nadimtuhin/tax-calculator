function getTotalSalary(salaryBreakDown) {
  const { basic, house, medical, lfa, transport } = salaryBreakDown;
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
    salaryBreakDown: {
      basic: { amount: 0, percentage: 50 },
      house: { amount: 0, percentage: 25 },
      medical: { amount: 0, percentage: 10 },
      transport: { amount: 0, percentage: 5 },
      lfa: { amount: 0, percentage: 10 }
    }
  }),
  getters: {
    totalPercentage: (state) => {
      const { basic, house, medical, lfa, transport } = state.salaryBreakDown;
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
        const amount = state.totalSalary * (state.salaryBreakDown[part].percentage / 100);
        state.salaryBreakDown[part].amount = Math.round(amount);
      });
    },

    changeBreakdownPercentage(state, { part, value }) {
      state.salaryBreakDown[part].percentage = +value;

      const amount = state.totalSalary * (state.salaryBreakDown[part].percentage / 100);
      state.salaryBreakDown[part].amount = Math.round(amount);
      state.totalSalary = getTotalSalary(state.salaryBreakDown);
    },

    changeBreakdownAmount(state, { part, value }) {
      state.salaryBreakDown[part].amount = +value;

      state.totalSalary = getTotalSalary(state.salaryBreakDown);

      state.salaryBreakDown[part].percentage =
        (state.salaryBreakDown[part].amount * 100) / state.totalSalary;

    },
  }
};

export default breakdown;
