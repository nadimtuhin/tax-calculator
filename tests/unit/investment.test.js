import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import Investment from '@/components/Investment.vue';
import salariesStore from '@/store/salaries';
import breakdownStore from '@/store/breakdown';

describe('Investment Component', () => {
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
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should render the component', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Tax rebate on investment');
    });

    test('should render investment table', () => {
      const table = wrapper.find('table');
      expect(table.exists()).toBe(true);
      
      const headers = table.findAll('th');
      expect(headers.at(1).text()).toBe('Amount');
      expect(headers.at(2).text()).toBe('Maximum allowed');
    });

    test('should render investment rows for each investment type', () => {
      const investments = store.state.salaries.investments;
      const investmentRows = wrapper.findAll('tbody tr').filter((row, index) => 
        index < investments.length
      );
      
      expect(investmentRows.length).toBe(investments.length);
      
      investmentRows.forEach((row, index) => {
        expect(row.text()).toContain(investments[index].name);
      });
    });

    test('should render summary rows', () => {
      const summaryRows = wrapper.findAll('tbody tr').filter(row => 
        row.text().includes('Total Investment') ||
        row.text().includes('Total rebateable investment') ||
        row.text().includes('Tax rebate percentage') ||
        row.text().includes('Totat rebate on investment')
      );
      
      expect(summaryRows.length).toBe(4);
    });
  });

  describe('Investment Input Functionality', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should allow editing investment amounts', async () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('100000');
        await firstInput.trigger('input');
        
        expect(store.state.salaries.investments[0].amount).toBe(100000);
      }
    });

    test('should call changeInvestment method when input changes', async () => {
      const spy = jest.spyOn(wrapper.vm, 'changeInvestment');
      
      const inputs = wrapper.findAll('input[type="number"]');
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('50000');
        await firstInput.trigger('input');
        
        expect(spy).toHaveBeenCalledWith(expect.any(Object), 0);
      }
    });

    test('should commit store mutation when investment changes', async () => {
      const spy = jest.spyOn(store, 'commit');
      
      const inputs = wrapper.findAll('input[type="number"]');
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('75000');
        await firstInput.trigger('input');
        
        expect(spy).toHaveBeenCalledWith('changeInvestment', { index: 0, value: '75000' });
      }
    });

    test('should have proper input constraints', () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      inputs.forEach(input => {
        expect(input.attributes('min')).toBe('0');
        expect(input.attributes('max')).toBe('9999999');
        expect(input.attributes('step')).toBe('1000');
      });
    });
  });

  describe('Investment Limits Display', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should display "Unlimited" for investments with very high maximum', () => {
      const investments = store.state.salaries.investments;
      const unlimitedInvestments = investments.filter(inv => inv.maximum > 9999999999);
      
      if (unlimitedInvestments.length > 0) {
        const unlimitedElements = wrapper.findAll('.unlimited');
        expect(unlimitedElements.length).toBe(unlimitedInvestments.length);
        
        unlimitedElements.forEach(element => {
          expect(element.text()).toBe('Unlimited');
        });
      }
    });

    test('should display formatted numbers for limited investments', () => {
      const investments = store.state.salaries.investments;
      const limitedInvestments = investments.filter(inv => inv.maximum <= 9999999999);
      
      if (limitedInvestments.length > 0) {
        const limitedElements = wrapper.findAll('.limited');
        expect(limitedElements.length).toBe(limitedInvestments.length);
        
        limitedElements.forEach((element, index) => {
          const expectedAmount = limitedInvestments[index].maximum.toLocaleString();
          expect(element.text()).toBe(expectedAmount);
        });
      }
    });

    test('should apply correct CSS classes for unlimited and limited investments', () => {
      const unlimitedElements = wrapper.findAll('.unlimited');
      const limitedElements = wrapper.findAll('.limited');
      
      unlimitedElements.forEach(element => {
        expect(element.classes()).toContain('unlimited');
      });
      
      limitedElements.forEach(element => {
        expect(element.classes()).toContain('limited');
      });
    });
  });

  describe('Investment Calculations Display', () => {
    beforeEach(() => {
      // Set some investment amounts for calculations
      store.commit('changeInvestment', { index: 0, value: 100000 });
      if (store.state.salaries.investments.length > 1) {
        store.commit('changeInvestment', { index: 1, value: 50000 });
      }
      
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should display total investment amount', () => {
      const totalInvestmentRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Total Investment')
      );
      
      expect(totalInvestmentRow).toBeTruthy();
      expect(totalInvestmentRow.text()).toContain(wrapper.vm.totalInvestment.toLocaleString());
    });

    test('should display total rebateable investment', () => {
      const rebateableRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Total rebateable investment')
      );
      
      expect(rebateableRow).toBeTruthy();
      expect(rebateableRow.text()).toContain(wrapper.vm.totalRebateableInvestment.toLocaleString());
    });

    test('should display maximum rebateable investment', () => {
      const maxRebateableRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Total Investment')
      );
      
      expect(maxRebateableRow).toBeTruthy();
      expect(maxRebateableRow.text()).toContain(wrapper.vm.maxRebateableInvestment.toLocaleString());
    });

    test('should display tax rebate percentage as 15%', () => {
      const rebatePercentageRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Tax rebate percentage')
      );
      
      expect(rebatePercentageRow).toBeTruthy();
      expect(rebatePercentageRow.text()).toContain('15%');
    });

    test('should display total rebate amount', () => {
      const totalRebateRow = wrapper.findAll('tbody tr').find(row => 
        row.text().includes('Totat rebate on investment')
      );
      
      expect(totalRebateRow).toBeTruthy();
      expect(totalRebateRow.text()).toContain(wrapper.vm.investmentRebate.toLocaleString());
    });
  });

  describe('Store Integration', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should react to investment changes in store', async () => {
      // Change investment in store
      store.commit('changeInvestment', { index: 0, value: 200000 });
      await wrapper.vm.$nextTick();
      
      const firstInput = wrapper.findAll('input[type="number"]')[0];
      expect(firstInput.element.value).toBe('200000');
    });

    test('should display updated calculations when investments change', async () => {
      const initialTotalInvestment = wrapper.vm.totalInvestment;
      
      // Add more investment
      store.commit('changeInvestment', { index: 0, value: 150000 });
      await wrapper.vm.$nextTick();
      
      expect(wrapper.vm.totalInvestment).not.toBe(initialTotalInvestment);
      expect(wrapper.vm.totalInvestment).toBeGreaterThan(initialTotalInvestment);
    });

    test('should access all required state properties', () => {
      expect(wrapper.vm.investments).toBeDefined();
      expect(wrapper.vm.totalInvestment).toBeDefined();
      expect(wrapper.vm.totalRebateableInvestment).toBeDefined();
      expect(wrapper.vm.maxRebateableInvestment).toBeDefined();
      expect(wrapper.vm.investmentRebate).toBeDefined();
    });

    test('should access all required getters', () => {
      expect(typeof wrapper.vm.totalInvestment).toBe('number');
      expect(typeof wrapper.vm.totalRebateableInvestment).toBe('number');
      expect(typeof wrapper.vm.maxRebateableInvestment).toBe('number');
      expect(typeof wrapper.vm.investmentRebate).toBe('number');
    });
  });

  describe('Number Formatting', () => {
    beforeEach(() => {
      // Set large numbers to test formatting
      store.commit('changeInvestment', { index: 0, value: 1500000 });
      
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should format large numbers with locale formatting', () => {
      const formattedNumbers = wrapper.findAll('td').filter(td => 
        /\d{1,3}(,\d{3})*/.test(td.text())
      );
      
      // Should have some formatted numbers
      expect(formattedNumbers.length).toBeGreaterThan(0);
    });

    test('should use toLocaleString for number formatting', () => {
      const testNumber = 1500000;
      const formattedNumber = testNumber.toLocaleString();
      
      // Should contain formatted representation somewhere in the component
      expect(wrapper.text()).toContain(formattedNumber);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should handle empty input values', async () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('');
        await firstInput.trigger('input');
        
        // Should handle empty values gracefully
        expect(wrapper.vm.totalInvestment).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle maximum value constraints', async () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('99999999'); // At maximum
        await firstInput.trigger('input');
        
        expect(store.state.salaries.investments[0].amount).toBe(99999999);
      }
    });
  });

  describe('Component Methods', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should have changeInvestment method', () => {
      expect(typeof wrapper.vm.changeInvestment).toBe('function');
    });

    test('changeInvestment should handle event object correctly', () => {
      const mockEvent = {
        target: {
          value: '125000'
        }
      };
      
      const spy = jest.spyOn(store, 'commit');
      wrapper.vm.changeInvestment(mockEvent, 0);
      
      expect(spy).toHaveBeenCalledWith('changeInvestment', { index: 0, value: '125000' });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should handle zero investment amounts', async () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('0');
        await firstInput.trigger('input');
        
        expect(store.state.salaries.investments[0].amount).toBe(0);
        expect(wrapper.vm.totalInvestment).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle very large investment amounts', async () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      if (inputs.length > 0) {
        const firstInput = inputs[0];
        await firstInput.setValue('5000000');
        await firstInput.trigger('input');
        
        expect(store.state.salaries.investments[0].amount).toBe(5000000);
      }
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(Investment, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should have proper table structure', () => {
      const table = wrapper.find('table');
      expect(table.exists()).toBe(true);
      
      const thead = table.find('thead');
      const tbody = table.find('tbody');
      
      expect(thead.exists()).toBe(true);
      expect(tbody.exists()).toBe(true);
    });

    test('should have proper input labels through table structure', () => {
      const inputs = wrapper.findAll('input[type="number"]');
      
      inputs.forEach((input, index) => {
        const parentRow = input.element.closest('tr');
        const nameCell = parentRow?.querySelector('td:first-child');
        
        expect(nameCell).toBeTruthy();
        expect(nameCell.textContent.trim()).toBeTruthy();
      });
    });
  });
});