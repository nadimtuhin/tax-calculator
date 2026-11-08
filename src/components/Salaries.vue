<template>
<div>
  <header class="section-header">
    <div class="section-heading-group">
      <span class="section-eyebrow">Step 02 · Monthly Earnings &amp; TDS</span>
      <h2>Enter salary information</h2>
    </div>
    <span class="section-pill amount">Gross <strong>৳{{ Number(totalSalary || 0).toLocaleString() }}</strong></span>
  </header>
  <p class="unit-note">All amounts in ৳ (BDT). Scroll the grid sideways on small screens.</p>
  <div class="grid-scroll" tabindex="0" role="region" aria-label="Monthly salary grid">
  <table class="salary-grid">
    <thead>
      <tr>
        <th></th>
        <th>Salary</th>
        <th>
          <span title="tax deduction at source">TDS*</span>
        </th>
        <th>Basic</th>
        <th>House</th>
        <th>Medical</th>
        <th>Transport</th>
        <th>Others</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(month, index) in months" :key="month.id">
      <td><strong>{{month.id}}</strong></td>
      <td>
        <input
          disabled
          type="number"
          min="0"
          max="999999"
          class="input"
          step="1000"
          :aria-label="`${month.id} salary`"
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
          :aria-label="`${month.id} TDS`"
          :value="months[index]['tds']"
          @input="changeSubsequentTds($event, index)"
        >
      </td>

      <template v-for="part in visibleParts" :key="part">
        <td>
          <input
            max="999999"
            min="0"
            step="500"
            type="number"
            :aria-label="`${month.id} ${part}`"
            :value="months[index].breakdown[part]"
            @input="changeBreakdown($event, index, part)"
          >
        </td>
      </template>
      </tr>

      <tr>
        <td>
          Bonus
          <button 
            v-if="!showBonus2" 
            @click="$store.commit('setShowBonus2', true)" 
            class="add-bonus-btn"
            type="button"
            title="Add another bonus"
          >
            +
          </button>
        </td>
        <td>
          <span class="money"><span class="money-prefix" aria-hidden="true">৳</span><input
            aria-label="Bonus"
            type="number"
            min="0"
            max="999999"
            step="1000"
            :value="bonus"
            @input="changeBonus"
          ></span>
        </td>
      </tr>
      <tr v-if="showBonus2">
        <td>
          Bonus
          <button 
            @click="removeBonus2" 
            class="remove-bonus-btn"
            type="button"
            title="Remove this bonus"
          >
            ×
          </button>
        </td>
        <td>
          <span class="money"><span class="money-prefix" aria-hidden="true">৳</span><input
            aria-label="Second bonus"
            type="number"
            min="0"
            max="999999"
            step="1000"
            :value="bonus2"
            @input="changeBonus2"
          ></span>
        </td>
      </tr>
      <tr>
        <td class="row-label">Others (Additional Income)</td>
        <td>
          <span class="money"><span class="money-prefix" aria-hidden="true">৳</span><input
            aria-label="Others"
            type="number"
            min="0"
            max="999999"
            step="1000"
            :value="others"
            @input="changeOthers"
          ></span>
        </td>
      </tr>
    </tbody>
  </table>
  </div>
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
    changeBonus2($event) {
      this.$store.commit('changeBonus2', $event.target.value );
    },
    removeBonus2() {
      this.$store.commit('setShowBonus2', false);
      this.$store.commit('changeBonus2', 0);
    },
    changeOthers($event) {
      this.$store.commit('changeOthers', $event.target.value );
    },
    changeBreakdown($event, index, part) {
      this.$store.commit('changeParts', { index, part, value: $event.target.value } );
    },
  },
  computed: {
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      bonus2: state => state.salaries.bonus2,
      showBonus2: state => state.salaries.showBonus2,
      others: state => state.salaries.others,
    }),
    ...mapGetters({
      totalSalary: 'totalSalary',
      totalTds: 'totalTds',
      totalHouse: 'totalHouse',
      totalMedical: 'totalMedical',
      totalTransport: 'totalTransport',
      totalBasic: 'totalBasic',
      totalOthersBreakdown: 'totalOthersBreakdown',
    }),
    
    visibleParts() {
      return this.parts; // Show all parts including others
    },
  }
};
</script>

<style scoped>
.unit-note {
  margin: 0 0 var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.grid-scroll {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.grid-scroll:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.salary-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.salary-grid th,
.salary-grid td {
  padding: var(--space-2) var(--space-1);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}

.salary-grid th {
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.salary-grid .row-label {
  white-space: normal;
  min-width: 7rem;
}

.salary-grid tr:last-child td {
  border-bottom: 0;
}

.salary-grid td:first-child,
.salary-grid th:first-child {
  position: sticky;
  left: 0;
  background: var(--surface);
  z-index: 1;
}

.salary-grid th:first-child {
  background: var(--surface-muted);
}

.salary-grid input {
  width: 74px;
  min-height: 36px;
  padding: 0 var(--space-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-variant-numeric: tabular-nums;
}

.salary-grid input:disabled {
  background: var(--surface-muted);
  color: var(--text-muted);
}

.salary-grid input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.money {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.money-prefix {
  position: absolute;
  left: var(--space-2);
  color: var(--text-muted);
  pointer-events: none;
}

.money input {
  width: 88px;
  padding-left: calc(var(--space-2) + 1.1em);
}

.add-bonus-btn,
.remove-bonus-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: var(--space-2);
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.add-bonus-btn {
  color: var(--accent);
}

.remove-bonus-btn {
  color: var(--bad);
}

.add-bonus-btn:hover {
  background: var(--accent-soft);
}

.remove-bonus-btn:hover {
  background: var(--bad-soft);
}
</style>
