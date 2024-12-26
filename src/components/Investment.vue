<template>
<div>
<h2>{{ $t('investment.title') }}</h2>

<table class="table">
  <tr>
    <th></th>
    <th>{{ $t('investment.amount') }}</th>
    <th>{{ $t('investment.maximumAllowed') }}</th>
    <th></th>
  </tr>

  <tr v-for="(investment, index) in investments" v-bind:key="investment.name">
    <td><strong>{{investment.name}}</strong></td>
    <td>
      <input
        type="number"
        :value="investments[index].amount"
        @input="changeInvestment($event, index)"
        step="1000"
        min="0"
        max="9999999"
      />
    </td>
    <td>{{investment.maximum > 9999999999 ? '': investment.maximum.toLocaleString()}}</td>
    <td>
      <button
        v-if="investment.isCustom"
        @click="removeInvestment(index)"
        class="remove-btn"
      >
        {{ $t('investment.remove') }}
      </button>
      <button
        v-if="investment.name === $t('investment.others')"
        @click="showAddDialog = true"
        class="add-btn circle"
      >
        +
      </button>
    </td>
  </tr>

  <tr>
    <td><strong>{{ $t('investment.totalInvestment') }}</strong></td>
    <td>{{totalInvestment.toLocaleString()}}</td>
    <td>{{maxRebatableInvestment.toLocaleString()}}</td>
    <td></td>
  </tr>

  <tr>
    <td><strong>{{ $t('investment.totalRebatableInvestment') }}</strong></td>
    <td>{{totalRebatableInvestment.toLocaleString()}}</td>
    <td></td>
    <td></td>
  </tr>

  <tr>
    <td><strong>{{ $t('investment.taxRebatePercentage') }}</strong></td>
    <td>15%</td>
    <td></td>
    <td></td>
  </tr>

  <tr>
    <td><strong>{{ $t('investment.totalRebate') }}</strong></td>
    <td>{{ investmentRebate.toLocaleString() }}</td>
    <td></td>
    <td></td>
  </tr>
</table>

<div v-if="showAddDialog" class="modal">
  <div class="modal-content">
    <h3>{{ $t('investment.addNew.title') }}</h3>
    <input
      type="text"
      v-model="newInvestmentName"
      :placeholder="$t('investment.addNew.placeholder')"
      class="investment-input"
      @keyup.enter="addNewInvestment"
    />
    <div class="modal-actions">
      <button @click="showAddDialog = false" class="cancel-btn">{{ $t('investment.addNew.cancel') }}</button>
      <button @click="addNewInvestment" class="add-btn">{{ $t('investment.addNew.add') }}</button>
    </div>
  </div>
</div>

</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "investment",
  data() {
    return {
      newInvestmentName: '',
      showAddDialog: false
    }
  },
  methods: {
    changeInvestment($event, index) {
      this.$store.commit('changeInvestment', { index, value: $event.target.value });
    },
    addNewInvestment() {
      if (this.newInvestmentName.trim()) {
        this.$store.commit('addInvestment', this.newInvestmentName.trim());
        this.newInvestmentName = '';
        this.showAddDialog = false;
      }
    },
    removeInvestment(index) {
      this.$store.commit('removeInvestment', index);
    }
  },
  computed: {
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      others: state => state.salaries.others,
      investments: state => state.salaries.investments,
    }),
    ...mapGetters({
      totalInvestment: 'totalInvestment',
      totalRebatableInvestment: 'totalRebatableInvestment',
      maxRebatableInvestment: 'maxRebatableInvestment',
      rebatePercentage: 'rebatePercentage',
      investmentRebate: 'investmentRebate',

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

input[type="number"] {
  width: 150px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input[type="number"]:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.table tr:nth-last-child(-n+4) {
  font-weight: 600;
  background-color: #f8f9fa;
}

.add-investment-row td {
  padding: 0.5rem 1rem;
  background-color: #f8f9fa;
}

.investment-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.add-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.add-btn:hover {
  background-color: #45a049;
}

.remove-btn {
  padding: 0.25rem 0.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.remove-btn:hover {
  background-color: #c82333;
}

.add-btn.circle {
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.investment-input {
  margin-bottom: 1rem;
}
</style>
