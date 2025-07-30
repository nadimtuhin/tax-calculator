<template>
  <table>
    <tbody>
      <tr>
        <td>Last months salary</td>
        <td>
          $ <input
            step="1000"
            type="number"
            min="0"
            max="999999"
            :value="totalSalary"
            @input="updateTotalSalary"
            />
        </td>
        <td>{{totalPercentage}} %</td>
      </tr>

      <tr v-for="part in visibleParts" :key="part">
        <td>{{part}}</td>
        <td>
          $  <input
            type="number"
            max="999999"
            min="0"
            step="1000"
            :value="salaryBreakdown[part].amount"
            @input="changeBreakdownAmount($event, part)"
          >
        </td>
        <td>
          <input
            max="100"
            min="0"
            step="5"
            type="number"
            :value="salaryBreakdown[part].percentage"
            @input="changeBreakdownPercentage($event, part)"
          > %
        </td>
      </tr>
    </tbody>
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
    this.$store.commit('changeSubsequentSalaries', { index: 0, value: 35000 });
  },
  methods: {
    updateTotalSalary(e) {
      this.$store.commit("updateTotalSalary", e.target.value);
      this.$store.commit('changeSubsequentSalaries', { index: 0, value: e.target.value });
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
      salaryBreakdown: state => state.breakdown.salaryBreakdown
    }),
    ...mapGetters({
      totalPercentage: 'totalPercentage',
    }),
    visibleParts() {
      return this.parts.filter(part => 
        this.salaryBreakdown[part] && 
        (this.salaryBreakdown[part].amount > 0 || this.salaryBreakdown[part].percentage > 0)
      );
    }
  }
};
</script>
