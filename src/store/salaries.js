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
    breakdownPercentage: {
      basic: 50,
      house: 25,
      lfa: 10,
      medical: 10,
      transport: 5,
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
    bonus: 0,
    others: 0,
  }),
  mutations: {
    changeSubsequentSalaries(state, { index, value }) {
      const { months, parts } = state;

      months[index].salary = +value;

      // calculate monthly salary percentage from breakdowns
      parts.forEach(part => {
        const month = months[index];
        month.breakdown[part] = Math.round(month.breakdownPercentage[part]/100 * month.salary);
      });

      // change subsequent salaries
      for (let ii = index + 1; ii <= 11; ii++) {
        months[ii].salary = months[index].salary;
      }

      // recalculate subsequent salary breakdowns
      for (let ii = index + 1; ii <= 11; ii++) {
        parts.forEach(part => {
          months[ii].breakdown[part] = months[index].breakdown[part];
        });
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

      // recalculate subsequent salary breakdowns
      for (let ii = index + 1; ii <= 11; ii++) {
        parts.forEach(part => {
          months[ii].breakdown[part] = months[index].breakdown[part];
        });
      }

      // calculate monthly salary from breakdowns
      months.forEach(month => {
        month.salary = arraySum(Object.values(month.breakdown));
      });

      // calculate monthly salary percentage from breakdowns
      months.forEach(month => parts.forEach(part => {
        month.breakdownPercentage[part] = Math.round(month.breakdown[part] * 100 / month.salary);
      }));
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
      return state.months.reduceRight((carry, item) => carry + +item.salary, 0);
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
  }
};

export default salaries;
