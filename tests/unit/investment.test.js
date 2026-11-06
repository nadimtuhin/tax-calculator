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

    test('should render the component and headers', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('h2').text()).toContain('Tax rebate on investment');
      const headers = wrapper.findAll('th');
      expect(headers.at(1).text()).toBe('Amount');
      expect(headers.at(2).text()).toBe('Maximum allowed');
    });

    test('should render investment rows and summary rows without typo', () => {
      const investments = store.state.salaries.investments;
      const rows = wrapper.findAll('tbody tr');
      expect(rows.length).toBe(investments.length + 4);

      expect(wrapper.text()).toContain('Total Investment');
      expect(wrapper.text()).toContain('Total rebateable investment');
      expect(wrapper.text()).toContain('Tax rebate percentage');
      expect(wrapper.text()).toContain('Total rebate on investment');
      expect(wrapper.text()).not.toContain('Totat rebate');
    });
  });

  describe('Year-Aware Sixth Schedule Part 3 Caps & Section 78 Rebate', () => {
    test('displays Unlimited for Mutual fund in FY 2025-26/2026-27 and 500,000 in FY 2024-25', async () => {
      wrapper = mount(Investment, { global: { plugins: [store] } });

      // Default FY 2025-26: Life insurance shows "10% of policy value" (never Unlimited); Mutual fund Unlimited
      const lifeRow = wrapper.findAll('tbody tr').find(r => r.text().includes('Life insurance premium'));
      expect(lifeRow.text()).toContain('10% of policy value');
      expect(lifeRow.text()).not.toContain('Unlimited');

      let mfRow = wrapper.findAll('tbody tr').find(r => r.text().includes('Mutual fund'));
      expect(mfRow.text()).toContain('Unlimited');
      expect(wrapper.text()).toContain('10%');

      // Switch to FY 2024-25: Mutual fund capped at 500,000 and rebate percentage is 15%
      store.commit('setCurrentYear', '2024-25');
      await wrapper.vm.$nextTick();

      mfRow = wrapper.findAll('tbody tr').find(r => r.text().includes('Mutual fund'));
      expect(mfRow.text()).toContain('500,000');
      expect(wrapper.text()).toContain('15%');
    });

    test('enforces per-instrument caps when computing eligible investment and rebate', async () => {
      // Gross 3.6M -> Taxable 3.1M (3% = 93,000)
      store.commit('changeSubsequentSalaries', { index: 0, value: 300000 });
      // DPS = 200,000 (capped at 120,000), Mutual fund = 700,000 (uncapped in 2025-26, capped at 500,000 in 2024-25)
      store.commit('changeInvestment', { index: 0, value: 200000 });
      store.commit('changeInvestment', { index: 4, value: 700000 });

      wrapper = mount(Investment, { global: { plugins: [store] } });

      // FY 2025-26: eligible = 120,000 + 700,000 = 820,000 -> 10% = 82,000 (< 93,000)
      expect(store.getters.eligibleInvestment).toBe(820000);
      expect(store.getters.investmentRebate).toBe(82000);

      // FY 2024-25: eligible = 120,000 + 500,000 = 620,000 -> 15% = 93,000 (matches 3% of 3.1M = 93,000)
      store.commit('setCurrentYear', '2024-25');
      await wrapper.vm.$nextTick();
      expect(store.getters.eligibleInvestment).toBe(620000);
      expect(store.getters.investmentRebate).toBe(93000);
    });

    test('caps Life insurance premium at 10% of policy sum assured when policy value is entered', async () => {
      store.commit('changeSubsequentSalaries', { index: 0, value: 166667 }); // ~2M gross -> 1.5M taxable (3% = 45,000)
      store.commit('changeInvestment', { index: 1, value: 500000 }); // 5L premium

      wrapper = mount(Investment, { global: { plugins: [store] } });

      // Before entering policy sum assured: warning shown and eligible investment is 0 (never uncapped)
      expect(store.getters.eligibleInvestment).toBe(0);
      expect(wrapper.find('.policy-warning').exists()).toBe(true);

      const policyInput = wrapper.find('[aria-label="Life insurance policy value"]');
      expect(policyInput.exists()).toBe(true);
      await policyInput.setValue('1000000'); // 10L policy -> 10% cap = 100,000
      await policyInput.trigger('input');

      expect(store.getters.eligibleInvestment).toBe(100000);
      expect(store.getters.investmentRebate).toBe(10000); // 10% of 100k = 10k (not 45k)
      expect(wrapper.find('.policy-warning').exists()).toBe(false);
      expect(wrapper.text()).toContain('100,000 (10% of policy)');
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

    test('should allow editing investment amounts and commit changeInvestment', async () => {
      const spy = jest.spyOn(store, 'commit');
      const firstInput = wrapper.findAll('input[type="number"]')[0];
      await firstInput.setValue('75000');
      await firstInput.trigger('input');

      expect(spy).toHaveBeenCalledWith('changeInvestment', { index: 0, value: '75000' });
      expect(store.state.salaries.investments[0].amount).toBe(75000);
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
});
