<template>
<div>
  <header class="calc-card-header">
    <span class="section-eyebrow">Assessment Year 2026–27 · Schedule 1</span>
    <h2 class="calc-heading"><span class="calc-heading-label">Tax for {{otherYearLabel}}</span> <span class="calc-heading-amount amount">{{totalTax}}</span></h2>
  </header>
  <table class="invoice">
    <tbody>
      <tr>
        <td>
          <strong>Income (per year)</strong>
        </td>
        <td>
          <strong>New rate [%]</strong>
        </td>
        <td>
          <strong>Tax (BDT)</strong>
        </td>
      </tr>
      <tr v-for="slab in taxBreakdown" :key="slab.id">
        <td>{{slab.slabTitle}}</td>
        <td>{{slab.slabPercentage}}</td>
        <td>{{slab.slabCut}}</td>
      </tr>
      <tr class="row-total">
        <td> <strong>Total tax</strong> </td> <td> </td>
        <td> 
          <strong>{{totalTax}}</strong>
          <small v-if="isMinimumTaxApplied" class="min-tax-notice">
            (Minimum tax applied: BDT {{minimumTaxAmount}})
          </small>
        </td>
      </tr>
      <tr>
        <td> <strong>Tax deducted at source</strong> </td>
        <td> </td>
        <td> <strong>-{{totalTds}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Tax rebate on investment</strong> </td>
        <td> </td>
        <td> <strong>-{{investmentRebate}}</strong> </td>
      </tr>
      <tr class="row-payable">
        <td> <strong>Payable</strong> </td>
        <td> </td>
        <td> <strong>{{payableTax}}</strong> </td>
      </tr>
    </tbody>
  </table>
</div>

</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "calculation-2025",
  computed: {
    ...mapGetters({
      taxableSalary: 'taxableSalary',
      totalTds: 'totalTds',

      // FY 2025-2026 specific getters
      investmentRebate: 'investmentRebate2025',
      taxFreeThreshold: 'taxFreeThreshold2025',
      minimumTaxAmount: 'minimumTaxAmount2025',
      taxBreakdown: 'taxBreakdown2025',
      calculatedTax: 'calculatedTax2025',
      totalTax: 'totalTax2025',
      isMinimumTaxApplied: 'isMinimumTaxApplied2025',
      payableTax: 'payableTax2025',

      currentYear: 'currentYear',
      fiscalYearOptions: 'fiscalYearOptions'
    }),
    otherYearLabel() {
      // This component always shows FY 2025-26 data
      return 'FY 2025-2026';
    }
  }
};
</script>

<style scoped>
.calc-card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--border);
}

.calc-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin: 0;
}

.calc-heading-amount {
  display: inline-flex;
  align-items: center;
  padding: 3px var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--text-sm);
  font-weight: 700;
}

.calc-heading-amount::before {
  content: "৳";
  margin-right: 2px;
}

.invoice {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.invoice td {
  padding: var(--space-3) var(--space-2);
  border-bottom: 1px solid var(--border);
  font-variant-numeric: tabular-nums;
  vertical-align: top;
}

.invoice td:not(:first-child) {
  text-align: right;
}

.invoice tr:first-child td {
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom-color: var(--border-strong);
}

.invoice tr:first-child td strong {
  font-weight: 600;
}

.invoice .row-total td {
  border-top: 1px solid var(--border-strong);
  font-size: var(--text-base);
}

.invoice .row-payable td {
  background: var(--accent-soft);
  color: var(--accent);
  font-size: var(--text-lg);
  border-bottom: 0;
}

.invoice .row-payable td:first-child {
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
}

.invoice .row-payable td:last-child {
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.min-tax-notice {
  display: block;
  margin-top: var(--space-1);
  color: var(--bad);
  font-size: 0.8125rem;
}
</style>
