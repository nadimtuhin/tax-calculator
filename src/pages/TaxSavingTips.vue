<template>
  <div class="tax-saving-tips container py-5">
    <h2 class="text-center mb-5">How to Save on Tax Payments in Bangladesh</h2>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-piggy-bank tip-icon"></i>
        <h3>1. Investment Tax Credit</h3>
      </div>
      <p>
        You can save on taxes by investing in various tax-saving instruments. The maximum investment allowable for tax rebate
        is 25% of your total income or BDT 1.5 crore, whichever is lower. Eligible investments include:
      </p>
      <ul class="mt-3">
        <li>Life Insurance Premiums</li>
        <li>Deposit Pension Scheme (DPS)</li>
        <li>Provident Fund Contributions</li>
        <li>Government Securities and Savings Certificates</li>
        <li>Stock Market Investments in approved IPOs</li>
        <li>Unit Certificates</li>
        <li>Pension Schemes</li>
      </ul>
      <p class="mt-3">
        The tax rebate rate is 15% of your eligible investments or 10% of total tax, whichever is lower. For example,
        if you invest BDT 100,000 in eligible instruments, you can receive up to BDT 15,000 in tax rebates.
      </p>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-cash-stack tip-icon"></i>
        <h3>2. Tax-Free Allowances</h3>
      </div>
      <p>
        Several allowances are exempt from tax under Bangladesh's tax laws:
      </p>
      <ul class="mt-3">
        <li>House Rent Allowance: Tax-free up to 50% of basic salary or actual rent paid, whichever is lower</li>
        <li>Medical Allowance: 10% of basic salary is tax-exempt</li>
        <li>Conveyance Allowance: Up to BDT 30,000 per year</li>
        <li>Leave Travel Allowance: Actual travel expenses are tax-exempt</li>
        <li>Festival Bonus: Two festival bonuses per year are tax-exempt</li>
        <li>Children's Education Allowance: Within specified limits</li>
      </ul>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-heart tip-icon"></i>
        <h3>3. Zakat and Charitable Donations</h3>
      </div>
      <p>
        Zakat paid during the income year is fully tax-deductible if properly documented. Additionally, donations to
        government-approved charitable organizations and specified welfare funds can provide tax benefits. Make sure to
        maintain proper documentation of all charitable contributions.
      </p>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-graph-up tip-icon"></i>
        <h3>4. Strategic Salary Structure</h3>
      </div>
      <p>
        Structure your salary package wisely by optimizing the mix between basic salary and allowances:
      </p>
      <ul class="mt-3">
        <li>Utilize tax-free allowances to their maximum limits</li>
        <li>Consider meal vouchers and other tax-free benefits</li>
        <li>Participate in your employer's provident fund scheme</li>
        <li>Take advantage of group insurance benefits</li>
      </ul>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-file-earmark-text tip-icon"></i>
        <h3>5. Documentation and Compliance</h3>
      </div>
      <p>
        Maintain thorough documentation of all tax-related items:
      </p>
      <ul class="mt-3">
        <li>Investment proofs and certificates</li>
        <li>House rent receipts and agreements</li>
        <li>Bank statements showing investment deposits</li>
        <li>Insurance premium payment receipts</li>
        <li>Zakat payment receipts</li>
        <li>Charitable donation receipts</li>
      </ul>
      <p class="mt-3">
        Submit your tax returns on time to avoid penalties and ensure you receive maximum benefits. Late submission
        can result in reduced rebates and additional charges.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'tax-saving-tips'
};
</script>

<style scoped>
.tax-saving-tips {
  max-width: 900px;
  margin: 0 auto;
}

.tip-section {
  margin-bottom: 2rem;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tip-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.tip-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.tip-icon {
  font-size: 1.5rem;
  color: #4a90e2;
  flex-shrink: 0;
}

h2 {
  color: #2c3e50;
  font-weight: 700;
  position: relative;
  padding-bottom: 1rem;
}

h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 3px;
  background: linear-gradient(90deg, #4a90e2, #2c3e94);
  border-radius: 2px;
}

h3 {
  color: #2c3e50;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

p {
  color: #4a5568;
  line-height: 1.8;
  margin-bottom: 0;
  text-align: justify;
}

.mt-3 {
  margin-top: 1rem;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
