<template>
<div>
<h2>{{ $t('taxableIncome.title') }}</h2>
<table class="table">
  <tr>
    <th></th>
    <th>{{ $t('taxableIncome.total') }}</th>
    <th>{{ $t('taxableIncome.taxExempted') }}</th>
    <th>{{ $t('taxableIncome.taxable') }}</th>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.basic') }}</strong></td>
    <td>{{totalBasic}}</td>
    <td>0</td>
    <td>{{totalBasic}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.house') }}</strong></td>
    <td>{{totalHouse}}</td>
    <td>{{houseExempt}}</td>
    <td>{{totalHouse - houseExempt}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.medical') }}</strong></td>
    <td>{{totalMedical}}</td>
    <td>{{medicalExempt}}</td>
    <td>{{totalMedical - medicalExempt}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.transport') }}</strong></td>
    <td>{{totalTransport}}</td>
    <td>{{transportExempt}}</td>
    <td>{{totalTransport - transportExempt}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.lfa') }}</strong></td>
    <td>{{totalLfa}}</td>
    <td>{{lfaExempt}}</td>
    <td>{{totalLfa - lfaExempt}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.others') }}</strong></td>
    <td>{{others}}</td>
    <td>0</td>
    <td>{{others}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.bonus') }}</strong></td>
    <td>{{bonus}}</td>
    <td>0</td>
    <td>{{bonus}}</td>
  </tr>
  <tr>
    <td><strong>{{ $t('taxableIncome.grossSalary') }}</strong></td>
    <td><strong>{{totalSalary}}</strong></td>
    <td><strong>{{totalExempt}}</strong></td>
    <td><strong>{{taxableSalary}}</strong></td>
  </tr>
</table>
</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "taxable-income",
  computed: {
    ...mapState('salaries', {
      parts: 'parts',
      months: 'months',
      salaryBreakdown: 'salaryBreakdown',
      bonus: 'bonus',
      others: 'others',
    }),
    ...mapGetters('salaries', {
      totalSalary: 'totalSalary',
      totalTds: 'totalTds',
      totalHouse: 'totalHouse',
      totalLfa: 'totalLfa',
      totalMedical: 'totalMedical',
      totalTransport: 'totalTransport',
      totalBasic: 'totalBasic',
      houseExempt: 'houseExempt',
      medicalExempt: 'medicalExempt',
      transportExempt: 'transportExempt',
      lfaExempt: 'lfaExempt',
      taxableSalary: 'taxableSalary',
      totalExempt: 'totalExempt',
    }),
  }
}
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

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
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

.table tr:last-child {
  font-weight: 600;
  background-color: #f8f9fa;
}
</style>
