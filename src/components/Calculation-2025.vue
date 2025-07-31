<template>
<div>
  <h2>Tax for {{otherYearLabel}} {{totalTax}}</h2>
  <table class="table table-bordered">
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
      <tr>
        <td> <strong>Total tax</strong> </td> <td> </td>
        <td> 
          <strong>{{totalTax}}</strong>
          <small v-if="isMinimumTaxApplied" style="color: red; display: block;">
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
      <tr>
        <td> <strong>Payable</strong> </td>
        <td> </td>
        <td> <strong>{{totalTax - totalTds - investmentRebate}}</strong> </td>
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
      return this.currentYear === '2024-25' ? 'FY 2025-2026' : 'FY 2024-2025';
    }
  }
};
</script>