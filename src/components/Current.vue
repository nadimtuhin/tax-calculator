<template>
<div>
  <h2>Tax on current rate {{totalTax}}</h2>
  <table class="table table-bordered">
    <tbody>
      <tr>
        <td>
          <strong>Income (per year)</strong>
        </td>
        <td>
          <strong>Current rate [%]</strong>
        </td>
        <td>
          <strong>Tax (BDT)</strong>
        </td>
      </tr>
      <tr v-for="slab in taxBreakdown" v-bind:key="slab.slabTitle">
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
        <td> <strong>{{totalTds}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Tax rebate on investment</strong> </td>
        <td> </td>
        <td> <strong>{{investmentRebate}}</strong> </td>
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
import { mapState, mapGetters } from "vuex";
import calculateTaxBreakdown from '../calculateTaxBreakdown';

const LAKH = 100000;

export default {
  name: "Current",
  data: () => ({
    slabs: [
      ['First Tk2.5 lakh', 0, 2.5*LAKH, 0],
      ['Next Tk4 lakh', 2.5*LAKH, (2.5+4)*LAKH, 10],
      ['Next Tk5 lakh', (2.5+4)*LAKH, (2.5+4+5)*LAKH, 15],
      ['Next Tk6 lakh', (2.5+4+5)*LAKH, (2.5+4+5+6)*LAKH, 20],
      ['Next Tk30 lakh', (2.5+4+5+6)*LAKH, (2.5+4+5+6+30)*LAKH, 25],
      ['Above', (2.5+4+5+6+30)*LAKH, Infinity, 30],
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
