import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Calculation2025 from '@/components/Calculation-2025.vue';
import salariesStore from '@/store/salaries';

describe('Calculation-2025 Component', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        salaries: {
          ...salariesStore,
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
      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Tax for FY 2025-2026');
    });

    test('should render tax calculation table', () => {
      const table = wrapper.find('table');
      expect(table.exists()).toBe(true);
      
      const headers = table.findAll('td strong');
      expect(headers.at(0).text()).toBe('Income (per year)');
      expect(headers.at(1).text()).toBe('New rate [%]');
      expect(headers.at(2).text()).toBe('Tax (BDT)');
    });

    test('should render summary rows', () => {
      const summaryRows = wrapper.findAll('tr');
      const summaryTexts = summaryRows.map(row => {
        const firstCell = row.find('td strong');
        return firstCell.exists() ? firstCell.text() : null;
      }).filter(Boolean);
      
      expect(summaryTexts).toContain('Total tax');
      expect(summaryTexts).toContain('Tax deducted at source');
      expect(summaryTexts).toContain('Tax rebate on investment');
      expect(summaryTexts).toContain('Payable');
    });
  });

  describe('FY 2025-2026 Tax Calculations', () => {
    test('should display correct tax for general taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const totalTaxDisplay = wrapper.find('h2');
      expect(totalTaxDisplay.text()).toContain(wrapper.vm.totalTax.toString());
    });

    test('should use FY 2025-26 tax slabs (6 slabs, no 5% bracket)', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 }); // 600K annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      
      expect(taxBreakdown).toHaveLength(6); // 6 slabs for 2025-26
      
      // Check that tax rates don't include 5%
      const rates = taxBreakdown.map(slab => slab.slabPercentage);
      expect(rates).not.toContain(5);
      expect(rates).toEqual([0, 10, 15, 20, 25, 30]);
    });

    test('should show higher tax-free threshold for 2025-26', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const threshold = wrapper.vm.taxFreeThreshold;
      expect(threshold).toBe(375000); // 25K higher than 2024-25
    });

    test('should apply unified minimum tax of 5000', () => {
      const locations = ['dhaka', 'chittagong', 'other_city', 'district'];
      
      locations.forEach(location => {
        store.commit('updateTaxpayerProfile', {
          category: 'general',
          age: 30,
          location: location
        });
        
        store.commit('changeSubsequentSalaries', { index: 0, value: 30000 }); // Low income

        wrapper = mount(Calculation2025, {
          global: {
            plugins: [store]
          }
        });

        const minimumTax = wrapper.vm.minimumTaxAmount;
        expect(minimumTax).toBe(5000); // Unified for all locations
      });
    });
  });

  describe('Different Taxpayer Categories', () => {
    test('should calculate correctly for female taxpayer', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const threshold = wrapper.vm.taxFreeThreshold;
      expect(threshold).toBe(425000); // Female threshold for 2025-26
    });

    test('should calculate correctly for disabled person', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 35,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const threshold = wrapper.vm.taxFreeThreshold;
      expect(threshold).toBe(500000); // Disabled threshold for 2025-26
    });

    test('should calculate correctly for freedom fighter', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 35,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const threshold = wrapper.vm.taxFreeThreshold;
      expect(threshold).toBe(525000); // Freedom fighter threshold for 2025-26
    });

    test('should calculate correctly for third gender', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'third_gender',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const threshold = wrapper.vm.taxFreeThreshold;
      expect(threshold).toBe(500000); // Third gender threshold for 2025-26
    });

    test('should auto-detect senior citizen', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 70,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const threshold = wrapper.vm.taxFreeThreshold;
      expect(threshold).toBe(425000); // Senior threshold for 2025-26
    });
  });

  describe('Tax Calculation Logic', () => {
    test('should calculate zero tax for income below threshold', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 25000 }); // 300K annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      const calculatedTax = wrapper.vm.calculatedTax;
      const totalTax = wrapper.vm.totalTax;
      const minimumTax = wrapper.vm.minimumTaxAmount;
      
      expect(calculatedTax).toBe(0);
      expect(totalTax).toBe(minimumTax); // Should apply minimum tax
    });

    test('should calculate correct tax for income in first bracket (10%)', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 40000 }); // 480K annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      
      expect(taxBreakdown[0].slabCut).toBe(0); // No tax on first 375K
      expect(taxBreakdown[1].slabCut).toBeGreaterThan(0); // Tax on excess at 10%
      expect(taxBreakdown[1].slabPercentage).toBe(10); // First taxable bracket is 10%
    });

    test('should apply minimum tax when calculated tax is lower', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'district'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 32000 }); // 384K annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const calculatedTax = wrapper.vm.calculatedTax;
      const totalTax = wrapper.vm.totalTax;
      const minimumTax = wrapper.vm.minimumTaxAmount;
      const isMinimumTaxApplied = wrapper.vm.isMinimumTaxApplied;
      
      expect(totalTax).toBe(minimumTax);
      expect(totalTax).toBe(5000); // Unified minimum tax
      expect(isMinimumTaxApplied).toBe(true);
    });

    test('should not apply minimum tax when calculated tax is higher', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 }); // 1.2M annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const calculatedTax = wrapper.vm.calculatedTax;
      const totalTax = wrapper.vm.totalTax;
      const minimumTax = wrapper.vm.minimumTaxAmount;
      const isMinimumTaxApplied = wrapper.vm.isMinimumTaxApplied;
      
      expect(totalTax).toBe(calculatedTax);
      expect(totalTax).toBeGreaterThan(minimumTax);
      expect(isMinimumTaxApplied).toBe(false);
    });
  });

  describe('Investment Rebate and TDS', () => {
    test('should calculate investment rebate correctly', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 }); // 1M annually
      store.commit('changeInvestment', { index: 0, value: 100000 }); // Investment

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const investmentRebate = wrapper.vm.investmentRebate;
      expect(investmentRebate).toBeGreaterThan(0);
    });

    test('should deduct TDS from final payable amount', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 }); // 1M annually
      store.commit('changeSubsequentTds', { index: 0, value: 5000 }); // TDS

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const totalTds = wrapper.vm.totalTds;
      expect(totalTds).toBe(60000); // 12 months * 5000
    });

    test('should display payable amount correctly', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 83334 });
      store.commit('changeSubsequentTds', { index: 0, value: 2000 });
      store.commit('changeInvestment', { index: 0, value: 50000 });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const payableRow = wrapper.findAll('tr').find(row => {
        const strongText = row.find('td strong');
        return strongText.exists() && strongText.text() === 'Payable';
      });

      expect(payableRow).toBeTruthy();
      
      const totalTax = wrapper.vm.totalTax;
      const totalTds = wrapper.vm.totalTds;
      const investmentRebate = wrapper.vm.investmentRebate;
      const expectedPayable = totalTax - totalTds - investmentRebate;
      
      const payableCell = payableRow.findAll('td').at(2);
      expect(payableCell.text().trim()).toBe(expectedPayable.toString());
    });
  });

  describe('UI Display Features', () => {
    test('should show minimum tax notice when applied', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 30000 }); // Low income

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const minimumTaxNotice = wrapper.find('small[style*="color: red"]');
      expect(minimumTaxNotice.exists()).toBe(true);
      expect(minimumTaxNotice.text()).toContain('Minimum tax applied');
      expect(minimumTaxNotice.text()).toContain('BDT 5000'); // Unified minimum tax
    });

    test('should not show minimum tax notice when not applied', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 }); // High income

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const minimumTaxNotice = wrapper.find('small[style*="color: red"]');
      expect(minimumTaxNotice.exists()).toBe(false);
    });

    test('should display total tax in header correctly', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const totalTaxDisplay = wrapper.find('h2');
      const totalTax = wrapper.vm.totalTax;
      expect(totalTaxDisplay.text()).toContain(totalTax.toString());
    });
  });

  describe('Integration with Store', () => {
    test('should respond to changes in taxpayer profile', async () => {
      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const initialThreshold = wrapper.vm.taxFreeThreshold;
      
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      await wrapper.vm.$nextTick();
      
      const newThreshold = wrapper.vm.taxFreeThreshold;
      expect(newThreshold).toBeGreaterThan(initialThreshold);
      expect(newThreshold).toBe(425000); // Female threshold
    });

    test('should respond to changes in salary', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const initialTax = wrapper.vm.totalTax;
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      
      await wrapper.vm.$nextTick();
      
      const newTax = wrapper.vm.totalTax;
      expect(newTax).toBeGreaterThan(initialTax);
    });

    test('should respond to changes in investments', async () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      
      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const initialRebate = wrapper.vm.investmentRebate;
      
      store.commit('changeInvestment', { index: 0, value: 100000 });
      
      await wrapper.vm.$nextTick();
      
      const newRebate = wrapper.vm.investmentRebate;
      expect(newRebate).toBeGreaterThan(initialRebate);
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    test('should handle tax calculation at exact threshold boundaries', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 31250 }); // Exactly 375K annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      const totalTax = wrapper.vm.totalTax;
      const minimumTax = wrapper.vm.minimumTaxAmount;
      
      expect(taxBreakdown[0].slabCut).toBe(0);
      expect(totalTax).toBe(minimumTax); // Should apply minimum tax
    });

    test('should handle very high income correctly', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 500000 }); // 6M annually

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      const totalTax = wrapper.vm.totalTax;
      
      expect(taxBreakdown).toHaveLength(6);
      expect(taxBreakdown[5].slabCut).toBeGreaterThan(0); // Highest slab should have tax
      expect(totalTax).toBeGreaterThan(100000); // Substantial tax amount
    });

    test('should handle profile changes dynamically', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 40000 });

      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const initialThreshold = wrapper.vm.taxFreeThreshold;
      expect(initialThreshold).toBe(375000);
      
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 30,
        location: 'dhaka'
      });

      const newThreshold = wrapper.vm.taxFreeThreshold;
      expect(newThreshold).toBe(500000);
    });
  });

  describe('Comparison with Calculation-2024', () => {
    test('should have different component name', () => {
      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      expect(wrapper.vm.$options.name).toBe('calculation-2025');
    });

    test('should use 2025-specific getters', () => {
      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      // Component should be using 2025-specific computed properties
      expect(wrapper.vm.investmentRebate).toBeDefined();
      expect(wrapper.vm.taxFreeThreshold).toBeDefined();
      expect(wrapper.vm.totalTax).toBeDefined();
      
      // Check that these are different from default store values
      const defaultThreshold = store.getters.taxFreeThreshold;
      const component2025Threshold = wrapper.vm.taxFreeThreshold;
      expect(component2025Threshold).toBeGreaterThan(defaultThreshold);
    });

    test('should display "New (2025-26) rate" in header', () => {
      wrapper = mount(Calculation2025, {
        global: {
          plugins: [store]
        }
      });

      const header = wrapper.find('h2');
      expect(header.text()).toContain('Tax for FY 2025-2026');
    });
  });
});