<template>
<div>
<h2>{{ $t('investment.title') }}</h2>

<button @click="resetInvestments" class="reset-btn" :aria-label="$t('investment.reset')">
  {{ $t('investment.reset') }}
</button>

<table class="table" role="grid">
  <thead>
    <tr>
      <th scope="col">{{ $t('investment.name') }}</th>
      <th scope="col">{{ $t('investment.amount') }}</th>
      <th scope="col">{{ $t('investment.maximumAllowed') }}</th>
      <th scope="col" aria-label="Actions"></th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(investment, index) in investments" :key="investment.name">
      <th scope="row"><strong>{{investment.name}}</strong></th>
      <td>
        <input
          type="number"
          :value="formatNumber(investments[index].amount)"
          @input="changeInvestment($event, index)"
          step="1000"
          min="0"
          :max="investment.maximum"
          :aria-label="investment.name + ' ' + $t('investment.amount')"
          class="investment-input"
        />
      </td>
      <td>{{formatNumber(investment.maximum > 9999999999 ? '' : investment.maximum)}}</td>
      <td>
        <button
          v-if="investment.isCustom"
          @click="removeInvestment(index)"
          class="remove-btn"
          :aria-label="$t('investment.remove') + ' ' + investment.name"
        >
          {{ $t('investment.remove') }}
        </button>
        <button
          v-if="investment.name === $t('investment.others')"
          @click="showAddDialog = true"
          class="add-btn circle"
          aria-label="Add new investment"
        >
          +
        </button>
      </td>
    </tr>

    <tr class="summary-row">
      <th scope="row"><strong>{{ $t('investment.totalInvestment') }}</strong></th>
      <td>{{formatNumber(totalInvestment)}}</td>
      <td>{{formatNumber(maxRebatableInvestment)}}</td>
      <td></td>
    </tr>

    <tr class="summary-row">
      <th scope="row"><strong>{{ $t('investment.threePercentIncome') }}</strong></th>
      <td>{{formatNumber(taxableSalary * 0.03)}}</td>
      <td></td>
      <td></td>
    </tr>

    <tr class="summary-row">
      <th scope="row"><strong>{{ $t('investment.fifteenPercentInvestment') }}</strong></th>
      <td>{{formatNumber(totalInvestment * 0.15)}}</td>
      <td></td>
      <td></td>
    </tr>

    <tr class="summary-row">
      <th scope="row"><strong class="small">{{ $t('investment.fixedMaximum') }}</strong></th>
      <td>1,000,000</td>
      <td></td>
      <td></td>
    </tr>

    <tr class="summary-row highlight">
      <th scope="row"><strong class="small">{{ $t('investment.totalRebate') }}</strong></th>
      <td>{{ formatNumber(investmentRebate) }}</td>
      <td></td>
      <td></td>
    </tr>
  </tbody>
</table>

<div v-if="showAddDialog" class="modal" @click.self="closeModal" role="dialog" aria-labelledby="modal-title">
  <div class="modal-content">
    <h3 id="modal-title">{{ $t('investment.addNew.title') }}</h3>
    <input
      type="text"
      v-model.trim="newInvestmentName"
      :placeholder="$t('investment.addNew.placeholder')"
      class="investment-input"
      @keyup.enter="addNewInvestment"
      @keyup.esc="closeModal"
      ref="newInvestmentInput"
      maxlength="50"
    />
    <div class="modal-actions">
      <button @click="closeModal" class="cancel-btn">{{ $t('investment.addNew.cancel') }}</button>
      <button
        @click="addNewInvestment"
        class="add-btn"
        :disabled="!newInvestmentName.trim()"
      >
        {{ $t('investment.addNew.add') }}
      </button>
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
    formatNumber(value) {
      if (!value && value !== 0) return '';
      return Number(value).toLocaleString();
    },
    changeInvestment($event, index) {
      const value = $event.target.value.replace(/,/g, '');
      if (isNaN(value)) return;

      const numValue = Number(value);
      const max = this.investments[index].maximum;

      if (numValue < 0) return;
      if (max !== Infinity && numValue > max) {
        $event.target.value = max;
        this.$store.commit('investments/changeInvestment', { index, value: max });
        return;
      }

      this.$store.commit('investments/changeInvestment', { index, value: numValue });
    },
    addNewInvestment() {
      const name = this.newInvestmentName.trim();
      if (name) {
        if (this.investments.some(function(inv) { return inv.name.toLowerCase() === name.toLowerCase(); })) {
          alert(this.$t('investment.addNew.duplicate'));
          return;
        }
        this.$store.commit('investments/addInvestment', name);
        this.closeModal();
      }
    },
    removeInvestment(index) {
      if (confirm(this.$t('investment.confirmRemove'))) {
        this.$store.commit('investments/removeInvestment', index);
      }
    },
    resetInvestments() {
      if (confirm(this.$t('investment.confirmReset'))) {
        this.$store.commit('investments/resetInvestments');
      }
    },
    closeModal() {
      this.showAddDialog = false;
      this.newInvestmentName = '';
    },
    focusInput() {
      if (this.$refs.newInvestmentInput) {
        this.$refs.newInvestmentInput.focus();
      }
    }
  },
  watch: {
    showAddDialog: function(newVal) {
      if (newVal) {
        this.$nextTick(this.focusInput);
      }
    }
  },
  computed: {
    ...mapState({
      investments: function(state) { return state.investments.investments; }
    }),
    ...mapGetters({
      totalInvestment: 'investments/totalInvestment',
      totalRebatableInvestment: 'investments/totalRebatableInvestment',
      maxRebatableInvestment: 'salaries/maxRebatableInvestment',
      rebatePercentage: 'investments/rebatePercentage',
      investmentRebate: 'investments/investmentRebate',
      taxableSalary: 'salaries/taxableSalary'
    })
  }
}
</script>

<style scoped>
.table {
  width: 100%;
  margin: 1rem 0;
  border-collapse: separate;
  border-spacing: 0;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border-radius: 8px;
  overflow: hidden;
}

.table th,
.table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.table thead th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  position: sticky;
  top: 0;
  z-index: 1;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:hover:not(.summary-row) {
  background-color: #f8f9fa;
}

.investment-input {
  width: 150px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.investment-input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.investment-input:invalid {
  border-color: #dc3545;
}

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.summary-row {
  background-color: #f8f9fa;
  font-weight: 500;
}

.summary-row.highlight {
  background-color: #e9ecef;
  font-weight: 600;
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
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.add-btn {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.add-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.add-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
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
}

.remove-btn {
  padding: 0.25rem 0.5rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #c82333;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

.reset-btn {
  padding: 0.5rem 1rem;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
  margin-bottom: 1rem;
}

.reset-btn:hover {
  background-color: #5a6268;
}

@media (max-width: 768px) {
  .investment-input {
    width: 120px;
  }

  .table th,
  .table td {
    padding: 0.75rem;
  }
}
</style>
