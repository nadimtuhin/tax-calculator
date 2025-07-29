<template>
  <div class="action-bar">
    <div class="action-bar-content">
      <h1 class="app-title">Bangladesh Tax Calculator 2024-25</h1>
      <div class="button-group">
        <a href="https://github.com/nadimtuhin/pathao-tax-calculator" target="_blank" class="action-btn fork-btn">
          <span class="btn-icon">⭐</span>
          Fork on GitHub
        </a>
        <button @click="exportData" class="action-btn export-btn">
          <span class="btn-icon">📥</span>
          Export Data
        </button>
        <button @click="triggerFileInput" class="action-btn import-btn">
          <span class="btn-icon">📤</span>
          Import Data
        </button>
        <button @click="resetData" class="action-btn reset-btn">
          <span class="btn-icon">🔄</span>
          Reset All
        </button>
        <input type="file" ref="fileInput" @change="importData" style="display: none;">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionBar',
  
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    exportData() {
      const data = {
        taxpayerProfile: this.$store.state.salaries.taxpayerProfile,
        salaries: this.$store.state.salaries.months,
        investments: this.$store.state.salaries.investments,
        bonus: this.$store.state.salaries.bonus,
        others: this.$store.state.salaries.others,
      };
      const fileName = 'tax-data-2024-25.json';
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
      if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
        this.$store.commit('resetSalaries');
        this.$store.commit('resetInvestments');
        this.$store.commit('changeBonus', 0);
        this.$store.commit('changeOthers', 0);
        this.$store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: null,
          location: 'dhaka',
        });
        alert('All data has been reset!');
      }
    },
    
    importData(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.salaries) {
            this.$store.commit('loadSalaries', data.salaries);
          }
          if (data.investments) {
            this.$store.commit('loadInvestments', data.investments);
          }
          if (data.bonus !== undefined) {
            this.$store.commit('changeBonus', data.bonus);
          }
          if (data.others !== undefined) {
            this.$store.commit('changeOthers', data.others);
          }
          if (data.taxpayerProfile) {
            this.$store.commit('updateTaxpayerProfile', data.taxpayerProfile);
          }
          alert('Data imported successfully!');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
      // Reset file input
      event.target.value = '';
    }
  }
};
</script>

<style scoped>
.action-bar {
  background-color: #f8f9fa;
  color: #495057;
  padding: 20px 0;
  margin-bottom: 0;
  border-bottom: 1px solid #dee2e6;
}

.action-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 0 30px;
  max-width: none;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #495057;
  background-color: white;
}

.btn-icon {
  font-size: 16px;
}

.export-btn:hover {
  background-color: #f8f9fa;
  border-color: #28a745;
  color: #28a745;
}

.import-btn:hover {
  background-color: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.reset-btn:hover {
  background-color: #f8f9fa;
  border-color: #dc3545;
  color: #dc3545;
}

.fork-btn {
  text-decoration: none;
}

.fork-btn:hover {
  background-color: #f8f9fa;
  border-color: #6f42c1;
  color: #6f42c1;
  text-decoration: none;
}

@media (max-width: 768px) {
  .action-bar-content {
    flex-direction: column;
    text-align: center;
  }
  
  .app-title {
    font-size: 1.5rem;
  }
  
  .button-group {
    justify-content: center;
  }
}
</style>