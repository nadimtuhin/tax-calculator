<template>
  <table>
    <tr>
      <td>Last months salary</td>
      <td>
        $ <input type="number" min="0" :value="totalSalary" @input="updateTotalSalary">
      </td>
      <td>{{totalPercentage}} %</td>
    </tr>

    <tr v-for="part in this.parts" v-bind:key="part">
      <td>{{part}}</td>
      <td>
        $  <input
          type="number"
          :value="salaryBreakDown[part].amount"
          @input="changeBreakdownAmount($event, part)"
        >
      </td>
      <td>
        <input
          max="100"
          min="0"
          type="number"
          :value="salaryBreakDown[part].percentage"
          @input="changeBreakdownPercentage($event, part)"
        > %
      </td>
    </tr>
  </table>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "salary-breakdown",
  data: () => ({}),
  mounted() {
    // this.totalSalary = 35000;
    this.$store.commit("updateTotalSalary", 35000);
  },
  methods: {
    updateTotalSalary(e) {
      this.$store.commit("updateTotalSalary", e.target.value);
    },
    changeBreakdownPercentage(e, part) {
      this.$store.commit("changeBreakdownPercentage", { part, value: e.target.value });
    },
    changeBreakdownAmount(e, part) {
      this.$store.commit("changeBreakdownAmount", { part, value: e.target.value });
    }
  },
  computed: {
    ...mapState({
      parts: state => state.breakdown.parts,
      totalSalary: state => state.breakdown.totalSalary,
      salaryBreakDown: state => state.breakdown.salaryBreakDown
    }),
    ...mapGetters({
      totalPercentage: 'totalPercentage',
    })
  }
};
</script>
