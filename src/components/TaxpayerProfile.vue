<template>
  <div class="taxpayer-profile">
    <header class="section-header">
      <div class="section-heading-group">
        <span class="section-eyebrow">Step 01 · Assessment Setup</span>
        <h2>Taxpayer Profile</h2>
      </div>
      <span class="section-pill section-pill-accent amount">Tax-free <strong>৳{{ threshold.toLocaleString() }}</strong></span>
    </header>

    <fieldset class="category-group">
      <legend>Category</legend>
      <div class="chip-list">
        <div v-for="option in categoryOptions" :key="option.value" class="chip">
          <input
            :id="`category-${option.value}`"
            type="radio"
            name="taxpayer-category"
            :value="option.value"
            v-model="selectedCategory"
            @change="updateProfile"
          >
          <label :for="`category-${option.value}`">{{ option.label }}</label>
        </div>
      </div>
    </fieldset>

    <label class="switch-row" for="parent-of-disabled">
      <span class="switch-text">Parent / guardian of a person with disability (+BDT 50,000)</span>
      <input
        id="parent-of-disabled"
        class="switch-input"
        type="checkbox"
        role="switch"
        v-model="parentOfDisabled"
        @change="updateProfile"
      >
      <span class="switch-track" aria-hidden="true"></span>
    </label>

    <label class="switch-row" for="first-time-filer">
      <span class="switch-text">First-time return filer (BDT 1,000 minimum tax in FY 2025–26 &amp; 2026–27)</span>
      <input
        id="first-time-filer"
        class="switch-input"
        type="checkbox"
        role="switch"
        v-model="firstTimeFiler"
        @change="updateProfile"
      >
      <span class="switch-track" aria-hidden="true"></span>
    </label>

    <div class="profile-row">
      <div class="profile-field">
        <label for="profile-age">Age</label>
        <input
          id="profile-age"
          type="number"
          v-model="age"
          @input="updateProfile"
          min="18"
          max="120"
          placeholder="Age"
        >
      </div>

      <div class="profile-field">
        <label for="profile-location">Location</label>
        <select id="profile-location" v-model="selectedLocation" @change="updateProfile">
          <option value="dhaka">Dhaka City Corporation</option>
          <option value="chittagong">Chittagong City Corporation</option>
          <option value="other_city">Other City Corporations</option>
          <option value="district">District Towns</option>
        </select>
      </div>

      <div class="profile-field">
        <label for="profile-fiscal-year">Fiscal Year</label>
        <select id="profile-fiscal-year" v-model="selectedFiscalYear" @change="updateProfile">
          <option
            v-for="option in fiscalYearOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="age >= 65 && selectedCategory !== 'senior'" class="age-notice-row">
      <small class="age-notice">
        Note: You qualify for Senior Citizen category
      </small>
    </div>

    <div class="stat-row">
      <div class="threshold-info">
        <h3>Your Tax-Free Income Threshold</h3>
        <div class="threshold-amount amount">BDT {{ threshold.toLocaleString() }}</div>
        <small>Based on your category: {{ categoryName }}</small>
      </div>
      <div class="min-tax-stat">
        <span class="stat-label">Minimum Tax</span>
        <div class="readonly-value amount">BDT {{ minimumTax.toLocaleString() }}</div>
        <small>Applies only above threshold</small>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { SUPPORTED_FISCAL_YEARS, resolveDefaultFiscalYear } from '../utils/taxEngine';

