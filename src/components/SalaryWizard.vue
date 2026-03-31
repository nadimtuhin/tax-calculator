<template>
  <div class="salary-wizard">

    <!-- Progress Stepper -->
    <div class="wizard-stepper">
      <template v-for="(label, i) in stepLabels" :key="i">
        <div
          class="stepper-item"
          :class="{
            'stepper-active': currentStep === i + 1,
            'stepper-done': currentStep > i + 1,
          }"
          @click="currentStep > i + 1 && goToStep(i + 1)"
        >
          <div class="stepper-dot">
            <span v-if="currentStep > i + 1">✓</span>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div class="stepper-label">{{ label }}</div>
        </div>
        <div v-if="i < stepLabels.length - 1" class="stepper-line" :class="{ 'line-done': currentStep > i + 1 }"></div>
      </template>
    </div>

    <div class="wizard-layout">

      <!-- ─── Main Content ─── -->
      <div class="wizard-main">

        <!-- Completed step summaries -->
        <div
          v-for="n in currentStep - 1"
          :key="`summary-${n}`"
          class="step-summary-card"
          @click="goToStep(n)"
        >
          <div class="summary-left">
            <span class="summary-check">✓</span>
            <div>
              <div class="summary-title">{{ stepLabels[n - 1] }}</div>
              <div class="summary-text">{{ stepSummary(n) }}</div>
            </div>
          </div>
          <button class="summary-edit-btn" @click.stop="goToStep(n)">Edit</button>
        </div>

        <!-- ═══ STEP 1: Profile ═══ -->
        <div v-if="currentStep === 1" class="step-content">
          <h2>Who are you?</h2>

          <div class="category-grid">
            <div
              v-for="cat in availableCategories"
              :key="cat.value"
              class="category-card"
              :class="{ 'cat-selected': localProfile.category === cat.value }"
              @click="selectCategory(cat.value)"
            >
              <div class="cat-icon">{{ cat.icon }}</div>
              <div class="cat-name">{{ cat.label }}</div>
              <div class="cat-threshold">৳{{ fmt(cat.displayThreshold) }}</div>
              <div class="cat-threshold-label">tax-free</div>
              <div v-if="cat.yearOnly" class="cat-badge">{{ cat.yearOnly }}</div>
            </div>
          </div>

          <div v-if="selectedCategoryNote" class="category-note">
            ℹ {{ selectedCategoryNote }}
          </div>

          <div v-if="showSeniorNudge" class="nudge-banner">
            💡 You qualify for Senior Citizen (65+) —
            <button class="nudge-link" @click="selectCategory('senior')">switch for higher threshold</button>
          </div>

          <div v-if="localProfile.category === 'parent_disabled'" class="threshold-breakdown">
            <div class="threshold-row">
              <span>General base</span><span>৳{{ fmt(baseThreshold) }}</span>
            </div>
            <div class="threshold-row">
              <span>+ Parent of disabled child</span><span>৳50,000</span>
            </div>
            <div class="threshold-row threshold-total">
              <span>Your total threshold</span><span>৳{{ fmt(baseThreshold + 50000) }}</span>
            </div>
          </div>

          <div class="profile-fields">
            <div class="profile-field">
              <label>Age</label>
              <input
                type="number" min="18" max="120" placeholder="e.g. 35"
                :value="localProfile.age"
                @input="updateAge(+$event.target.value)"
              />
            </div>
            <div class="profile-field">
              <label>Location</label>
              <select :value="localProfile.location" @change="updateLocation($event.target.value)">
                <option value="dhaka">Dhaka City Corporation</option>
                <option value="chittagong">Chittagong City Corporation</option>
                <option value="other_city">Other City Corporations</option>
                <option value="district">District Towns</option>
              </select>
            </div>
            <div class="profile-field">
              <label>Minimum Tax</label>
              <div class="readonly-val">৳{{ fmt(minimumTaxAmount) }}</div>
            </div>
          </div>

          <div class="step-nav">
            <button class="btn-next" @click="nextStep">Next: Salary →</button>
          </div>
        </div>

        <!-- ═══ STEP 2: Salary ═══ -->
        <div v-if="currentStep === 2" class="step-content">
          <h2>Monthly Salary</h2>

          <div class="salary-mode-tabs">
            <button
              v-for="mode in salaryModes"
              :key="mode.value"
              class="mode-tab"
              :class="{ 'mode-tab-active': salaryMode === mode.value }"
              @click="setSalaryMode(mode.value)"
            >
              {{ mode.label }}
              <span class="mode-tab-hint">{{ mode.hint }}</span>
            </button>
          </div>

          <!-- Same all year -->
          <div v-if="salaryMode === 'same'">
            <div class="breakdown-grid">
              <div class="bd-field" v-for="part in breakdownParts" :key="part.key">
                <label>{{ part.label }}</label>
                <div class="taka-input">
                  <span class="taka-sign">৳</span>
                  <input
                    type="number" min="0" step="500"
                    :value="months[0].breakdown[part.key]"
                    @input="setSameYear(part.key, +$event.target.value)"
                  />
                </div>
              </div>
              <div class="bd-field">
                <label>TDS / month</label>
                <div class="taka-input">
                  <span class="taka-sign">৳</span>
                  <input
                    type="number" min="0" step="500"
                    :value="months[0].tds"
                    @input="setSameYearTds(+$event.target.value)"
                  />
                </div>
              </div>
            </div>

            <div class="salary-totals">
              Monthly ৳{{ fmt(months[0].salary) }} &nbsp;·&nbsp; Annual ৳{{ fmt(months[0].salary * 12) }}
            </div>

            <div class="month-pills-section">
              <div class="month-pills-header">
                <span>Month by month</span>
                <span class="pills-hint">Click any month to override it individually</span>
              </div>
              <div class="month-pills">
                <div
                  v-for="(month, idx) in months"
                  :key="month.id"
                  class="month-pill"
                  :class="{
                    'pill-different': isMonthDifferent(idx),
                    'pill-expanded': expandedMonthIndex === idx,
                  }"
                  @click="toggleMonthExpand(idx)"
                >
                  <div class="pill-name">{{ month.id.slice(0, 3) }}</div>
                  <div class="pill-amount">{{ fmtShort(month.salary) }}</div>
                </div>
              </div>

              <div v-if="expandedMonthIndex !== null" class="month-override">
                <div class="override-header">
                  <strong>{{ months[expandedMonthIndex].id }}</strong> — custom values
                  <button class="reset-btn" @click="resetMonth(expandedMonthIndex)">Reset to default ×</button>
                </div>
                <div class="breakdown-grid">
                  <div class="bd-field" v-for="part in breakdownParts" :key="part.key">
                    <label>{{ part.label }}</label>
                    <div class="taka-input">
                      <span class="taka-sign">৳</span>
                      <input
                        type="number" min="0" step="500"
                        :value="months[expandedMonthIndex].breakdown[part.key]"
                        @input="setOneMonthPart(expandedMonthIndex, part.key, +$event.target.value)"
                      />
                    </div>
                  </div>
                  <div class="bd-field">
                    <label>TDS</label>
                    <div class="taka-input">
                      <span class="taka-sign">৳</span>
                      <input
                        type="number" min="0" step="500"
                        :value="months[expandedMonthIndex].tds"
                        @input="setOneMonthTds(expandedMonthIndex, +$event.target.value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Partial year -->
          <div v-if="salaryMode === 'partial'">
            <p class="mode-hint-text">Toggle off months you did <strong>not</strong> work:</p>
            <div class="month-pills">
              <div
                v-for="(month, idx) in months"
                :key="month.id"
                class="month-pill"
                :class="{ 'pill-inactive': !activeMonths[idx] }"
                @click="toggleActiveMonth(idx)"
              >
                <div class="pill-name">{{ month.id.slice(0, 3) }}</div>
                <div class="pill-amount">{{ activeMonths[idx] ? fmtShort(month.salary) : '—' }}</div>
              </div>
            </div>
            <div class="partial-info">
              Active: {{ activeMonths.filter(Boolean).length }} / 12 months
            </div>
            <div class="breakdown-grid">
              <div class="bd-field" v-for="part in breakdownParts" :key="part.key">
                <label>{{ part.label }}</label>
                <div class="taka-input">
                  <span class="taka-sign">৳</span>
                  <input
                    type="number" min="0" step="500"
                    :value="partialBreakdown[part.key]"
                    @input="setPartialPart(part.key, +$event.target.value)"
                  />
                </div>
              </div>
              <div class="bd-field">
                <label>TDS / month</label>
                <div class="taka-input">
                  <span class="taka-sign">৳</span>
                  <input
                    type="number" min="0" step="500"
                    :value="partialTds"
                    @input="setPartialTds(+$event.target.value)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Salary periods (increments / job changes) -->
          <div v-if="salaryMode === 'periods'">
            <div
              v-for="(period, pi) in periods"
              :key="pi"
              class="period-card"
            >
              <div class="period-header" @click="togglePeriod(pi)">
                <span class="period-range">
                  {{ monthNames[period.from].slice(0, 3) }} – {{ monthNames[period.to].slice(0, 3) }}
                </span>
                <span class="period-amount">৳{{ fmtShort(periodMonthlyTotal(period)) }}/mo</span>
                <span class="period-chevron">{{ expandedPeriodIndex === pi ? '▲' : '▼' }}</span>
                <button
                  v-if="periods.length > 1"
                  class="remove-period-btn"
                  @click.stop="removePeriod(pi)"
                >×</button>
              </div>

              <div v-if="expandedPeriodIndex === pi" class="period-detail">
                <div class="period-range-row">
                  <div class="range-field">
                    <label>From</label>
                    <select :value="period.from" @change="setPeriodFrom(pi, +$event.target.value)">
                      <option v-for="(name, mi) in monthNames" :key="mi" :value="mi">{{ name }}</option>
                    </select>
                  </div>
                  <div class="range-field">
                    <label>To</label>
                    <select :value="period.to" @change="setPeriodTo(pi, +$event.target.value)">
                      <option v-for="(name, mi) in monthNames" :key="mi" :value="mi">{{ name }}</option>
                    </select>
                  </div>
                </div>
                <div class="breakdown-grid">
                  <div class="bd-field" v-for="part in breakdownParts" :key="part.key">
                    <label>{{ part.label }}</label>
                    <div class="taka-input">
                      <span class="taka-sign">৳</span>
                      <input
                        type="number" min="0" step="500"
                        :value="period.breakdown[part.key]"
                        @input="setPeriodPart(pi, part.key, +$event.target.value)"
                      />
                    </div>
                  </div>
                  <div class="bd-field">
                    <label>TDS / month</label>
                    <div class="taka-input">
                      <span class="taka-sign">৳</span>
                      <input
                        type="number" min="0" step="500"
                        :value="period.tds"
                        @input="setPeriodTds(pi, +$event.target.value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button class="add-period-btn" @click="addPeriod">+ Add another salary period</button>
          </div>

          <div class="step-nav">
            <button class="btn-back" @click="prevStep">← Back</button>
            <button class="btn-next" @click="nextStep">Next: Bonuses →</button>
          </div>
        </div>

        <!-- ═══ STEP 3: Bonuses ═══ -->
        <div v-if="currentStep === 3" class="step-content">
          <h2>Extra Income</h2>

          <div class="extra-income-list">
            <div class="extra-item">
              <label>Festival / Performance Bonus</label>
              <div class="taka-input">
                <span class="taka-sign">৳</span>
                <input
                  type="number" min="0" step="1000"
                  :value="bonus"
                  @input="$store.commit('changeBonus', $event.target.value)"
                />
              </div>
            </div>

            <div class="extra-item" v-if="showBonus2">
              <label>
                Second Bonus
                <button class="inline-remove-btn" @click="removeBonus2">×</button>
              </label>
              <div class="taka-input">
                <span class="taka-sign">৳</span>
                <input
                  type="number" min="0" step="1000"
                  :value="bonus2"
                  @input="$store.commit('changeBonus2', $event.target.value)"
                />
              </div>
            </div>

            <div v-if="!showBonus2" class="add-link-row">
              <button class="add-link-btn" @click="$store.commit('setShowBonus2', true)">
                + Add second bonus
              </button>
            </div>

            <div class="extra-item">
              <label>Other Lump Sum Income</label>
              <div class="extra-hint">e.g. freelance, rental, consultancy</div>
              <div class="taka-input">
                <span class="taka-sign">৳</span>
                <input
                  type="number" min="0" step="1000"
                  :value="others"
                  @input="$store.commit('changeOthers', $event.target.value)"
                />
              </div>
            </div>
          </div>

          <div class="step-nav">
            <button class="btn-back" @click="prevStep">← Back</button>
            <button class="btn-next" @click="nextStep">Next: Investments →</button>
          </div>
        </div>

        <!-- ═══ STEP 4: Investments ═══ -->
        <div v-if="currentStep === 4" class="step-content">
          <h2>Tax Saving Investments</h2>
          <p class="step-hint">15% rebate on qualifying investment amount</p>

          <div class="investment-list">
            <div class="inv-row" v-for="(inv, idx) in investments" :key="idx">
              <div class="inv-name">{{ inv.name }}</div>
              <div class="taka-input">
                <span class="taka-sign">৳</span>
                <input
                  type="number" min="0" step="1000"
                  :value="inv.amount"
                  @input="$store.commit('changeInvestment', { index: idx, value: $event.target.value })"
                />
              </div>
              <div class="inv-max">
                <span v-if="inv.maximum >= 99999999">—</span>
                <span v-else>Max ৳{{ fmt(inv.maximum) }}</span>
              </div>
            </div>
          </div>

          <div class="inv-summary" v-if="totalInvestment > 0">
            <div class="inv-summary-row">
              <span>Total Investment</span>
              <span>৳{{ fmt(totalInvestment) }}</span>
            </div>
            <div class="inv-summary-row inv-rebate-row">
              <span>Tax Rebate (15%)</span>
              <strong class="text-green">-৳{{ fmt(investmentRebate) }}</strong>
            </div>
          </div>

          <div class="step-nav">
            <button class="btn-back" @click="prevStep">← Back</button>
            <button class="btn-done" @click="currentStep = 5">Done ✓</button>
          </div>
        </div>

        <!-- ═══ STEP 5: Complete ═══ -->
        <div v-if="currentStep === 5" class="step-content">
          <div class="done-banner">✓ All done — your tax summary is below</div>
          <div class="done-summaries">
            <div
              class="done-card"
              v-for="n in 4"
              :key="n"
              @click="goToStep(n)"
            >
              <div class="done-card-step">{{ stepLabels[n - 1] }}</div>
              <div class="done-card-text">{{ stepSummary(n) }}</div>
              <span class="done-card-edit">Edit →</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ─── Live Preview Sidebar ─── -->
      <div class="wizard-preview">
        <div class="preview-heading">Live Preview</div>

        <div v-if="totalSalary === 0" class="preview-empty">
          Fill in your salary details to see your tax estimate.
        </div>

        <template v-else>
          <div class="preview-line">
            <span class="preview-lbl">Annual Income</span>
            <span class="preview-val">৳{{ fmt(totalSalary) }}</span>
          </div>
          <div class="preview-line">
            <span class="preview-lbl">Tax Exempt</span>
            <span class="preview-val text-green">-৳{{ fmt(totalExempt) }}</span>
          </div>
          <div class="preview-line preview-divider">
            <span class="preview-lbl">Taxable Income</span>
            <span class="preview-val">৳{{ fmt(taxableSalary) }}</span>
          </div>
          <div class="preview-line">
            <span class="preview-lbl">Gross Tax</span>
            <span class="preview-val">৳{{ fmt(grossTax) }}</span>
          </div>
          <div class="preview-line" v-if="investmentRebate > 0">
            <span class="preview-lbl">Investment Rebate</span>
            <span class="preview-val text-green">-৳{{ fmt(investmentRebate) }}</span>
          </div>
          <div class="preview-line" v-if="totalTds > 0">
            <span class="preview-lbl">TDS Paid</span>
            <span class="preview-val text-green">-৳{{ fmt(totalTds) }}</span>
          </div>
          <div class="preview-payable">
            <span>{{ payableTax > 0 ? 'You Owe' : 'Refund Due' }}</span>
            <span :class="payableTax > 0 ? 'text-red' : 'text-green'">
              ৳{{ fmt(Math.abs(payableTax)) }}
            </span>
          </div>

          <div v-if="currentStep < 4 && grossTax > 0 && investmentRebate === 0" class="preview-nudge">
            💡 Add investments in step 4 to reduce this
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script>
/* eslint-disable */
import { mapState, mapGetters } from 'vuex';

