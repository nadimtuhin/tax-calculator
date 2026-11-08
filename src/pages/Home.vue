<template>
  <div id="home-page">
    <div class="main-content">
      <header class="page-hero">
        <div class="hero-copy">
          <span class="hero-eyebrow">Bangladesh Income Tax · Finance Act 2026</span>
          <h1>Salaried Income Tax Calculator</h1>
          <p class="hero-subtitle">
            Estimate and compare your FY 2025–26 and FY 2026–27 (plus FY 2024–25) tax slabs, Sixth Schedule salary exemption, monthly TDS, and Section 78 investment rebate in ৳ BDT.
          </p>
        </div>
        <div class="hero-meta" aria-label="Calculator highlights">
          <span class="section-pill"><strong>AY 2026–27 &amp; 2027–28</strong> Schedule 1</span>
          <span class="section-pill"><strong>100% Local</strong> Browser-only</span>
        </div>
      </header>

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
        <div class="hero-sticky">
          <tax-comparison />
        </div>
      </aside>

      <div class="tax-comparison-section">
        <div class="comparison-row">
          <div class="comparison-col">
            <div class="content-section">
              <calculation-2024 v-if="comparisonFromYear === '2024-25'" />
              <calculation-2026 v-else-if="comparisonFromYear === '2026-27'" />
              <calculation-2025 v-else />
            </div>
          </div>
          <div class="comparison-col">
            <div class="content-section">
              <calculation-2024 v-if="comparisonToYear === '2024-25'" />
              <calculation-2025 v-else-if="comparisonToYear === '2025-26'" />
              <calculation-2026 v-else />
            </div>
          </div>
        </div>
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
  },
  computed: {
    ...mapGetters(["comparisonFromYear", "comparisonToYear"]),
  },
};
</script>

<style scoped>
/* ponytail: Two-pane CSS grid on desktop, single-column stack on mobile. Upgrade to resizable panes if user customization is requested. */
#home-page {
  color: var(--text);
  min-height: 100vh;
  background-color: var(--bg);
}

/* Desktop splits into top page hero + left inputs stack (<=772px) + right sticky verdict (380px),
   with the two full-year invoice tables side-by-side underneath. */
.main-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-5) var(--space-4) 112px;
  width: 100%;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding: var(--space-1) 0 var(--space-2);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: 680px;
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.page-hero h1 {
  font-size: clamp(1.5rem, 3vw, 2.05rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: var(--text);
}

.hero-subtitle {
  font-size: var(--text-sm);
  color: var(--text-muted);
  line-height: 1.5;
  max-width: 620px;
}

.hero-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
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
  letter-spacing: -0.015em;
  text-align: left;
}

.content-section :deep(.section-header h2),
.content-section :deep(.calc-card-header h2) {
  margin-bottom: 0;
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

  .page-hero {
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
    top: 76px;
  }

  .tax-comparison-section {
    grid-column: 1 / -1;
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

  .hero-meta {
    display: none;
  }
}
</style>
