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

const infinity = 99999999999999999999999999; // Inifiny has persist issues in localStorage

const salaries = {
  state: () => ({
    investments: [
      { name: 'DPS', amount: 0,  maximum: 120000 },
      { name: 'Life insurance premium', amount: 0,  maximum: infinity },
      { name: 'Stocks', amount: 0,  maximum: infinity },
      { name: 'Mutual fund', amount: 0,  maximum: 500000 },
      { name: 'Savings certificate', amount: 0,  maximum: infinity },
      { name: 'Others', amount: 0,  maximum: infinity },
    ],
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
    bonus: 0,
    others: 0,
  }),
  mutations: {
    loadSalaries(state, salaries) {
      state.months = salaries;
    },
    loadInvestments(state, investments) {
      state.investments = investments;
    },
    resetSalaries(state) {
      state.months = state.months.map((month) => ({
        id: month.id,
        salary: 0,
        tds: 0,
        breakdown: {
          basic: 0,
          house: 0,
          medical: 0,
          transport: 0,
          lfa: 0,
        },
      }));
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
  },
  getters: {
    totalSalary(state) {
      return state.months.reduceRight((carry, item) => carry + +item.salary, 0) + state.others + state.bonus;
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
    medicalExempt(state, getters) {
      const { totalBasic, totalMedical } = getters;
      const maxExempt = 120000;
      // মূল ববতদনর ১০% অথবা বাতষকড ১,২০,০০০/- টাকা (প্রততবন্ধী ব্যতির বেদত্র ১০ লে টাকা), এ দ্য’টির মদে বেটি কম বস পতরমাণ অা��ক করমুি।
      return Math.min(maxExempt, totalBasic/10, totalMedical)
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
    totalInvestment(state, getters) {
      return state.investments.map(i => i.amount).reduce((c, n) => c+n, 0);
    },
    totalRebateableInvestment(state, getters) {
      const rebateable = state.investments
        .map(i => [i.amount, i.maximum])
        .reduceRight((c, arr) => {
          return c+(Math.min(...arr))
        }, 0);

      return Math.min(getters.maxRebateableInvestment, rebateable);
    },
    maxRebateableInvestment(state, getters) {
      return Math.round(getters.taxableSalary/5);
    },
    rebatePercentage(state, getters) {
      return 15;
    },
    investmentRebate(state, getters) {
      return Math.round(getters.totalRebateableInvestment * getters.rebatePercentage/100);
    },
  }
};

export default salaries;
