<template>
  <div id="app">
    <nav class="navbar navbar-expand-sm navbar-dark bg-dark shadow-lg">
      <div class="container py-2">
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center w-100">
          <div class="navbar-nav me-auto mb-3 mb-sm-0">
            <router-link
              to="/"
              class="nav-link px-3 mx-1 rounded-pill"
              :class="{ 'router-link-active': $route.path === '/' }"
            >
              <i class="bi bi-house-door me-1"></i>
              Home
            </router-link>
            <router-link
              to="/tax-2023"
              class="nav-link px-3 mx-1 rounded-pill"
              :class="{ 'router-link-active': $route.path === '/tax-2023' }"
            >
              <i class="bi bi-calculator me-1"></i>
              2023 Tax Calculator
            </router-link>
          </div>
          <div class="btn-group shadow-sm">
            <button
              @click="exportData"
              class="btn btn-outline-light"
              title="Export your data to a JSON file"
            >
              <i class="bi bi-download me-1"></i>
              Export
            </button>
            <button
              @click="triggerFileInput"
              class="btn btn-outline-light"
              title="Import data from a JSON file"
            >
              <i class="bi bi-upload me-1"></i>
              Import
            </button>
            <button
              @click="resetData"
              class="btn btn-outline-danger"
              title="Clear all data"
            >
              <i class="bi bi-trash me-1"></i>
              Reset
            </button>
            <input type="file" ref="fileInput" @change="importData" accept=".json" style="display: none;">
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
  created() {
    // Add Bootstrap Icons CSS
    const link = document.createElement('link');
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  },
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
  min-height: 100vh;
  background-color: #f8f9fa;
}

.navbar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-link {
  color: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.1);
}

.router-link-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.15);
}

.btn {
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-group {
  border-radius: 0.375rem;
  overflow: hidden;
}

.btn-group .btn {
  border: none;
  position: relative;
}

.btn-group .btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
