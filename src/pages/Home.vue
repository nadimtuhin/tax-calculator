<template>
  <div id="home-page">
    <div class="main-content">
      <YearSwitcher />

      <div class="content-section">
        <SalaryWizard />
      </div>

      <!-- Active year calculation — full width (hidden when comparison is expanded) -->
      <div v-if="!showComparison" class="content-section">
        <calculation-2025 v-if="currentYear === '2025-26'" />
        <calculation-2026 v-else />
      </div>

      <!-- Compare both years toggle -->
      <div class="compare-toggle-row">
        <button class="compare-toggle-btn" @click="showComparison = !showComparison">
          {{ showComparison ? '▲ Hide year comparison' : '▼ Compare both years' }}
        </button>
      </div>

      <div v-if="showComparison" class="tax-comparison-section">
        <div class="comparison-row">
          <div class="comparison-col">
            <div class="content-section">
              <calculation-2025 />
            </div>
          </div>
          <div class="comparison-col">
            <div class="content-section">
              <calculation-2026 />
            </div>
          </div>
        </div>
      </div>

      <div class="content-section">
        <tax-comparison />
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import Calculation2025 from "../components/Calculation-2025";
import Calculation2026 from "../components/Calculation-2026";
import TaxComparison from "../components/TaxComparison";
import SalaryWizard from "../components/SalaryWizard";
import YearSwitcher from "../components/YearSwitcher";

export default {
  name: "App",
  data: () => ({
    showComparison: false,
  }),
  components: {
    Calculation2025,
    Calculation2026,
    TaxComparison,
    SalaryWizard,
    YearSwitcher,
  },
  computed: {
    currentYear() {
      return this.$store.state.salaries.currentYear;
    },
  },
};
</script>

<style>
#home-page {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background-color: #F4F6F4;
}

.main-content {
  padding: 12px;
  margin: 0 auto;
}

.content-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.content-col-half {
  flex: 1;
  min-width: 0;
}

.content-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 12px;
}

@media (min-width: 600px) {
  .main-content {
    padding: 20px;
  }
  .content-section {
    padding: 20px;
  }
  .content-row {
    gap: 16px;
    margin-bottom: 16px;
  }
}

@media (min-width: 960px) {
  .main-content {
    padding: 30px;
    max-width: 1100px;
  }
  .content-row {
    flex-direction: row;
    gap: 20px;
    margin-bottom: 20px;
  }
  .content-section {
    padding: 25px;
    margin-bottom: 20px;
  }
}

.content-section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.5rem;
  text-align: left;
}

table {
  width: 100%;
}

table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.875rem;
  padding: 12px;
  text-align: left;
}

table td {
  padding: 10px;
  border-bottom: 1px solid #e9ecef;
}

table tr:last-child td {
  border-bottom: none;
}

input[type="number"], select {
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 6px 10px;
  transition: border-color 0.3s;
}

input[type="number"]:focus, select:focus {
  outline: none;
  border-color: #006A4E;
  box-shadow: 0 0 0 0.2rem rgba(0, 106, 78, 0.2);
}

/* Compare toggle */
.compare-toggle-row {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.compare-toggle-btn {
  background: none;
  border: 1px solid #ced4da;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 0.875rem;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s;
}

.compare-toggle-btn:hover {
  border-color: #006A4E;
  color: #006A4E;
  background: rgba(0, 106, 78, 0.06);
}

/* Tax Comparison Layout */
.tax-comparison-section {
  margin-top: 4px;
}

.comparison-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.comparison-col {
  flex: 1;
  min-width: 0;
}

/* Tax Difference Highlighting */
.tax-highlight-savings {
  background-color: #ffffff;
  border: 2px solid #006A4E;
  color: #006A4E;
  font-weight: 600;
}

.tax-highlight-increase {
  background-color: #F42A41;
  border: 2px solid #F42A41;
  color: #ffffff;
  font-weight: 600;
}

.tax-comparison-badge {
  font-size: 0.875rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  margin-left: 8px;
}

.badge-savings {
  background-color: #ffffff;
  color: #006A4E;
  border: 2px solid #006A4E;
  font-weight: 700;
}

.badge-increase {
  background-color: #F42A41;
  color: #ffffff;
  border: 2px solid #F42A41;
  font-weight: 700;
}

@media (min-width: 960px) {
  .comparison-row {
    flex-direction: row;
    gap: 20px;
  }
}
</style>
