<template>
  <div id="app">
    <nav class="bg-indigo-600 shadow-lg">
      <div class="container mx-auto px-4 py-3">
        <div class="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div class="flex space-x-6">
            <router-link
              to="/"
              class="text-white hover:text-gray-200 transition-colors duration-200 font-semibold text-base"
              active-class="text-white font-bold border-b-2 border-white pb-1"
            >
              Home
            </router-link>
            <router-link
              to="/tax-2023"
              class="text-white hover:text-gray-200 transition-colors duration-200 font-semibold text-base"
              active-class="text-white font-bold border-b-2 border-white pb-1"
            >
              2023 Tax Calculator
            </router-link>
          </div>
          <div class="flex space-x-4">
            <button
              @click="exportData"
              class="text-indigo-600 bg-white hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
            >
              Export Data
            </button>
            <button
              @click="triggerFileInput"
              class="text-indigo-600 bg-white hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
            >
              Import Data
            </button>
            <button
              @click="resetData"
              class="text-white bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 shadow-sm"
            >
              Reset Data
            </button>
            <input type="file" ref="fileInput" @change="importData" style="display: none;">
          </div>
        </div>
      </div>
    </nav>

    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: "App",
  methods: {
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
  }
};
</script>

<style>
#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.router-link-active {
  @apply text-white font-bold border-b-2 border-white pb-1;
}
</style>