export default {
  name: 'TaxpayerProfile',
  
  data() {
    return {
      age: 30,
      selectedCategory: 'general',
      parentOfDisabled: false,
      firstTimeFiler: false,
      selectedLocation: 'dhaka',
      selectedFiscalYear: resolveDefaultFiscalYear(new Date(), SUPPORTED_FISCAL_YEARS),
      categoryOptions: [
        { value: 'general', label: 'General (Male)' },
        { value: 'female', label: 'Female' },
        { value: 'senior', label: 'Senior Citizen (65+)' },
        { value: 'disabled', label: 'Disabled Person' },
        { value: 'freedom_fighter', label: 'War-wounded Freedom Fighter / July Warrior' },
        { value: 'third_gender', label: 'Third Gender' },
      ],
    };
  },

  computed: {
    ...mapGetters({
      fiscalYearOptions: 'fiscalYearOptions',
      taxFreeThreshold: 'taxFreeThreshold',
      minimumTaxAmount: 'minimumTaxAmount',
    }),
    
    threshold() {
      return this.taxFreeThreshold;
    },
    
    minimumTax() {
      return this.minimumTaxAmount;
    },
    
    categoryName() {
      const names = {
        general: 'General (Male)',
        female: 'Female',
        senior: 'Senior Citizen (65+)',
        disabled: 'Disabled Person',
        parent_disabled: 'Parent of Disabled Child',
        freedom_fighter: 'War-wounded Freedom Fighter',
        third_gender: 'Third Gender',
      };
      const name = names[this.selectedCategory] || 'General';
      return this.parentOfDisabled ? `${name} + Parent of Disabled Child` : name;
    },
  },

  mounted() {
    // Initialize from store
    const currentProfile = this.$store.state.salaries?.taxpayerProfile;
    const currentYear = this.$store.state.salaries?.currentYear;
    
    if (currentProfile) {
      this.selectedCategory = currentProfile.category || 'general';
      this.parentOfDisabled = !!currentProfile.parentOfDisabled;
      this.firstTimeFiler = !!currentProfile.firstTimeFiler;
      // Migrate legacy single-category profile to the combinable flag
      if (this.selectedCategory === 'parent_disabled') {
        this.selectedCategory = 'general';
        this.parentOfDisabled = true;
      }
      this.age = currentProfile.age || 30;
      this.selectedLocation = currentProfile.location || 'dhaka';
    }
    
    if (currentYear) {
      this.selectedFiscalYear = currentYear;
    }
    
    this.updateProfile();
  },

  methods: {
    ...mapMutations(['updateTaxpayerProfile', 'setCurrentYear']),
    
    updateProfile() {
      if (this.age >= 65 && this.selectedCategory === 'general') {
        this.selectedCategory = 'senior';
      }
      
      // Update Vuex store
      this.updateTaxpayerProfile({
        category: this.selectedCategory,
        age: parseInt(this.age),
        location: this.selectedLocation,
        parentOfDisabled: this.parentOfDisabled,
        firstTimeFiler: this.firstTimeFiler,
      });
      
      // Update fiscal year
      this.setCurrentYear(this.selectedFiscalYear);
    },
  },
};
</script>

<style scoped>
.taxpayer-profile {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.taxpayer-profile h2 {
  margin-bottom: 0;
}

.category-group {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.category-group legend,
.profile-field label,
.stat-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
  padding: 0;
  margin-bottom: var(--space-2);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.chip {
  position: relative;
}

.chip input {
  position: absolute;
  opacity: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}

.chip label {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color 0.15s, border-color 0.15s;
}

.chip input:hover + label {
  background: var(--surface-muted);
}

.chip input:checked + label {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 600;
}

.chip input:focus-visible + label {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.switch-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--surface-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
}

.switch-input {
  position: absolute;
  opacity: 0;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}

.switch-track {
  position: relative;
  flex: 0 0 44px;
  height: 26px;
  border-radius: var(--radius-pill);
  background: var(--border-strong);
  transition: background-color 0.15s;
}

.switch-track::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s;
}

.switch-input:checked ~ .switch-track {
  background: var(--accent);
}

.switch-input:checked ~ .switch-track::after {
  transform: translateX(18px);
}

.switch-input:focus-visible ~ .switch-track {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.profile-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
}

.profile-field {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-field input,
.profile-field select {
  min-height: 44px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  width: 100%;
}

.profile-field input:focus,
.profile-field select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.age-notice {
  color: var(--info);
  font-size: var(--text-sm);
}

.stat-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.threshold-info h3 {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.threshold-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.threshold-info small {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.readonly-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

@media (min-width: 600px) {
  .profile-row {
    grid-template-columns: 100px repeat(2, minmax(0, 1fr));
  }

  .stat-row {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
}
</style>