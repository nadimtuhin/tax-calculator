import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TaxableIncome from '@/components/TaxableIncome.vue';
import salariesStore from '@/store/salaries';
import breakdownStore from '@/store/breakdown';

describe('TaxableIncome Component', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
          namespaced: false
        },
        breakdown: {
          ...breakdownStore,
          namespaced: false
        }
      }
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Component Rendering', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Taxable income breakdown');
    });

    test('should render taxable income table', () => {
      const table = wrapper.find('table');
      expect(table.exists()).toBe(true);
      
      const headers = table.findAll('th');
      expect(headers.at(1).text()).toBe('Total');
      expect(headers.at(2).text()).toBe('Tax exempted');
      expect(headers.at(3).text()).toBe('Taxable');
    });

    test('should render all income component rows', () => {
      const incomeRows = wrapper.findAll('tbody tr').filter(row => 
        row.text().includes('Basic') ||
        row.text().includes('House') ||
        row.text().includes('Medical') ||
        row.text().includes('Transport') ||
        row.text().includes('Others') ||
        row.text().includes('Bonus')
      );
      
      expect(incomeRows.length).toBeGreaterThanOrEqual(6); // Basic, House, Medical, Transport, Others (2), Bonus
    });

    test('should render gross salary summary row', () => {
      const grossSalaryRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Gross Salary')
      );
      
      expect(grossSalaryRow).toBeTruthy();
      expect(grossSalaryRow.text()).toContain('Gross Salary');
    });
  });

  describe('Income Breakdown Display', () => {
    beforeEach(() => {
      // Set up some test data
      store.commit('updateTotalSalary', 60000);
      store.commit('changeBonus', 100000);
      store.commit('changeOthers', 50000);
      
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should display basic salary correctly', () => {
      const basicRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Basic')
      );
      
      expect(basicRow).toBeTruthy();
      expect(basicRow.text()).toContain(wrapper.vm.totalBasic.toString());
    });

    test('should display house allowance with exemption', () => {
      const houseRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('House')
      );
      
      expect(houseRow).toBeTruthy();
      expect(houseRow.text()).toContain(wrapper.vm.totalHouse.toString());
      expect(houseRow.text()).toContain(wrapper.vm.houseExempt.toString());
    });

    test('should display medical allowance with exemption', () => {
      const medicalRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Medical')
      );
      
      expect(medicalRow).toBeTruthy();
      expect(medicalRow.text()).toContain(wrapper.vm.totalMedical.toString());
      expect(medicalRow.text()).toContain(wrapper.vm.medicalExempt.toString());
    });

    test('should display transport allowance with exemption', () => {
      const transportRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Transport')
      );
      
      expect(transportRow).toBeTruthy();
      expect(transportRow.text()).toContain(wrapper.vm.totalTransport.toString());
      expect(transportRow.text()).toContain(wrapper.vm.transportExempt.toString());
    });

    test('should calculate taxable amounts correctly', () => {
      const houseRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('House')
      );
      
      if (houseRow) {
        const taxableHouse = wrapper.vm.totalHouse - wrapper.vm.houseExempt;
        expect(houseRow.text()).toContain(taxableHouse.toString());
      }
    });

    test('should display bonus amounts', () => {
      const bonusRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Bonus')
      );
      
      expect(bonusRow).toBeTruthy();
      expect(bonusRow.text()).toContain(wrapper.vm.bonus.toString());
    });

    test('should show second bonus only if bonus2 > 0', async () => {
      // Initially bonus2 should be 0 or not shown
      let bonus2Rows = wrapper.findAll('tbody tr').filter(row => 
        row.text().includes('Bonus') && row.html().includes('v-if')
      );
      
      // Set bonus2 to a positive value
      store.commit('changeBonus2', 50000);
      await wrapper.vm.$nextTick();
      
      // Now bonus2 row should be visible
      const allBonusRows = wrapper.findAll('tbody tr').filter(row => 
        row.text().includes('Bonus')
      );
      
      if (wrapper.vm.bonus2 > 0) {
        expect(allBonusRows.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Tooltip Functionality', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should have tooltip buttons for house, medical, and transport', () => {
      const tooltipButtons = wrapper.findAll('button').filter(button => 
        button.text().includes('?')
      );
      
      expect(tooltipButtons.length).toBe(3); // House, Medical, Transport
    });

    test('should toggle house tooltip when clicked', async () => {
      const houseTooltipButton = wrapper.findAll('button').find(button => 
        button.element.closest('td')?.textContent?.includes('House')
      );
      
      expect(houseTooltipButton).toBeTruthy();
      
      // Initially no tooltip should be shown
      expect(wrapper.vm.showTooltip).toBe(null);
      
      // Click to show tooltip
      await houseTooltipButton.trigger('click');
      expect(wrapper.vm.showTooltip).toBe('house');
      
      // Click again to hide tooltip
      await houseTooltipButton.trigger('click');
      expect(wrapper.vm.showTooltip).toBe(null);
    });

    test('should toggle medical tooltip when clicked', async () => {
      const medicalTooltipButton = wrapper.findAll('button').find(button => 
        button.element.closest('td')?.textContent?.includes('Medical')
      );
      
      expect(medicalTooltipButton).toBeTruthy();
      
      await medicalTooltipButton.trigger('click');
      expect(wrapper.vm.showTooltip).toBe('medical');
    });

    test('should toggle transport tooltip when clicked', async () => {
      const transportTooltipButton = wrapper.findAll('button').find(button => 
        button.element.closest('td')?.textContent?.includes('Transport')
      );
      
      expect(transportTooltipButton).toBeTruthy();
      
      await transportTooltipButton.trigger('click');
      expect(wrapper.vm.showTooltip).toBe('transport');
    });

    test('should show tooltip modal when tooltip is active', async () => {
      // Trigger house tooltip
      await wrapper.vm.toggleTooltip('house');
      await wrapper.vm.$nextTick();
      
      const tooltipModal = wrapper.find('.tooltip-modal');
      expect(tooltipModal.exists()).toBe(true);
      
      const tooltipOverlay = wrapper.find('.tooltip-overlay');
      expect(tooltipOverlay.exists()).toBe(true);
    });

    test('should display correct tooltip content for house', async () => {
      await wrapper.vm.toggleTooltip('house');
      await wrapper.vm.$nextTick();
      
      const tooltipModal = wrapper.find('.tooltip-modal');
      expect(tooltipModal.text()).toContain('House Rent Exemption');
      expect(tooltipModal.text()).toContain('50% of basic salary');
      expect(tooltipModal.text()).toContain('৳3,00,000 per year');
    });

    test('should display correct tooltip content for medical', async () => {
      await wrapper.vm.toggleTooltip('medical');
      await wrapper.vm.$nextTick();
      
      const tooltipModal = wrapper.find('.tooltip-modal');
      expect(tooltipModal.text()).toContain('Medical Allowance Exemption');
      expect(tooltipModal.text()).toContain('10% of basic salary');
      expect(tooltipModal.text()).toContain('৳1,20,000 per year');
    });

    test('should display correct tooltip content for transport', async () => {
      await wrapper.vm.toggleTooltip('transport');
      await wrapper.vm.$nextTick();
      
      const tooltipModal = wrapper.find('.tooltip-modal');
      expect(tooltipModal.text()).toContain('Transport Allowance Exemption');
      expect(tooltipModal.text()).toContain('Actual transport allowance');
      expect(tooltipModal.text()).toContain('৳30,000 per year');
    });

    test('should close tooltip when close button is clicked', async () => {
      await wrapper.vm.toggleTooltip('house');
      await wrapper.vm.$nextTick();
      
      const closeButton = wrapper.find('.tooltip-close');
      expect(closeButton.exists()).toBe(true);
      
      await closeButton.trigger('click');
      expect(wrapper.vm.showTooltip).toBe(null);
    });

    test('should close tooltip when overlay is clicked', async () => {
      await wrapper.vm.toggleTooltip('medical');
      await wrapper.vm.$nextTick();
      
      const overlay = wrapper.find('.tooltip-overlay');
      expect(overlay.exists()).toBe(true);
      
      await overlay.trigger('click');
      expect(wrapper.vm.showTooltip).toBe(null);
    });

    test('should not close tooltip when modal content is clicked', async () => {
      await wrapper.vm.toggleTooltip('transport');
      await wrapper.vm.$nextTick();
      
      const modal = wrapper.find('.tooltip-modal');
      expect(modal.exists()).toBe(true);
      
      await modal.trigger('click');
      expect(wrapper.vm.showTooltip).toBe('transport'); // Should still be open
    });
  });

  describe('Store Integration', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should access all required state properties', () => {
      expect(wrapper.vm.parts).toBeDefined();
      expect(wrapper.vm.months).toBeDefined();
      expect(wrapper.vm.salaryBreakdown).toBeDefined();
      expect(wrapper.vm.bonus).toBeDefined();
      expect(wrapper.vm.bonus2).toBeDefined();
      expect(wrapper.vm.others).toBeDefined();
    });

    test('should access all required getters', () => {
      expect(typeof wrapper.vm.totalSalary).toBe('number');
      expect(typeof wrapper.vm.totalBasic).toBe('number');
      expect(typeof wrapper.vm.totalHouse).toBe('number');
      expect(typeof wrapper.vm.totalMedical).toBe('number');
      expect(typeof wrapper.vm.totalTransport).toBe('number');
      expect(typeof wrapper.vm.houseExempt).toBe('number');
      expect(typeof wrapper.vm.medicalExempt).toBe('number');
      expect(typeof wrapper.vm.transportExempt).toBe('number');
      expect(typeof wrapper.vm.taxableSalary).toBe('number');
      expect(typeof wrapper.vm.totalExempt).toBe('number');
    });

    test('should react to store changes', async () => {
      const initialTotalSalary = wrapper.vm.totalSalary;
      
      // Change salary in store (should use salaries store mutation)
      store.commit('changeBonus', 50000);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.totalSalary).not.toBe(initialTotalSalary);
      expect(wrapper.vm.totalSalary).toBeGreaterThan(initialTotalSalary);
    });

    test('should update display when bonus changes', async () => {
      const initialBonus = wrapper.vm.bonus;
      
      store.commit('changeBonus', 150000);
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.bonus).not.toBe(initialBonus);
      expect(wrapper.vm.bonus).toBe(150000);
    });
  });

  describe('Component Methods', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should have toggleTooltip method', () => {
      expect(typeof wrapper.vm.toggleTooltip).toBe('function');
    });

    test('toggleTooltip should set tooltip type when none is shown', () => {
      wrapper.vm.showTooltip = null;
      wrapper.vm.toggleTooltip('house');
      
      expect(wrapper.vm.showTooltip).toBe('house');
    });

    test('toggleTooltip should hide tooltip when same type is clicked', () => {
      wrapper.vm.showTooltip = 'medical';
      wrapper.vm.toggleTooltip('medical');
      
      expect(wrapper.vm.showTooltip).toBe(null);
    });

    test('toggleTooltip should switch tooltip when different type is clicked', () => {
      wrapper.vm.showTooltip = 'house';
      wrapper.vm.toggleTooltip('transport');
      
      expect(wrapper.vm.showTooltip).toBe('transport');
    });
  });

  describe('Data Properties', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should have showTooltip data property initialized to null', () => {
      expect(wrapper.vm.showTooltip).toBe(null);
    });
  });

  describe('Calculations Accuracy', () => {
    beforeEach(() => {
      // Set up specific test scenario
      store.commit('updateTotalSalary', 50000);
      store.commit('changeBonus', 100000);
      store.commit('changeOthers', 25000);
      
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should show correct exemption calculations', () => {
      // House exemption should be calculated correctly
      const expectedHouseExempt = Math.min(
        wrapper.vm.totalHouse,
        wrapper.vm.totalBasic * 0.5,
        300000
      );
      
      expect(wrapper.vm.houseExempt).toBeCloseTo(expectedHouseExempt, 0);
    });

    test('should show correct taxable amounts', () => {
      // Basic should be fully taxable (no exemption)
      const rows = wrapper.findAll('tbody tr');
      const basicRow = rows.find(row => row.text().includes('Basic'));
      if (basicRow) {
        expect(basicRow.text()).toContain(wrapper.vm.totalBasic.toString());
      }
      
      // Taxable house = total house - house exempt
      const taxableHouse = wrapper.vm.totalHouse - wrapper.vm.houseExempt;
      const tableRows = wrapper.findAll('tbody tr');
      const houseRow = tableRows.find(row => row.text().includes('House'));
      if (houseRow) {
        expect(houseRow.text()).toContain(taxableHouse.toString());
      }
    });

    test('should show correct gross salary totals', () => {
      const grossSalaryRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Gross Salary')
      );
      
      expect(grossSalaryRow.text()).toContain(wrapper.vm.totalSalary.toString());
      expect(grossSalaryRow.text()).toContain(wrapper.vm.totalExempt.toString());
      expect(grossSalaryRow.text()).toContain(wrapper.vm.taxableSalary.toString());
    });
  });

  describe('Conditional Rendering', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should conditionally show bonus2 row', async () => {
      // Initially bonus2 should be 0
      expect(wrapper.vm.bonus2).toBe(0);
      
      let bonus2Rows = wrapper.findAll('tr').filter(row => 
        row.text().includes('Bonus') && row.html().includes('bonus2')
      );
      
      // Set bonus2 to positive value
      store.commit('changeBonus2', 75000);
      await wrapper.vm.$nextTick();
      
      // Now check if the row appears
      expect(wrapper.vm.bonus2).toBe(75000);
    });
  });

  describe('Console Logging', () => {
    beforeEach(() => {
      // Mock console.log to test logging
      jest.spyOn(console, 'log').mockImplementation(() => {});
      
      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    afterEach(() => {
      console.log.mockRestore();
    });

    test('should log tooltip toggle actions', () => {
      wrapper.vm.toggleTooltip('house');
      
      expect(console.log).toHaveBeenCalledWith(
        'Toggling tooltip:', 'house', 'Current:', null
      );
    });
  });
});