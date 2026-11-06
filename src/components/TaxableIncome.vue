<template>
<div>
<header class="section-header">
  <div class="section-heading-group">
    <span class="section-eyebrow">Step 03 · Exemptions &amp; Net Base</span>
    <h2>Taxable income breakdown</h2>
  </div>
  <span class="section-pill amount">Taxable <strong>৳{{ Number(taxableSalary || 0).toLocaleString() }}</strong></span>
</header>
<div class="table-scroll">
<table class="income-table">
  <thead>
    <tr>
      <th>Component</th>
      <th>Annual Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Basic</strong></td>
      <td>{{totalBasic}}</td>
    </tr>
    <tr>
      <td><strong>House</strong></td>
      <td>{{totalHouse}}</td>
    </tr>
    <tr>
      <td><strong>Medical</strong></td>
      <td>{{totalMedical}}</td>
    </tr>
    <tr>
      <td><strong>Transport</strong></td>
      <td>{{totalTransport}}</td>
    </tr>
    <tr>
      <td><strong>Others (Breakdown)</strong></td>
      <td>{{totalOthersBreakdown}}</td>
    </tr>
    <tr>
      <td><strong>Others (Lump Sum / LFA / Employer RPF)</strong></td>
      <td>{{others}}</td>
    </tr>
    <tr>
      <td><strong>Bonus</strong></td>
      <td>{{bonus}}</td>
    </tr>
    <tr v-if="bonus2 > 0">
      <td><strong>Bonus</strong></td>
      <td>{{bonus2}}</td>
    </tr>
    <tr class="subtotal-row">
      <td><strong>Gross Salary</strong></td>
      <td><strong>{{totalSalary}}</strong></td>
    </tr>
    <tr class="exemption-row">
      <td>
        <strong>Statutory Exemption (1/3 of gross, max ৳{{exemptionCap.toLocaleString()}})</strong>
        <button
          type="button"
          class="help-btn"
          ref="triggerExemption"
          aria-label="About employment income exemption"
          :aria-expanded="showTooltip === 'exemption'"
          @click="toggleTooltip('exemption')"
        >?</button>
        <div v-if="showTooltip === 'exemption'" class="tooltip-overlay" @click="closeTooltip('exemption')">
          <div
            ref="modalExemption"
            class="tooltip-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Employment Income Exemption"
            tabindex="-1"
            @click.stop
          >
            <button
              ref="closeExemption"
              class="tooltip-close"
              type="button"
              aria-label="Close"
              @click="closeTooltip('exemption')"
            >&times;</button>
            <strong>Employment Income Exemption (ITA 2023):</strong><br>
            • Single pool under Sixth Schedule Part 1 Para 27<br>
            • 1/3 of gross employment income OR ৳{{exemptionCap.toLocaleString()}} per year, whichever is lower<br>
            • Replaces repealed ITO 1984 separate house, medical &amp; transport caps<br>
            • Gross includes basic, house, medical, transport, bonuses, LFA &amp; employer RPF
          </div>
        </div>
      </td>
      <td>-{{totalExempt}}</td>
    </tr>
    <tr>
      <td><strong>Taxable Salary</strong></td>
      <td><strong>{{taxableSalary}}</strong></td>
    </tr>
  </tbody>
</table>
</div>
</div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

export default {
  name: "taxable-income",
  data() {
    return {
      showTooltip: null
    }
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
  },
  methods: {
    capitalize(type) {
      return `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
    },
    toggleTooltip(type) {
      if (this.showTooltip === type) {
        this.closeTooltip(type);
        return;
      }
      this.showTooltip = type;
      this.$nextTick(() => {
        const refKey = `close${this.capitalize(type)}`;
        this.$refs[refKey]?.focus?.();
      });
    },
    closeTooltip(type) {
      const active = type || this.showTooltip;
      this.showTooltip = null;
      if (active) {
        this.$nextTick(() => {
          const refKey = `trigger${this.capitalize(active)}`;
          this.$refs[refKey]?.focus?.();
        });
      }
    },
    handleKeydown(event) {
      if (!this.showTooltip) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeTooltip(this.showTooltip);
        return;
      }
      if (event.key === 'Tab') {
        const modal = this.$refs[`modal${this.capitalize(this.showTooltip)}`];
        if (!modal) return;
        const focusables = Array.from(
          modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter(el => !el.disabled);
        if (focusables.length === 0) {
          event.preventDefault();
          modal.focus?.();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement;
        if (event.shiftKey) {
          if (activeEl === first || !modal.contains(activeEl)) {
            event.preventDefault();
            last.focus();
          }
        } else if (activeEl === last || !modal.contains(activeEl)) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  },
  computed: {
    ...mapState({
      parts: state => state.salaries.parts,
      months: state => state.salaries.months,
      salaryBreakdown: state => state.breakdown.salaryBreakdown,
      bonus: state => state.salaries.bonus,
      bonus2: state => state.salaries.bonus2,
      others: state => state.salaries.others,
    }),
    ...mapGetters({
      totalSalary: 'totalSalary',
      totalTds: 'totalTds',
      totalHouse: 'totalHouse',
      totalMedical: 'totalMedical',
      totalTransport: 'totalTransport',
      totalBasic: 'totalBasic',
      totalOthersBreakdown: 'totalOthersBreakdown',
      houseExempt: 'houseExempt',
      medicalExempt: 'medicalExempt',
      transportExempt: 'transportExempt',
      exemptionCap: 'exemptionCap',
      taxableSalary: 'taxableSalary',
      totalExempt: 'totalExempt',
    }),
  }
}
</script>

<style scoped>
.table-scroll {
  overflow-x: auto;
}

.income-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.income-table th {
  padding: var(--space-2) var(--space-3);
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-strong);
  white-space: nowrap;
}

.income-table td {
  padding: var(--space-3);
  text-align: right;
  border-bottom: 1px solid var(--border);
  font-variant-numeric: tabular-nums;
}

.income-table th:first-child,
.income-table td:first-child {
  text-align: left;
  white-space: nowrap;
}

.income-table .subtotal-row td {
  border-top: 1px solid var(--border-strong);
}

.income-table .exemption-row td {
  color: var(--good);
  font-weight: 600;
}

.income-table tr:last-child td {
  border-bottom: 0;
  background: var(--surface-muted);
  font-weight: 700;
}

.help-btn {
  width: 24px;
  height: 24px;
  margin-left: var(--space-2);
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 50%;
  background: var(--surface);
  color: var(--info);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}

.help-btn:hover {
  background: var(--surface-muted);
}

.tooltip-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
}

.tooltip-modal {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  padding: var(--space-5);
  border-radius: var(--radius);
  max-width: min(400px, 90vw);
  position: relative;
  box-shadow: var(--shadow-lg);
  line-height: 1.6;
  text-align: left;
  font-weight: 400;
  white-space: normal;
}

.tooltip-close {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltip-close:hover {
  color: var(--text);
}
</style>
