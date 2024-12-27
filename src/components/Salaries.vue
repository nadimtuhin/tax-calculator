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
      <div class="header-group">
        <h3>{{ $t('salaries.bonuses') }}</h3>
        <button class="reset-button" @click="resetBonuses">{{ $t('actions.reset') }}</button>
      </div>
      <div class="header-group">
        <h3>{{ $t('salaries.otherIncomes') }}</h3>
        <button class="reset-button" @click="resetOtherIncomes">{{ $t('actions.reset') }}</button>
      </div>
    </div>
    <div class="income-tables-container">
      <table class="income-table">
        <tr v-if="bonuses.length === 0">
          <td colspan="3" class="empty-message">
            {{ $t('salaries.noBonus') }}
          </td>
        </tr>
        <tr v-for="(bonus, index) in bonuses" :key="'bonus-'+index">
          <td>
            <input
              v-if="!bonus.isDefault"
              :placeholder="$t('salaries.bonus') + ' ' + (index+1)"
              type="text"
              :value="bonus.name"
              class="name-input"
            >
            <input
              v-else
              type="text"
              :value="bonus.name"
              disabled
              class="name-input"
            >
          </td>
          <td>
            <input
              type="number"
              min="0"
              max="999999"
              step="1000"
              :value="bonus.amount"
              @input="updateBonus(index, bonus.name, $event.target.value)"
              class="amount-input"
            >
          </td>
          <td>
            <button class="remove-button" @click="removeBonus(index)">{{ $t('common.remove') }}</button>
          </td>
        </tr>
        <tr class="add-row">
          <td colspan="3">
            <button class="add-button" @click="addBonus">{{ $t('common.add') }} {{ $t('salaries.bonus') }}</button>
          </td>
        </tr>
      </table>

      <table class="income-table">
        <tr v-if="otherIncomes.length === 0">
          <td colspan="3" class="empty-message">
            {{ $t('salaries.noOtherIncome') }}
          </td>
        </tr>
        <tr v-for="(income, index) in otherIncomes" :key="'other-'+index">
          <td>
            <input
              type="text"
              :placeholder="$t('salaries.incomeName')"
              :value="income.name"
              @input="updateOtherIncome(index, $event.target.value, income.amount)"
              class="name-input"
            >
          </td>
          <td>
            <input
              type="number"
              min="0"
              max="999999"
              step="1000"
              :value="income.amount"
              @input="updateOtherIncome(index, income.name, $event.target.value)"
              class="amount-input"
            >
          </td>
          <td>
            <button class="remove-button" @click="removeOtherIncome(index)">{{ $t('common.remove') }}</button>
          </td>
        </tr>
        <tr class="add-row">
          <td colspan="3">
            <button class="add-button" @click="addOtherIncome">{{ $t('common.add') }} {{ $t('salaries.otherIncome') }}</button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "salaries",

  methods: {
    changeSubsequentTds($event, index) {
      this.$store.commit('salaries/changeSubsequentTds', { index, value: $event.target.value });
    },
    changeBreakdown($event, index, part) {
      this.$store.commit('salaries/changeParts', { index, part, value: $event.target.value } );
    },
    addBonus() {
      this.$store.commit('salaries/addBonus', { name: '', amount: 0 });
    },
    removeBonus(index) {
      this.$store.commit('salaries/removeBonus', index);
    },
    updateBonus(index, name, amount) {
      this.$store.commit('salaries/updateBonus', { index, name, amount });
    },
    resetBonuses() {
      this.$store.commit('salaries/resetBonuses');
    },
    addOtherIncome() {
      this.$store.commit('salaries/addOtherIncome', { name: '', amount: 0 });
    },
    removeOtherIncome(index) {
      this.$store.commit('salaries/removeOtherIncome', index);
    },
    updateOtherIncome(index, name, amount) {
      this.$store.commit('salaries/updateOtherIncome', { index, name, amount });
    },
    resetOtherIncomes() {
      this.$store.commit('salaries/resetOtherIncomes');
    }
  },
  computed: {
    ...mapState('salaries', {
      parts: 'parts',
      months: 'months',
      bonuses: 'bonuses',
      otherIncomes: 'otherIncomes'
    }),
    ...mapGetters('salaries', {
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
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
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
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .add-button:hover {
    background-color: #2563eb;
  }
  .add-button:active {
    transform: translateY(1px);
  }
  .remove-button {
    background-color: transparent;
    color: #dc3545;
    border: 1px solid #dc3545;
    border-radius: 4px;
    padding: 6px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  .remove-button:hover {
    background-color: #dc3545;
    color: white;
  }
  .remove-button:active {
    transform: translateY(1px);
  }
  .reset-button {
    background-color: transparent;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .reset-button:hover {
    background-color: #f5f5f5;
    border-color: #ccc;
    color: #333;
  }
  .reset-button:active {
    background-color: #e9e9e9;
    transform: translateY(1px);
  }
  .income-section {
    margin-top: 24px;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #eee;
  }
  .header-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .section-header h3 {
    margin: 0;
    color: #2c3e50;
  }
  .income-tables-container {
    display: flex;
    gap: 24px;
    justify-content: space-between;
  }
  .income-table {
    flex: 1;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  .income-table td {
    padding: 8px;
  }
  .add-row {
    border-top: 1px solid #eee;
  }
  .add-row td {
    padding-top: 16px;
  }
  .name-input {
    width: 200px !important;
  }
  .amount-input {
    width: 145px !important;
  }
  .empty-message {
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 16px !important;
    background: #f9f9f9;
    border-radius: 4px;
  }
</style>