const MONTH_NAMES = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];

const CATEGORIES = [
  { value: 'general',         label: 'General (Male)',             icon: '👤', note: null,        yearOnly: null },
  { value: 'female',          label: 'Female',                     icon: '👩', note: null,        yearOnly: null },
  { value: 'senior',          label: 'Senior Citizen (65+)',       icon: '👴', note: null,        yearOnly: null },
  { value: 'disabled',        label: 'Disabled Person',            icon: '♿', note: 'Requires disability certificate from relevant government authority.', yearOnly: null },
  { value: 'parent_disabled', label: 'Parent of Disabled Child',   icon: '👶', note: 'Requires child\'s disability certificate.', yearOnly: null },
  { value: 'freedom_fighter', label: 'Freedom Fighter',            icon: '🎖', note: 'Highest threshold. Requires Muktiযোদ্ধা certificate.', yearOnly: null },
  { value: 'third_gender',    label: 'Third Gender',               icon: '🏳', note: null,        yearOnly: null },
  { value: 'july_warrior',    label: 'July Warrior',               icon: '⭐', note: 'New FY 2026-27. Recognises participants of the July 2024 uprising. Requires supporting documentation.', yearOnly: '2026-27' },
];

const THRESHOLDS = {
  '2025-26': { general: 375000, female: 425000, senior: 425000, disabled: 500000, parent_disabled: 425000, freedom_fighter: 525000, third_gender: 500000 },
  '2026-27': { general: 375000, female: 425000, senior: 425000, disabled: 500000, parent_disabled: 425000, freedom_fighter: 525000, third_gender: 500000, july_warrior: 525000 },
};

