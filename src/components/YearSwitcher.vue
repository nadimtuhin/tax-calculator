<template>
  <div class="year-switcher">
    <div class="year-switcher-label">Tax Filing Year</div>
    <div class="year-pills">
      <button
        v-for="option in fiscalYearOptions"
        :key="option.value"
        class="year-pill"
        :class="{ active: currentYear === option.value }"
        @click="selectYear(option.value)"
      >
        {{ option.label }}
      </button>
    </div>
    <div class="year-meta">
      <span class="meta-item">
        <span class="meta-label">Tax-free threshold</span>
        <span class="meta-value">BDT {{ taxFreeThreshold.toLocaleString() }}</span>
      </span>
      <span class="meta-divider">·</span>
      <span class="meta-item">
        <span class="meta-label">Minimum tax</span>
        <span class="meta-value">BDT {{ minimumTaxAmount.toLocaleString() }}</span>
      </span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'YearSwitcher',

  computed: {
    ...mapGetters(['fiscalYearOptions', 'taxFreeThreshold', 'minimumTaxAmount']),

    currentYear() {
      return this.$store.state.salaries.currentYear;
    },
  },

  methods: {
    ...mapMutations(['setCurrentYear']),

    selectYear(year) {
      this.setCurrentYear(year);
    },
  },
};
</script>

<style scoped>
.year-switcher {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 28px 25px 24px;
  background: linear-gradient(135deg, #006A4E 0%, #008A66 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(0, 106, 78, 0.35);
}

.year-switcher-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
}

.year-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.year-pill {
  padding: 10px 28px;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5px;
}

.year-pill:hover {
  border-color: white;
  color: white;
  background: rgba(255, 255, 255, 0.12);
}

.year-pill.active {
  background: white;
  border-color: white;
  color: #006A4E;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.year-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-label {
  opacity: 0.75;
  font-size: 0.8rem;
}

.meta-value {
  font-weight: 700;
}

.meta-divider {
  opacity: 0.5;
  font-size: 1.2rem;
}

@media (max-width: 480px) {
  .year-pills {
    flex-direction: column;
    width: 100%;
  }

  .year-pill {
    text-align: center;
  }

  .year-meta {
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }

  .meta-divider {
    display: none;
  }
}
</style>
