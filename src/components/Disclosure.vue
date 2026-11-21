<template>
  <section class="disclosure" :class="{ 'is-open': isOpen }">
    <h2 class="disclosure-heading">
      <button
        type="button"
        class="disclosure-toggle"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="panelId"
        @click="toggle"
      >
        <span class="disclosure-title">{{ title }}</span>
        <span v-if="hint" class="disclosure-hint">{{ hint }}</span>
        <span class="disclosure-chevron" aria-hidden="true"></span>
      </button>
    </h2>
    <div :id="panelId" v-show="isOpen" class="disclosure-panel">
      <slot />
    </div>
  </section>
</template>

<script>
const STORAGE_KEY = 'tax-calculator-ui-open';

function readOpenSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'all') return 'all';
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export default {
  name: 'Disclosure',
  props: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    hint: { type: String, default: '' },
    forceOpen: { type: Boolean, default: false },
  },
  data() {
    const saved = readOpenSet();
    return { userOpen: saved === 'all' || saved.includes(this.id) };
  },
  computed: {
    isOpen() {
      return this.userOpen || this.forceOpen;
    },
    panelId() {
      return `disclosure-${this.id}`;
    },
  },
  methods: {
    toggle() {
      this.userOpen = !this.isOpen;
      try {
        const saved = readOpenSet();
        const set = new Set(saved === 'all' ? [] : saved);
        if (this.userOpen) set.add(this.id);
        else set.delete(this.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
      } catch (e) {
        /* storage unavailable: toggle still works for this session */
      }
    },
  },
};
</script>

<style scoped>
.disclosure {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.disclosure-heading {
  margin: 0;
  font-size: inherit;
}

.disclosure-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: 56px;
  padding: var(--space-3) var(--space-5);
  background: none;
  border: 0;
  border-radius: var(--radius-lg);
  font: inherit;
  text-align: left;
  color: var(--text);
  cursor: pointer;
}

.disclosure-title {
  font-size: var(--text-base);
  font-weight: 600;
}

.disclosure-hint {
  margin-left: auto;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.disclosure-chevron {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-left: var(--space-2);
  border-right: 2px solid var(--text-muted);
  border-bottom: 2px solid var(--text-muted);
  transform: rotate(45deg);
  transition: transform 0.2s;
}

.disclosure-hint + .disclosure-chevron { margin-left: var(--space-2); }
.disclosure-title + .disclosure-chevron { margin-left: auto; }

.is-open .disclosure-chevron {
  transform: rotate(-135deg);
}

.disclosure-panel {
  padding: 0 var(--space-5) var(--space-5);
}

@media (max-width: 600px) {
  .disclosure-toggle,
  .disclosure-panel {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
  }
}
</style>
