<template>
<div>
  <h2 v-if="totalTax">Tax (2024): {{totalTax.toLocaleString()}} BDT</h2>
  <h2 v-else>You are not liable to pay any tax</h2>
  <table class="table table-bordered">
    <tbody>
      <tr>
        <td>
          <strong>Income slab (per year)</strong>
        </td>
        <td>
          <strong>Tax rate [%]</strong>
        </td>
        <td>
          <strong>Tax (BDT)</strong>
        </td>
      </tr>
      <tr v-for="slab in taxBreakdown" v-bind:key="slab.id">
        <td>{{slab.slabTitle}}</td>
        <td>{{slab.slabPercentage}}</td>
        <td>{{slab.slabCut.toLocaleString()}}</td>
      </tr>
      <tr>
        <td> <strong>Total tax</strong> </td> <td> </td>
        <td> <strong>{{totalTax.toLocaleString()}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Tax deducted at source</strong> </td>
        <td> </td>
        <td> <strong v-if="totalTds">-{{totalTds.toLocaleString()}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Tax rebate on investment</strong> </td>
        <td> </td>
        <td> <strong v-if="investmentRebate">-{{investmentRebate.toLocaleString()}}</strong> </td>
      </tr>
      <tr>
        <td> <strong>Payable</strong> </td>
        <td> </td>
        <td>
          <strong>
            {{totalTax - totalTds - investmentRebate}}
          </strong> <br/>
          <span v-if="totalTax - totalTds - investmentRebate < 0">
              (You can claim this amount from the government)
            </span>
        </td>
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
