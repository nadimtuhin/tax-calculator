<template>
<div>
<header class="section-header">
  <div class="section-heading-group">
    <span class="section-eyebrow">Step 04 · Section 78 Credit</span>
    <h2>Tax rebate on investment</h2>
  </div>
  <span class="section-pill section-pill-accent amount">Rebate <strong>৳{{ Number(investmentRebate || 0).toLocaleString() }}</strong></span>
</header>

<p v-if="totalInvestment === 0" class="empty-state">
  No investments yet. Enter an amount below to see your tax rebate.
</p>

<div class="table-scroll">
<table class="investment-list">
  <thead>
    <tr>
      <th></th>
      <th>Amount</th>
      <th>Maximum allowed</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="(investment, index) in investments" :key="investment.name">
      <td>
        <strong>{{investment.name}}</strong>
        <div
          v-if="isLifeInsurance(investment.name) && (investment.amount > 0 || investment.policyValue !== null)"
          class="policy-subrow"
        >
          <label :for="`policy-value-${index}`" class="policy-label">Policy sum assured:</label>
          <span class="money money-compact"><span class="money-prefix" aria-hidden="true">৳</span><input
            :id="`policy-value-${index}`"
            type="number"
            aria-label="Life insurance policy value"
            placeholder="Policy sum"
            :value="investment.policyValue ?? ''"
            @input="changePolicyValue($event, index)"
            step="10000"
            min="0"
            max="999999999"
          /></span>
          <small
            v-if="investment.amount > 0 && !(Number(investment.policyValue) > 0)"
            class="policy-warning"
          >
            Enter policy sum assured to qualify for rebate (max 10% of policy value).
          </small>
        </div>
      </td>
      <td>
        <span class="money"><span class="money-prefix" aria-hidden="true">৳</span><input
          type="number"
          :aria-label="`${investment.name} amount`"
          :value="investments[index].amount"
          @input="changeInvestment($event, index)"
          step="1000"
          min="0"
          max="9999999"
        /></span>
      </td>
      <td>
        <span v-if="isLifeInsurance(investment.name)" class="limited">{{ lifeInsuranceCapDisplay(investment) }}</span>
        <span v-else-if="getCapForRow(investment.name) === 0" class="limited">Not eligible in this year</span>
        <span v-else-if="getCapForRow(investment.name) === null" class="unlimited">Unlimited</span>
        <span v-else class="limited">{{getCapForRow(investment.name).toLocaleString()}}</span>
      </td>
    </tr>

    <tr>
      <td><strong>Total Investment</strong></td>
      <td>{{totalInvestment.toLocaleString()}}</td>
      <td>{{maxRebateableInvestment.toLocaleString()}}</td>
    </tr>

    <tr>
      <td>
        <strong>Total rebateable investment</strong>
      </td>
      <td>{{eligibleInvestment.toLocaleString()}}</td>
      <td></td>
    </tr>

    <tr>
      <td>
        <strong>Tax rebate percentage</strong>
        <small class="formula-hint">
          Lower of 3% of taxable income, {{rebatePercentage}}% of eligible investment, or ৳{{rebateMaxCap.toLocaleString()}}
        </small>
      </td>
      <td>{{rebatePercentage}}%</td>
      <td></td>
    </tr>

    <tr>
      <td><strong>Total rebate on investment</strong></td>
      <td>{{ investmentRebate.toLocaleString() }}</td>
      <td></td>
    </tr>
  </tbody>
</table>
</div>

<p v-if="usesFa2026" class="fa2026-note">
  Unit certificates, mutual funds, ETFs and collective investment schemes have no BDT 500,000 investment limit
  from FY 2025-26 (Finance Act 2026, ACNABIN booklet s.1.43, p.22). Savings certificates and DPS keep their own limits.
</p>

<p v-if="isDonationYear" class="fa2026-note">
  Donations to {{ institutionList }} qualify for the investment tax rebate from 1 July 2026 (booklet s.1.46, pp.23-24).
  The booklet states no separate rate or cap, so the amount counts with your other investments under the normal 3% / 10% / BDT 750,000 limits.
