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
          <button
            class="btn nav-action-btn me-5"
            type="button"
            @click="showDataManagement = true"
            style="margin-right: 5px;"
          >
            <i class="bi bi-gear me-1"></i>
            {{ $t('nav.dataManagement') }}
          </button>
          <div class="language-switcher ms-3">
            <select
              v-model="$i18n.locale"
              class="form-select"
              aria-label="Language selector"
            >
              <option
                v-for="locale in availableLocales"
                :key="locale.code"
                :value="locale.code"
              >
                {{ locale.code.toUpperCase() }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <DataManagement :show="showDataManagement" @update:show="showDataManagement = $event" />
  </nav>
</template>

<script>
import { availableLocales } from '../i18n';
import DataManagement from './DataManagement.vue';

export default {
  name: "NavigationBar",
  components: {
    DataManagement
  },
  data() {
    return {
      availableLocales,
      showDataManagement: false
    };
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
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.nav-link:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.router-link-exact-active {
  color: white !important;
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.language-switcher {
  position: relative;
}

.language-switcher .form-select {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 2.5rem 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 20px;
  min-width: 90px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  text-transform: uppercase;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='rgba(255,255,255,0.9)' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 12px;
}

.language-switcher .form-select:hover,
.language-switcher .form-select:focus {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  outline: none;
}

.language-switcher .form-select option {
  color: #333;
  background-color: white;
  padding: 0.75rem;
  font-size: 0.95rem;
  text-transform: uppercase;
}

/* Navigation Action Buttons */
.nav-action-btn {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1.25rem;
  font-weight: 500;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-action-btn:hover,
.nav-action-btn:focus {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
