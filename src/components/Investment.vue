<template>
<div>
<header class="section-header">
  <div class="section-heading-group">
    <span class="section-eyebrow">Step 04 · Section 78 Credit</span>
    <h2>Tax rebate on investment</h2>
  </div>
  <span class="section-pill section-pill-accent amount">Rebate <strong>৳{{ Number(investmentRebate || 0).toLocaleString() }}</strong></span>
</header>

<p v-if="totalInvestment === 0" class="empty-state">
  No investments yet. Enter an amount below to see your tax rebate.
</p>

<div class="table-scroll">
<table class="investment-list">
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
        <span class="money"><span class="money-prefix" aria-hidden="true">৳</span><input
          type="number"
          :aria-label="`${investment.name} amount`"
          :value="investments[index].amount"
          @input="changeInvestment($event, index)"
          step="1000"
          min="0"
          max="9999999"
        /></span>
      </td>
      <td>
        <span v-if="getCapForRow(investment.name) === null" class="unlimited">Unlimited</span>
        <span v-else class="limited">{{getCapForRow(investment.name).toLocaleString()}}</span>
      </td>
    </tr>

    <tr>
      <td><strong>Total Investment</strong></td>
      <td>{{totalInvestment.toLocaleString()}}</td>
      <td>{{maxRebateableInvestment.toLocaleString()}}</td>
    </tr>

    <tr>
      <td>
        <strong>Total rebateable investment</strong>
      </td>
      <td>{{eligibleInvestment.toLocaleString()}}</td>
      <td></td>
    </tr>

    <tr>
      <td>
        <strong>Tax rebate percentage</strong>
        <small class="formula-hint">
          Lower of 3% of taxable income, {{rebatePercentage}}% of eligible investment, or ৳{{rebateMaxCap.toLocaleString()}}
        </small>
      </td>
      <td>{{rebatePercentage}}%</td>
      <td></td>
    </tr>

    <tr>
      <td><strong>Total rebate on investment</strong></td>
      <td>{{ investmentRebate.toLocaleString() }}</td>
      <td></td>
    </tr>
  </tbody>
</table>
</div>

</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { getInvestmentCapForType } from "../utils/taxEngine";

export default {
  name: "investment",
  methods: {
    changeInvestment($event, index) {
      this.$store.commit('changeInvestment', { index, value: $event.target.value });
    },
    getCapForRow(name) {
      return getInvestmentCapForType(name, this.currentYear);
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
      currentYear: state => state.salaries.currentYear,
    }),
    ...mapGetters({
      totalInvestment: 'totalInvestment',
      eligibleInvestment: 'eligibleInvestment',
      totalRebateableInvestment: 'totalRebateableInvestment',
      maxRebateableInvestment: 'maxRebateableInvestment',
      rebatePercentage: 'rebatePercentage',
      rebateMaxCap: 'rebateMaxCap',
      investmentRebate: 'investmentRebate',

      totalSalary: 'totalSalary',
      totalTds: 'totalTds',
      totalHouse: 'totalHouse',
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
.empty-state {
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.table-scroll {
  overflow-x: auto;
}

.investment-list {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.investment-list th {
  padding: var(--space-2) var(--space-1);
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-strong);
}

.investment-list td {
  padding: var(--space-3) var(--space-1);
  text-align: right;
  border-bottom: 1px solid var(--border);
  font-variant-numeric: tabular-nums;
}

.investment-list th:first-child,
.investment-list td:first-child {
  text-align: left;
}

.investment-list tr:last-child td {
  border-bottom: 0;
  font-weight: 700;
}

.formula-hint {
  display: block;
  margin-top: 2px;
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.money {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.money-prefix {
  position: absolute;
  left: var(--space-2);
  color: var(--text-muted);
  pointer-events: none;
}

.money input {
  width: 128px;
  min-height: 40px;
  padding: 0 var(--space-2) 0 calc(var(--space-2) + 1.1em);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.money input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.unlimited,
.limited {
  display: inline-block;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}

.unlimited {
  color: var(--good);
  background-color: var(--good-soft);
}

.limited {
  color: var(--text-muted);
  background-color: var(--surface-muted);
  border: 1px solid var(--border);
}
</style>
