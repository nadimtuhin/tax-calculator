<template>
  <div id="home-page">
    <ActionBar />
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
      <div class="content-section">
        <current />
      </div>
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import Current from "../components/Calculation-2024";
import SalaryBreakdown from "../components/SalaryBreakdown";
import Salaries from "../components/Salaries";
import Investment from "../components/Investment";
import TaxableIncome from "../components/TaxableIncome";
import TaxpayerProfile from "../components/TaxpayerProfile";
import ActionBar from "../components/ActionBar";

export default {
  name: "App",
  data: () => ({}),
  components: {
    Current,
    Salaries,
    TaxableIncome,
    Investment,
    TaxpayerProfile,
    ActionBar,
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


@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .content-row {
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
