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
          :value="months[index]['salary']"
          @input="changeSubsequentSalaries($event, index)"
        >
      </td>
      <td>
        <input
          min="0"
          type="number"
          :value="months[index]['tds']"
          @input="changeSubsequentTds($event, index)"
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
    }
  },

  computed: {
    ...mapState({
      months: state => state.salaries.months,
    }),
    ...mapGetters({
      totalSalary: 'totalSalary',
      totalTds: 'totalTds'
    }),
  }
};
</script>
