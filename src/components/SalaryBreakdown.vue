<template>
  <table>
    <tr>
      <td>Last months salary</td>
      <td>
        <input type="number" min="0" :value="totalSalary" @input="updateTotalSalary">
      </td>
      <td>{{totalPercentage}}</td>
    </tr>
    <!-- <tr v-for="(part, index) in ['basic', 'house', 'medical', 'transport', 'lfa']">
      <td>{{part}}</td>
      <td>
        <input
          type="number"
          :value="salaryBreakDown[part].amount"
          @change="changeBreakdownAmount(part)"
        >
      </td>
      <td>
        <input
          max="100"
          min="0"
          type="number"
          :value="salaryBreakDown[part].percentage"
          @change="changeBreakdownPercentage(part)"
        >
      </td>
    </tr>-->
  </table>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "salary-breakdown",
  data: () => ({}),
  mounted() {
    // this.totalSalary = 35000;
  },
  methods: {
    updateTotalSalary(e) {
      this.$store.commit("updateTotalSalary", e.target.value);
    },
    changeBreakdownPercentage(part) {
      this.salaryBreakDown[part].amount = Math.round(
        this.totalSalary * (this.salaryBreakDown[part].percentage / 100)
      );
    },
    changeBreakdownAmount(part) {
      const { basic, house, medical, lfa, transport } = this.salaryBreakDown;

      this.totalSalary = Math.round(
        +basic.amount +
          +house.amount +
          +medical.amount +
          +lfa.amount +
          +transport.amount
      );

      this.salaryBreakDown[part].percentage =
        (this.salaryBreakDown[part].amount * 100) / this.totalSalary;
    }
  },

  watch: {
    totalSalary() {
      const keys = Object.keys(this.salaryBreakDown);
      keys.forEach(key => {
        this.salaryBreakDown[key].amount =
          this.totalSalary * (this.salaryBreakDown[key].percentage / 100);
      });
    }
  },
  computed: {
    ...mapState({
      totalSalary: state => state.totalSalary,
      totalPercentage: state => state.totalPercentage,
      salaryBreakDown: state => state.salaryBreakDown
    })
  }
};
</script>