function emptyBreakdown() {
  return { basic: 0, house: 0, medical: 0, transport: 0, others: 0 };
}

export default {
  name: 'SalaryWizard',

  data() {
    return {
      currentStep: 1,
      stepLabels: ['Profile', 'Salary', 'Bonuses', 'Investments'],

      localProfile: { category: 'general', age: null, location: 'dhaka' },

      salaryMode: 'same',
      salaryModes: [
        { value: 'same',    label: 'Same all year',    hint: 'most common' },
        { value: 'partial', label: 'Partial year',     hint: 'didn\'t work all 12 months' },
        { value: 'periods', label: 'Salary changed',   hint: 'increments or job changes' },
      ],

      breakdownParts: [
        { key: 'basic',     label: 'Basic' },
        { key: 'house',     label: 'House' },
        { key: 'medical',   label: 'Medical' },
        { key: 'transport', label: 'Transport' },
        { key: 'others',    label: 'Others' },
      ],

      // Same mode — month pill expansion
      expandedMonthIndex: null,

      // Partial mode
      activeMonths: Array(12).fill(true),
      partialBreakdown: emptyBreakdown(),
      partialTds: 0,

      // Periods mode
      periods: [{ from: 0, to: 11, breakdown: emptyBreakdown(), tds: 0 }],
      expandedPeriodIndex: 0,

      monthNames: MONTH_NAMES,
    };
  },

  created() {
    const profile = this.$store.state.salaries.taxpayerProfile;
    this.localProfile = { ...profile };

    const firstMonth = this.$store.state.salaries.months[0];
    if (firstMonth.salary > 0) {
      this.partialBreakdown = { ...firstMonth.breakdown };
      this.partialTds = firstMonth.tds;
      this.periods = [{ from: 0, to: 11, breakdown: { ...firstMonth.breakdown }, tds: firstMonth.tds }];
    }
  },

  computed: {
    ...mapState({
      months:      state => state.salaries.months,
      bonus:       state => state.salaries.bonus,
      bonus2:      state => state.salaries.bonus2,
      showBonus2:  state => state.salaries.showBonus2,
      others:      state => state.salaries.others,
      investments: state => state.salaries.investments,
    }),
    ...mapGetters([
      'totalSalary', 'totalTds', 'totalExempt', 'taxableSalary', 'totalInvestment',
      'calculatedTax2025', 'investmentRebate2025', 'payableTax2025', 'minimumTaxAmount2025',
      'calculatedTax2026', 'investmentRebate2026', 'payableTax2026', 'minimumTaxAmount2026',
    ]),

    currentYear() {
      return this.$store.state.salaries.currentYear;
    },

    availableCategories() {
      const thresholds = THRESHOLDS[this.currentYear] || THRESHOLDS['2025-26'];
      return CATEGORIES
        .filter(c => !c.yearOnly || c.yearOnly === this.currentYear)
        .map(c => ({ ...c, displayThreshold: thresholds[c.value] || thresholds.general }));
    },

    selectedCategoryNote() {
      return CATEGORIES.find(c => c.value === this.localProfile.category)?.note || null;
    },

    showSeniorNudge() {
      return this.localProfile.age >= 65 && this.localProfile.category !== 'senior';
    },

    baseThreshold() {
      const t = THRESHOLDS[this.currentYear] || THRESHOLDS['2025-26'];
      return t.general;
    },

    minimumTaxAmount() {
      return this.currentYear === '2026-27' ? this.minimumTaxAmount2026 : this.minimumTaxAmount2025;
    },

    grossTax() {
      return this.currentYear === '2026-27' ? this.calculatedTax2026 : this.calculatedTax2025;
    },

    investmentRebate() {
      return this.currentYear === '2026-27' ? this.investmentRebate2026 : this.investmentRebate2025;
    },

    payableTax() {
      return this.currentYear === '2026-27' ? this.payableTax2026 : this.payableTax2025;
    },

    firstActiveMonthIndex() {
      const idx = this.activeMonths.findIndex(Boolean);
      return idx >= 0 ? idx : 0;
    },
  },

  methods: {
    // ── Navigation ──
    goToStep(n) { this.currentStep = n; },
    nextStep()  { this.currentStep++; },
    prevStep()  { this.currentStep--; },

    // ── Profile ──
    selectCategory(value) {
      this.localProfile = { ...this.localProfile, category: value };
      this.commitProfile();
    },
    updateAge(value) {
      this.localProfile = { ...this.localProfile, age: value };
      this.commitProfile();
    },
    updateLocation(value) {
      this.localProfile = { ...this.localProfile, location: value };
      this.commitProfile();
    },
    commitProfile() {
      this.$store.commit('updateTaxpayerProfile', { ...this.localProfile });
    },

    // ── Step summary text ──
    stepSummary(n) {
      if (n === 1) {
        const cat = CATEGORIES.find(c => c.value === this.localProfile.category);
        const loc = { dhaka: 'Dhaka', chittagong: 'Chittagong', other_city: 'Other City', district: 'District' }[this.localProfile.location] || '';
        return `${cat?.label || 'General'} · ${loc}`;
      }
      if (n === 2) {
        if (this.salaryMode === 'partial') {
          const active = this.activeMonths.filter(Boolean).length;
          return `৳${this.fmt(this.months[this.firstActiveMonthIndex].salary)}/mo · ${active} months`;
        }
        if (this.salaryMode === 'periods') {
          return `${this.periods.length} salary period${this.periods.length > 1 ? 's' : ''}`;
        }
        const overrides = this.months.filter((_, i) => this.isMonthDifferent(i)).length;
        let s = `৳${this.fmt(this.months[0].salary)}/mo`;
        if (overrides > 0) s += ` · ${overrides} override${overrides > 1 ? 's' : ''}`;
        return s;
      }
      if (n === 3) {
        const total = +this.bonus + +this.bonus2 + +this.others;
        return total > 0 ? `৳${this.fmt(total)} extra income` : 'No extra income';
      }
      if (n === 4) {
        return this.totalInvestment > 0
          ? `৳${this.fmt(this.totalInvestment)} · Rebate ৳${this.fmt(this.investmentRebate)}`
          : 'No investments';
      }
      return '';
    },

    // ── Salary: same all year ──
    setSameYear(part, value) {
      this.$store.commit('changeParts', { index: 0, part, value });
    },
    setSameYearTds(value) {
      this.$store.commit('changeSubsequentTds', { index: 0, value });
    },

    // ── Month pill overrides ──
    toggleMonthExpand(idx) {
      this.expandedMonthIndex = this.expandedMonthIndex === idx ? null : idx;
    },
    isMonthDifferent(idx) {
      if (idx === 0) return false;
      const ref = this.months[0];
      const cur = this.months[idx];
      return cur.tds !== ref.tds || JSON.stringify(cur.breakdown) !== JSON.stringify(ref.breakdown);
    },
    setOneMonthPart(idx, part, value) {
      this.$store.commit('setMonthBreakdownPart', { index: idx, part, value });
    },
    setOneMonthTds(idx, value) {
      this.$store.commit('setMonthTds', { index: idx, value });
    },
    resetMonth(idx) {
      const ref = this.months[0];
      ['basic', 'house', 'medical', 'transport', 'others'].forEach(part => {
        this.$store.commit('setMonthBreakdownPart', { index: idx, part, value: ref.breakdown[part] });
      });
      this.$store.commit('setMonthTds', { index: idx, value: ref.tds });
      this.expandedMonthIndex = null;
    },

    // ── Salary mode switch ──
    setSalaryMode(mode) {
      this.salaryMode = mode;
      if (mode === 'partial') {
        const ref = this.months[this.firstActiveMonthIndex];
        this.partialBreakdown = { ...ref.breakdown };
        this.partialTds = ref.tds;
        this.rebuildPartial();
      } else if (mode === 'periods') {
        this.periods = [{ from: 0, to: 11, breakdown: { ...this.months[0].breakdown }, tds: this.months[0].tds }];
        this.expandedPeriodIndex = 0;
        this.rebuildPeriods();
      }
    },

    // ── Partial year ──
    toggleActiveMonth(idx) {
      this.activeMonths = this.activeMonths.map((v, i) => i === idx ? !v : v);
      this.rebuildPartial();
    },
    setPartialPart(part, value) {
      this.partialBreakdown = { ...this.partialBreakdown, [part]: value };
      this.rebuildPartial();
    },
    setPartialTds(value) {
      this.partialTds = value;
      this.rebuildPartial();
    },
    rebuildPartial() {
      const salary = Object.values(this.partialBreakdown).reduce((a, b) => a + +b, 0);
      const newMonths = this.months.map((m, idx) => ({
        ...m,
        salary:    this.activeMonths[idx] ? salary : 0,
        tds:       this.activeMonths[idx] ? +this.partialTds : 0,
        breakdown: this.activeMonths[idx] ? { ...this.partialBreakdown } : emptyBreakdown(),
      }));
      this.$store.commit('loadSalaries', newMonths);
    },

    // ── Salary periods ──
    togglePeriod(pi) {
      this.expandedPeriodIndex = this.expandedPeriodIndex === pi ? null : pi;
    },
    addPeriod() {
      const last = this.periods[this.periods.length - 1];
      const newFrom = Math.min(last.to + 1, 11);
      if (last.to < 11) {
        this.periods.splice(this.periods.length - 1, 1, { ...last, to: newFrom - 1 });
      }
      this.periods.push({ from: newFrom, to: 11, breakdown: { ...last.breakdown }, tds: last.tds });
      this.expandedPeriodIndex = this.periods.length - 1;
      this.rebuildPeriods();
    },
    removePeriod(pi) {
      this.periods.splice(pi, 1);
      if (this.periods.length > 0) {
        this.periods.splice(0, 1, { ...this.periods[0], from: 0 });
        const last = this.periods.length - 1;
        this.periods.splice(last, 1, { ...this.periods[last], to: 11 });
      }
      this.expandedPeriodIndex = null;
      this.rebuildPeriods();
    },
    setPeriodFrom(pi, value) {
      this.periods.splice(pi, 1, { ...this.periods[pi], from: value });
      this.rebuildPeriods();
    },
    setPeriodTo(pi, value) {
      this.periods.splice(pi, 1, { ...this.periods[pi], to: value });
      this.rebuildPeriods();
    },
    setPeriodPart(pi, part, value) {
      const bd = { ...this.periods[pi].breakdown, [part]: value };
      this.periods.splice(pi, 1, { ...this.periods[pi], breakdown: bd });
      this.rebuildPeriods();
    },
    setPeriodTds(pi, value) {
      this.periods.splice(pi, 1, { ...this.periods[pi], tds: value });
      this.rebuildPeriods();
    },
    rebuildPeriods() {
      const newMonths = this.months.map((m, idx) => {
        const period = this.periods.find(p => idx >= p.from && idx <= p.to);
        if (period) {
          const salary = Object.values(period.breakdown).reduce((a, b) => a + +b, 0);
          return { id: m.id, salary, tds: +period.tds, breakdown: { ...period.breakdown } };
        }
        return { id: m.id, salary: 0, tds: 0, breakdown: emptyBreakdown() };
      });
      this.$store.commit('loadSalaries', newMonths);
    },
    periodMonthlyTotal(period) {
      return Object.values(period.breakdown).reduce((a, b) => a + +b, 0);
    },

    // ── Bonuses ──
    removeBonus2() {
      this.$store.commit('setShowBonus2', false);
      this.$store.commit('changeBonus2', 0);
    },

    // ── Formatting ──
    fmt(n) {
      if (!n && n !== 0) return '0';
      n = Math.round(+n);
      if (n >= 100000) return (n / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L';
      if (n >= 1000)   return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k';
      return n.toString();
    },
    fmtShort(n) {
      if (!n) return '0';
      n = Math.round(+n);
      if (n >= 100000) return (n / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L';
      if (n >= 1000)   return (n / 1000).toFixed(2).replace(/\.?0+$/, '') + 'k';
      return n.toString();
    },
  },
};
</script>

<style scoped>
/* ── Wizard layout ── */
.salary-wizard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wizard-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}

@media (min-width: 900px) {
  .salary-wizard {
    gap: 24px;
    max-width: 900px;
  }
  .wizard-layout {
    flex-direction: row;
    gap: 24px;
    align-items: flex-start;
  }
}

.wizard-main {
  flex: 1;
  min-width: 0;
}

/* ── Stepper ── */
.wizard-stepper {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 4px;
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: default;
}

.stepper-done {
  cursor: pointer;
}

.stepper-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ced4da;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  transition: all 0.2s;
}

