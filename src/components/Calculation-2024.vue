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
      <tr v-for="slab in taxBreakdown" v-bind:key="slab.id">
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

const LAKH = 100000;

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
      const threshold = this.taxFreeThreshold;
      const firstSlabAmountInLakh = (threshold / LAKH).toFixed(1); // Convert to lakh with 1 decimal
      
      return [
        [`First Tk${firstSlabAmountInLakh} lakh`, 0, threshold, 0],
        ['Next Tk1 lakh', threshold, threshold + 1*LAKH, 5],
        ['Next Tk4 lakh', threshold + 1*LAKH, threshold + 5*LAKH, 10],
        ['Next Tk5 lakh', threshold + 5*LAKH, threshold + 10*LAKH, 15],
        ['Next Tk5 lakh', threshold + 10*LAKH, threshold + 15*LAKH, 20],
        ['Next Tk20 lakh', threshold + 15*LAKH, threshold + 35*LAKH, 25],
        ['Above', threshold + 35*LAKH, Infinity, 30],
      ];
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
