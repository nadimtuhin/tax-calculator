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
import { calculateTaxBreakdown, calculateTaxSlabs } from '../utils/calculateTaxBreakdown';

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
        this.slabs = calculateTaxSlabs(newSlab);
      }
    }
  }
};
</script>
