<template>
<div>
<h2>Taxable income breakdown</h2>
<table class="table">
  <tr>
    <th></th>
    <th>Total</th>
    <th>Tax exempted</th>
    <th>Taxable</th>
  </tr>
  <tr>
    <td><strong>Basic</strong></td>
    <td>{{totalBasic}}</td>
    <td>0</td>
    <td>{{totalBasic}}</td>
  </tr>
  <tr>
    <td><strong>House</strong></td>
    <td>{{totalHouse}}</td>
    <td>{{houseExempt}}</td>
    <td>{{totalHouse - houseExempt}}</td>
  </tr>
  <tr>
    <td><strong>Medical</strong></td>
    <td>{{totalMedical}}</td>
    <td>{{medicalExempt}}</td>
    <td>{{totalMedical - medicalExempt}}</td>
  </tr>
  <tr>
    <td><strong>Transport</strong></td>
    <td>{{totalTransport}}</td>
    <td>{{transportExempt}}</td>
    <td>{{totalTransport - transportExempt}}</td>
  </tr>
  <tr>
    <td><strong>LFA</strong></td>
    <td>{{totalLfa}}</td>
    <td>{{lfaExempt}}</td>
    <td>{{totalLfa - lfaExempt}}</td>
  </tr>
  <tr>
    <td><strong>Others</strong></td>
    <td>{{others}}</td>
    <td>0</td>
    <td>{{others}}</td>
  </tr>
  <tr>
    <td><strong>Bonus</strong></td>
    <td>{{bonus}}</td>
    <td>0</td>
    <td>{{bonus}}</td>
  </tr>
  <tr>
    <td><strong>Gross Salary</strong></td>
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
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      others: state => state.salaries.others,
    }),
    ...mapGetters({
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

<style>

</style>
