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

<style scoped>
.table {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
}

.table th,
.table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover {
  background-color: #f8f9fa;
}

input[type="number"] {
  width: 150px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input[type="number"]:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.table tr:nth-last-child(-n+4) {
  font-weight: 600;
  background-color: #f8f9fa;
}
</style>
