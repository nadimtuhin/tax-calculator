<template>
<div>
  <h2>Total Tax Current (2023) ৳{{totalTax.toLocaleString()}}</h2>
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
        <td> <strong>{{totalTax.toLocaleString()}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Tax deducted at source</strong> </td>
        <td> </td>
        <td> <strong>-{{totalTds.toLocaleString()}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Tax rebate on investment</strong> </td>
        <td> </td>
        <td> <strong>-{{investmentRebate.toLocaleString()}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Payable</strong> </td>
        <td> </td>
        <td> <strong>{{(totalTax - totalTds - investmentRebate).toLocaleString()}}</strong> </td>
      </tr>
    </tbody>
  </table>
</div>

</template>

<script>
import { mapState, mapGetters } from 'vuex';
import calculateTaxBreakdown from '../calculateTaxBreakdown';

const LAKH = 100000;

export default {
  name: "calculation-2023",
  data: () => ({
    slabs: [
      ['First Tk3.5 lakh', 0, 3.5*LAKH, 0],
      ['Next Tk1 lakh', 3.5*LAKH, (3.5+1)*LAKH, 5],
      ['Next Tk3 lakh', (3.5+1)*LAKH, (3.5+1+3)*LAKH, 10],
      ['Next Tk4 lakh', (3.5+1+3)*LAKH, (3.5+1+3+4)*LAKH, 15],
      ['Next Tk5 lakh', (3.5+1+3+4)*LAKH, (3.5+1+3+4+5)*LAKH, 20],
      ['Above', (3.5+1+3+4+5)*LAKH, Infinity, 25],
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
