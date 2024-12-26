function monthlyDefault() {
  return {
    salary: 0,
    tds: 0,
    breakdown: {
      basic: 0,
      house: 0,
      lfa: 0,
      medical: 0,
      transport: 0,
    },
  }
}

function arraySum(arr) {
  return arr.reduceRight((c, i) => (c + +i), 0);
}

const salaries = {
  state: () => ({
    parts: ['basic', 'house', 'medical', 'transport', 'lfa'],
    months: [
      { id: "July",  ...monthlyDefault() },
      { id: "August",  ...monthlyDefault() },
      { id: "September",  ...monthlyDefault() },
      { id: "October",  ...monthlyDefault() },
      { id: "November",  ...monthlyDefault() },
      { id: "December",  ...monthlyDefault() },
      { id: "January",  ...monthlyDefault() },
      { id: "February",  ...monthlyDefault() },
      { id: "March",  ...monthlyDefault() },
      { id: "April",  ...monthlyDefault() },
      { id: "May",  ...monthlyDefault() },
      { id: "June",  ...monthlyDefault() },
    ],
    bonuses: [
      { name: 'Eid Bonus 1', amount: 0, isDefault: true },
      { name: 'Eid Bonus 2', amount: 0, isDefault: true },
      { name: 'New Year Bonus', amount: 0, isDefault: true },
    ],
    otherIncomes: [],
  }),
  mutations: {
    loadSalaries(state, salaries) {
      state.months = salaries;
    },
    resetSalaries(state) {
      state.months = [
        { id: "July",  ...monthlyDefault() },
        { id: "August",  ...monthlyDefault() },
        { id: "September",  ...monthlyDefault() },
        { id: "October",  ...monthlyDefault() },
        { id: "November",  ...monthlyDefault() },
        { id: "December",  ...monthlyDefault() },
        { id: "January",  ...monthlyDefault() },
        { id: "February",  ...monthlyDefault() },
        { id: "March",  ...monthlyDefault() },
        { id: "April",  ...monthlyDefault() },
        { id: "May",  ...monthlyDefault() },
        { id: "June",  ...monthlyDefault() },
      ];
    },
    resetBonuses(state) {
      state.bonuses = [
        { name: 'Eid Bonus 1', amount: 0, isDefault: true },
        { name: 'Eid Bonus 2', amount: 0, isDefault: true },
        { name: 'New Year Bonus', amount: 0, isDefault: true },
      ];
    },
    resetOtherIncomes(state) {
      state.otherIncomes = [];
    },
    changeSubsequentSalaries(state, { index, value }) {
      // window.history.pushState(value, "Tax for monthly salary "+value, "/?salary="+value);
      const { months, parts } = state;

      months[index].salary = +value;

      // change subsequent salaries
      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].salary = months[index].salary;
      }
    },

    changeSubsequentTds(state, { index, value }) {
      const { months } = state;

      months[index].tds = +value;

      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].tds = months[index].tds;
      }
    },

    changeParts(state, { part, index, value }) {
      const { months, parts } = state;
      months[index].breakdown[part] = +value;

      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].breakdown[part] = months[index].breakdown[part];
      }

      // calculate monthly salary from breakdowns
      months.forEach(month => {
        month.salary = arraySum(Object.values(month.breakdown));
      });
    },
    changeOthers(state, value) {
      state.others = +value;
    },
    changeBonus(state, value) {
      state.bonus = +value;
    },
    addBonus(state, { name, amount }) {
      state.bonuses.push({ name, amount: +amount });
    },
    removeBonus(state, index) {
      state.bonuses.splice(index, 1);
    },
    updateBonus(state, { index, name, amount }) {
      state.bonuses[index] = { name, amount: +amount };
    },
    addOtherIncome(state, { name, amount }) {
      state.otherIncomes.push({ name, amount: +amount });
    },
    removeOtherIncome(state, index) {
      state.otherIncomes.splice(index, 1);
    },
    updateOtherIncome(state, { index, name, amount }) {
      state.otherIncomes[index] = { name, amount: +amount };
    },
  },
  getters: {
    totalSalary(state) {
      const salarySum = state.months.reduceRight((carry, item) => carry + +item.salary, 0);
      const bonusSum = state.bonuses.reduce((sum, bonus) => sum + +bonus.amount, 0);
      const othersSum = state.otherIncomes.reduce((sum, income) => sum + +income.amount, 0);
      return salarySum + bonusSum + othersSum;
    },
    totalTds(state) {
      return state.months.reduceRight((carry, item) => carry + +item.tds, 0);
    },
    totalBasic({ months }) {
      return arraySum(months.map(month => month.breakdown.basic));
    },
    totalHouse({ months }) {
      return arraySum(months.map(month => month.breakdown.house));
    },
    totalMedical({ months }) {
      return arraySum(months.map(month => month.breakdown.medical));
    },
    totalTransport({ months }) {
      return arraySum(months.map(month => month.breakdown.transport));
    },
    totalLfa({ months }) {
      return arraySum(months.map(month => month.breakdown.lfa));
    },
    houseExempt(state, getters) {
      const { totalBasic, totalHouse } = getters;
      const houseExempt = totalBasic/2 < totalHouse ? totalBasic/2 : totalHouse;
      const maxExempt = 300000;

      return Math.min(maxExempt, houseExempt)
    },
    medicalExempt(state, getters, rootState) {
      const { totalBasic, totalMedical } = getters;
      const isDisabled = rootState.personalInfo.isDisabled;
      const maxExempt = isDisabled ? 1000000 : 120000; // 10 lakh if disabled, otherwise 1.2 lakh
      return Math.min(maxExempt, Math.round(totalBasic/10), totalMedical)
    },
    transportExempt(state, getters) {
      const { totalTransport } = getters;
      const maxExempt = 30000;
      return Math.min(totalTransport, maxExempt)
    },
    lfaExempt(state, getters) {
      // no exempt on lfa
      return 0;
    },
    totalExempt(state, getters) {
      const { medicalExempt, transportExempt, lfaExempt, houseExempt } = getters;
      return medicalExempt + transportExempt + lfaExempt + houseExempt;
    },
    taxableSalary(state, getters) {
      return getters.totalSalary - getters.totalExempt;
    },
    maxRebatableInvestment(state, getters) {
      const threePercentOfTaxableIncome = getters.taxableSalary * 0.03;
      const fixedAmount = 1000000; // 10 lakh BDT
      return Math.min(threePercentOfTaxableIncome, fixedAmount);
    },
  }
};

export default salaries;
