<template>
  <div class="tax-comparison-summary">
    <div class="comparison-header">
      <div class="comparison-header-top">
        <span class="section-eyebrow">Live Verdict</span>
        <span class="section-pill">2-Year Delta</span>
      </div>
      <h2>Tax Year Comparison (FY {{ fromShort }} vs FY {{ toShort }})</h2>

      <div class="period-picker-bar" role="group" aria-label="Compare fiscal years">
        <div class="period-select-group">
          <label for="compare-from-year" class="period-select-label">Baseline</label>
          <div class="period-select-shell">
            <select
              id="compare-from-year"
              class="period-select"
              :value="comparisonFromYear"
              aria-label="Baseline fiscal year"
              @change="setComparisonFromYear($event.target.value)"
            >
              <option
                v-for="opt in yearPickerOptions"
                :key="'from-' + opt.value"
                :value="opt.value"
              >
                {{ opt.shortLabel }} · {{ opt.ayLabel }}
              </option>
            </select>
          </div>
        </div>

        <button
          type="button"
          class="period-swap-btn"
          aria-label="Swap comparison years"
          title="Swap baseline and comparison years"
          @click="swapYears"
        >
          <span aria-hidden="true">⇄</span>
        </button>

        <div class="period-select-group">
          <label for="compare-to-year" class="period-select-label">Compare to</label>
          <div class="period-select-shell">
            <select
              id="compare-to-year"
              class="period-select"
              :value="comparisonToYear"
              aria-label="Target fiscal year"
              @change="setComparisonToYear($event.target.value)"
            >
              <option
                v-for="opt in yearPickerOptions"
                :key="'to-' + opt.value"
                :value="opt.value"
              >
                {{ opt.shortLabel }} · {{ opt.ayLabel }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="comparison-result">
      <div v-if="taxSavings > 0" class="verdict verdict-savings">
        <div class="verdict-amount amount" aria-hidden="true">৳{{taxSavings.toLocaleString()}}</div>
        <div class="result-badge badge-savings">
          <strong>You will save ৳{{taxSavings.toLocaleString()}} in total tax</strong>
        </div>
        <div class="result-text">
          Under FY {{ toShort }} rules, your total tax is ৳{{taxSavings.toLocaleString()}} lower than FY {{ fromShort }}.
        </div>
      </div>

      <div v-else-if="additionalTax > 0" class="verdict verdict-increase">
        <div class="verdict-amount amount" aria-hidden="true">৳{{additionalTax.toLocaleString()}}</div>
        <div class="result-badge badge-increase">
          <strong>You will pay ৳{{additionalTax.toLocaleString()}} more in total tax</strong>
        </div>
        <div class="result-text">
          Under FY {{ toShort }} rules, your total tax is ৳{{additionalTax.toLocaleString()}} higher than FY {{ fromShort }}.
        </div>
      </div>

      <div v-else class="verdict verdict-neutral">
        <div class="verdict-amount amount" aria-hidden="true">৳0</div>
        <div class="result-badge badge-neutral">
          <strong>No change in total tax</strong>
        </div>
        <div class="result-text">
          Your total tax remains the same in FY {{ fromShort }} and FY {{ toShort }}.
        </div>
      </div>
    </div>

    <p class="payable-change" :class="payableChangeClass" data-testid="payable-change">{{payableChangeText}}</p>

    <div class="comparison-cards">
      <div class="comparison-card" :class="{ 'is-selected': currentYear === comparisonFromYear }">
        <div class="tile-label">{{ fromFullLabel }}{{ currentYear === comparisonFromYear ? ' (Selected)' : '' }}</div>
        <div class="tax-amount amount">৳{{comparisonFromTax.toLocaleString()}}</div>
        <div class="threshold-info">Tax-free: ৳{{comparisonFromThreshold.toLocaleString()}}</div>
      </div>

      <div class="comparison-card" :class="{ 'is-selected': currentYear === comparisonToYear }">
        <div class="tile-label">{{ toFullLabel }}{{ currentYear === comparisonToYear ? ' (Selected)' : '' }}</div>
        <div class="tax-amount amount">৳{{comparisonToTax.toLocaleString()}}</div>
        <div class="threshold-info">Tax-free: ৳{{comparisonToThreshold.toLocaleString()}}</div>
      </div>
    </div>

    <div class="comparison-details">
      <details class="comparison-breakdown">
        <summary>View Detailed Breakdown</summary>
        <div class="breakdown-content">
          <div class="breakdown-section">
            <h3>Statutory Rules Summary (ITA 2023 &amp; Finance Act 2026):</h3>
            <ul>
              <li>Employment exemption (Sixth Schedule Part 1 Para 27): single pool min(1/3 of gross salary, ৳5,00,000) across FY 2024-25, FY 2025-26 &amp; FY 2026-27</li>
              <li>FY 2025-26 &amp; FY 2026-27 Schedule 1: 6 slabs (0–30%, 5% slab removed) with ৳4,00,000 general threshold (+৳50,000 vs FY 2024-25)</li>
              <li>Section 78 rebate: 15% / ৳10,00,000 cap in FY 2024-25; 10% / ৳7,50,000 cap in FY 2025-26 &amp; FY 2026-27 (3% of taxable income cap unchanged)</li>
              <li>Part 3 instrument caps: DPS ≤ ৳1,20,000, Sanchaypatra ≤ ৳5,00,000; Mutual Fund ৳5,00,000 cap removed from FY 2025-26 onward</li>
              <li>Minimum tax: ৳0 at/below threshold; unified ৳5,000 above threshold in FY 2025-26 &amp; FY 2026-27 (৳1,000 for first-time filers)</li>
            </ul>
          </div>

          <div class="breakdown-section">
            <h3>Tax Calculation Breakdown:</h3>
            <div class="table-scroll">
              <table class="breakdown-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>FY {{ fromShort }}</th>
                    <th>FY {{ toShort }}</th>
                    <th>Difference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Tax-free Threshold</td>
                    <td>৳{{comparisonFromThreshold.toLocaleString()}}</td>
                    <td>৳{{comparisonToThreshold.toLocaleString()}}</td>
                    <td :class="thresholdDiffClass">{{formatThresholdDiff(comparisonToThreshold - comparisonFromThreshold)}}</td>
                  </tr>
                  <tr>
                    <td>Total Tax</td>
                    <td>৳{{comparisonFromTax.toLocaleString()}}</td>
                    <td>৳{{comparisonToTax.toLocaleString()}}</td>
                    <td data-testid="total-tax-diff" :class="totalTaxDiffClass">
                      {{formatSignedBdt(taxDifference)}}
                    </td>
                  </tr>
                  <tr>
                    <td>Final Payable</td>
                    <td>৳{{comparisonFromPayable.toLocaleString()}}</td>
                    <td>৳{{comparisonToPayable.toLocaleString()}}</td>
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

    <div class="mobile-bar" role="region" :aria-label="`FY ${fromShort} vs FY ${toShort} tax summary`">
      <div>
        <span class="bar-label">Payable FY {{ toShort }}</span>
        <strong class="amount">৳{{comparisonToPayable.toLocaleString()}}</strong>
        <span class="bar-label" :class="payableChangeClass" data-testid="mobile-payable-change">{{payableChangeShort}}</span>
      </div>
      <div class="bar-diff" :class="totalTaxDiffClass" data-testid="mobile-total-diff">
        <span class="bar-label">Total tax vs FY {{ fromShort }}</span>
        <strong class="amount">{{formatSignedBdt(taxDifference)}}</strong>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

const YEAR_PICKER_OPTIONS = [
  { value: '2024-25', short: '2024-25', shortLabel: 'FY 2024-25', fullLabel: 'FY 2024-2025', ayLabel: 'AY 2025-26' },
  { value: '2025-26', short: '2025-26', shortLabel: 'FY 2025-26', fullLabel: 'FY 2025-2026', ayLabel: 'AY 2026-27' },
  { value: '2026-27', short: '2026-27', shortLabel: 'FY 2026-27', fullLabel: 'FY 2026-2027', ayLabel: 'AY 2027-28' },
];

export default {
  name: "TaxComparison",
  data() {
    return {
      yearPickerOptions: YEAR_PICKER_OPTIONS,
    };
  },
  computed: {
    ...mapGetters({
      totalTax2025: 'totalTax2025',
      taxFreeThreshold2025: 'taxFreeThreshold2025',
      payableTax2025: 'payableTax2025',

      totalTax2026: 'totalTax2026',
      taxFreeThreshold2026: 'taxFreeThreshold2026',
      payableTax2026: 'payableTax2026',

      taxDifference: 'taxDifference',
      taxSavings: 'taxSavings',
      additionalTax: 'additionalTax',
      currentYear: 'currentYear',
    }),
    comparisonFromYear() {
      return this.$store.getters.comparisonFromYear || '2025-26';
    },
    comparisonToYear() {
      return this.$store.getters.comparisonToYear || '2026-27';
    },
    comparisonFromThreshold() {
      if ('comparisonFromThreshold' in this.$store.getters) {
        return this.$store.getters.comparisonFromThreshold;
      }
      return this.taxFreeThreshold2025;
    },
    comparisonToThreshold() {
      if ('comparisonToThreshold' in this.$store.getters) {
        return this.$store.getters.comparisonToThreshold;
      }
      return this.taxFreeThreshold2026;
    },
    comparisonFromTax() {
      if ('comparisonFromTax' in this.$store.getters) {
        return this.$store.getters.comparisonFromTax;
      }
      return this.totalTax2025;
    },
    comparisonToTax() {
      if ('comparisonToTax' in this.$store.getters) {
        return this.$store.getters.comparisonToTax;
      }
      return this.totalTax2026;
    },
    comparisonFromPayable() {
      if ('comparisonFromPayable' in this.$store.getters) {
        return this.$store.getters.comparisonFromPayable;
      }
      return this.payableTax2025;
    },
    comparisonToPayable() {
      if ('comparisonToPayable' in this.$store.getters) {
        return this.$store.getters.comparisonToPayable;
      }
      return this.payableTax2026;
    },

    fromMeta() {
      return YEAR_PICKER_OPTIONS.find((o) => o.value === this.comparisonFromYear) || YEAR_PICKER_OPTIONS[1];
    },
    toMeta() {
      return YEAR_PICKER_OPTIONS.find((o) => o.value === this.comparisonToYear) || YEAR_PICKER_OPTIONS[2];
    },
    fromShort() {
      return this.fromMeta.short;
    },
    toShort() {
      return this.toMeta.short;
    },
    fromFullLabel() {
      return this.fromMeta.fullLabel;
    },
    toFullLabel() {
      return this.toMeta.fullLabel;
    },

    payableChange() {
      return this.comparisonToPayable - this.comparisonFromPayable;
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
      const diff = this.comparisonToThreshold - this.comparisonFromThreshold;
      if (diff > 0) return 'positive';
      if (diff < 0) return 'negative';
      return '';
    },

    payableChangeText() {
      const amount = Math.abs(this.payableChange).toLocaleString();
      const from = this.comparisonFromPayable.toLocaleString();
      const to = this.comparisonToPayable.toLocaleString();
      if (this.payableChange > 0) {
        return `Payable after rebate and TDS goes up by ৳${amount} (৳${from} to ৳${to}).`;
      }
      if (this.payableChange < 0) {
        return `Payable after rebate and TDS goes down by ৳${amount} (৳${from} to ৳${to}).`;
      }
      return `Payable after rebate and TDS stays ৳${to} across both years.`;
    },

    payableChangeShort() {
      const amount = Math.abs(this.payableChange).toLocaleString();
      if (this.payableChange > 0) return `up ৳${amount} vs FY ${this.fromShort}`;
      if (this.payableChange < 0) return `down ৳${amount} vs FY ${this.fromShort}`;
      return `same as FY ${this.fromShort}`;
    },
  },
  methods: {
    ...mapMutations(['setComparisonFromYear', 'setComparisonToYear']),
    swapYears() {
      const prevFrom = this.comparisonFromYear;
      const prevTo = this.comparisonToYear;
      this.setComparisonFromYear(prevTo);
      this.setComparisonToYear(prevFrom);
    },
    formatSignedBdt(value) {
      if (value > 0) return `+৳${value.toLocaleString()}`;
      if (value < 0) return `-৳${Math.abs(value).toLocaleString()}`;
      return '৳0';
    },
    formatThresholdDiff(value) {
      return this.formatSignedBdt(value);
    },
  },
};
</script>

<style scoped>
/* ponytail: Single sticky verdict card with CSS grid comparison tiles. Upgrade to modal dialog if more breakdown charts are added. */
.tax-comparison-summary {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--space-5);
}

.comparison-header {
  padding-bottom: var(--space-3);
  margin-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.comparison-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.comparison-header h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--text-base);
  font-weight: 650;
  color: var(--text);
  letter-spacing: -0.01em;
}

.period-picker-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: end;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.period-select-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.period-select-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding-left: 2px;
}

.period-select-shell {
  position: relative;
}

.period-select {
  width: 100%;
  min-height: 36px;
  padding: 0 26px 0 var(--space-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background-color: var(--surface);
  background-image: linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
    linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position: calc(100% - 13px) 50%, calc(100% - 8px) 50%;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  appearance: none;
  color: var(--text);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  text-overflow: ellipsis;
}

.period-select:hover {
  border-color: var(--accent);
}

.period-select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.period-swap-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
}

.period-swap-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
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

.breakdown-section h3 {
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

@media (max-width: 440px) {
  .period-picker-bar {
    grid-template-columns: 1fr;
  }

  .period-swap-btn {
    width: 100%;
    height: 30px;
  }
}
</style>
