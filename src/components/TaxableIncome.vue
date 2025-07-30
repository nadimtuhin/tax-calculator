<template>
<div>
<h2>Taxable income breakdown</h2>
<table class="table">
  <thead>
    <tr>
      <th></th>
      <th>Total</th>
      <th>Tax exempted</th>
      <th>Taxable</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Basic</strong></td>
      <td>{{totalBasic}}</td>
      <td>0</td>
      <td>{{totalBasic}}</td>
    </tr>
    <tr>
      <td>
        <strong>House</strong>
        <button style="background: #2196f3; color: white; border: none; padding: 2px 4px; margin-left: 5px; cursor: pointer; border-radius: 50%; font-size: 10px; line-height: 1;" @click="toggleTooltip('house')">
          ?
        </button>
        <div v-if="showTooltip === 'house'" class="tooltip-overlay" @click="showTooltip = null">
          <div class="tooltip-modal" @click.stop>
            <button class="tooltip-close" @click="showTooltip = null">&times;</button>
            <strong>House Rent Exemption:</strong><br>
            • 50% of basic salary OR actual house allowance<br>
            • Whichever is lower<br>
            • Maximum: ৳3,00,000 per year
          </div>
        </div>
      </td>
      <td>{{totalHouse}}</td>
      <td>{{houseExempt}}</td>
      <td>{{totalHouse - houseExempt}}</td>
    </tr>
    <tr>
      <td>
        <strong>Medical</strong>
        <button style="background: #2196f3; color: white; border: none; padding: 2px 4px; margin-left: 5px; cursor: pointer; border-radius: 50%; font-size: 10px; line-height: 1;" @click="toggleTooltip('medical')">
          ?
        </button>
        <div v-if="showTooltip === 'medical'" class="tooltip-overlay" @click="showTooltip = null">
          <div class="tooltip-modal" @click.stop>
            <button class="tooltip-close" @click="showTooltip = null">&times;</button>
            <strong>Medical Allowance Exemption:</strong><br>
            • 10% of basic salary OR actual medical allowance<br>
            • Whichever is lower<br>
            • Maximum: ৳1,20,000 per year
          </div>
        </div>
      </td>
      <td>{{totalMedical}}</td>
      <td>{{medicalExempt}}</td>
      <td>{{totalMedical - medicalExempt}}</td>
    </tr>
    <tr>
      <td>
        <strong>Transport</strong>
        <button style="background: #2196f3; color: white; border: none; padding: 2px 4px; margin-left: 5px; cursor: pointer; border-radius: 50%; font-size: 10px; line-height: 1;" @click="toggleTooltip('transport')">
          ?
        </button>
        <div v-if="showTooltip === 'transport'" class="tooltip-overlay" @click="showTooltip = null">
          <div class="tooltip-modal" @click.stop>
            <button class="tooltip-close" @click="showTooltip = null">&times;</button>
            <strong>Transport Allowance Exemption:</strong><br>
            • Actual transport allowance received<br>
            • Maximum: ৳30,000 per year
          </div>
        </div>
      </td>
      <td>{{totalTransport}}</td>
      <td>{{transportExempt}}</td>
      <td>{{totalTransport - transportExempt}}</td>
    </tr>
    <tr>
      <td><strong>Others (Breakdown)</strong></td>
      <td>{{totalOthersBreakdown}}</td>
      <td>0</td>
      <td>{{totalOthersBreakdown}}</td>
    </tr>
    <tr>
      <td><strong>Others (Lump Sum)</strong></td>
      <td>{{others}}</td>
      <td>0</td>
      <td>{{others}}</td>
    </tr>
    <tr>
      <td><strong>Bonus</strong></td>
      <td>{{bonus}}</td>
      <td>0</td>
      <td>{{bonus}}</td>
    </tr>
    <tr v-if="bonus2 > 0">
      <td><strong>Bonus</strong></td>
      <td>{{bonus2}}</td>
      <td>0</td>
      <td>{{bonus2}}</td>
    </tr>
    <tr>
      <td><strong>Gross Salary</strong></td>
      <td><strong>{{totalSalary}}</strong></td>
      <td><strong>{{totalExempt}}</strong></td>
      <td><strong>{{taxableSalary}}</strong></td>
    </tr>
  </tbody>
</table>
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
  methods: {
    toggleTooltip(type) {
      console.log('Toggling tooltip:', type, 'Current:', this.showTooltip);
      this.showTooltip = this.showTooltip === type ? null : type;
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
      taxableSalary: 'taxableSalary',
      totalExempt: 'totalExempt',
    }),
  }
}
</script>

<style scoped>
.tooltip {
  position: relative;
  display: inline-block;
  margin-left: 8px;
  cursor: pointer;
}

.tooltip-icon {
  font-size: 14px;
  font-weight: bold;
  opacity: 0.8;
  transition: all 0.2s;
  background: #e3f2fd;
  padding: 4px 6px;
  border-radius: 50%;
  border: 1px solid #90caf9;
  display: inline-block;
  min-width: 20px;
  text-align: center;
  color: #1976d2;
}

.tooltip-icon:hover {
  opacity: 1;
  background: #bbdefb;
  transform: scale(1.1);
}

.tooltip-icon.active {
  background: #2196f3;
  color: white;
  border-color: #1976d2;
}

.tooltip-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
}

.tooltip-modal {
  background: #2d3748;
  color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 320px;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  line-height: 1.5;
}

.tooltip-close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  color: #cbd5e0;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tooltip-close:hover {
  color: white;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #2d3748;
  color: white;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  min-width: 250px;
}

.tooltip-content::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #2d3748 transparent transparent transparent;
}

.tooltip-content strong {
  color: #ffd700;
  display: block;
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .tooltip-content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    min-width: 280px;
    max-width: 90vw;
    white-space: normal;
  }
  
  .tooltip-content::after {
    display: none;
  }
}
</style>
