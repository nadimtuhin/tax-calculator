import calculateTaxBreakdown2025, { 
  calculateInvestmentRebate2025,
  calculateFinalTax2025 
} from '@/calculateTaxBreakdown2025';
import { calculateTaxSlabs2025 } from '@/utils/taxSlabs2025';

describe('Calculate Tax Breakdown 2025 Functions', () => {
  let testSlabs;

  beforeEach(() => {
    // Create standard test slabs for general taxpayer (400k threshold)
    testSlabs = calculateTaxSlabs2025(400000);
  });

  describe('calculateTaxBreakdown2025', () => {
    test('should calculate no tax for income below threshold', () => {
      const taxableSalary = 300000; // Below 400k threshold
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);

      expect(breakdown).toHaveLength(6);
      
      // All slabs should have zero tax
      breakdown.forEach(slab => {
        expect(slab.slabCut).toBe(0);
      });
    });

    test('should calculate tax correctly for income in first taxable bracket', () => {
      const taxableSalary = 500000; // 100k above 400k threshold, in 10% bracket
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);

      expect(breakdown).toHaveLength(6);
      
      // First slab (0%) should have no tax
      expect(breakdown[0].slabCut).toBe(0);
      expect(breakdown[0].slabAmount).toBe(400000);
      
      // Second slab (10%) should have tax on 100k
      expect(breakdown[1].slabCut).toBe(10000); // 100k * 10% = 10k
      expect(breakdown[1].slabAmount).toBe(100000);
      
      // Remaining slabs should have no tax
      for (let i = 2; i < 6; i++) {
        expect(breakdown[i].slabCut).toBe(0);
        expect(breakdown[i].slabAmount).toBe(0);
      }
    });

    test('should calculate tax correctly for income spanning multiple brackets', () => {
      const taxableSalary = 1200000; // Spans first 3 brackets
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);

      // First slab: 400k at 0% = 0
      expect(breakdown[0].slabCut).toBe(0);
      expect(breakdown[0].slabAmount).toBe(400000);
      
      // Second slab: 300k at 10% = 30k
      expect(breakdown[1].slabCut).toBe(30000);
      expect(breakdown[1].slabAmount).toBe(300000);
      
      // Third slab: 400k at 15% = 60k
      expect(breakdown[2].slabCut).toBe(60000);
      expect(breakdown[2].slabAmount).toBe(400000);
      
      // Fourth slab: 100k at 20% = 20k
      expect(breakdown[3].slabCut).toBe(20000);
      expect(breakdown[3].slabAmount).toBe(100000);
      
      // Remaining slabs should have no tax
      expect(breakdown[4].slabCut).toBe(0);
      expect(breakdown[5].slabCut).toBe(0);
    });

    test('should handle very high income spanning all brackets', () => {
      const taxableSalary = 5000000; // 50 lakh, spans all brackets
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);

      // All slabs should have some amount
      expect(breakdown[0].slabAmount).toBe(400000);  // 4L at 0%
      expect(breakdown[1].slabAmount).toBe(300000);  // 3L at 10%
      expect(breakdown[2].slabAmount).toBe(400000);  // 4L at 15%
      expect(breakdown[3].slabAmount).toBe(500000);  // 5L at 20%
      expect(breakdown[4].slabAmount).toBe(2000000); // 20L at 25%
      expect(breakdown[5].slabAmount).toBe(1400000); // Remaining at 30%

      // Calculate expected tax
      const expectedTax = 0 + 30000 + 60000 + 100000 + 500000 + 420000;
      const actualTax = breakdown.reduce((sum, slab) => sum + slab.slabCut, 0);
      expect(actualTax).toBe(expectedTax);
    });

    test('should have correct slab IDs with 2025 prefix', () => {
      const taxableSalary = 500000;
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);

      breakdown.forEach((slab, index) => {
        expect(slab.id).toContain('slab-2025-');
        expect(slab.id).toContain(`-${index}-`);
      });
    });

    test('should include all required properties in breakdown', () => {
      const taxableSalary = 500000;
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);

      breakdown.forEach(slab => {
        expect(slab).toHaveProperty('id');
        expect(slab).toHaveProperty('slabTitle');
        expect(slab).toHaveProperty('slabUpper');
        expect(slab).toHaveProperty('slabLower');
        expect(slab).toHaveProperty('slabPercentage');
        expect(slab).toHaveProperty('slabAmount');
        expect(slab).toHaveProperty('slabCut');
      });
    });

    test('should handle boundary values correctly', () => {
      // Test exact threshold
      let breakdown = calculateTaxBreakdown2025(400000, testSlabs);
      expect(breakdown[0].slabCut).toBe(0);
      expect(breakdown[1].slabCut).toBe(0);

      // Test one taka above threshold
      breakdown = calculateTaxBreakdown2025(400001, testSlabs);
      expect(breakdown[0].slabCut).toBe(0);
      expect(breakdown[1].slabCut).toBe(0); // Should be rounded to 0
      expect(breakdown[1].slabAmount).toBe(1);

      // Test exact slab boundary
      breakdown = calculateTaxBreakdown2025(700000, testSlabs); // End of 10% slab
      expect(breakdown[1].slabAmount).toBe(300000);
      expect(breakdown[1].slabCut).toBe(30000);
      expect(breakdown[2].slabCut).toBe(0);
    });
  });

  describe('calculateInvestmentRebate2025', () => {
    test('should calculate rebate correctly', () => {
      const totalInvestment = 200000;
      const rebatePercentage = 15;
      const maxRebateable = 300000;

      const rebate = calculateInvestmentRebate2025(totalInvestment, rebatePercentage, maxRebateable);
      expect(rebate).toBe(30000); // 200k * 15% = 30k
    });

    test('should limit rebate to maximum rebateable investment', () => {
      const totalInvestment = 500000;
      const rebatePercentage = 15;
      const maxRebateable = 300000; // Lower than total investment

      const rebate = calculateInvestmentRebate2025(totalInvestment, rebatePercentage, maxRebateable);
      expect(rebate).toBe(45000); // 300k * 15% = 45k (not 500k * 15%)
    });

    test('should handle zero investment', () => {
      const rebate = calculateInvestmentRebate2025(0, 15, 100000);
      expect(rebate).toBe(0);
    });

    test('should handle zero rebate percentage', () => {
      const rebate = calculateInvestmentRebate2025(100000, 0, 200000);
      expect(rebate).toBe(0);
    });

    test('should round rebate amount', () => {
      const totalInvestment = 333333;
      const rebatePercentage = 15;
      const maxRebateable = 500000;

      const rebate = calculateInvestmentRebate2025(totalInvestment, rebatePercentage, maxRebateable);
      expect(rebate).toBe(50000); // 333333 * 15% = 49999.95, rounds to 50000
    });
  });

  describe('calculateFinalTax2025 (IT-11GA2023 Lines 12-16 order)', () => {
    test('should apply rebate before minimum-tax floor and deduct TDS after Line 16', () => {
      const calculatedTax = 3000;
      const minimumTax = 5000;
      const totalTds = 1000;
      const investmentRebate = 500;

      const result = calculateFinalTax2025(calculatedTax, minimumTax, totalTds, investmentRebate);

      expect(result.taxAfterRebate).toBe(2500);
      expect(result.totalTax).toBe(5000); // Rebate cannot push below 5000 minimum tax
      expect(result.isMinimumTaxApplied).toBe(true);
      expect(result.minimumTaxAmount).toBe(5000);
      expect(result.payable).toBe(4000); // 5000 - 1000 TDS
      expect(result.totalTds).toBe(1000);
      expect(result.investmentRebate).toBe(500);
    });

    test('should use taxAfterRebate when higher than minimum tax', () => {
      const calculatedTax = 8000;
      const minimumTax = 5000;
      const totalTds = 1000;
      const investmentRebate = 500;

      const result = calculateFinalTax2025(calculatedTax, minimumTax, totalTds, investmentRebate);

      expect(result.taxAfterRebate).toBe(7500);
      expect(result.totalTax).toBe(7500); // 8000 - 500 rebate >= 5000 min tax
      expect(result.isMinimumTaxApplied).toBe(false);
      expect(result.minimumTaxAmount).toBe(5000);
      expect(result.payable).toBe(6500); // 7500 - 1000 TDS
    });

    test('should never have negative payable amount when TDS exceeds minimum tax', () => {
      const result = calculateFinalTax2025(5000, 5000, 6000, 3000);

      expect(result.totalTax).toBe(5000); // Line 16 floored at 5000
      expect(result.payable).toBe(0); // 5000 - 6000 TDS -> 0
    });

    test('should return zero minimum tax and zero payable at or below threshold', () => {
      const result = calculateFinalTax2025(0, 5000, 0, 0);

      expect(result.totalTax).toBe(0);
      expect(result.minimumTaxAmount).toBe(0);
      expect(result.isMinimumTaxApplied).toBe(false);
      expect(result.payable).toBe(0);
    });

    test('should floor Line 16 at minimum tax when rebate exceeds slab difference, then deduct TDS', () => {
      const calculatedTax = 10000;
      const minimumTax = 5000;
      const totalTds = 8000;
      const investmentRebate = 7000; // 10000 - 7000 = 3000 < 5000 -> Line 16 = 5000

      const result = calculateFinalTax2025(calculatedTax, minimumTax, totalTds, investmentRebate);

      expect(result.totalTax).toBe(5000);
      expect(result.isMinimumTaxApplied).toBe(true);
      expect(result.payable).toBe(0); // 5000 - 8000 TDS -> 0
    });
  });

  describe('Integration Tests', () => {
    test('should work correctly with different taxpayer thresholds', () => {
      const testCases = [
        { threshold: 400000, expectedSlabs: 6 }, // General
        { threshold: 450000, expectedSlabs: 6 }, // Female
        { threshold: 525000, expectedSlabs: 6 }, // Disabled
        { threshold: 550000, expectedSlabs: 6 }  // Freedom Fighter / July Warrior
      ];

      testCases.forEach(({ threshold, expectedSlabs }) => {
        const slabs = calculateTaxSlabs2025(threshold);
        const breakdown = calculateTaxBreakdown2025(threshold + 100000, slabs);

        expect(breakdown).toHaveLength(expectedSlabs);
        expect(breakdown[0].slabCut).toBe(0); // First slab should be tax-free
        expect(breakdown[1].slabCut).toBeGreaterThan(0); // Second slab should have tax
      });
    });

    test('should maintain consistency between breakdown and total calculations', () => {
      const taxableSalary = 1500000;
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);
      
      const totalTaxFromBreakdown = breakdown.reduce((sum, slab) => sum + slab.slabCut, 0);
      const totalAmountFromBreakdown = breakdown.reduce((sum, slab) => sum + slab.slabAmount, 0);

      expect(totalAmountFromBreakdown).toBe(taxableSalary);
      expect(totalTaxFromBreakdown).toBeGreaterThan(0);
    });

    test('should work with complete tax calculation workflow', () => {
      const taxableSalary = 800000;
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);
      const calculatedTax = breakdown.reduce((sum, slab) => sum + slab.slabCut, 0);
      
      const investmentRebate = calculateInvestmentRebate2025(100000, 15, 160000);
      const finalTax = calculateFinalTax2025(calculatedTax, 5000, 10000, investmentRebate);

      expect(breakdown).toHaveLength(6);
      expect(calculatedTax).toBeGreaterThan(0);
      expect(investmentRebate).toBe(15000); // 100k * 15%
      expect(finalTax.totalTax).toBeGreaterThanOrEqual(5000); // At least minimum tax
      expect(finalTax.payable).toBeGreaterThanOrEqual(0); // Never negative
    });
  });

  describe('Comparison with 2024-25 Structure', () => {
    test('should have 6 slabs instead of 7', () => {
      const breakdown = calculateTaxBreakdown2025(1000000, testSlabs);
      expect(breakdown).toHaveLength(6); // 2025-26 has 6 slabs, 2024-25 had 7
    });

    test('should start with 10% bracket instead of 5%', () => {
      const taxableSalary = 425000; // Just above 400k threshold
      const breakdown = calculateTaxBreakdown2025(taxableSalary, testSlabs);
      
      // Find first taxable slab
      const firstTaxableSlab = breakdown.find(slab => slab.slabCut > 0);
      expect(firstTaxableSlab.slabPercentage).toBe(10); // Should be 10%, not 5%
    });

    test('should handle unified minimum tax of 5000', () => {
      const calculatedTax = 1000;
      const minimumTax = 5000; // Unified for all locations in 2025-26
      
      const finalTax = calculateFinalTax2025(calculatedTax, minimumTax, 0, 0);
      expect(finalTax.totalTax).toBe(5000);
      expect(finalTax.isMinimumTaxApplied).toBe(true);
    });
  });
});