const salaries = {
  state: () => ({
    months: [
      { id: "January", salary: 0, tds: 0 },
      { id: "February", salary: 0, tds: 0 },
      { id: "March", salary: 0, tds: 0 },
      { id: "April", salary: 0, tds: 0 },
      { id: "May", salary: 0, tds: 0 },
      { id: "June", salary: 0, tds: 0 },
      { id: "July", salary: 0, tds: 0 },
      { id: "August", salary: 0, tds: 0 },
      { id: "September", salary: 0, tds: 0 },
      { id: "October", salary: 0, tds: 0 },
      { id: "November", salary: 0, tds: 0 },
      { id: "December", salary: 0, tds: 0 },
      { id: "Bonus", salary: 0, tds: 0 },
      { id: "Others", salary: 0, tds: 0 }
    ]
  }),
  mutations: {
    changeSubsequentSalaries(state, { index, value }) {
      state.months[index].salary = +value;

      for (let ii = index + 1; ii <= 11; ii++) {
        state.months[ii].salary = state.months[index].salary;
      }
    },
    changeSubsequentTds(state, { index, value }) {
      state.months[index].tds = +value;

      for (let ii = index + 1; ii <= 11; ii++) {
        state.months[ii].tds = state.months[index].tds;
      }
    }
  },
  getters: {
    totalSalary(state) {
      return state.months.reduceRight((carry, item) => carry + +item.salary, 0);
    },
    totalTds(state) {
      return state.months.reduceRight((carry, item) => carry + +item.tds, 0);
    }
  }
};

export default salaries;
