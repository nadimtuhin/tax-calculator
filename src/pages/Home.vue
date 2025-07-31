<template>
  <div id="home-page">
    <div class="main-content">
      <div class="profile-container">
        <div class="content-section">
          <TaxpayerProfile />
        </div>
      </div>
      <div class="content-section">
        <Salaries />
      </div>
      <div class="content-row">
        <div class="content-col-half">
          <div class="content-section">
            <taxable-income />
          </div>
        </div>
        <div class="content-col-half">
          <div class="content-section">
            <investment />
          </div>
        </div>
      </div>
      
      <!-- Tax Calculation Comparison Section - Moved to bottom -->
      <div class="tax-comparison-section">
        <div class="comparison-row">
          <div class="comparison-col">
            <div class="content-section">
              <current />
            </div>
          </div>
          <div class="comparison-col">
            <div class="content-section">
              <calculation-2025 />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tax Comparison Summary - Now at the bottom -->
      <div class="content-section">
        <tax-comparison />
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import Current from "../components/Calculation-2024";
import Calculation2025 from "../components/Calculation-2025";
import TaxComparison from "../components/TaxComparison";
import SalaryBreakdown from "../components/SalaryBreakdown";
import Salaries from "../components/Salaries";
import Investment from "../components/Investment";
import TaxableIncome from "../components/TaxableIncome";
import TaxpayerProfile from "../components/TaxpayerProfile";

export default {
  name: "App",
  data: () => ({}),
  components: {
    Current,
    Calculation2025,
    TaxComparison,
    Salaries,
    TaxableIncome,
    Investment,
    TaxpayerProfile,
  }
};
</script>

<style>
#home-page {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background-color: #f5f6fa;
}


.main-content {
  padding: 30px;
  max-width: none;
  width: 100%;
}

.content-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.content-col-half {
  flex: 1;
  min-width: 0;
}

.profile-container {
  margin: 0 auto 20px auto;
}

.content-section {
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
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
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}


/* Tax Comparison Layout */
.tax-comparison-section {
  margin-top: 20px;
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
  border: 2px solid #000000;
  color: #000000;
  font-weight: 600;
}

.tax-highlight-increase {
  background-color: #000000;
  border: 2px solid #000000;
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
  color: #000000;
  border: 2px solid #000000;
  font-weight: 700;
}

.badge-increase {
  background-color: #000000;
  color: #ffffff;
  border: 2px solid #000000;
  font-weight: 700;
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .content-row {
    flex-direction: column;
    gap: 15px;
  }

  .comparison-row {
    flex-direction: column;
    gap: 15px;
  }

  .content-section {
    padding: 15px;
  }

  table {
    font-size: 0.875rem;
  }

  table input {
    width: 100px !important;
  }
}
</style>