.stepper-active .stepper-dot {
  border-color: #006A4E;
  background: #006A4E;
  color: white;
}

.stepper-done .stepper-dot {
  border-color: #006A4E;
  background: #e8f5f0;
  color: #006A4E;
}

.stepper-label {
  font-size: 0.7rem;
  color: #6c757d;
  white-space: nowrap;
  display: none;
}

@media (min-width: 480px) {
  .stepper-label {
    display: block;
    font-size: 0.75rem;
  }
}

.stepper-active .stepper-label {
  color: #006A4E;
  font-weight: 600;
}

.stepper-done .stepper-label {
  color: #006A4E;
}

.stepper-line {
  flex: 1;
  height: 2px;
  background: #e9ecef;
  margin: 0 6px;
  margin-bottom: 20px;
}

.stepper-line.line-done {
  background: #006A4E;
}

/* ── Completed step summary cards ── */
.step-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8faf9;
  border: 1px solid #d0e8df;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.step-summary-card:hover {
  border-color: #006A4E;
}

.summary-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.summary-check {
  color: #006A4E;
  font-weight: bold;
  font-size: 1rem;
  margin-top: 2px;
}

.summary-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #2c3e50;
}

.summary-text {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 2px;
}

.summary-edit-btn {
  background: none;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.8rem;
  color: #6c757d;
  cursor: pointer;
  flex-shrink: 0;
}

