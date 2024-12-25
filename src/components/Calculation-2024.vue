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
        <td> <strong>{{totalTax}}</strong> </td>
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
  data: () => ({
    slabs: [
      ['First Tk3.5 lakh', 0, 3.5*LAKH, 0],
      ['Next Tk1 lakh', 3.5*LAKH, (3.5+1)*LAKH, 5],
      ['Next Tk4 lakh', (3.5+1)*LAKH, (3.5+1+4)*LAKH, 10],
      ['Next Tk5 lakh', (3.5+1+4)*LAKH, (3.5+1+4+5)*LAKH, 15],
      ['Next Tk5 lakh', (3.5+1+4+5)*LAKH, (3.5+1+4+5+5)*LAKH, 20],
      ['Next Tk20 lakh', (3.5+1+4+5+5)*LAKH, (3.5+1+4+5+5+20)*LAKH, 25],
      ['Above', (3.5+1+4+5+5+20)*LAKH, Infinity, 30],
    ],
  }),
  computed: {
    ...mapGetters({
      taxableSalary: 'taxableSalary',
      totalTds: 'totalTds',
      investmentRebate: 'investmentRebate',
    }),
    totalTax() {
      return Math.round(this.taxBreakdown.reduceRight((c,i)=>c+ +i.slabCut, 0));
    },
    taxBreakdown() {
      return calculateTaxBreakdown(this.taxableSalary, this.slabs);
    }
  }
};
</script>
