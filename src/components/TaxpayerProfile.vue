<template>
  <div class="taxpayer-profile">
    <h2>Taxpayer Profile</h2>
    
    <div class="profile-row">
      <div class="profile-field">
        <label>Category</label>
        <select v-model="selectedCategory" @change="updateProfile">
          <option value="general">General (Male)</option>
          <option value="female">Female</option>
          <option value="senior">Senior Citizen (65+)</option>
          <option value="disabled">Disabled Person</option>
          <option value="parent_disabled">Parent of Disabled Child</option>
          <option value="freedom_fighter">War-wounded Freedom Fighter</option>
          <option value="third_gender">Third Gender</option>
        </select>
      </div>
      
      <div class="profile-field">
        <label>Age</label>
        <input 
          type="number" 
          v-model="age"
          @input="updateProfile"
          min="18"
          max="120"
          placeholder="Age"
        >
      </div>
      
      <div class="profile-field">
        <label>Location</label>
        <select v-model="selectedLocation" @change="updateProfile">
          <option value="dhaka">Dhaka City Corporation</option>
          <option value="chittagong">Chittagong City Corporation</option>
          <option value="other_city">Other City Corporations</option>
          <option value="district">District Towns</option>
        </select>
      </div>
      
      <div class="profile-field">
        <label>Fiscal Year</label>
        <select v-model="selectedFiscalYear" @change="updateProfile">
          <option 
            v-for="option in fiscalYearOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <div class="profile-field">
        <label>Minimum Tax</label>
        <div class="readonly-value">BDT {{ minimumTax.toLocaleString() }}</div>
      </div>
    </div>
    
    <div v-if="age >= 65 && selectedCategory !== 'senior'" class="age-notice-row">
      <small class="age-notice">
        Note: You qualify for Senior Citizen category
      </small>
    </div>

    <div class="threshold-info">
      <h3>Your Tax-Free Income Threshold</h3>
      <div class="threshold-amount">BDT {{ threshold.toLocaleString() }}</div>
      <small>Based on your category: {{ categoryName }}</small>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'TaxpayerProfile',
  
  data() {
    return {
      age: 30,
      selectedCategory: 'general',
      selectedLocation: 'dhaka',
      selectedFiscalYear: '2024-25',
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
      return names[this.selectedCategory] || 'General';
    },
  },

  mounted() {
    // Initialize from store
    const currentProfile = this.$store.state.salaries?.taxpayerProfile;
    const currentYear = this.$store.state.salaries?.currentYear;
    
    if (currentProfile) {
      this.selectedCategory = currentProfile.category || 'general';
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
      });
      
      // Update fiscal year
      this.setCurrentYear(this.selectedFiscalYear);
    },
  },
};
</script>

<style scoped>
.taxpayer-profile {
  margin-bottom: 20px;
}

.profile-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  align-items: flex-end;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.profile-field:last-child {
  flex: 0 0 150px;
}

.profile-field label {
  font-weight: 600;
  color: #495057;
  font-size: 14px;
}

.profile-field input,
.profile-field select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.profile-field input:focus,
.profile-field select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.readonly-value {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-weight: 600;
  color: #495057;
}

.age-notice-row {
  margin-bottom: 15px;
}

.age-notice {
  color: #0066cc;
  font-size: 0.875rem;
}

.threshold-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 25px;
  margin-top: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.threshold-info h3 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: white;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.threshold-amount {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
}

.threshold-info small {
  color: white;
  font-size: 0.875rem;
  opacity: 0.8;
}

@media (max-width: 768px) {
  .profile-row {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .profile-field {
    flex: 1 !important;
  }
}
</style>