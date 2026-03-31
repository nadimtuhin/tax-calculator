<template>
  <div class="tax-comparison-summary">
    <div class="comparison-header">
      <h3>Tax Year Comparison</h3>
    </div>
    
    <div class="comparison-cards">
      <div class="comparison-card">
        <div class="card-header">Current Year ({{currentYearLabel}})</div>
        <div class="card-content">
          <div class="tax-amount">৳{{currentYearTax.toLocaleString()}}</div>
          <div class="threshold-info">Tax-free: ৳{{currentYearThreshold.toLocaleString()}}</div>
        </div>
      </div>
      
      <div class="comparison-arrow">
        <i class="arrow-icon">vs</i>
      </div>
      
      <div class="comparison-card">
        <div class="card-header">Other Year ({{otherYearLabel}})</div>
        <div class="card-content">
          <div class="tax-amount">৳{{otherYearTax.toLocaleString()}}</div>
          <div class="threshold-info">Tax-free: ৳{{otherYearThreshold.toLocaleString()}}</div>
        </div>
      </div>
    </div>
    
    <div class="comparison-result">
      <div v-if="activeTaxSavings > 0" class="savings-highlight">
        <div class="result-badge badge-savings">
          <strong>You will SAVE ৳{{activeTaxSavings.toLocaleString()}}</strong>
        </div>
        <div class="result-text">
          Under {{otherYearLabel}}, you will pay ৳{{activeTaxSavings.toLocaleString()}} less in taxes.
        </div>
      </div>

      <div v-else-if="activeAdditionalTax > 0" class="increase-highlight">
        <div class="result-badge badge-increase">
          <strong>You will pay ৳{{activeAdditionalTax.toLocaleString()}} MORE</strong>
        </div>
        <div class="result-text">
          Under {{otherYearLabel}}, you will pay ৳{{activeAdditionalTax.toLocaleString()}} more in taxes.
        </div>
      </div>

      <div v-else class="no-change">
        <div class="result-badge badge-neutral">
          <strong>No change in tax amount</strong>
        </div>
        <div class="result-text">
          Your tax liability remains the same under both tax structures.
        </div>
      </div>
    </div>
    
    <div class="comparison-details">
      <details class="comparison-breakdown">
        <summary>View Detailed Breakdown</summary>
        <div class="breakdown-content">
          <div class="breakdown-section">
            <h4>Key Changes in 2026-2027 vs 2025-2026:</h4>
            <ul>
              <li>New "July Warrior" category (tax-free threshold: ৳5,25,000)</li>
              <li>Same slab structure as 2025-2026</li>
              <li>Unified minimum tax of ৳5,000 (unchanged)</li>
              <li>Investment rebate formula unchanged</li>
            </ul>
          </div>
          
          <div class="breakdown-section">
            <h4>Your Tax Calculation:</h4>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>{{currentYearLabel}}</th>
                  <th>{{otherYearLabel}}</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tax-free Threshold</td>
                  <td>৳{{currentYearThreshold.toLocaleString()}}</td>
                  <td>৳{{otherYearThreshold.toLocaleString()}}</td>
                  <td :class="(otherYearThreshold - currentYearThreshold) >= 0 ? 'positive' : 'negative'">
                    {{(otherYearThreshold - currentYearThreshold) >= 0 ? '+' : ''}}৳{{(otherYearThreshold - currentYearThreshold).toLocaleString()}}
                  </td>
                </tr>
                <tr>
                  <td>Total Tax</td>
                  <td>৳{{currentYearTax.toLocaleString()}}</td>
                  <td>৳{{otherYearTax.toLocaleString()}}</td>
                  <td :class="activeTaxDifference > 0 ? 'negative' : 'positive'">
                    {{activeTaxDifference > 0 ? '+' : ''}}৳{{activeTaxDifference.toLocaleString()}}
                  </td>
                </tr>
                <tr>
                  <td>Final Payable</td>
                  <td>৳{{currentYearPayable.toLocaleString()}}</td>
                  <td>৳{{otherYearPayable.toLocaleString()}}</td>
                  <td :class="(otherYearPayable - currentYearPayable) > 0 ? 'negative' : 'positive'">
                    {{(otherYearPayable - currentYearPayable) > 0 ? '+' : ''}}৳{{(otherYearPayable - currentYearPayable).toLocaleString()}}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "TaxComparison",
  computed: {
    ...mapGetters({
      totalTax2025: 'totalTax2025',
      taxFreeThreshold2025: 'taxFreeThreshold2025',
      payableTax2025: 'payableTax2025',

      totalTax2026: 'totalTax2026',
      taxFreeThreshold2026: 'taxFreeThreshold2026',
      payableTax2026: 'payableTax2026',

      currentYear: 'currentYear',
      fiscalYearOptions: 'fiscalYearOptions',
    }),

    currentYearLabel() {
      const option = this.fiscalYearOptions.find(opt => opt.value === this.currentYear);
      return option ? option.label : '2025-2026';
    },

    otherYearLabel() {
      return this.currentYear === '2026-27' ? '2025-2026' : '2026-2027';
    },

    currentYearTax() {
      return this.currentYear === '2026-27' ? this.totalTax2026 : this.totalTax2025;
    },

    currentYearThreshold() {
      return this.currentYear === '2026-27' ? this.taxFreeThreshold2026 : this.taxFreeThreshold2025;
    },

    currentYearPayable() {
      return this.currentYear === '2026-27' ? this.payableTax2026 : this.payableTax2025;
    },

    otherYearTax() {
      return this.currentYear === '2026-27' ? this.totalTax2025 : this.totalTax2026;
    },

    otherYearThreshold() {
      return this.currentYear === '2026-27' ? this.taxFreeThreshold2025 : this.taxFreeThreshold2026;
    },

    otherYearPayable() {
      return this.currentYear === '2026-27' ? this.payableTax2025 : this.payableTax2026;
    },

    activeTaxDifference() {
      return this.otherYearTax - this.currentYearTax;
    },

    activeTaxSavings() {
      return this.activeTaxDifference < 0 ? Math.abs(this.activeTaxDifference) : 0;
    },

    activeAdditionalTax() {
      return this.activeTaxDifference > 0 ? this.activeTaxDifference : 0;
    },
  }
};
</script>

