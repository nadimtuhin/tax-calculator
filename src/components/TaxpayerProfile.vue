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
          <option v-if="currentYear === '2026-27'" value="july_warrior">July Warrior (FY 2026-27+)</option>
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
        <label>Minimum Tax</label>
        <div class="readonly-value">BDT {{ minimumTax.toLocaleString() }}</div>
      </div>
    </div>
    
    <div v-if="age >= 65 && selectedCategory !== 'senior'" class="age-notice-row">
      <small class="age-notice">
        Note: You qualify for Senior Citizen category
      </small>
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
    };
  },

  computed: {
    ...mapGetters({
      minimumTaxAmount: 'minimumTaxAmount',
    }),

    currentYear() {
      return this.$store.state.salaries.currentYear;
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
        july_warrior: 'July Warrior',
      };
      return names[this.selectedCategory] || 'General';
    },
  },

  watch: {
    currentYear(year) {
      if (year !== '2026-27' && this.selectedCategory === 'july_warrior') {
        this.selectedCategory = 'general';
        this.updateProfile();
      }
    },
  },

  mounted() {
    const currentProfile = this.$store.state.salaries?.taxpayerProfile;

    if (currentProfile) {
      this.selectedCategory = currentProfile.category || 'general';
      this.age = currentProfile.age || 30;
      this.selectedLocation = currentProfile.location || 'dhaka';
    }

    this.updateProfile();
  },

  methods: {
    ...mapMutations(['updateTaxpayerProfile']),

    updateProfile() {
      if (this.age >= 65 && this.selectedCategory === 'general') {
        this.selectedCategory = 'senior';
      }

      this.updateTaxpayerProfile({
        category: this.selectedCategory,
        age: parseInt(this.age),
        location: this.selectedLocation,
      });
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