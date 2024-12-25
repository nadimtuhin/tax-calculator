<template>
  <div class="tax-saving-tips container py-5">
    <h2 class="text-center mb-5">How to Save on Tax Payments in Bangladesh</h2>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-piggy-bank tip-icon"></i>
        <h3>1. Investment Tax Credit</h3>
      </div>
      <p>
        You can save on taxes by investing in DPS (Deposit Pension Scheme), paying life insurance premiums,
        and making provident fund contributions. Government securities and stock market investments in approved IPOs
        are also eligible for tax benefits. The maximum rebate you can get is 15% of eligible investments or 10%
        of total tax, whichever is lower.
      </p>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-cash-stack tip-icon"></i>
        <h3>2. Tax-Free Allowances</h3>
      </div>
      <p>
        Several allowances are exempt from tax. House rent allowance is tax-free up to 50% of basic salary or actual
        rent paid, whichever is lower. Medical allowance of 10% of basic salary, conveyance allowance up to BDT 30,000
        per year, and actual leave travel expenses are also tax-exempt.
      </p>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-heart tip-icon"></i>
        <h3>3. Zakat Deduction</h3>
      </div>
      <p>Zakat paid during the income year is fully tax-deductible if properly documented.</p>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-graph-up tip-icon"></i>
        <h3>4. Strategic Salary Structure</h3>
      </div>
      <p>
        Structure your salary wisely by optimizing the mix between basic salary and allowances. Consider splitting your
        income appropriately and take advantage of meal vouchers and other tax-free benefits to minimize your tax burden.
      </p>
    </div>

    <div class="tip-section">
      <div class="tip-header">
        <i class="bi bi-file-earmark-text tip-icon"></i>
        <h3>5. Documentation</h3>
      </div>
      <p>
        Maintain thorough documentation of all tax-related items. This includes investment proofs, receipts, house rent
        payment records, and any other tax-deductible expenses. Proper documentation is crucial for claiming tax benefits.
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
</style>