.summary-edit-btn:hover {
  border-color: #006A4E;
  color: #006A4E;
}

/* ── Step content ── */
.step-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #e9ecef;
}

.step-content h2 {
  margin: 0 0 20px 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.step-hint {
  color: #6c757d;
  font-size: 0.875rem;
  margin: -12px 0 20px 0;
}

/* ── Category grid ── */
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
}

.category-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.category-card:hover {
  border-color: #006A4E;
  background: #f8faf9;
}

.cat-selected {
  border-color: #006A4E !important;
  background: #e8f5f0 !important;
}

.cat-icon {
  font-size: 1.75rem;
  margin-bottom: 6px;
}

.cat-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  line-height: 1.2;
}

.cat-threshold {
  font-size: 0.875rem;
  font-weight: 700;
  color: #006A4E;
}

.cat-threshold-label {
  font-size: 0.65rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.cat-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #006A4E;
  color: white;
  font-size: 0.6rem;
  padding: 1px 5px;
  border-radius: 3px;
  font-weight: 600;
}

/* ── Category notes & nudges ── */
.category-note {
  background: #f0f4ff;
  border-left: 3px solid #4a6fa5;
  border-radius: 0 6px 6px 0;
  padding: 10px 14px;
  font-size: 0.8rem;
  color: #4a6fa5;
  margin-bottom: 16px;
}

