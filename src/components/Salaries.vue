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
  </table>

  <div class="income-section">
    <div class="section-header">
      <h3>{{ $t('salaries.bonuses') }}</h3>
      <button class="reset-button" @click="resetBonuses">{{ $t('actions.reset') }}</button>
    </div>
    <div v-for="(bonus, index) in bonuses" :key="'bonus-'+index" class="income-row">
      <input
        type="text"
        :value="bonus.name"
        disabled
      >
      <input
        type="number"
        min="0"
        max="999999"
        step="1000"
        :value="bonus.amount"
        @input="updateBonus(index, bonus.name, $event.target.value)"
      >
      <button class="remove-button" @click="removeBonus(index)">{{ $t('common.remove') }}</button>
    </div>
    <button class="add-button" @click="addBonus">{{ $t('common.add') }} {{ $t('salaries.bonus') }}</button>
  </div>

  <div class="income-section">
    <div class="section-header">
      <h3>{{ $t('salaries.otherIncomes') }}</h3>
      <button class="reset-button" @click="resetOtherIncomes">{{ $t('actions.reset') }}</button>
    </div>
    <div v-for="(income, index) in otherIncomes" :key="'other-'+index" class="income-row">
      <input
        type="text"
        :placeholder="$t('salaries.incomeName')"
        :value="income.name"
        @input="updateOtherIncome(index, $event.target.value, income.amount)"
      >
      <input
        type="number"
        min="0"
        max="999999"
        step="1000"
        :value="income.amount"
        @input="updateOtherIncome(index, income.name, $event.target.value)"
      >
      <button class="remove-button" @click="removeOtherIncome(index)">{{ $t('common.remove') }}</button>
    </div>
    <button class="add-button" @click="addOtherIncome">{{ $t('common.add') }} {{ $t('salaries.otherIncome') }}</button>
  </div>
</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "salaries",

  methods: {
    changeSubsequentTds($event, index) {
      this.$store.commit('changeSubsequentTds', { index, value: $event.target.value });
    },
    changeBreakdown($event, index, part) {
      this.$store.commit('changeParts', { index, part, value: $event.target.value } );
    },
    addBonus() {
      this.$store.commit('addBonus', { name: '', amount: 0 });
    },
    removeBonus(index) {
      this.$store.commit('removeBonus', index);
    },
    updateBonus(index, name, amount) {
      this.$store.commit('updateBonus', { index, name, amount });
    },
    resetBonuses() {
      this.$store.commit('resetBonuses');
    },
    addOtherIncome() {
      this.$store.commit('addOtherIncome', { name: '', amount: 0 });
    },
    removeOtherIncome(index) {
      this.$store.commit('removeOtherIncome', index);
    },
    updateOtherIncome(index, name, amount) {
      this.$store.commit('updateOtherIncome', { index, name, amount });
    },
    resetOtherIncomes() {
      this.$store.commit('resetOtherIncomes');
    }
  },
  computed: {
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      bonuses: state => state.salaries.bonuses,
      otherIncomes: state => state.salaries.otherIncomes,
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
  .add-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    margin-left: 8px;
  }
  .remove-button {
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    margin-left: 8px;
  }
  .income-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  .income-row input {
    margin-right: 8px;
  }
  .income-section {
    margin-top: 16px;
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .reset-button {
    background-color: #ff9800;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 0.9em;
  }
  .reset-button:hover {
    background-color: #f57c00;
  }
</style>
