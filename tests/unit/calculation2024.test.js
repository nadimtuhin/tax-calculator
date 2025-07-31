import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Calculation2024 from '@/components/Calculation-2024.vue';
import salariesStore from '@/store/salaries';

describe('Calculation-2024 Component', () => {
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
      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Tax for FY 2024-2025');
    });

    test('should render tax calculation table', () => {
      const table = wrapper.find('table');
      expect(table.exists()).toBe(true);
      
      const headers = table.findAll('td strong');
      expect(headers.at(0).text()).toBe('Income (per year)');
      expect(headers.at(1).text()).toBe('Proposed rate [%]');
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

  describe('Tax Slab Generation', () => {
    test('should generate correct tax slabs for general taxpayer', () => {
      // Set up general taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      
      expect(slabs).toHaveLength(7);
      expect(slabs[0]).toEqual(['First Tk3.5 lakh [0-3.5 lakh]', 0, 350000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [3.5-4.5 lakh]', 350000, 450000, 5]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [4.5-8.5 lakh]', 450000, 850000, 10]);
      expect(slabs[3]).toEqual(['Next Tk5 lakh [8.5-13.5 lakh]', 850000, 1350000, 15]);
      expect(slabs[4]).toEqual(['Next Tk5 lakh [13.5-18.5 lakh]', 1350000, 1850000, 20]);
      expect(slabs[5]).toEqual(['Next Tk20 lakh [18.5-38.5 lakh]', 1850000, 3850000, 25]);
      expect(slabs[6]).toEqual(['Above [38.5-UP lakh]', 3850000, Infinity, 30]);
    });

    test('should generate correct tax slabs for female taxpayer', () => {
      // Set up female taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      
      expect(slabs[0]).toEqual(['First Tk4 lakh [0-4 lakh]', 0, 400000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [4-5 lakh]', 400000, 500000, 5]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [5-9 lakh]', 500000, 900000, 10]);
    });

    test('should generate correct tax slabs for disabled person', () => {
      // Set up disabled person
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 35,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      
      expect(slabs[0]).toEqual(['First Tk4.8 lakh [0-4.8 lakh]', 0, 475000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [4.8-5.8 lakh]', 475000, 575000, 5]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [5.8-9.8 lakh]', 575000, 975000, 10]);
    });

    test('should generate correct tax slabs for senior citizen', () => {
      // Set up senior citizen
      store.commit('updateTaxpayerProfile', {
        category: 'senior',
        age: 67,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      
      expect(slabs[0]).toEqual(['First Tk4 lakh [0-4 lakh]', 0, 400000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [4-5 lakh]', 400000, 500000, 5]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [5-9 lakh]', 500000, 900000, 10]);
    });

    test('should generate correct tax slabs for third gender', () => {
      // Set up third gender taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'third_gender',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      
      expect(slabs[0]).toEqual(['First Tk4.8 lakh [0-4.8 lakh]', 0, 475000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [4.8-5.8 lakh]', 475000, 575000, 5]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [5.8-9.8 lakh]', 575000, 975000, 10]);
    });

    test('should generate correct tax slabs for freedom fighter', () => {
      // Set up freedom fighter
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      
      expect(slabs[0]).toEqual(['First Tk5 lakh [0-5 lakh]', 0, 500000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [5-6 lakh]', 500000, 600000, 5]);
      expect(slabs[2]).toEqual(['Next Tk4 lakh [6-10 lakh]', 600000, 1000000, 10]);
    });
  });

  describe('Tax Calculation Logic', () => {
    test('should calculate zero tax for income below threshold', () => {
      // Set up taxpayer with low income
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set salary below threshold
      store.commit('changeSubsequentSalaries', { index: 0, value: 25000 }); // 300k annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const totalTax = wrapper.vm.totalTax;
      const minimumTax = store.getters.minimumTaxAmount;
      
      // Should apply minimum tax
      expect(totalTax).toBe(minimumTax);
    });

    test('should calculate correct tax for income in first bracket', () => {
      // Set up taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set salary to 400k (50k above 350k threshold)
      store.commit('changeSubsequentSalaries', { index: 0, value: 33334 });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      
      // First slab should have no tax
      expect(taxBreakdown[0].slabCut).toBe(0);
      
      // Second slab should have tax on the excess amount
      const secondSlabTax = parseFloat(taxBreakdown[1].slabCut);
      expect(secondSlabTax).toBeGreaterThan(0);
    });

    test('should apply minimum tax when calculated tax is lower', () => {
      // Set up taxpayer in district (minimum tax 3000)
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'district'
      });
      
      // Set low salary that generates minimal tax
      store.commit('changeSubsequentSalaries', { index: 0, value: 30000 }); // 360k annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const totalTax = wrapper.vm.totalTax;
      const minimumTax = store.getters.minimumTaxAmount;
      const isMinimumTaxApplied = wrapper.vm.isMinimumTaxApplied;
      
      expect(totalTax).toBe(minimumTax);
      expect(totalTax).toBe(3000);
      expect(isMinimumTaxApplied).toBe(true);
    });

    test('should not apply minimum tax when calculated tax is higher', () => {
      // Set up taxpayer
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      // Set high salary
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 }); // 1.2M annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const totalTax = wrapper.vm.totalTax;
      const minimumTax = store.getters.minimumTaxAmount;
      const isMinimumTaxApplied = wrapper.vm.isMinimumTaxApplied;
      
      expect(totalTax).toBeGreaterThan(minimumTax);
      expect(isMinimumTaxApplied).toBe(false);
    });
  });

  describe('Tax Display', () => {
    test('should display total tax correctly', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const totalTaxDisplay = wrapper.find('h2');
      expect(totalTaxDisplay.text()).toContain(wrapper.vm.totalTax.toString());
    });

    test('should show minimum tax notice when applied', () => {
      // Set up scenario where minimum tax applies
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 30000 });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const minimumTaxNotice = wrapper.find('small[style*="color: red"]');
      expect(minimumTaxNotice.exists()).toBe(true);
      expect(minimumTaxNotice.text()).toContain('Minimum tax applied');
    });

    test('should not show minimum tax notice when not applied', () => {
      // Set up scenario where calculated tax is higher
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 100000 });

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const minimumTaxNotice = wrapper.find('small[style*="color: red"]');
      expect(minimumTaxNotice.exists()).toBe(false);
    });

    test('should display payable amount correctly', () => {
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 50000 });
      store.commit('changeSubsequentTds', { index: 0, value: 2000 });
      store.commit('changeInvestment', { index: 0, value: 50000 });

      wrapper = mount(Calculation2024, {
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
      const totalTds = store.getters.totalTds;
      const investmentRebate = store.getters.investmentRebate;
      const expectedPayable = totalTax - totalTds - investmentRebate;
      
      const payableCell = payableRow.findAll('td').at(2);
      expect(payableCell.text().trim()).toBe(expectedPayable.toString());
    });
  });

  describe('Integration with Store', () => {
    test('should respond to changes in taxpayer profile', async () => {
      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const initialSlabs = wrapper.vm.slabs;
      
      // Change taxpayer category
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      await wrapper.vm.$nextTick();
      
      const newSlabs = wrapper.vm.slabs;
      expect(newSlabs[0]).not.toEqual(initialSlabs[0]);
      expect(newSlabs[0][2]).toBe(400000); // Female threshold
    });

    test('should respond to changes in salary', async () => {
      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const initialTax = wrapper.vm.totalTax;
      
      // Increase salary
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      
      await wrapper.vm.$nextTick();
      
      const newTax = wrapper.vm.totalTax;
      expect(newTax).toBeGreaterThan(initialTax);
    });

    test('should respond to changes in investments', async () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 80000 });
      
      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const initialRebate = store.getters.investmentRebate;
      
      // Add investments
      store.commit('changeInvestment', { index: 0, value: 100000 });
      
      await wrapper.vm.$nextTick();
      
      const newRebate = store.getters.investmentRebate;
      expect(newRebate).toBeGreaterThan(initialRebate);
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    test('should handle tax calculation at exact threshold boundaries', () => {
      // Test General taxpayer at 350k threshold
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 29167 }); // Exactly 350k annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      const totalTax = wrapper.vm.totalTax;
      
      // Should have no calculated tax, only minimum tax applies
      expect(taxBreakdown[0].slabCut).toBe(0);
      expect(totalTax).toBe(5000); // Dhaka minimum tax
    });

    test('should handle tax calculation just above threshold', () => {
      // Test Female taxpayer at 400k + 1 threshold
      store.commit('updateTaxpayerProfile', {
        category: 'female',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 35000 }); // 420,000 annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      
      // Should have minimal tax on the excess amount
      expect(taxBreakdown[0].slabCut).toBe(0); // No tax on first 400k
      expect(parseFloat(taxBreakdown[1].slabCut)).toBeGreaterThan(0); // Small tax on excess
    });

    test('should correctly handle slab transitions for high-threshold profiles', () => {
      // Test Freedom Fighter with 500k threshold
      store.commit('updateTaxpayerProfile', {
        category: 'freedom_fighter',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 60000 }); // 720k annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const slabs = wrapper.vm.slabs;
      const taxBreakdown = wrapper.vm.taxBreakdown;
      
      // Verify slab structure
      expect(slabs[0]).toEqual(['First Tk5 lakh [0-5 lakh]', 0, 500000, 0]);
      expect(slabs[1]).toEqual(['Next Tk1 lakh [5-6 lakh]', 500000, 600000, 5]);
      
      // Should have tax in first taxable slab
      expect(taxBreakdown[0].slabCut).toBe(0); // No tax on first 500k
      expect(parseFloat(taxBreakdown[1].slabCut)).toBeGreaterThan(0); // Tax on 220k excess at 5%
    });

    test('should handle profile changes dynamically', () => {
      // Start with general profile
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 40000 }); // 480k annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const initialSlabs = wrapper.vm.slabs;
      expect(initialSlabs[0]).toEqual(['First Tk3.5 lakh [0-3.5 lakh]', 0, 350000, 0]);
      
      // Change to disabled profile
      store.commit('updateTaxpayerProfile', {
        category: 'disabled',
        age: 30,
        location: 'dhaka'
      });

      const newSlabs = wrapper.vm.slabs;
      expect(newSlabs[0]).toEqual(['First Tk4.8 lakh [0-4.8 lakh]', 0, 475000, 0]);
      
      // Tax should be recalculated with new threshold
      const taxBreakdown = wrapper.vm.taxBreakdown;
      expect(taxBreakdown[0].slabCut).toBe(0); // No tax on first 475k (income is 480k)
    });

    test('should handle very high income across all slabs', () => {
      // Test with income spanning all tax slabs
      store.commit('updateTaxpayerProfile', {
        category: 'general',
        age: 30,
        location: 'dhaka'
      });
      
      store.commit('changeSubsequentSalaries', { index: 0, value: 500000 }); // 6M annually

      wrapper = mount(Calculation2024, {
        global: {
          plugins: [store]
        }
      });

      const taxBreakdown = wrapper.vm.taxBreakdown;
      const totalTax = wrapper.vm.totalTax;
      
      // Should have tax in multiple slabs
      expect(taxBreakdown.length).toBe(7);
      expect(parseFloat(taxBreakdown[6].slabCut)).toBeGreaterThan(0); // Highest slab should have tax
      expect(totalTax).toBeGreaterThan(100000); // Substantial tax amount
    });
  });
});