.nudge-banner {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 0.85rem;
  color: #8a6914;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.nudge-link {
  background: none;
  border: none;
  color: #006A4E;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
}

.threshold-breakdown {
  background: #f8faf9;
  border: 1px solid #d0e8df;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.threshold-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  color: #555;
}

.threshold-total {
  border-top: 1px solid #d0e8df;
  margin-top: 4px;
  padding-top: 6px;
  font-weight: 700;
  color: #006A4E;
}

/* ── Profile fields ── */
.profile-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.profile-field input,
.profile-field select {
  width: 160px;
}

.readonly-val {
  font-size: 1rem;
  font-weight: 600;
  color: #006A4E;
  padding: 6px 0;
}

/* ── Salary mode tabs ── */
.salary-mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.mode-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 10px 16px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  transition: all 0.15s;
  line-height: 1.2;
}

.mode-tab:hover {
  border-color: #006A4E;
  color: #006A4E;
}

.mode-tab-active {
  border-color: #006A4E;
  background: #e8f5f0;
  color: #006A4E;
}

.mode-tab-hint {
  font-size: 0.7rem;
  font-weight: 400;
  color: #6c757d;
  margin-top: 2px;
}

.mode-tab-active .mode-tab-hint {
  color: #006A4E;
  opacity: 0.75;
}

