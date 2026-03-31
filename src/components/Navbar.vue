<template>
  <!-- Skip link for accessibility -->
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="navbar-container">
      <!-- Brand section -->
      <div class="navbar-brand-section">
        <router-link to="/" class="navbar-brand" aria-label="BD Tax Calculator - Go to calculator">
          <span class="brand-icon">🇧🇩</span>
          <span class="brand-text">BD Tax Calculator</span>
        </router-link>
      </div>
      
      <!-- Main navigation -->
      <ul class="navbar-nav" role="menubar">
        <!-- No navigation items for now -->
      </ul>
      
      <!-- Action buttons -->
      <div class="navbar-actions">
        <div class="action-buttons">
          <div v-if="$route.name === 'Home'" class="data-actions">
            <button @click="populateRandomData" class="nav-action" aria-label="Fill with random sample data">Random</button>
            <button @click="exportData" class="nav-action" aria-label="Export your tax data">Export</button>
            <button @click="triggerFileInput" class="nav-action" aria-label="Import tax data from file">Import</button>
            <button @click="resetData" class="nav-action nav-action-danger" aria-label="Reset all tax data">Reset</button>
            <input
              type="file"
              ref="fileInput"
              @change="importData"
              accept=".json"
              style="display: none;"
              aria-label="Choose file to import"
            >
          </div>

          <a
            href="https://github.com/nadimtuhin/pathao-tax-calculator"
            target="_blank"
            rel="noopener noreferrer"
            class="nav-action nav-action-github"
            aria-label="View source code on GitHub"
          >GitHub</a>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  computed: {
    isLocalhost() {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
  },
  methods: {
    openStarModal() {
      // Use the global method exposed by StarModal
      if (window.showStarModal) {
        window.showStarModal();
      } else {
        console.warn('StarModal not available');
        alert('StarModal component not found or not ready');
      }
    },
    populateRandomData() {
      // Generate random taxpayer profile
      const categories = ['general', 'female', 'senior', 'disabled'];
      const locations = ['dhaka', 'chittagong', 'other_city', 'district'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      
      this.$store.commit('updateTaxpayerProfile', {
        category: randomCategory,
        age: randomCategory === 'senior' ? 67 : Math.floor(Math.random() * 40) + 25,
        location: randomLocation,
      });
      
      // Generate random salary data (between 30k to 150k monthly)
      const baseBasic = Math.floor(Math.random() * 120000) + 30000;
      const house = Math.floor(baseBasic * (0.3 + Math.random() * 0.4)); // 30-70% of basic
      const medical = Math.floor(Math.random() * 10000) + 2000;
      const transport = Math.floor(Math.random() * 3000) + 1000;
      const others = Math.floor(Math.random() * 5000);
      
      // Set salary for all months
      for (let i = 0; i < 12; i++) {
        this.$store.commit('changeParts', { part: 'basic', index: i, value: baseBasic });
        this.$store.commit('changeParts', { part: 'house', index: i, value: house });
        this.$store.commit('changeParts', { part: 'medical', index: i, value: medical });
        this.$store.commit('changeParts', { part: 'transport', index: i, value: transport });
        this.$store.commit('changeParts', { part: 'others', index: i, value: others });
        
        // Random TDS (0-5% of total salary)
        const totalSalary = baseBasic + house + medical + transport + others;
        const tds = Math.floor(totalSalary * Math.random() * 0.05);
        this.$store.commit('changeSubsequentTds', { index: i, value: tds });
      }
      
      // Generate random bonus and others
      this.$store.commit('changeBonus', Math.floor(Math.random() * 100000));
      const bonus2Amount = Math.floor(Math.random() * 80000);
      this.$store.commit('changeBonus2', bonus2Amount);
      this.$store.commit('setShowBonus2', bonus2Amount > 0);
      this.$store.commit('changeOthers', Math.floor(Math.random() * 50000));
      
      // Generate random investments
      const investments = [
        Math.floor(Math.random() * 200000), // DPS
        Math.floor(Math.random() * 100000), // Life insurance
        Math.floor(Math.random() * 150000), // Stocks
        Math.floor(Math.random() * 300000), // Savings certificate
        Math.floor(Math.random() * 100000), // Mutual fund
        Math.floor(Math.random() * 80000),  // Others
      ];
      
      investments.forEach((amount, index) => {
        this.$store.commit('changeInvestment', { index, value: amount });
      });
      
      alert('Random data populated! 🎲');
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    exportData() {
      const data = {
        taxpayerProfile: this.$store.state.salaries.taxpayerProfile,
        salaries: this.$store.state.salaries.months,
        investments: this.$store.state.salaries.investments,
        bonus: this.$store.state.salaries.bonus,
        bonus2: this.$store.state.salaries.bonus2,
        showBonus2: this.$store.state.salaries.showBonus2,
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
        this.$store.commit('changeBonus2', 0);
        this.$store.commit('setShowBonus2', false);
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
          if (data.bonus2 !== undefined) {
            this.$store.commit('changeBonus2', data.bonus2);
          }
          if (data.showBonus2 !== undefined) {
            this.$store.commit('setShowBonus2', data.showBonus2);
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
      event.target.value = '';
    }
  }
}
</script>

<style scoped>
/* Skip link for accessibility */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 9999;
  font-size: 14px;
}

.skip-link:focus {
  top: 6px;
}

/* Main navbar */
.navbar {
  background: #006A4E;
  border-bottom: 2px solid #005240;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 82, 64, 0.35);
}

.navbar-container {
  padding: 0 20px;
  display: flex;
  align-items: center;
  min-height: 64px;
}

/* Brand section */
.navbar-brand-section {
  flex-shrink: 0;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-decoration: none;
  transition: all 0.2s ease;
  padding: 8px 12px;
  border-radius: 6px;
}

.navbar-brand:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.navbar-brand:focus {
  outline: 2px solid rgba(255, 255, 255, 0.7);
  outline-offset: 2px;
}

.brand-icon {
  font-size: 24px;
}

.brand-text {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Navigation */
.navbar-nav {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
  margin-left: 40px;
}

.nav-link {
  color: #4a5568;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 32px;
  transition: all 0.2s ease;
  border-radius: 6px;
  min-height: 44px;
  display: flex;
  align-items: center;
  min-width: 120px;
  justify-content: center;
}

.nav-link:hover {
  color: #2d3748;
  background-color: #edf2f7;
}

.nav-link:focus {
  outline: 2px solid #4299e1;
  outline-offset: 2px;
}

.nav-link.router-link-active {
  color: #2c5282;
  background-color: #bee3f8;
  font-weight: 600;
}

/* Action toolbar */
.navbar-actions {
  flex-shrink: 0;
  margin-left: auto;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
}

.data-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
}

.nav-action {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 4px;
  letter-spacing: 0.2px;
  transition: color 0.15s, background 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  min-height: 36px;
}

.nav-action:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.nav-action:focus {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
}

.nav-action-danger {
  color: rgba(255, 180, 180, 0.9);
}

.nav-action-danger:hover {
  color: #ffffff;
  background: rgba(244, 42, 65, 0.3);
}

.nav-action-github {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .navbar-container {
    padding: 0 16px;
    min-height: 56px;
  }

  .navbar-brand {
    font-size: 18px;
    padding: 6px 8px;
  }

  .brand-icon {
    font-size: 20px;
  }

  .navbar-nav {
    display: none;
  }

  .nav-action {
    font-size: 12px;
    padding: 5px 7px;
  }

  .data-actions {
    margin-right: 6px;
    padding-right: 6px;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 0 12px;
  }

  .navbar-brand {
    font-size: 16px;
  }

  .brand-text {
    display: none;
  }

  .data-actions {
    display: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .navbar {
    border-bottom-width: 3px;
    border-bottom-color: #000;
  }
  
  .navbar-brand {
    color: #000;
  }
  
  .nav-link {
    color: #000;
  }
  
  .action-btn {
    border-color: #000;
    color: #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .navbar-brand,
  .nav-link,
  .action-btn {
    transition: none;
  }
}
</style>