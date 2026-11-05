<template>
  <div class="tax-comparison-summary">
    <div class="comparison-header">
      <h3>Tax Year Comparison (FY 2025-26 vs FY 2026-27)</h3>
    </div>

    <div class="comparison-result">
      <div v-if="taxSavings > 0" class="verdict verdict-savings">
        <div class="verdict-amount amount" aria-hidden="true">৳{{taxSavings.toLocaleString()}}</div>
        <div class="result-badge badge-savings">
          <strong>You will save ৳{{taxSavings.toLocaleString()}} in total tax</strong>
        </div>
        <div class="result-text">
          Under FY 2026-27 rules, your total tax is ৳{{taxSavings.toLocaleString()}} lower than FY 2025-26.
        </div>
      </div>

      <div v-else-if="additionalTax > 0" class="verdict verdict-increase">
        <div class="verdict-amount amount" aria-hidden="true">৳{{additionalTax.toLocaleString()}}</div>
        <div class="result-badge badge-increase">
          <strong>You will pay ৳{{additionalTax.toLocaleString()}} more in total tax</strong>
        </div>
        <div class="result-text">
          Under FY 2026-27 rules, your total tax is ৳{{additionalTax.toLocaleString()}} higher than FY 2025-26.
        </div>
      </div>

      <div v-else class="verdict verdict-neutral">
        <div class="verdict-amount amount" aria-hidden="true">৳0</div>
        <div class="result-badge badge-neutral">
          <strong>No change in total tax</strong>
        </div>
        <div class="result-text">
          Your total tax remains the same in FY 2025-26 and FY 2026-27.
        </div>
      </div>
    </div>

    <p class="payable-change" :class="payableChangeClass" data-testid="payable-change">{{payableChangeText}}</p>

    <div class="comparison-cards">
      <div class="comparison-card" :class="{ 'is-selected': currentYear === '2025-26' }">
        <div class="tile-label">FY 2025-2026{{ currentYear === '2025-26' ? ' (Selected)' : '' }}</div>
        <div class="tax-amount amount">৳{{totalTax2025.toLocaleString()}}</div>
        <div class="threshold-info">Tax-free: ৳{{taxFreeThreshold2025.toLocaleString()}}</div>
      </div>

      <div class="comparison-card" :class="{ 'is-selected': currentYear === '2026-27' }">
        <div class="tile-label">FY 2026-2027{{ currentYear === '2026-27' ? ' (Selected)' : '' }}</div>
        <div class="tax-amount amount">৳{{totalTax2026.toLocaleString()}}</div>
        <div class="threshold-info">Tax-free: ৳{{taxFreeThreshold2026.toLocaleString()}}</div>
      </div>
    </div>

    <div class="comparison-details">
      <details class="comparison-breakdown">
        <summary>View Detailed Breakdown</summary>
        <div class="breakdown-content">
          <div class="breakdown-section">
            <h4>Key Changes in FY 2026-2027 (Finance Act 2026):</h4>
            <ul>
              <li>Tax-free thresholds match FY 2025-26 (৳4,00,000 general; Finance Act 2026 Schedule 1 covers both AY 2026-27 and AY 2027-28)</li>
              <li>Investment rebate rate reduced: 15% → 10% of eligible investment</li>
              <li>Investment rebate cap reduced: ৳10,00,000 → ৳7,50,000</li>
              <li>Minimum tax remains flat ৳5,000; ৳1,000 for first-time filers</li>
              <li>Slab rates unchanged: 0%, 10%, 15%, 20%, 25%, 30%</li>
            </ul>
          </div>

          <div class="breakdown-section">
            <h4>Your Tax Calculation:</h4>
            <div class="table-scroll">
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
                    <td :class="thresholdDiffClass">{{formatThresholdDiff(taxFreeThreshold2026 - taxFreeThreshold2025)}}</td>
                  </tr>
                  <tr>
                    <td>Total Tax</td>
                    <td>৳{{totalTax2025.toLocaleString()}}</td>
                    <td>৳{{totalTax2026.toLocaleString()}}</td>
                    <td data-testid="total-tax-diff" :class="totalTaxDiffClass">
                      {{formatSignedBdt(taxDifference)}}
                    </td>
                  </tr>
                  <tr>
                    <td>Final Payable</td>
                    <td>৳{{payableTax2025.toLocaleString()}}</td>
                    <td>৳{{payableTax2026.toLocaleString()}}</td>
                    <td data-testid="payable-tax-diff" :class="payableChangeClass">
                      {{formatSignedBdt(payableChange)}}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </details>
    </div>

    <div class="mobile-bar" role="region" aria-label="FY 2025-26 vs FY 2026-27 tax summary">
      <div>
        <span class="bar-label">Payable FY 2026-27</span>
        <strong class="amount">৳{{payableTax2026.toLocaleString()}}</strong>
        <span class="bar-label" :class="payableChangeClass" data-testid="mobile-payable-change">{{payableChangeShort}}</span>
      </div>
      <div class="bar-diff" :class="totalTaxDiffClass" data-testid="mobile-total-diff">
        <span class="bar-label">Total tax vs FY 2025-26</span>
        <strong class="amount">{{formatSignedBdt(taxDifference)}}</strong>
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

      // Current year selected in profile
      currentYear: 'currentYear'
    }),

    payableChange() {
      return this.payableTax2026 - this.payableTax2025;
    },

    totalTaxDiffClass() {
      if (this.taxDifference > 0) return 'negative';
      if (this.taxDifference < 0) return 'positive';
      return '';
    },

    payableChangeClass() {
      if (this.payableChange > 0) return 'negative';
      if (this.payableChange < 0) return 'positive';
      return '';
    },

    thresholdDiffClass() {
      const diff = this.taxFreeThreshold2026 - this.taxFreeThreshold2025;
      if (diff > 0) return 'positive';
      if (diff < 0) return 'negative';
      return '';
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
    }
  },
  methods: {
    formatSignedBdt(value) {
      if (value > 0) return `+৳${value.toLocaleString()}`;
      if (value < 0) return `-৳${Math.abs(value).toLocaleString()}`;
      return '৳0';
    },
    formatThresholdDiff(value) {
      return this.formatSignedBdt(value);
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

.comparison-card.is-selected {
  border-color: var(--accent);
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

.table-scroll {
  overflow-x: auto;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
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

.positive,
.payable-change.positive {
  color: var(--good);
  font-weight: 700;
}

.negative,
.payable-change.negative {
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

  .bar-label.positive {
    color: var(--good);
    font-weight: 600;
  }

  .bar-label.negative {
    color: var(--warn);
    font-weight: 600;
  }
}
</style>
