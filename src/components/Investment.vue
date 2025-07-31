<template>
<div>
<h2>Tax rebate on investment</h2>

<table class="table">
  <thead>
    <tr>
      <th></th>
      <th>Amount</th>
      <th>Maximum allowed</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(investment, index) in investments" :key="investment.name">
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
    <td>
      <span v-if="investment.maximum > 9999999999" class="unlimited">Unlimited</span>
      <span v-else class="limited">{{investment.maximum.toLocaleString()}}</span>
    </td>
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
  </tbody>
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

<style scoped>
.unlimited {
  color: #000000;
  font-weight: 600;
  background-color: #ffffff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #000000;
}

.limited {
  color: #ffffff;
  font-weight: 600;
  background-color: #000000;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #000000;
}
</style>