</p>

<div v-if="usesFa2026" class="fa2026-extras">
  <p class="fa2026-note fa2026-warning">
    <strong>Early encashment:</strong> the rebate on government securities, unit funds, mutual funds and similar
    instruments applies only if held until maturity or the prescribed holding period. Early encashment, redemption or
    disposal means the rebate claimed earlier must be repaid (booklet s.1.43, p.22). The booklet states no commencement date.
  </p>
  <label class="extras-field" for="early-redemption-repayable">
    <span>Rebate repayable due to early encashment / redemption (BDT)</span>
    <input
      id="early-redemption-repayable"
      type="number"
      min="0"
      max="9999999"
      step="1000"
      :value="earlyRedemptionRebateRepayable"
      @input="setEarlyRedemption($event)"
    />
  </label>
  <label v-if="usesFa2026" class="extras-field" for="group-insurance-reimbursement">
    <span>Group-insurance medical reimbursement received (BDT) - excluded from employment income</span>
    <input
      id="group-insurance-reimbursement"
      type="number"
      min="0"
      max="9999999"
      step="1000"
      :value="groupInsuranceReimbursement"
      @input="setGroupInsurance($event)"
    />
    <small>Booklet s.1.11, FY 2025-26 and FY 2026-27 only. Entered by you: the booklet text was not checked for caps or conditions, so confirm them before filing. Excluded: BDT {{ groupInsuranceExclusion.toLocaleString() }}.</small>
  </label>
  <label v-if="isDonationYear" class="extras-field" for="zakat-donation">
    <span>Donation to Zakat Management (BDT) - excluded from taxable income</span>
    <input
      id="zakat-donation"
      type="number"
      min="0"
      max="9999999"
      step="1000"
      :value="zakatDonation"
      @input="setZakatDonation($event)"
    />
    <small>FY 2026-27 only. Entered by you: the booklet text was not checked, so no cap or rate is applied and the treatment (exclusion from income) is unconfirmed. Excluded: BDT {{ zakatDonationExclusion.toLocaleString() }}.</small>
  </label>
  <label v-if="isSolarYear" class="extras-field" for="solar-electricity-bill">
    <span>Solar electricity bill paid in the income year (BDT) - 5% rebate</span>
    <input
      id="solar-electricity-bill"
      type="number"
      min="0"
      max="9999999"
      step="1000"
      :value="solarElectricityBill"
      @input="setSolarBill($event)"
    />
    <small>Rebate: BDT {{ solarRebate2026.toLocaleString() }} (booklet s.1.44(b), p.23; individuals using solar-generated electricity).</small>
  </label>
</div>

</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { getInvestmentCapForType, LIFE_INSURANCE_POLICY_RATE } from "../utils/taxEngine";
import { PHILANTHROPIC_INSTITUTIONS } from "../utils/fa2026Rules";

