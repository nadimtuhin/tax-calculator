<style scoped>
  table input {
    width: 145px;
  }
  .button-container {
    display: flex; /* Ensures inline display of buttons */
    align-items: center; /* Vertically aligns the buttons if needed */
    justify-content: start; /* Aligns buttons to the start of the container */
  }
  .button-container button {
    padding: 8px 15px;
    margin-right: 10px; /* Space between buttons */
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .button-container button:hover {
    background-color: #45a049;
  }


</style>

<template>
<div>
  <h2>{{ $t('salaries.title') }}</h2>
  <table>
    <tr>
      <th></th>
      <th>{{ $t('salaries.salary') }}</th>
      <th>
        <span :title="$t('salaries.tdsTooltip')">{{ $t('salaries.tds') }}*</span>
      </th>
      <th>{{ $t('salaries.basic') }}</th>
      <th>{{ $t('salaries.house') }}</th>
      <th>{{ $t('salaries.medical') }}</th>
      <th>{{ $t('salaries.transportation') }}</th>
      <th>{{ $t('salaries.lfa') }}</th>
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

      <td v-for="part in parts" :key="part">
        <input
          max="999999"
          min="0"
          step="500"
          type="number"
          :value="months[index].breakdown[part]"
          @input="changeBreakdown($event, index, part)"
        >
      </td>
    </tr>

    <tr>
      <td>{{ $t('salaries.bonus') }}</td>
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
      <td>{{ $t('salaries.others') }}</td>
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