/* ── Breakdown grid ── */
.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

@media (min-width: 600px) {
  .breakdown-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

.bd-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bd-field label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.taka-input {
  display: flex;
  align-items: center;
  border: 1px solid #ced4da;
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.taka-input:focus-within {
  border-color: #006A4E;
  box-shadow: 0 0 0 0.2rem rgba(0, 106, 78, 0.2);
}

.taka-sign {
  padding: 6px 8px;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 0.875rem;
  border-right: 1px solid #ced4da;
  flex-shrink: 0;
}

.taka-input input {
  border: none;
  border-radius: 0;
  padding: 6px 8px;
  width: 100%;
  font-size: 0.875rem;
}

.taka-input input:focus {
  outline: none;
  box-shadow: none;
}

.salary-totals {
  font-size: 0.875rem;
  color: #006A4E;
  font-weight: 600;
  margin-bottom: 20px;
  padding: 8px 12px;
  background: #e8f5f0;
  border-radius: 6px;
  display: inline-block;
}

/* ── Month pills ── */
.month-pills-section {
  margin-top: 8px;
}

.month-pills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.pills-hint {
  font-weight: 400;
  font-size: 0.8rem;
  color: #6c757d;
}

.month-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.month-pill {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 6px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 52px;
}

.month-pill:hover {
  border-color: #006A4E;
  background: #f8faf9;
}

.pill-different {
  border-color: #f59e0b;
  background: #fffbeb;
}

.pill-expanded {
  border-color: #006A4E;
  background: #e8f5f0;
}

.pill-inactive {
  opacity: 0.35;
  background: #f8f9fa;
}

.pill-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
}

.pill-amount {
  font-size: 0.8rem;
  color: #2c3e50;
  margin-top: 2px;
}

/* ── Month override panel ── */
.month-override {
  border: 1px solid #006A4E;
  border-radius: 8px;
  padding: 16px;
  margin-top: 4px;
  background: #f8faf9;
}

.override-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-size: 0.875rem;
  color: #2c3e50;
}

.reset-btn {
  background: none;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: 0.75rem;
  color: #6c757d;
  cursor: pointer;
}

.reset-btn:hover {
  border-color: #dc3545;
  color: #dc3545;
}

/* ── Partial year ── */
.mode-hint-text {
  color: #6c757d;
  font-size: 0.875rem;
  margin-bottom: 12px;
}

