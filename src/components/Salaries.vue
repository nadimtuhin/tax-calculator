<template>
  <table>
    <tr>
      <th>month</th>
      <th>salary</th>
      <th>
        <span title="tax deduction at source">tds*</span>
      </th>
    </tr>

    <tr v-for="(month, index) in months" v-bind:key="month.id">
      <td>{{month.id}}</td>
      <td>
        <input
          type="number"
          min="0"
          v-model="months[index]['salary']"
          @change="changeSubsequentSalaries(index)"
        >
      </td>
      <td>
        <input
          min="0"
          type="number"
          v-model="months[index]['tds']"
          @change="changeSubsequentTds(index)"
        >
      </td>
    </tr>

    <tr>
      <td></td>
      <td>salary: {{ totalSalary }}</td>
      <td>tds: {{ totalTds }}</td>
    </tr>
  </table>
</template>

<script>
export default {
  name: "salaries",
  data: () => ({
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
  methods: {
    changeSubsequentSalaries(index) {
      for (let ii = index + 1; ii <= 11; ii++) {
        this.months[ii].salary = this.months[index].salary;
      }
    },
    changeSubsequentTds(index) {
      for (let ii = index + 1; ii <= 11; ii++) {
        this.months[ii].tds = this.months[index].tds;
      }
    }
  },
  computed: {
    totalSalary() {
      return this.months.reduceRight((carry, item) => carry + +item.salary, 0);
    },
    totalTds() {
      return this.months.reduceRight((carry, item) => carry + +item.tds, 0);
    }
  },
  watch: {
    salaries(val) {
      console.log(val);
    },
    tds(val) {
      console.log(val);
    }
  }
};
</script>
