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
      <div v-if="taxSavings > 0" class="savings-highlight">
        <div class="result-badge badge-savings">
          <strong>You will SAVE ৳{{taxSavings.toLocaleString()}}</strong>
        </div>
        <div class="result-text">
          Under the new tax structure, you will pay ৳{{taxSavings.toLocaleString()}} less in taxes.
        </div>
      </div>
      
      <div v-else-if="additionalTax > 0" class="increase-highlight">
        <div class="result-badge badge-increase">
          <strong>You will pay ৳{{additionalTax.toLocaleString()}} MORE</strong>
        </div>
        <div class="result-text">
          Under the new tax structure, you will pay ৳{{additionalTax.toLocaleString()}} more in taxes.
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
            <h4>Key Changes in FY 2025-2026:</h4>
            <ul>
              <li>Tax-free threshold increased by ৳25,000</li>
              <li>5% tax bracket removed (simplified to 6 slabs)</li>
              <li>Unified minimum tax of ৳5,000</li>
              <li>Tax rates: 0%, 10%, 15%, 20%, 25%, 30%</li>
            </ul>
          </div>
          
          <div class="breakdown-section">
            <h4>Your Tax Calculation:</h4>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>FY 2024-25</th>
                  <th>FY 2025-26</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tax-free Threshold</td>
                  <td>৳{{taxFreeThreshold2024.toLocaleString()}}</td>
                  <td>৳{{taxFreeThreshold2025.toLocaleString()}}</td>
                  <td class="positive">+৳{{(taxFreeThreshold2025 - taxFreeThreshold2024).toLocaleString()}}</td>
                </tr>
                <tr>
                  <td>Total Tax</td>
                  <td>৳{{totalTax2024.toLocaleString()}}</td>
                  <td>৳{{totalTax2025.toLocaleString()}}</td>
                  <td :class="taxDifference > 0 ? 'negative' : 'positive'">
                    {{taxDifference > 0 ? '+' : ''}}৳{{taxDifference.toLocaleString()}}
                  </td>
                </tr>
                <tr>
                  <td>Final Payable</td>
                  <td>৳{{payableTax2024.toLocaleString()}}</td>
                  <td>৳{{payableTax2025.toLocaleString()}}</td>
                  <td :class="(payableTax2025 - payableTax2024) > 0 ? 'negative' : 'positive'">
                    {{(payableTax2025 - payableTax2024) > 0 ? '+' : ''}}৳{{(payableTax2025 - payableTax2024).toLocaleString()}}
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
      // FY 2024-25 (current)
      totalTax2024: 'totalTax',
      taxFreeThreshold2024: 'taxFreeThreshold',
      payableTax2024: 'payableTax',
      
      // FY 2025-26 (new)
      totalTax2025: 'totalTax2025',
      taxFreeThreshold2025: 'taxFreeThreshold2025',
      payableTax2025: 'payableTax2025',
      
      // Comparison
      taxDifference: 'taxDifference',
      taxSavings: 'taxSavings',
      additionalTax: 'additionalTax',
      
      // Current year
      currentYear: 'currentYear',
      fiscalYearOptions: 'fiscalYearOptions'
    }),
    
    currentYearLabel() {
      const option = this.fiscalYearOptions.find(opt => opt.value === this.currentYear);
      return option ? option.label : 'FY 2024-2025';
    },
    
    otherYearLabel() {
      return this.currentYear === '2024-25' ? 'FY 2025-2026' : 'FY 2024-2025';
    },
    
    currentYearTax() {
      return this.currentYear === '2024-25' ? this.totalTax2024 : this.totalTax2025;
    },
    
    currentYearThreshold() {
      return this.currentYear === '2024-25' ? this.taxFreeThreshold2024 : this.taxFreeThreshold2025;
    },
    
    otherYearTax() {
      return this.currentYear === '2024-25' ? this.totalTax2025 : this.totalTax2024;
    },
    
    otherYearThreshold() {
      return this.currentYear === '2024-25' ? this.taxFreeThreshold2025 : this.taxFreeThreshold2024;
    }
  }
};
</script>

<style scoped>
.tax-comparison-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #000000;
  border: 2px solid #000000;
  border-radius: 6px;
}

.badge-increase {
  background-color: #000000;
  color: #ffffff;
  border: 2px solid #000000;
  border-radius: 6px;
}

.badge-neutral {
  background-color: #f5f5f5;
  color: #000000;
  border: 2px solid #666666;
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
  color: #000000;
  font-weight: 700;
  background-color: #ffffff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #000000;
}

.negative {
  color: #ffffff;
  font-weight: 700;
  background-color: #000000;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #000000;
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