<style scoped>
.tax-comparison-summary {
  background: linear-gradient(135deg, #006A4E 0%, #008A66 100%);
  color: white;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
}

.comparison-header h3 {
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
}


.comparison-cards {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 24px;
}

.comparison-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
  flex: 1;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header {
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 8px;
  opacity: 0.9;
}

.tax-amount {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.threshold-info {
  font-size: 0.75rem;
  opacity: 0.8;
}

.comparison-arrow {
  font-size: 1.5rem;
  font-weight: bold;
  opacity: 0.8;
}

.comparison-result {
  text-align: center;
  margin-bottom: 20px;
}

.result-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.badge-savings {
  background-color: #ffffff;
  color: #006A4E;
  border: 2px solid #ffffff;
  border-radius: 6px;
}

.badge-increase {
  background-color: #F42A41;
  color: #ffffff;
  border: 2px solid #F42A41;
  border-radius: 6px;
}

.badge-neutral {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 6px;
}

.result-text {
  font-size: 0.875rem;
  opacity: 0.9;
}

.comparison-details {
  margin-top: 20px;
}

.comparison-breakdown {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.comparison-breakdown summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 12px;
}

.breakdown-content {
  margin-top: 16px;
}

.breakdown-section {
  margin-bottom: 20px;
}

.breakdown-section h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
}

.breakdown-section ul {
  margin: 0;
  padding-left: 20px;
}

.breakdown-section li {
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.breakdown-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.breakdown-table th,
.breakdown-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.breakdown-table th {
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
}

.positive {
  color: #006A4E;
  font-weight: 700;
  background-color: #ffffff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.negative {
  color: #ffffff;
  font-weight: 700;
  background-color: #F42A41;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #F42A41;
}

@media (max-width: 768px) {
  .comparison-cards {
    flex-direction: column;
    gap: 12px;
  }
  
  .comparison-arrow {
    transform: rotate(90deg);
  }
  
  .tax-amount {
    font-size: 1.25rem;
  }
  
  .breakdown-table {
    font-size: 0.75rem;
  }
  
  .breakdown-table th,
  .breakdown-table td {
    padding: 6px 8px;
  }
}
</style>