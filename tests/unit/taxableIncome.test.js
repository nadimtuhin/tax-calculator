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
      expect(headers.at(0).text()).toBe('Component');
      expect(headers.at(1).text()).toBe('Annual Total');
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

      expect(incomeRows.length).toBeGreaterThanOrEqual(6);
    });

    test('should render gross salary, statutory exemption, and taxable salary summary rows', () => {
      const rows = wrapper.findAll('tbody tr');
      expect(rows.some(r => r.text().includes('Gross Salary'))).toBe(true);
      expect(rows.some(r => r.text().includes('Statutory Exemption'))).toBe(true);
      expect(rows.some(r => r.text().includes('Taxable Salary'))).toBe(true);
    });
  });

  describe('Income Breakdown & Single-Pool Exemption Display (ITA 2023 Para 27)', () => {
    beforeEach(() => {
      store.commit('changeParts', { part: 'basic', index: 0, value: 60000 });
      store.commit('changeParts', { part: 'house', index: 0, value: 30000 });
      store.commit('changeParts', { part: 'medical', index: 0, value: 10000 });
      store.commit('changeParts', { part: 'transport', index: 0, value: 5000 });
      store.commit('changeBonus', 100000);
      store.commit('changeOthers', 50000);

      wrapper = mount(TaxableIncome, {
        global: {
          plugins: [store]
        }
      });
    });

    test('should display component totals accurately', () => {
      const rows = wrapper.findAll('tbody tr');
      expect(rows.find(r => r.text().includes('Basic')).text()).toContain('720000');
      expect(rows.find(r => r.text().includes('House')).text()).toContain('360000');
      expect(rows.find(r => r.text().includes('Medical')).text()).toContain('120000');
      expect(rows.find(r => r.text().includes('Transport')).text()).toContain('60000');
      expect(rows.find(r => r.text().includes('Bonus')).text()).toContain('100000');
    });

    test('should apply single-pool min(1/3 gross, 500k) exemption', async () => {
      // Gross = 12 * 105k + 100k + 50k = 1,410,000 -> 1/3 = 470,000 (< 500,000)
      expect(wrapper.vm.totalSalary).toBe(1410000);
      expect(wrapper.vm.totalExempt).toBe(470000);
      expect(wrapper.vm.taxableSalary).toBe(940000);

      // Push gross above 1.5M -> capped at 500,000 in FY 2024-25/2025-26/2026-27
      store.commit('changeBonus', 400000);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.totalSalary).toBe(1710000);
      expect(wrapper.vm.totalExempt).toBe(500000);
      expect(wrapper.vm.taxableSalary).toBe(1210000);

      // In FY 2023-24, cap is 450,000
      store.commit('setCurrentYear', '2023-24');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.exemptionCap).toBe(450000);
      expect(wrapper.vm.totalExempt).toBe(450000);
      expect(wrapper.vm.taxableSalary).toBe(1260000);
    });

    test('should show second bonus row only when bonus2 > 0', async () => {
      expect(wrapper.vm.bonus2).toBe(0);
      store.commit('changeBonus2', 75000);
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.bonus2).toBe(75000);
      const bonusRows = wrapper.findAll('tbody tr').filter(r => r.text().includes('Bonus'));
      expect(bonusRows.length).toBe(2);
    });
  });

  describe('Tooltip Modal & Accessibility', () => {
    beforeEach(() => {
      wrapper = mount(TaxableIncome, {
        attachTo: document.body,
        global: {
          plugins: [store]
        }
      });
    });

    test('should render single-pool exemption help button and display Para 27 rules', async () => {
      const trigger = wrapper.find('[aria-label="About employment income exemption"]');
      expect(trigger.exists()).toBe(true);
      expect(wrapper.vm.showTooltip).toBe(null);

      await trigger.trigger('click');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.showTooltip).toBe('exemption');
      const modal = wrapper.find('.tooltip-modal');
      expect(modal.exists()).toBe(true);
      expect(modal.text()).toContain('Sixth Schedule Part 1 Para 27');
      expect(modal.text()).toContain('1/3 of gross employment income');
      expect(modal.text()).toContain('500,000');
    });

    test('moves initial focus to close button, traps Tab/Shift+Tab, and closes on Escape / backdrop click', async () => {
      const trigger = wrapper.find('[aria-label="About employment income exemption"]');
      trigger.element.focus();
      await trigger.trigger('click');
      await wrapper.vm.$nextTick();

      const modal = wrapper.find('.tooltip-modal');
      const closeBtn = wrapper.find('.tooltip-close');
      expect(modal.attributes('role')).toBe('dialog');
      expect(modal.attributes('aria-modal')).toBe('true');
      expect(document.activeElement).toBe(closeBtn.element);

      const forwardTab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      window.dispatchEvent(forwardTab);
      expect(forwardTab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeBtn.element);

      const backwardTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      window.dispatchEvent(backwardTab);
      expect(backwardTab.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(closeBtn.element);

      const esc = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      window.dispatchEvent(esc);
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.find('.tooltip-modal').exists()).toBe(false);
      expect(document.activeElement).toBe(trigger.element);

      // Reopen and close via backdrop click
      await trigger.trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.find('.tooltip-overlay').trigger('click');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.tooltip-modal').exists()).toBe(false);
      expect(document.activeElement).toBe(trigger.element);
    });
  });
});
