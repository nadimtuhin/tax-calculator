<template>
<table class="table">
  <tr>
    <th></th>
    <th>Total</th>
    <th>Tax exempted</th>
    <th>Taxable</th>
  </tr>
  <tr>
    <td>Basic</td>
    <td>{{totalBasic}}</td>
    <td>0</td>
    <td>{{totalBasic}}</td>
  </tr>
  <tr>
    <td>House</td>
    <td>{{totalHouse}}</td>
    <td>{{houseExempt}}</td>
    <td>{{totalHouse - houseExempt}}</td>
  </tr>
  <tr>
    <td>Medical</td>
    <td>{{totalMedical}}</td>
    <td>{{medicalExempt}}</td>
    <td>{{totalMedical - medicalExempt}}</td>
  </tr>
  <tr>
    <td>Transport</td>
    <td>{{totalTransport}}</td>
    <td>{{transportExempt}}</td>
    <td>{{totalTransport - transportExempt}}</td>
  </tr>
  <tr>
    <td>LFA</td>
    <td>{{totalLfa}}</td>
    <td>{{lfaExempt}}</td>
    <td>{{totalLfa - lfaExempt}}</td>
  </tr>
  <tr>
    <td>Others</td>
    <td>{{others}}</td>
    <td>0</td>
    <td>{{others}}</td>
  </tr>
  <tr>
    <td>Bonus</td>
    <td>{{bonus}}</td>
    <td>0</td>
    <td>{{bonus}}</td>
  </tr>
  <tr>
    <td>Gross Salary</td>
    <td>{{totalSalary}}</td>
    <td>{{medicalExempt + transportExempt + lfaExempt + houseExempt}}</td>
    <td>{{totalSalary - (medicalExempt + transportExempt + lfaExempt + houseExempt)}}</td>
  </tr>
</table>
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
    }),
  }
}
</script>

<style>

</style>
