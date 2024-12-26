<template>
  <nav class="navbar navbar-expand-sm navbar-dark bg-dark shadow-lg">
    <div class="container py-2">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center w-100">
        <div class="navbar-nav me-auto mb-3 mb-sm-0">
          <router-link
            to="/"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-house-door me-1"></i>
            {{ $t('nav.home') }}
          </router-link>
          <router-link
            to="/tax-calculation-guide"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-book me-1"></i>
            Tax Guide
          </router-link>
          <router-link
            to="/tax-2023"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-calculator me-1"></i>
            {{ $t('nav.calculator2023') }}
          </router-link>
          <router-link
            to="/tax-saving-tips"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-piggy-bank me-1"></i>
            {{ $t('nav.taxSavingTips') }}
          </router-link>
          <router-link
            to="/contact"
            class="nav-link px-3 mx-1 rounded-pill"
          >
            <i class="bi bi-envelope me-1"></i>
            {{ $t('nav.contact') }}
          </router-link>
        </div>
        <div class="d-flex align-items-center">
          <div class="dropdown me-3">
            <button
              class="btn btn-outline-light dropdown-toggle"
              type="button"
              @click="toggleDropdown"
              :aria-expanded="isDropdownOpen"
            >
              <i class="bi bi-gear me-1"></i>
              {{ $t('nav.dataManagement') }}
            </button>
            <ul class="dropdown-menu dropdown-menu-end" v-show="isDropdownOpen" @click.stop>
              <li>
                <button class="dropdown-item" @click="exportData">
                  <i class="bi bi-download me-2"></i>
                  {{ $t('actions.export') }}
                </button>
              </li>
              <li>
                <button class="dropdown-item" @click="triggerFileInput">
                  <i class="bi bi-upload me-2"></i>
                  {{ $t('actions.import') }}
                </button>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button class="dropdown-item text-danger" @click="resetData">
                  <i class="bi bi-trash me-2"></i>
                  {{ $t('actions.reset') }}
                </button>
              </li>
            </ul>
          </div>
          <input type="file" ref="fileInput" @change="importData" accept=".json" style="display: none;">
          <div class="language-switcher">
            <select
              v-model="$i18n.locale"
              class="form-select form-select-sm bg-dark text-light"
            >
              <option
                v-for="locale in availableLocales"
                :key="locale.code"
                :value="locale.code"
              >
                {{ locale.code }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { availableLocales } from '../i18n';

export default {
  name: "NavigationBar",
  data() {
    return {
      availableLocales,
      isDropdownOpen: false
    };
  },
  mounted() {
    document.addEventListener('click', this.closeDropdown);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeDropdown);
  },
  methods: {
    toggleDropdown(event) {
      event.stopPropagation();
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    exportData() {
      const data = {
        salaries: this.$store.state.salaries.months,
        investments: this.$store.state.salaries.investments,
        bonus: this.$store.state.salaries.bonus,
        others: this.$store.state.salaries.others,
      };
      const fileName = 'salary-investment-data.json';
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    },
    resetData() {
      this.$store.commit('resetSalaries');
      this.$store.commit('resetInvestments');
      this.$store.commit('changeBonus', 0);
      this.$store.commit('changeOthers', 0);
      alert(this.$t('messages.dataReset'));
    },
    importData(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        if (data.salaries) {
          this.$store.commit('loadSalaries', data.salaries);
        }
        if (data.investments) {
          this.$store.commit('loadInvestments', data.investments);
        }
        if (data.bonus) {
          this.$store.commit('changeBonus', data.bonus);
        }
        if (data.others) {
          this.$store.commit('changeOthers', data.others);
        }
        alert(this.$t('messages.importSuccess'));
      };
      reader.readAsText(file);
    }
  }
};
</script>

<style scoped>
.navbar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 0;
  background: linear-gradient(135deg, #4a90e2 0%, #2c3e94 100%) !important;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9) !important;
  transition: all 0.3s ease;
  font-weight: 500;
  padding: 0.5rem 1.25rem !important;
  margin: 0 0.25rem;
}

.nav-link:hover {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.2);
}

.router-link-exact-active {
  color: white !important;
  background-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-group {
  border-radius: 0.5rem;
  overflow: hidden;
}

.btn-group .btn {
  border: none;
  position: relative;
  font-size: 0.95rem;
}

.btn-group .btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 1px;
  background-color: rgba(255, 255, 255, 0.2);
}

.btn-outline-light {
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.9);
}

.btn-outline-light:hover {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
  color: white;
}

.btn-outline-danger {
  background-color: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.5);
  color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.form-select {
  cursor: pointer;
}

.form-select option {
  background-color: #343a40;
  color: white;
}

.language-switcher {
  position: relative;
}

.language-switcher .form-select {
  padding: 0.4rem 2rem 0.4rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
}

.language-switcher .form-select:hover {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.1);
}

.language-switcher .form-select:focus {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.2);
}

.language-switcher .form-select option {
  padding: 8px;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 200px;
  margin-top: 0.5rem;
  display: block;
  background-color: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
}

.dropdown-menu[style*="display: block"] {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  padding: 0.6rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item.text-danger:hover {
  background-color: #dc3545;
  color: white !important;
}

.dropdown-divider {
  margin: 0.5rem 0;
  border-color: #eee;
}

.btn-outline-light.dropdown-toggle {
  border-color: rgba(255, 255, 255, 0.5);
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.btn-outline-light.dropdown-toggle:hover,
.btn-outline-light.dropdown-toggle:focus {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.dropdown-menu-end {
  right: 0;
  left: auto;
}
</style>
