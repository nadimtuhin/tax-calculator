<template>
<div>
  <h2 v-if="totalTax">{{ $t('calculation.tax2024', { amount: totalTax.toLocaleString() }) }}</h2>
  <h2 v-else>{{ $t('calculation.noTaxMessage') }}</h2>
  <table class="table table-bordered">
    <tbody>
      <tr>
        <td>
          <strong>{{ $t('calculation.incomeSlab') }}</strong>
        </td>
        <td>
          <strong>{{ $t('calculation.taxRate') }}</strong>
        </td>
        <td>
          <strong>{{ $t('calculation.taxAmount') }}</strong>
        </td>
      </tr>
      <tr v-for="slab in taxBreakdown" v-bind:key="slab.id">
        <td>{{slab.slabTitle}}</td>
        <td>{{slab.slabPercentage}}</td>
        <td>{{slab.slabCut.toLocaleString()}}</td>
      </tr>
      <tr>
        <td><strong>{{ $t('calculation.totalTax') }}</strong></td>
        <td></td>
        <td><strong>{{totalTax.toLocaleString()}}</strong></td>
      </tr>
      <tr>
        <td><strong>{{ $t('calculation.tds') }}</strong></td>
        <td></td>
        <td><strong v-if="totalTds">-{{totalTds.toLocaleString()}}</strong></td>
      </tr>
      <tr>
        <td><strong>{{ $t('calculation.investmentRebate') }}</strong></td>
        <td></td>
        <td><strong v-if="investmentRebate">-{{investmentRebate.toLocaleString()}}</strong></td>
      </tr>
      <tr>
        <td><strong>{{ $t('calculation.payable') }}</strong></td>
        <td></td>
        <td>
          <strong>{{totalTax - totalTds - investmentRebate}}</strong><br/>
          <span v-if="totalTax - totalTds - investmentRebate < 0">
            {{ $t('calculation.refundMessage') }}
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>

</template>

<script>
import { mapGetters } from 'vuex';
import { calculateTaxBreakdown, calculateTaxSlabs } from '../utils/calculateTaxBreakdown';

export default {
  name: "calculation-2024",
  data() {
    return {
      slabs: []
    }
  },
  computed: {
    ...mapGetters({
      taxableSalary: 'salaries/taxableSalary',
      totalTds: 'salaries/totalTds',
      investmentRebate: 'investments/investmentRebate',
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

<style scoped>
.table {
  width: 100%;
  margin: 1rem 0;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
}

.table th,
.table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover {
  background-color: #f8f9fa;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.table tr:nth-last-child(-n+4) {
  background-color: #f8f9fa;
}

.table tr:last-child {
  font-weight: 600;
  font-size: 1.1em;
}

.table tr:last-child td {
  padding-top: 1.5rem;
}

span {
  color: #666;
  font-size: 0.9em;
  font-style: italic;
}
</style>
