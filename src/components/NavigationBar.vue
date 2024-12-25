<template>
  <nav class="navbar navbar-expand-sm navbar-dark bg-dark shadow-lg">
    <div class="container py-2">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center w-100">
        <div class="navbar-nav me-auto mb-3 mb-sm-0">
          <router-link
            to="/"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-house-door me-1"></i>
            Home
          </router-link>
          <router-link
            to="/tax-2023"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-calculator me-1"></i>
            2023 Tax Calculator
          </router-link>
          <router-link
            to="/tax-saving-tips"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-piggy-bank me-1"></i>
            Tax Saving Tips
          </router-link>
          <router-link
            to="/contact"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-envelope me-1"></i>
            Contact
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
</template>

<script>
export default {
  name: "NavigationBar",
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

<style scoped>
.navbar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 0;
  background: linear-gradient(135deg, #4a90e2 0%, #2c3e94 100%) !important;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 0.5rem 1.25rem !important;
  margin: 0 0.25rem;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.2);
}

.router-link-exact-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-group {
  border-radius: 0.5rem;
  overflow: hidden;
}

.btn-group .btn {
  border: none;
  position: relative;
  font-size: 0.95rem;
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

.btn-outline-light {
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
  color: white;
}

.btn-outline-danger {
  background-color: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.5);
  color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}
</style>
