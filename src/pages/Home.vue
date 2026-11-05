<template>
  <div id="home-page">
    <div class="main-content">
      <div class="inputs-column">
        <div class="content-section">
          <TaxpayerProfile />
        </div>
        <div class="content-section">
          <Salaries />
        </div>
        <div class="content-section">
          <taxable-income />
        </div>
        <div class="content-section">
          <investment />
        </div>
      </div>

      <aside class="hero-column">
        <tax-comparison />
      </aside>

      <div class="tax-comparison-section">
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
    </div>
  </div>
</template>

<script>
/* eslint-disable */
import Calculation2025 from "../components/Calculation-2025";
import Calculation2026 from "../components/Calculation-2026";
import TaxComparison from "../components/TaxComparison";
import Salaries from "../components/Salaries";
import Investment from "../components/Investment";
import TaxableIncome from "../components/TaxableIncome";
import TaxpayerProfile from "../components/TaxpayerProfile";

export default {
  name: "App",
  data: () => ({}),
  components: {
    Calculation2025,
    Calculation2026,
    TaxComparison,
    Salaries,
    TaxableIncome,
    Investment,
    TaxpayerProfile,
  }
};
</script>

<style scoped>
#home-page {
  color: var(--text);
  min-height: 100vh;
  background-color: var(--bg);
}

/* Desktop splits into left inputs stack (<=772px) + right sticky hero (380px),
   with the two full-year invoice tables side-by-side underneath. */
.main-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-4) 112px;
  width: 100%;
}

.inputs-column,
.hero-column,
.tax-comparison-section {
  min-width: 0;
}

.content-section {
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-5);
  box-shadow: var(--shadow);
  margin-bottom: var(--space-4);
}

.comparison-row .content-section,
.inputs-column > .content-section:last-child {
  margin-bottom: 0;
}

.content-section :deep(h2) {
  color: var(--text);
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
  font-weight: 650;
  letter-spacing: -0.01em;
  text-align: left;
}

.comparison-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

.comparison-col {
  min-width: 0;
}

@media (min-width: 1024px) {
  .main-content {
    grid-template-columns: minmax(0, 1fr) 380px;
    align-items: start;
    padding-bottom: var(--space-6);
  }

  .inputs-column {
    grid-column: 1;
    grid-row: 1;
  }

  .hero-column {
    grid-column: 2;
    grid-row: 1;
    position: sticky;
    top: 72px;
  }

  .tax-comparison-section {
    grid-column: 1 / -1;
  }

  .comparison-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .content-section {
    padding: var(--space-4);
  }
}
</style>
