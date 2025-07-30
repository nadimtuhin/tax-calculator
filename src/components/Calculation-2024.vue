<template>
<div>
  <h2>Tax on Proposed (2024) rate {{totalTax}}</h2>
  <table class="table table-bordered">
    <tbody>
      <tr>
        <td>
          <strong>Income (per year)</strong>
        </td>
        <td>
          <strong>Proposed rate [%]</strong>
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
import calculateTaxBreakdown from '../calculateTaxBreakdown';
import { calculateTaxSlabs } from '../utils/taxSlabs';

export default {
  name: "calculation-2024",
  computed: {
    ...mapGetters({
      taxableSalary: 'taxableSalary',
      totalTds: 'totalTds',
      investmentRebate: 'investmentRebate',
      taxFreeThreshold: 'taxFreeThreshold',
      minimumTaxAmount: 'minimumTaxAmount',
    }),
    slabs() {
      return calculateTaxSlabs(this.taxFreeThreshold);
    },
    totalTax() {
      const calculatedTax = Math.round(this.taxBreakdown.reduceRight((c,i)=>c+ +i.slabCut, 0));
      // Apply minimum tax if applicable
      return Math.max(calculatedTax, this.minimumTaxAmount);
    },
    taxBreakdown() {
      return calculateTaxBreakdown(this.taxableSalary, this.slabs);
    },
    isMinimumTaxApplied() {
      const calculatedTax = Math.round(this.taxBreakdown.reduceRight((c,i)=>c+ +i.slabCut, 0));
      return calculatedTax < this.minimumTaxAmount;
    }
  }
};
</script>
