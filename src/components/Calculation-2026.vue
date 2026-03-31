<template>
<div>
  <h2>Tax for 2026-2027 {{totalTax}}</h2>
  <table class="table table-bordered">
    <tbody>
      <tr>
        <td>
          <strong>Income (per year)</strong>
        </td>
        <td>
          <strong>Rate [%]</strong>
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
  name: "calculation-2026",
  computed: {
    ...mapGetters({
      taxableSalary: 'taxableSalary',
      totalTds: 'totalTds',

      // FY 2026-2027 specific getters
      investmentRebate: 'investmentRebate2026',
      taxFreeThreshold: 'taxFreeThreshold2026',
      minimumTaxAmount: 'minimumTaxAmount2026',
      taxBreakdown: 'taxBreakdown2026',
      calculatedTax: 'calculatedTax2026',
      totalTax: 'totalTax2026',
      isMinimumTaxApplied: 'isMinimumTaxApplied2026',
      payableTax: 'payableTax2026',
    }),
  }
};
</script>
