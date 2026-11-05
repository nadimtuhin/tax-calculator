import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TaxComparison from '@/components/TaxComparison.vue';

const mountWith = (figures) => {
  const getters = {
    totalTax2025: () => figures.total2025,
    totalTax2026: () => figures.total2026,
    payableTax2025: () => figures.payable2025,
    payableTax2026: () => figures.payable2026,
    taxFreeThreshold2025: () => 350000,
    taxFreeThreshold2026: () => 375000,
    taxDifference: () => figures.total2026 - figures.total2025,
    taxSavings: () => Math.max(figures.total2025 - figures.total2026, 0),
    additionalTax: () => Math.max(figures.total2026 - figures.total2025, 0),
    currentYear: () => '2026-27',
    fiscalYearOptions: () => [{ value: '2026-27', label: 'FY 2026-2027' }]
  };
  return mount(TaxComparison, { global: { plugins: [createStore({ getters })] } });
};

describe('TaxComparison hero', () => {
  test('total tax down while payable goes up (the fixed sample)', () => {
    const wrapper = mountWith({ total2025: 39450, total2026: 35700, payable2025: 11310, payable2026: 14700 });
    expect(wrapper.find('.verdict-savings').text()).toContain('You will save ৳3,750 in total tax');
    expect(wrapper.find('[data-testid="payable-change"]').text()).toContain('goes up by ৳3,390');
    expect(wrapper.find('.mobile-bar').text()).toContain('up ৳3,390');
    expect(wrapper.find('.mobile-bar').text()).toContain('৳-3,750');
  });

  test('total tax up while payable goes down', () => {
    const wrapper = mountWith({ total2025: 35700, total2026: 39450, payable2025: 14700, payable2026: 11310 });
    expect(wrapper.find('.verdict-increase').text()).toContain('You will pay ৳3,750 more in total tax');
    expect(wrapper.find('[data-testid="payable-change"]').text()).toContain('goes down by ৳3,390');
  });

  test('no change in either figure', () => {
    const wrapper = mountWith({ total2025: 5000, total2026: 5000, payable2025: 5000, payable2026: 5000 });
    expect(wrapper.find('.verdict-neutral').text()).toContain('No change in total tax');
    expect(wrapper.find('[data-testid="payable-change"]').text()).toContain('stays ৳5,000');
  });
});
