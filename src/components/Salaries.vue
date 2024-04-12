<style scoped>
  table input {
    width: 150px;
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
  <div class="button-container">
    <button @click="exportData">Export Data</button>
    <button @click="triggerFileInput">Import Data</button>
    <button @click="resetData">Reset Data</button>  <!-- Reset Button -->
    <input type="file" ref="fileInput" @change="importData" style="display: none;">
  </div>

  <h2>Enter salary information</h2>
  <table>
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
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    exportData() {
      const data = {
        salaries: this.$store.state.salaries.months,
        investments: this.$store.state.salaries.investments,
        bonus: this.$store.state.salaries.bonus,
        others: this.$store.state.salaries.others,
      };
      const fileName = 'salary-investment-data.json';
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    },
    resetData() {
      this.$store.commit('resetSalaries');
      this.$store.commit('resetInvestments');
      this.$store.commit('changeBonus', 0);
      this.$store.commit('changeOthers', 0);
      alert('All data has been reset!');
    },
    importData(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        if (data.salaries) {
          this.$store.commit('loadSalaries', data.salaries);
        }
        if (data.investments) {
          this.$store.commit('loadInvestments', data.investments);
        }
        if (data.bonus) {
          this.$store.commit('changeBonus', data.bonus);
        }
        if (data.others) {
          this.$store.commit('changeOthers', data.others);
        }
        alert('Data imported successfully!');
      };
      reader.readAsText(file);
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
