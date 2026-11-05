<template>
  <div class="tax-comparison-summary">
    <div class="comparison-header">
      <h3>Tax Year Comparison</h3>
    </div>

    <div class="comparison-result">
      <div v-if="taxSavings > 0" class="verdict verdict-savings">
        <div class="verdict-amount amount" aria-hidden="true">৳{{taxSavings.toLocaleString()}}</div>
        <div class="result-badge badge-savings">
          <strong>You will save ৳{{taxSavings.toLocaleString()}} in total tax</strong>
        </div>
        <div class="result-text">
          Under the new tax structure, your total tax is ৳{{taxSavings.toLocaleString()}} lower.
        </div>
      </div>

      <div v-else-if="additionalTax > 0" class="verdict verdict-increase">
        <div class="verdict-amount amount" aria-hidden="true">৳{{additionalTax.toLocaleString()}}</div>
        <div class="result-badge badge-increase">
          <strong>You will pay ৳{{additionalTax.toLocaleString()}} more in total tax</strong>
        </div>
        <div class="result-text">
          Under the new tax structure, your total tax is ৳{{additionalTax.toLocaleString()}} higher.
        </div>
      </div>

      <div v-else class="verdict verdict-neutral">
        <div class="verdict-amount amount" aria-hidden="true">৳0</div>
        <div class="result-badge badge-neutral">
          <strong>No change in total tax</strong>
        </div>
        <div class="result-text">
          Your total tax remains the same under both tax structures.
        </div>
      </div>
    </div>

    <p class="payable-change" :class="payableChangeClass" data-testid="payable-change">{{payableChangeText}}</p>

    <div class="comparison-cards">
      <div class="comparison-card">
        <div class="tile-label">Current Year ({{currentYearLabel}})</div>
        <div class="tax-amount amount">৳{{currentYearTax.toLocaleString()}}</div>
        <div class="threshold-info">Tax-free: ৳{{currentYearThreshold.toLocaleString()}}</div>
      </div>

      <div class="comparison-card">
        <div class="tile-label">Other Year ({{otherYearLabel}})</div>
        <div class="tax-amount amount">৳{{otherYearTax.toLocaleString()}}</div>
        <div class="threshold-info">Tax-free: ৳{{otherYearThreshold.toLocaleString()}}</div>
      </div>
    </div>

    <div class="comparison-details">
      <details class="comparison-breakdown">
        <summary>View Detailed Breakdown</summary>
        <div class="breakdown-content">
          <div class="breakdown-section">
            <h4>Key Changes in FY 2026-2027 (Finance Act 2026):</h4>
            <ul>
              <li>Tax-free threshold raised by ৳25,000 across all categories</li>
              <li>Investment rebate rate reduced: 15% → 10% of eligible investment</li>
              <li>Investment rebate cap reduced: ৳10,00,000 → ৳7,50,000</li>
              <li>Minimum tax remains flat ৳5,000; ৳1,000 for first-time filers</li>
              <li>Slab rates unchanged: 0%, 10%, 15%, 20%, 25%, 30%</li>
            </ul>
          </div>
          
          <div class="breakdown-section">
            <h4>Your Tax Calculation:</h4>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>FY 2025-26</th>
                  <th>FY 2026-27</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tax-free Threshold</td>
                  <td>৳{{taxFreeThreshold2025.toLocaleString()}}</td>
                  <td>৳{{taxFreeThreshold2026.toLocaleString()}}</td>
                  <td class="positive">+৳{{(taxFreeThreshold2026 - taxFreeThreshold2025).toLocaleString()}}</td>
                </tr>
                <tr>
                  <td>Total Tax</td>
                  <td>৳{{totalTax2025.toLocaleString()}}</td>
                  <td>৳{{totalTax2026.toLocaleString()}}</td>
                  <td :class="taxDifference > 0 ? 'negative' : 'positive'">
                    {{taxDifference > 0 ? '+' : ''}}৳{{taxDifference.toLocaleString()}}
                  </td>
                </tr>
                <tr>
                  <td>Final Payable</td>
                  <td>৳{{payableTax2025.toLocaleString()}}</td>
                  <td>৳{{payableTax2026.toLocaleString()}}</td>
                  <td :class="(payableTax2026 - payableTax2025) > 0 ? 'negative' : 'positive'">
                    {{(payableTax2026 - payableTax2025) > 0 ? '+' : ''}}৳{{(payableTax2026 - payableTax2025).toLocaleString()}}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>

    <div class="mobile-bar" role="region" aria-label="Tax summary">
      <div>
        <span class="bar-label">Payable FY 2026-27</span>
        <strong class="amount">৳{{payableTax2026.toLocaleString()}}</strong>
        <span class="bar-label" :class="payableChangeClass">{{payableChangeShort}}</span>
      </div>
      <div class="bar-diff" :class="taxDifference > 0 ? 'negative' : 'positive'">
        <span class="bar-label">Total tax change</span>
        <strong class="amount">{{taxDifference > 0 ? '+' : ''}}৳{{taxDifference.toLocaleString()}}</strong>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "TaxComparison",
  computed: {
    ...mapGetters({
      // FY 2025-26
      totalTax2025: 'totalTax2025',
      taxFreeThreshold2025: 'taxFreeThreshold2025',
      payableTax2025: 'payableTax2025',

      // FY 2026-27 (new/current)
      totalTax2026: 'totalTax2026',
      taxFreeThreshold2026: 'taxFreeThreshold2026',
      payableTax2026: 'payableTax2026',

      // Comparison
      taxDifference: 'taxDifference',
      taxSavings: 'taxSavings',
      additionalTax: 'additionalTax',

      // Current year
      currentYear: 'currentYear',
      fiscalYearOptions: 'fiscalYearOptions'
    }),

    payableChange() {
      return this.payableTax2026 - this.payableTax2025;
    },

    payableChangeClass() {
      if (this.payableChange === 0) return '';
      return this.payableChange > 0 ? 'negative' : 'positive';
    },

    payableChangeText() {
      const amount = Math.abs(this.payableChange).toLocaleString();
      const from = this.payableTax2025.toLocaleString();
      const to = this.payableTax2026.toLocaleString();
      if (this.payableChange > 0) return `Payable after rebate and TDS goes up by ৳${amount} (৳${from} to ৳${to}).`;
      if (this.payableChange < 0) return `Payable after rebate and TDS goes down by ৳${amount} (৳${from} to ৳${to}).`;
      return `Payable after rebate and TDS stays ৳${to}.`;
    },

    payableChangeShort() {
      const amount = Math.abs(this.payableChange).toLocaleString();
      if (this.payableChange > 0) return `up ৳${amount} vs FY 2025-26`;
      if (this.payableChange < 0) return `down ৳${amount} vs FY 2025-26`;
      return 'same as FY 2025-26';
    },

    currentYearLabel() {
      const option = this.fiscalYearOptions.find(opt => opt.value === this.currentYear);
      return option ? option.label : 'FY 2026-2027';
    },

    otherYearLabel() {
      return this.currentYear === '2026-27' ? 'FY 2025-2026' : 'FY 2026-2027';
    },

    currentYearTax() {
      return this.currentYear === '2026-27' ? this.totalTax2026 : this.totalTax2025;
    },

    currentYearThreshold() {
      return this.currentYear === '2026-27' ? this.taxFreeThreshold2026 : this.taxFreeThreshold2025;
    },

    otherYearTax() {
      return this.currentYear === '2026-27' ? this.totalTax2025 : this.totalTax2026;
    },

    otherYearThreshold() {
      return this.currentYear === '2026-27' ? this.taxFreeThreshold2025 : this.taxFreeThreshold2026;
    }
  }
};
</script>

