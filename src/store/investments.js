const infinity = 99999999999999999999999999; // Infinity has persist issues in localStorage

const investments = {
  namespaced: true,
  state: () => ({
    investments: [
      { name: 'DPS', amount: 0,  maximum: 120000 },
      { name: 'Life insurance premium', amount: 0,  maximum: infinity },
      { name: 'Stocks', amount: 0,  maximum: infinity },
      { name: 'Mutual fund', amount: 0,  maximum: 500000 },
      { name: 'Savings certificate', amount: 0,  maximum: infinity },
      { name: 'Others', amount: 0,  maximum: infinity },
    ],
  }),
  mutations: {
    loadInvestments(state, investments) {
      state.investments = investments;
    },
    resetInvestments(state) {
      state.investments = state.investments.map(investment => ({
        ...investment,
        amount: 0,
      }));
    },
    changeInvestment(state, { index, value }) {
      state.investments[index].amount = +value;
    },
    addInvestment(state, name) {
      state.investments.push({
        name,
        amount: 0,
        maximum: infinity,
        isCustom: true
      });
    },
    removeInvestment(state, index) {
      state.investments.splice(index, 1);
    },
  },
  getters: {
    totalInvestment(state) {
      return state.investments.map(i => i.amount).reduce((c, n) => c+n, 0);
    },
    totalRebatableInvestment(state, getters, rootState, rootGetters) {
      const rebatable = state.investments
        .map(i => [i.amount, i.maximum])
        .reduceRight((c, arr) => {
          return c+(Math.min(...arr))
        }, 0);

      return Math.min(rootGetters['salaries/maxRebatableInvestment'], rebatable);
    },
    rebatePercentage() {
      return 15;
    },
    investmentRebate(state, getters, rootState, rootGetters) {
      // Calculate 3% of taxable income
      const threePercentOfTaxableIncome = rootGetters['salaries/taxableSalary'] * 0.03;

      // Calculate 15% of total investments
      const fifteenPercentOfInvestments = getters.totalInvestment * 0.15;

      // Fixed amount of 10 lakh BDT
      const fixedAmount = 1000000;

      // Choose the lowest amount from the three
      const rebateAmount = Math.min(
        threePercentOfTaxableIncome,
        fifteenPercentOfInvestments,
        fixedAmount
      );

      return Math.round(rebateAmount);
    },
  }
};

export default investments;
