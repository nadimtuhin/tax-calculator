<template>
  <div id="app">
    <nav class="navbar navbar-expand-sm navbar-dark bg-primary shadow">
      <div class="container">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center w-100">
          <div class="navbar-nav me-auto mb-2 mb-sm-0">
            <router-link
              to="/"
              class="nav-link text-white fw-semibold"
              active-class="nav-link active fw-bold border-bottom border-white pb-1"
            >
              Home
            </router-link>
            <router-link
              to="/tax-2023"
              class="nav-link text-white fw-semibold"
              active-class="nav-link active fw-bold border-bottom border-white pb-1"
            >
              2023 Tax Calculator
            </router-link>
          </div>
          <div class="d-flex gap-2">
            <button
              @click="exportData"
              class="btn btn-light text-primary fw-medium"
            >
              Export Data
            </button>
            <button
              @click="triggerFileInput"
              class="btn btn-light text-primary fw-medium"
            >
              Import Data
            </button>
            <button
              @click="resetData"
              class="btn btn-primary fw-medium"
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
  font-weight: bold !important;
  border-bottom: 2px solid white !important;
  padding-bottom: 0.25rem !important;
}
</style>