export default {
  name: "investment",
  methods: {
    changeInvestment($event, index) {
      this.$store.commit('changeInvestment', { index, value: $event.target.value });
    },
    changePolicyValue($event, index) {
      this.$store.commit('changeInvestmentPolicyValue', { index, value: $event.target.value });
    },
    setEarlyRedemption($event) {
      this.$store.commit('setEarlyRedemptionRebateRepayable', $event.target.value);
    },
    setGroupInsurance($event) {
      this.$store.commit('setGroupInsuranceReimbursement', $event.target.value);
    },
    setZakatDonation($event) {
      this.$store.commit('setZakatDonation', $event.target.value);
    },
    setSolarBill($event) {
      this.$store.commit('setSolarElectricityBill', $event.target.value);
    },
    isLifeInsurance(name) {
      return String(name || '').toLowerCase().startsWith('life insurance');
    },
    lifeInsuranceCapDisplay(investment) {
      if (investment.policyValue !== null && investment.policyValue !== undefined && investment.policyValue !== '') {
        const cap = Math.round((Number(investment.policyValue) || 0) * LIFE_INSURANCE_POLICY_RATE);
        return `${cap.toLocaleString()} (10% of policy)`;
      }
      return '10% of policy value';
    },
    getCapForRow(name) {
      return getInvestmentCapForType(name, this.currentYear);
    },
  },
  computed: {
    usesFa2026() {
      return this.currentYear === '2025-26' || this.currentYear === '2026-27';
    },
    isDonationYear() {
      return this.currentYear === '2026-27';
    },
    isSolarYear() {
      return this.currentYear === '2026-27';
    },
    institutionList() {
      return PHILANTHROPIC_INSTITUTIONS.join('; ');
    },
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      others: state => state.salaries.others,
      investments: state => state.salaries.investments,
      currentYear: state => state.salaries.currentYear,
      earlyRedemptionRebateRepayable: state => state.salaries.earlyRedemptionRebateRepayable || 0,
      solarElectricityBill: state => state.salaries.solarElectricityBill || 0,
      groupInsuranceReimbursement: state => state.salaries.groupInsuranceReimbursement || 0,
      zakatDonation: state => state.salaries.zakatDonation || 0,
    }),
    ...mapGetters({
      groupInsuranceExclusion: 'groupInsuranceExclusion',
      zakatDonationExclusion: 'zakatDonationExclusion',
      totalInvestment: 'totalInvestment',
      eligibleInvestment: 'eligibleInvestment',
      totalRebateableInvestment: 'totalRebateableInvestment',
      maxRebateableInvestment: 'maxRebateableInvestment',
      rebatePercentage: 'rebatePercentage',
      rebateMaxCap: 'rebateMaxCap',
      investmentRebate: 'investmentRebate',
      solarRebate2026: 'solarRebate2026',

      totalSalary: 'totalSalary',
      totalTds: 'totalTds',
      totalHouse: 'totalHouse',
      totalMedical: 'totalMedical',
      totalTransport: 'totalTransport',
      totalBasic: 'totalBasic',
      houseExempt: 'houseExempt',
      medicalExempt: 'medicalExempt',
      transportExempt: 'transportExempt',
      lfaExempt: 'lfaExempt',
      taxableSalary: 'taxableSalary',
      totalExempt: 'totalExempt',
    }),
  }
}
</script>

<style scoped>
.fa2026-note {
  margin: var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.fa2026-warning {
  padding: var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
}

.extras-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: var(--space-3) 0;
  font-size: var(--text-sm);
}

.empty-state {
  margin-bottom: var(--space-4);
  padding: var(--space-4);
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius);
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.table-scroll {
  overflow-x: auto;
}

.investment-list {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.investment-list th {
  padding: var(--space-2) var(--space-1);
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-strong);
}

.investment-list td {
  padding: var(--space-3) var(--space-1);
  text-align: right;
  border-bottom: 1px solid var(--border);
  font-variant-numeric: tabular-nums;
}

.investment-list th:first-child,
.investment-list td:first-child {
  text-align: left;
}

.investment-list tr:last-child td {
  border-bottom: 0;
  font-weight: 700;
}

.policy-subrow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.policy-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
}

.policy-warning {
  flex-basis: 100%;
  font-size: 0.75rem;
  color: var(--warn);
}

.formula-hint {
  display: block;
  margin-top: 2px;
  font-weight: 400;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.money {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.money-prefix {
  position: absolute;
  left: var(--space-2);
  color: var(--text-muted);
  pointer-events: none;
}

.money input {
  width: 128px;
  min-height: 40px;
  padding: 0 var(--space-2) 0 calc(var(--space-2) + 1.1em);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.money-compact input {
  width: 124px;
  min-height: 32px;
  font-size: 0.75rem;
}

.money input:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.unlimited,
.limited {
  display: inline-block;
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 600;
}

.unlimited {
  color: var(--good);
  background-color: var(--good-soft);
}

.limited {
  color: var(--text-muted);
  background-color: var(--surface-muted);
  border: 1px solid var(--border);
}
</style>
