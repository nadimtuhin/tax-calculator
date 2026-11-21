<template>
  <div id="home-page">
    <div class="main-content">
      <header class="page-hero">
        <h1>Salaried Income Tax Calculator</h1>
        <p class="hero-subtitle">Enter your salary. See your tax.</p>
      </header>

      <aside class="hero-column">
        <div class="hero-sticky">
          <tax-comparison />
        </div>
      </aside>

      <div class="inputs-column">
        <div class="content-section">
          <TaxpayerProfile />
        </div>
        <div class="content-section">
          <Salaries />
        </div>
      </div>

      <div class="more-column">
        <Disclosure
          id="investment"
          title="Investment rebate"
          :hint="hasInvestments ? 'Added' : 'Optional'"
          :force-open="hasInvestments"
        >
          <div class="content-section content-section-flat">
            <investment />
          </div>
        </Disclosure>

        <Disclosure id="taxable" title="Taxable income" hint="Details">
          <div class="content-section content-section-flat">
            <taxable-income />
          </div>
        </Disclosure>

        <Disclosure id="breakdown" title="Full tax breakdown" hint="Year by year">
          <div class="tax-comparison-section">
            <div class="comparison-row">
              <div class="comparison-col">
                <div class="content-section content-section-flat">
                  <calculation-2024 v-if="comparisonFromYear === '2024-25'" />
                  <calculation-2026 v-else-if="comparisonFromYear === '2026-27'" />
                  <calculation-2025 v-else />
                </div>
              </div>
              <div class="comparison-col">
                <div class="content-section content-section-flat">
                  <calculation-2024 v-if="comparisonToYear === '2024-25'" />
                  <calculation-2025 v-else-if="comparisonToYear === '2025-26'" />
                  <calculation-2026 v-else />
                </div>
              </div>
            </div>
          </div>
        </Disclosure>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Calculation2024 from "../components/Calculation-2024";
import Calculation2025 from "../components/Calculation-2025";
import Calculation2026 from "../components/Calculation-2026";
import TaxComparison from "../components/TaxComparison";
import Salaries from "../components/Salaries";
import Investment from "../components/Investment";
import TaxableIncome from "../components/TaxableIncome";
import TaxpayerProfile from "../components/TaxpayerProfile";
import Disclosure from "../components/Disclosure";

export default {
  name: "App",
  data: () => ({}),
  components: {
    Calculation2024,
    Calculation2025,
    Calculation2026,
    TaxComparison,
    Salaries,
    TaxableIncome,
    Investment,
    TaxpayerProfile,
    Disclosure,
  },
  computed: {
    ...mapGetters(["comparisonFromYear", "comparisonToYear"]),
    hasInvestments() {
      const state = this.$store.state.salaries || {};
      const rows = Array.isArray(state.investments) ? state.investments : [];
      const extras = [
        state.earlyRedemptionRebateRepayable,
        state.solarElectricityBill,
        state.groupInsuranceReimbursement,
        state.zakatDonation,
      ];
      return rows.some((row) => Number(row.amount) > 0) || extras.some((v) => Number(v) > 0);
    },
  },
};
</script>

<style scoped>
#home-page {
  color: var(--text);
  min-height: 100vh;
  background-color: var(--bg);
}

/* Mobile: one column. Desktop: inputs left, one sticky result right, optional detail below. */
.main-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4) 112px;
  width: 100%;
}

.page-hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5) 0 var(--space-2);
}

.page-hero h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-muted);
}

.inputs-column,
.hero-column,
.more-column,
.tax-comparison-section {
  min-width: 0;
}

.inputs-column,
.more-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.content-section {
  background-color: var(--surface);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow);
}

.content-section-flat {
  padding: 0;
  box-shadow: none;
  background: none;
}

.content-section :deep(h2) {
  color: var(--text);
  margin-bottom: var(--space-4);
  font-size: var(--text-lg);
  font-weight: 650;
  letter-spacing: -0.015em;
  text-align: left;
}

.content-section :deep(.section-header h2),
.content-section :deep(.calc-card-header h2) {
  margin-bottom: 0;
}

.content-section :deep(.section-eyebrow) {
  display: none;
}

.comparison-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-5);
}

.comparison-col {
  min-width: 0;
}

@media (min-width: 1024px) {
  .main-content {
    grid-template-columns: minmax(0, 1fr) 400px;
    align-items: start;
    padding-bottom: var(--space-6);
  }

  .page-hero,
  .more-column {
    grid-column: 1 / -1;
  }

  .inputs-column {
    grid-column: 1;
    grid-row: 2;
  }

  .hero-column {
    grid-column: 2;
    grid-row: 2;
    align-self: stretch;
  }

  .hero-sticky {
    position: sticky;
    top: 84px;
  }

  .comparison-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .main-content {
    padding-top: var(--space-4);
  }

  .content-section {
    padding: var(--space-4);
  }
}
</style>
