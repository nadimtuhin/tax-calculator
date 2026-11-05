import calculateTaxBreakdown2026, {
  calculateFinalTax2026
} from '@/calculateTaxBreakdown2026';
import { calculateTaxSlabs2026 } from '@/utils/taxSlabs2026';

describe('calculateTaxBreakdown2026', () => {
  let generalSlabs;

  beforeEach(() => {
    generalSlabs = calculateTaxSlabs2026(400000); // general taxpayer
  });

  test('income below threshold: all slabs zero tax', () => {
    const bd = calculateTaxBreakdown2026(300000, generalSlabs);
    expect(bd.every(s => s.slabCut === 0)).toBe(true);
  });

  test('income at threshold: no tax', () => {
    const bd = calculateTaxBreakdown2026(400000, generalSlabs);
    expect(bd.reduce((sum, s) => sum + s.slabCut, 0)).toBe(0);
  });

  test('income 5,00,000: tax on 1L @10% = 10,000', () => {
    const bd = calculateTaxBreakdown2026(500000, generalSlabs);
    expect(bd[0].slabCut).toBe(0);
    expect(bd[1].slabCut).toBe(10000); // 100k * 10%
    expect(bd[2].slabCut).toBe(0);
  });

  test('income 15,00,000: correct multi-slab tax', () => {
    const bd = calculateTaxBreakdown2026(1500000, generalSlabs);
    // [0] 4L @0% = 0
    // [1] 3L @10% = 30,000
    // [2] 4L @15% = 60,000
    // [3] 4L @20% = 80,000
    expect(bd[0].slabCut).toBe(0);
    expect(bd[1].slabCut).toBe(30000);
    expect(bd[2].slabCut).toBe(60000);
    expect(bd[3].slabCut).toBe(80000);
    expect(bd[4].slabCut).toBe(0);
    expect(bd[5].slabCut).toBe(0);
  });

  test('high income spanning all slabs', () => {
    const bd = calculateTaxBreakdown2026(5000000, generalSlabs);
    // [0] 4L @0 = 0
    // [1] 3L @10 = 30k
    // [2] 4L @15 = 60k
    // [3] 5L @20 = 100k
    // [4] 20L @25 = 500k
    // [5] 5-4-3-5-20 = 50L-36L = 14L @30 = 420k
    expect(bd[0].slabAmount).toBe(400000);
    expect(bd[1].slabAmount).toBe(300000);
    expect(bd[2].slabAmount).toBe(400000);
    expect(bd[3].slabAmount).toBe(500000);
    expect(bd[4].slabAmount).toBe(2000000);
    expect(bd[5].slabAmount).toBe(5000000 - 400000 - 300000 - 400000 - 500000 - 2000000);
    const totalTax = bd.reduce((s, x) => s + x.slabCut, 0);
    expect(totalTax).toBe(0 + 30000 + 60000 + 100000 + 500000 + Math.round(bd[5].slabAmount * 0.3));
  });

  test('ids contain "slab-2026-" prefix', () => {
    const bd = calculateTaxBreakdown2026(500000, generalSlabs);
    bd.forEach(s => expect(s.id).toMatch(/^slab-2026-/));
  });

  test('all required properties present', () => {
    const bd = calculateTaxBreakdown2026(500000, generalSlabs);
    bd.forEach(s => {
      ['id', 'slabTitle', 'slabUpper', 'slabLower', 'slabPercentage', 'slabAmount', 'slabCut']
        .forEach(k => expect(s).toHaveProperty(k));
    });
  });
});

describe('calculateFinalTax2026', () => {
  test('minimum tax applied when calculated < minimum', () => {
    const result = calculateFinalTax2026(2000, 5000, 0, 0);
    expect(result.totalTax).toBe(5000);
    expect(result.isMinimumTaxApplied).toBe(true);
    expect(result.payable).toBe(5000);
  });

  test('calculated tax used when >= minimum', () => {
    const result = calculateFinalTax2026(10000, 5000, 0, 0);
    expect(result.totalTax).toBe(10000);
    expect(result.isMinimumTaxApplied).toBe(false);
  });

  test('TDS and rebate reduce payable', () => {
    const result = calculateFinalTax2026(30000, 5000, 5000, 3000);
    expect(result.payable).toBe(22000); // 30000 - 5000 - 3000
  });

  test('rebate cannot reduce liability below minimum tax floor, but TDS reduces payable to zero', () => {
    const floorHit = calculateFinalTax2026(5000, 5000, 4000, 4000);
    expect(floorHit.totalTax).toBe(5000);
    expect(floorHit.isMinimumTaxApplied).toBe(true);
    expect(floorHit.payable).toBe(1000); // 5000 min tax - 4000 TDS

    const fullyCoveredByTds = calculateFinalTax2026(5000, 5000, 6000, 4000);
    expect(fullyCoveredByTds.payable).toBe(0);
  });
});
