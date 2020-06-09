const breakdown = {
  state: () => ({
    totalSalary: 2220,
    salaryBreakDown: {
      basic: { amount: 0, percentage: 50 },
      house: { amount: 0, percentage: 25 },
      medical: { amount: 0, percentage: 10 },
      transport: { amount: 0, percentage: 5 },
      lfa: { amount: 0, percentage: 10 }
    }
  }),
  getters: {
    totalPercentage(state) {
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
      // `state` is the local module state
      state.totalSalary = totalSalary;
    }
  }
};

export default breakdown;
