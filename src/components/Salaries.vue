<style lang="css" scoped>
  input {
    width: 150px;
  }
</style>
<template>
<div>
  <h2>Enter salary information</h2>

  <table class="">
    <tr>
      <th></th>
      <th>salary</th>
      <th>
        <span title="tax deduction at source">tds*</span>
      </th>
      <th>Basic</th>
      <th>House</th>
      <th>Medical</th>
      <th>Transportation</th>
      <th>LFA</th>
    </tr>

    <tr v-for="(month, index) in months" v-bind:key="month.id">
      <td><strong>{{month.id}}</strong></td>
      <td>
        <input
          disabled
          type="number"
          min="0"
          max="999999"
          class="input"
          step="1000"
          :value="months[index]['salary']"
          @input="changeSubsequentSalaries($event, index)"
        >
      </td>
      <td>
        <input
          max="99999"
          min="0"
          step="500"
          type="number"
          :value="months[index]['tds']"
          @input="changeSubsequentTds($event, index)"
        >
      </td>

      <template v-for="part in parts">
        <td v-bind:key="part">
          <input
            max="999999"
            min="0"
            step="500"
            type="number"
            :value="months[index].breakdown[part]"
            @input="changeBreakdown($event, index, part)"
          >
        </td>
      </template>
    </tr>

    <tr>
      <td>Bonus</td>
      <td>
        <input
          type="number"
          min="0"
          max="999999"
          step="1000"
          :value="bonus"
          @input="changeBonus"
        >
      </td>
    </tr>

    <tr>
      <td>Others</td>
      <td>
        <input
          type="number"
          min="0"
          max="999999"
          step="1000"
          :value="others"
          @input="changeOthers"
        >
      </td>
    </tr>
  </table>
</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "salaries",

  mounted() {
    // const urlParams = new URLSearchParams(window.location.search);
    // const salary = urlParams.get("salary") || 35000;

    // load from query param if nothing found on local storage
    // if (!this.months[0].salary) {
    //   this.$store.commit('initialSalary');
    // }
  },

  methods: {
    changeSubsequentTds($event, index) {
      this.$store.commit('changeSubsequentTds', { index, value: $event.target.value });
    },
    changeBonus($event) {
      this.$store.commit('changeBonus', $event.target.value );
    },
    changeOthers($event) {
      this.$store.commit('changeOthers', $event.target.value );
    },
    changeBreakdown($event, index, part) {
      this.$store.commit('changeParts', { index, part, value: $event.target.value } );
    }
  },
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
    }),
  }
};
</script>
