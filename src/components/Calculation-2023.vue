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
      <tr v-for="slab in taxBreakdown" v-bind:key="slab.id">
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
import { calculateTaxBreakdown } from '../utils/calculateTaxBreakdown';

const LAKH = 100000;

export default {
  name: "calculation-2023",
  data() {
    return {
      slabs: []
    }
  },
  computed: {
    ...mapGetters({
      taxableSalary: 'taxableSalary',
      totalTds: 'totalTds',
      investmentRebate: 'investmentRebate',
      taxFreeSlab: 'personalInfo/taxFreeSlab'
    }),
    totalTax() {
      return Math.round(this.taxBreakdown.reduceRight((c,i)=>c+ +i.slabCut, 0));
    },
    taxBreakdown() {
      return calculateTaxBreakdown(this.taxableSalary, this.slabs);
    }
  },
  watch: {
    taxFreeSlab: {
      immediate: true,
      handler(newSlab) {
        this.slabs = [
          ['First ' + (newSlab/LAKH).toFixed(2) + ' lakh', 0, newSlab, 0],
          ['Next Tk1 lakh', newSlab, newSlab + LAKH, 5],
          ['Next Tk3 lakh', newSlab + LAKH, newSlab + 4*LAKH, 10],
          ['Next Tk4 lakh', newSlab + 4*LAKH, newSlab + 8*LAKH, 15],
          ['Next Tk5 lakh', newSlab + 8*LAKH, newSlab + 13*LAKH, 20],
          ['Above', newSlab + 13*LAKH, Infinity, 25],
        ];
      }
    }
  }
};
</script>
