<template>
<div>
<h2>Tax rebate on investment</h2>

<table class="table">
  <tr>
    <th></th>
    <th>Amount</th>
    <th>Maximum allowed</th>
  </tr>

  <tr v-for="(investment, index) in investments" v-bind:key="investment.name">
    <td><strong>{{investment.name}}</strong></td>
    <td>
      <input
        type="number"
        :value="investments[index].amount"
        @input="changeInvestment($event, index)"
        step="1000"
        min="0"
        max="9999999"
      />
    </td>
    <td>{{investment.maximum > 9999999999 ? '': investment.maximum.toLocaleString()}}</td>
  </tr>

  <tr>
    <td><strong>Total Investment</strong></td>
    <td>{{totalInvestment.toLocaleString()}}</td>
    <td>{{maxRebateableInvestment.toLocaleString()}}</td>
  </tr>

  <tr>
    <td><strong>Total rebateable investment</strong></td>
    <td>{{totalRebateableInvestment.toLocaleString()}}</td>
    <td></td>
  </tr>

  <tr>
    <td><strong>Tax rebate percentage</strong></td>
    <td>15%</td>
    <td></td>
  </tr>

  <tr>
    <td><strong>Totat rebate on investment</strong></td>
    <td>{{ investmentRebate.toLocaleString() }}</td>
    <td></td>
  </tr>
</table>


</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "investment",
  methods: {
    changeInvestment($event, index) {
      this.$store.commit('changeInvestment', { index, value: $event.target.value });
    },
  },
  computed: {
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      others: state => state.salaries.others,
      investments: state => state.salaries.investments,
    }),
    ...mapGetters({
      totalInvestment: 'totalInvestment',
      totalRebateableInvestment: 'totalRebateableInvestment',
      maxRebateableInvestment: 'maxRebateableInvestment',
      rebatePercentage: 'rebatePercentage',
      investmentRebate: 'investmentRebate',

      totalSalary: 'totalSalary',
      totalTds: 'totalTds',
      totalHouse: 'totalHouse',
      totalLfa: 'totalLfa',
      totalMedical: 'totalMedical',
      totalTransport: 'totalTransport',
      totalBasic: 'totalBasic',
      houseExempt: 'houseExempt',
      medicalExempt: 'medicalExempt',
      transportExempt: 'transportExempt',
      lfaExempt: 'lfaExempt',
      taxableSalary: 'taxableSalary',
      totalExempt: 'totalExempt',
    }),
  }
}
</script>

<style>

</style>