.partial-info {
  font-size: 0.8rem;
  color: #006A4E;
  font-weight: 600;
  margin-bottom: 16px;
}

/* ── Salary periods ── */
.period-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.period-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: #f8f9fa;
  transition: background 0.15s;
}

.period-header:hover {
  background: #e8f5f0;
}

.period-range {
  font-weight: 700;
  font-size: 0.9rem;
  color: #2c3e50;
  flex: 1;
}

.period-amount {
  font-size: 0.875rem;
  color: #006A4E;
  font-weight: 600;
}

.period-chevron {
  font-size: 0.75rem;
  color: #6c757d;
}

.remove-period-btn {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 14px;
  color: #6c757d;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-period-btn:hover {
  border-color: #dc3545;
  color: #dc3545;
}

.period-detail {
  padding: 16px;
  border-top: 1px solid #dee2e6;
}

.period-range-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.range-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
}

.add-period-btn {
  background: white;
  border: 1px dashed #006A4E;
  border-radius: 6px;
  padding: 10px 16px;
  font-size: 0.875rem;
  color: #006A4E;
  cursor: pointer;
  width: 100%;
  margin-top: 4px;
  transition: background 0.15s;
}

.add-period-btn:hover {
  background: #e8f5f0;
}

/* ── Extra income (step 3) ── */
.extra-income-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.extra-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 320px;
}

.extra-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.extra-hint {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: -4px;
}

.inline-remove-btn {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  line-height: 1;
}

.inline-remove-btn:hover {
  border-color: #dc3545;
  color: #dc3545;
}

.add-link-row {
  margin-top: -8px;
}

.add-link-btn {
  background: none;
  border: none;
  color: #006A4E;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}

/* ── Investments (step 4) ── */
.investment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.inv-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.inv-name {
  width: 200px;
  font-size: 0.875rem;
  color: #2c3e50;
  flex-shrink: 0;
}

.inv-row .taka-input {
  width: 180px;
  flex-shrink: 0;
}

.inv-max {
  font-size: 0.8rem;
  color: #6c757d;
}

.inv-summary {
  background: #f8faf9;
  border: 1px solid #d0e8df;
  border-radius: 6px;
  padding: 12px 16px;
}

.inv-summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  padding: 3px 0;
  color: #555;
}

.inv-rebate-row {
  border-top: 1px solid #d0e8df;
  margin-top: 4px;
  padding-top: 8px;
  font-weight: 600;
}

/* ── Done screen ── */
.done-banner {
  background: #e8f5f0;
  border: 1px solid #006A4E;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #006A4E;
  margin-bottom: 20px;
}

.done-summaries {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 600px) {
  .done-summaries {
    grid-template-columns: repeat(2, 1fr);
  }
}

.done-card {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.15s;
  position: relative;
}

.done-card:hover {
  border-color: #006A4E;
  background: #f8faf9;
}

.done-card-step {
  font-size: 0.75rem;
  font-weight: 700;
  color: #006A4E;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.done-card-text {
  font-size: 0.875rem;
  color: #2c3e50;
}

.done-card-edit {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 0.75rem;
  color: #6c757d;
}

/* ── Navigation buttons ── */
.step-nav {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.btn-back {
  background: white;
  border: 1px solid #ced4da;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.875rem;
  color: #6c757d;
  cursor: pointer;
}

.btn-back:hover {
  border-color: #006A4E;
  color: #006A4E;
}

.btn-next,
.btn-done {
  background: #006A4E;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: background 0.15s;
  min-height: 44px;
}

.btn-next:hover,
.btn-done:hover {
  background: #005a3f;
}

/* ── Live Preview ── */
.wizard-preview {
  width: 100%;
  background: #f8faf9;
  border: 1px solid #d0e8df;
  border-radius: 8px;
  padding: 16px;
  order: -1;
}

@media (min-width: 900px) {
  .wizard-preview {
    width: 264px;
    flex-shrink: 0;
    padding: 20px;
    position: sticky;
    top: 20px;
    order: 0;
  }
}

.preview-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6c757d;
  margin-bottom: 16px;
}

.preview-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 0.85rem;
}

.preview-lbl {
  color: #555;
}

.preview-val {
  font-weight: 600;
  color: #2c3e50;
}

.preview-divider {
  border-top: 1px solid #d0e8df;
  margin-top: 4px;
  padding-top: 10px;
  margin-bottom: 4px;
}

.preview-payable {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 2px solid #d0e8df;
  font-weight: 700;
  font-size: 1rem;
}

.preview-nudge {
  margin-top: 14px;
  padding: 10px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 6px;
  font-size: 0.78rem;
  color: #8a6914;
  line-height: 1.4;
}

.preview-empty {
  color: #6c757d;
  font-size: 0.85rem;
  line-height: 1.5;
}

/* ── Colors ── */
.text-green { color: #006A4E; }
.text-red   { color: #dc3545; }

/* ── Salary mode tabs: column on mobile, row on tablet+ ── */
.salary-mode-tabs {
  flex-direction: column;
}

@media (min-width: 600px) {
  .salary-mode-tabs {
    flex-direction: row;
  }
}

/* ── Investments: tighter on mobile ── */
.inv-name {
  width: 140px;
}

@media (min-width: 600px) {
  .inv-name {
    width: 200px;
  }
}

@media (min-width: 600px) {
  .profile-fields {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 20px;
  }
}
</style>
