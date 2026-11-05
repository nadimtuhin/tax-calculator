<template>
  <!-- Skip link for accessibility -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="navbar-container">
      <!-- Brand section -->
      <div class="navbar-brand-section">
        <router-link to="/" class="navbar-brand" aria-label="BD Tax Calculator - Go to calculator">
          <span class="brand-icon" aria-hidden="true">
            <svg class="brand-mark" viewBox="0 0 64 64" width="30" height="30" fill="none" focusable="false">
              <rect x="2" y="2" width="60" height="60" rx="14" class="brand-mark-bg" />
              <rect x="2.75" y="2.75" width="58.5" height="58.5" rx="13.25" class="brand-mark-rim" />
              <g transform="translate(0,64) scale(0.00625,-0.00625)">
                <path fill="#ffffff" d="M2330 8445 l0 -555 420 0 420 0 0 -370 0 -370 -640 0 -640 0 0 -555 0 -555 640 0 639 0 4 -1822 c3 -1814 3 -1824 25 -1934 109 -567 420 -902 947 -1021 138 -31 445 -42 632 -24 1134 115 2398 947 3064 2018 379 609 545 1207 526 1893 -17 591 -170 1055 -466 1413 -217 262 -544 458 -897 536 -225 50 -247 51 -1455 51 l-1129 0 0 925 0 925 -1045 0 -1045 0 0 -555z m4269 -2433 c383 -102 607 -444 628 -957 19 -466 -128 -872 -464 -1280 -349 -424 -871 -793 -1413 -1000 -296 -113 -518 -162 -822 -180 l-108 -7 0 1726 0 1727 1048 -4 c1045 -3 1047 -3 1131 -25z" />
              </g>
              <circle cx="36.46" cy="33.40" r="5.08" fill="#f42a41" />
            </svg>
          </span>
          <span class="brand-wordmark">
            <span class="brand-text">BD Tax Calculator</span>
            <span class="brand-badge">FY 25–27</span>
          </span>
        </router-link>
      </div>

      <!-- Action buttons -->
      <div class="navbar-actions">
        <div class="action-buttons">
          <div v-if="$route.name === 'Home'" class="data-actions">
            <button
              @click="populateRandomData"
              class="action-btn action-btn-random"
              aria-label="Fill with random sample data"
              title="Random Data"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/><circle cx="12" cy="12" r="1"/></svg>
              <span class="btn-text">Random</span>
            </button>
            <button
              @click="exportData"
              class="action-btn"
              aria-label="Export your tax data"
              title="Export Data"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16"/></svg>
              <span class="btn-text">Export</span>
            </button>
            <button
              @click="triggerFileInput"
              class="action-btn"
              aria-label="Import tax data from file"
              title="Import Data"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v12M7 11l5 5 5-5M4 20h16"/></svg>
              <span class="btn-text">Import</span>
            </button>
            <button
              @click="resetData"
              class="action-btn action-btn-danger"
              aria-label="Reset all tax data"
              title="Reset Data"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/></svg>
              <span class="btn-text">Reset</span>
            </button>
            <input
              type="file"
              ref="fileInput"
              @change="importData"
              accept=".json"
              style="display: none;"
              aria-label="Choose file to import"
            >
          </div>

          <!-- Star modal button for localhost -->
          <button
            v-if="isLocalhost"
            @click="openStarModal"
            class="action-btn star-btn"
            aria-label="Open star modal"
            title="Open Star Modal"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>
            <span class="btn-text">Star</span>
          </button>

          <!-- GitHub link -->
          <a
            href="https://github.com/nadimtuhin/tax-calculator"
            target="_blank"
            rel="noopener noreferrer"
            class="action-btn github-btn"
            aria-label="View source code on GitHub"
            title="GitHub Repository"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6.2 0C6.6 2.8 5.600 3.100 5.600 3.100a4.200 4.200 0 0 0-.1 3.200A4.600 4.600 0 0 0 4.200 9.500c0 4.600 2.700 5.700 5.500 6-.6.6-.6 1.200-.5 2V21"/></svg>
            <span class="btn-text">GitHub</span>
          </a>
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
.skip-link {
  position: absolute;
  top: -48px;
  left: var(--space-3);
  background: var(--accent);
  color: var(--on-accent);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  z-index: 9999;
  font-size: var(--text-sm);
}

.skip-link:focus {
  top: var(--space-2);
}

.navbar {
  background: var(--surface);
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 60px;
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
  text-decoration: none;
  transition: opacity 0.15s;
}

.navbar-brand:hover {
  color: var(--text);
  opacity: 0.88;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 0;
}

.brand-mark {
  display: block;
  width: 30px;
  height: 30px;
  border-radius: 7px;
}

.brand-mark-bg {
  fill: #0a5c3a;
}

.brand-mark-rim {
  fill: none;
  stroke: transparent;
  stroke-width: 1.5;
}

@media (prefers-color-scheme: dark) {
  .brand-mark-bg {
    fill: #0d6942;
  }

  .brand-mark-rim {
    stroke: #2c8c62;
  }
}

.brand-wordmark {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-text {
  font-weight: 700;
  font-size: 1.0625rem;
  letter-spacing: -0.02em;
  color: var(--text);
  line-height: 1.2;
}

.brand-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.4;
}

.action-buttons,
.data-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.data-actions {
  padding-right: var(--space-2);
  margin-right: var(--space-1);
  border-right: 1px solid var(--border);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  min-width: 40px;
  justify-content: center;
  padding: 0 var(--space-3);
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}

.action-btn:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.github-btn {
  border-color: var(--border);
  background: var(--surface-muted);
  color: var(--text);
}

.github-btn:hover {
  border-color: var(--border-strong);
}

.action-btn-danger:hover {
  background: var(--bad-soft);
  color: var(--bad);
}

.btn-icon {
  flex-shrink: 0;
}

@media (max-width: 860px) {
  .btn-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .action-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0;
  }
}

@media (max-width: 639px) {
  .brand-badge {
    display: none;
  }

  .brand-text {
    font-size: var(--text-base);
  }
}

@media (max-width: 479px) {
  .brand-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .navbar-container {
    padding: 0 var(--space-2);
  }

  .data-actions {
    padding-right: var(--space-1);
    margin-right: 0;
  }
}
</style>