<style scoped>
.tax-comparison-summary {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--space-5);
}

.comparison-header h3 {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.verdict {
  border-radius: var(--radius);
  padding: var(--space-5);
  text-align: center;
}

.verdict-savings {
  background: var(--good-soft);
  color: var(--good);
}

.verdict-increase {
  background: var(--warn-soft);
  color: var(--warn);
}

.verdict-neutral {
  background: var(--surface-muted);
  color: var(--text);
}

.verdict-amount {
  font-size: var(--text-hero);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.result-badge {
  margin-top: var(--space-2);
  font-size: var(--text-base);
}

.result-text {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.payable-change {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
  color: var(--text-muted);
}

.comparison-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.comparison-card {
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: var(--space-4);
}

.tile-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
}

.tax-amount {
  margin: var(--space-1) 0;
  font-size: 1.375rem;
  font-weight: 700;
}

.threshold-info {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.comparison-details {
  margin-top: var(--space-4);
}

.comparison-breakdown {
  border-top: 1px solid var(--border);
  padding-top: var(--space-3);
}

.comparison-breakdown summary {
  cursor: pointer;
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--accent);
  border-radius: var(--radius-sm);
}

.breakdown-content {
  margin-top: var(--space-4);
}

.breakdown-section {
  margin-bottom: var(--space-4);
}

.breakdown-section h4 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
}

.breakdown-section ul {
  margin: 0;
  padding-left: var(--space-5);
}

.breakdown-section li {
  margin-bottom: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
  display: block;
  overflow-x: auto;
}

.breakdown-table th,
.breakdown-table td {
  padding: var(--space-2);
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--border);
}

.breakdown-table th {
  font-weight: 600;
  color: var(--text-muted);
}

.positive {
  color: var(--good);
  font-weight: 700;
}

.negative {
  color: var(--warn);
  font-weight: 700;
}

.mobile-bar {
  display: none;
}

@media (max-width: 1023px) {
  .mobile-bar {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 900;
    padding: var(--space-3) var(--space-4);
    background: var(--surface);
    border-top: 1px solid var(--border);
    box-shadow: var(--shadow-lg);
  }

  .mobile-bar > div {
    display: flex;
    flex-direction: column;
  }

  .bar-diff {
    text-align: right;
  }

  .bar-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
  }
}
</style>