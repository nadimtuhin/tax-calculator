<template>
  <table>
    <tr>
      <th>month</th>
      <th>salary</th>
      <th>
        <span title="tax deduction at source">tds*</span>
      </th>
      <th>Basic</th>
      <th>House</th>
      <th>Medical</th>
      <th>Transportation</th>
      <th>LFA</th>
    </tr>

    <tr v-for="(month, index) in months" v-bind:key="month.id">
      <td>{{month.id}}</td>
      <td>
        <input
          type="number"
          min="0"
          max="999999"
          step="1000"
          :value="months[index]['salary']"
          @input="changeSubsequentSalaries($event, index)"
        >
      </td>
      <td>
        <input
          max="99999"
          min="0"
          step="500"
          type="number"
          :value="months[index]['tds']"
          @input="changeSubsequentTds($event, index)"
        >
      </td>
      <td>{{ Math.round(months[index]['salary'] * salaryBreakdown.basic.percentage/100)}}</td>
      <td>{{ Math.round(months[index]['salary'] * salaryBreakdown.house.percentage/100)}}</td>
      <td>{{ Math.round(months[index]['salary'] * salaryBreakdown.medical.percentage/100)}}</td>
      <td>{{ Math.round(months[index]['salary'] * salaryBreakdown.transport.percentage/100)}}</td>
      <td>{{ Math.round(months[index]['salary'] * salaryBreakdown.lfa.percentage/100)}}</td>
    </tr>


    <tr>
      <td>Bonus</td>
      <td>
        <input
          type="number"
          min="0"
          max="999999"
          :value="bonus"
          @input="changeBonus"
        >
      </td>
    </tr>

    <tr>
      <td>Others</td>
      <td>
        <input
          type="number"
          min="0"
          max="999999"
          :value="others"
          @input="changeOthers"
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
import { mapState, mapGetters } from "vuex";

export default {
  name: "salaries",

  methods: {
    changeSubsequentSalaries($event, index) {
      this.$store.commit('changeSubsequentSalaries', { index, value: $event.target.value });
    },
    changeSubsequentTds($event, index) {
      this.$store.commit('changeSubsequentTds', { index, value: $event.target.value });
    },
    changeBonus($event) {
      this.$store.commit('changeBonus', $event.target.value );
    },
    changeOthers($event) {
      this.$store.commit('changeOthers', $event.target.value );
    },
  },
  computed: {
    ...mapState({
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      others: state => state.salaries.others,
    }),
    ...mapGetters({
      totalSalary: 'totalSalary',
      totalTds: 'totalTds'
    }),
  }
};
</script>
