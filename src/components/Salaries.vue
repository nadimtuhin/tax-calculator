<style scoped>
  table input {
    width: 120px;
  }
  
  table {
    width: 100%;
    font-size: 14px;
  }
  
  th, td {
    padding: 5px;
    text-align: center;
  }
  
  th {
    font-size: 12px;
    white-space: nowrap;
  }
  
  .add-bonus-btn {
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    cursor: pointer;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .add-bonus-btn:hover {
    background: #45a049;
    transform: scale(1.1);
  }
  
  .remove-bonus-btn {
    background: #f44336;
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 12px;
    cursor: pointer;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  
  .remove-bonus-btn:hover {
    background: #da190b;
    transform: scale(1.1);
  }
</style>

<template>
<div>
  <h2>Enter salary information</h2>
  <table>
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

      <template v-for="part in visibleParts" :key="part">
        <td>
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
          <input
            type="number"
            min="0"
            max="999999"
            step="1000"
            :value="bonus2"
            @input="changeBonus2"
          >
        </td>
      </tr>
      <tr>
        <td>Others (Additional Income)</td>
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
    </tbody>
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
