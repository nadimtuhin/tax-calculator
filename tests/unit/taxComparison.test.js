import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import TaxComparison from '@/components/TaxComparison.vue';

const mountWith = ({
  total2025,
  total2026,
  payable2025,
  payable2026,
  threshold2025 = 400000,
  threshold2026 = 400000,
  taxDiff = total2026 - total2025,
  savings = Math.max(total2025 - total2026, 0),
  additional = Math.max(total2026 - total2025, 0),
  currentYear = '2026-27'
}) => {
  const getters = {
    totalTax2025: () => total2025,
    totalTax2026: () => total2026,
    payableTax2025: () => payable2025,
    payableTax2026: () => payable2026,
    taxFreeThreshold2025: () => threshold2025,
    taxFreeThreshold2026: () => threshold2026,
    taxDifference: () => taxDiff,
    taxSavings: () => savings,
    additionalTax: () => additional,
    currentYear: () => currentYear
  };
  return mount(TaxComparison, { global: { plugins: [createStore({ getters })] } });
};

describe('TaxComparison hero', () => {
  test('total tax down while payable goes up (the fixed sample)', () => {
    const wrapper = mountWith({
      total2025: 39450,
      total2026: 35700,
      payable2025: 11310,
      payable2026: 14700,
      taxDiff: -3750,
      savings: 3750,
      additional: 0
    });
    expect(wrapper.find('.verdict-savings').text()).toContain('You will save ৳3,750 in total tax');
    const payableEl = wrapper.find('[data-testid="payable-change"]');
    expect(payableEl.text()).toContain('goes up by ৳3,390 (৳11,310 to ৳14,700)');
    expect(payableEl.classes()).toContain('negative');
    expect(wrapper.find('[data-testid="mobile-payable-change"]').text()).toBe('up ৳3,390 vs FY 2025-26');
    expect(wrapper.find('[data-testid="mobile-payable-change"]').classes()).toContain('negative');
    expect(wrapper.find('[data-testid="mobile-total-diff"]').text()).toContain('-৳3,750');
    expect(wrapper.find('[data-testid="mobile-total-diff"]').classes()).toContain('positive');
    expect(wrapper.find('[data-testid="total-tax-diff"]').text()).toBe('-৳3,750');
    expect(wrapper.find('[data-testid="payable-tax-diff"]').text()).toBe('+৳3,390');
  });

  test('total tax up while payable goes down', () => {
    const wrapper = mountWith({
      total2025: 35700,
      total2026: 39450,
      payable2025: 14700,
      payable2026: 11310,
      taxDiff: 3750,
      savings: 0,
      additional: 3750
    });
    expect(wrapper.find('.verdict-increase').text()).toContain('You will pay ৳3,750 more in total tax');
    expect(wrapper.find('[data-testid="payable-change"]').text()).toContain('goes down by ৳3,390');
    expect(wrapper.find('[data-testid="payable-change"]').classes()).toContain('positive');
    expect(wrapper.find('[data-testid="total-tax-diff"]').text()).toBe('+৳3,750');
    expect(wrapper.find('[data-testid="payable-tax-diff"]').text()).toBe('-৳3,390');
  });

  test('both total tax and payable decrease together', () => {
    const wrapper = mountWith({
      total2025: 20000,
      total2026: 17500,
      payable2025: 20000,
      payable2026: 17500,
      taxDiff: -2500,
      savings: 2500,
      additional: 0
    });
    expect(wrapper.find('.verdict-savings').exists()).toBe(true);
    expect(wrapper.find('[data-testid="payable-change"]').classes()).toContain('positive');
    expect(wrapper.find('[data-testid="mobile-payable-change"]').text()).toBe('down ৳2,500 vs FY 2025-26');
  });

  test('no change in either figure renders neutral styling (not green/positive)', () => {
    const wrapper = mountWith({
      total2025: 5000,
      total2026: 5000,
      payable2025: 5000,
      payable2026: 5000,
      taxDiff: 0,
      savings: 0,
      additional: 0
    });
    expect(wrapper.find('.verdict-neutral').text()).toContain('No change in total tax');
    expect(wrapper.find('[data-testid="payable-change"]').text()).toContain('stays ৳5,000');
    expect(wrapper.find('[data-testid="payable-change"]').classes()).not.toContain('positive');
    expect(wrapper.find('[data-testid="payable-change"]').classes()).not.toContain('negative');
    expect(wrapper.find('[data-testid="mobile-total-diff"]').classes()).not.toContain('positive');
    expect(wrapper.find('[data-testid="mobile-total-diff"]').classes()).not.toContain('negative');
    expect(wrapper.find('[data-testid="total-tax-diff"]').text()).toBe('৳0');
    expect(wrapper.find('[data-testid="total-tax-diff"]').classes()).toEqual([]);
    expect(wrapper.find('[data-testid="payable-tax-diff"]').text()).toBe('৳0');
    expect(wrapper.find('[data-testid="payable-tax-diff"]').classes()).toEqual([]);
  });

  test('tiles keep accurate FY 2025-2026 and FY 2026-2027 labels even when profile selects 2024-25', () => {
    const wrapper2024 = mountWith({
      total2025: 35700,
      total2026: 35700,
      payable2025: 11310,
      payable2026: 14700,
      threshold2025: 400000,
      threshold2026: 400000,
      currentYear: '2024-25'
    });
    const cards2024 = wrapper2024.findAll('.comparison-card');
    expect(cards2024).toHaveLength(2);
    expect(cards2024[0].text()).toContain('FY 2025-2026');
    expect(cards2024[0].text()).toContain('৳35,700');
    expect(cards2024[0].text()).toContain('৳400,000');
    expect(cards2024[0].classes()).not.toContain('is-selected');
    expect(cards2024[1].text()).toContain('FY 2026-2027');
    expect(cards2024[1].text()).toContain('৳35,700');
    expect(cards2024[1].text()).toContain('৳400,000');
    expect(cards2024[1].classes()).not.toContain('is-selected');
    expect(wrapper2024.text()).not.toContain('FY 2024-2025');

    const wrapper2025 = mountWith({
      total2025: 39450,
      total2026: 35700,
      payable2025: 11310,
      payable2026: 14700,
      currentYear: '2025-26'
    });
    expect(wrapper2025.findAll('.comparison-card')[0].text()).toContain('FY 2025-2026 (Selected)');
    expect(wrapper2025.findAll('.comparison-card')[1].text()).not.toContain('(Selected)');
  });

  test('detailed breakdown reflects matching 400k-family thresholds across FY 2025-26 and FY 2026-27', () => {
    const wrapper = mountWith({
      total2025: 35700,
      total2026: 35700,
      payable2025: 11310,
      payable2026: 14700,
      threshold2025: 400000,
      threshold2026: 400000
    });
    const breakdownText = wrapper.find('.comparison-breakdown').text();
    expect(breakdownText).toContain('Tax-free thresholds match FY 2025-26');
    expect(breakdownText).toContain('AY 2026-27 and AY 2027-28');
    const thresholdRowCells = wrapper.findAll('.breakdown-table tbody tr')[0].findAll('td');
    expect(thresholdRowCells[1].text()).toBe('৳400,000');
    expect(thresholdRowCells[2].text()).toBe('৳400,000');
    expect(thresholdRowCells[3].text()).toBe('৳0');
    expect(thresholdRowCells[3].classes()).toEqual([]);
  });
});
