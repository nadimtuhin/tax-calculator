import { createStore } from 'vuex';
import breakdownStore from '@/store/breakdown';

describe('Breakdown Store Module', () => {
  let store;

  beforeEach(() => {
    store = createStore({
      modules: {
        breakdown: {
          ...breakdownStore,
          namespaced: false
        }
      }
    });
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = store.state.breakdown;
      
      expect(state.totalSalary).toBe(0);
      expect(state.parts).toEqual(['basic', 'house', 'medical', 'transport', 'lfa']);
      expect(state.salaryBreakdown).toEqual({
        basic: { amount: 0, percentage: 60 },
        house: { amount: 0, percentage: 25 },
        medical: { amount: 0, percentage: 10 },
        transport: { amount: 0, percentage: 5 },
        lfa: { amount: 0, percentage: 0 }
      });
    });

    test('should have all salary breakdown components defined', () => {
      const { salaryBreakdown } = store.state.breakdown;
      
      expect(salaryBreakdown.basic).toBeDefined();
      expect(salaryBreakdown.house).toBeDefined();
      expect(salaryBreakdown.medical).toBeDefined();
      expect(salaryBreakdown.transport).toBeDefined();
      expect(salaryBreakdown.lfa).toBeDefined();
    });

    test('should have correct initial percentages totaling 100%', () => {
      const totalPercentage = store.getters.totalPercentage;
      expect(totalPercentage).toBe(100);
    });
  });

  describe('Getters', () => {
    describe('totalPercentage', () => {
      test('should calculate total percentage correctly', () => {
        const totalPercentage = store.getters.totalPercentage;
        expect(totalPercentage).toBe(100); // 60 + 25 + 10 + 5 + 0
      });

      test('should update when individual percentages change', () => {
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 50 });
        
        const totalPercentage = store.getters.totalPercentage;
        expect(totalPercentage).toBe(90); // 50 + 25 + 10 + 5 + 0
      });

      test('should handle decimal percentages', () => {
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 60.5 });
        store.commit('changeBreakdownPercentage', { part: 'house', value: 25.5 });
        
        const totalPercentage = store.getters.totalPercentage;
        expect(totalPercentage).toBe(101); // Rounded: 61 + 26 + 10 + 5 + 0
      });
    });
  });

  describe('Mutations', () => {
    describe('updateTotalSalary', () => {
      test('should update total salary', () => {
        store.commit('updateTotalSalary', 50000);
        
        expect(store.state.breakdown.totalSalary).toBe(50000);
      });

      test('should convert string input to number', () => {
        store.commit('updateTotalSalary', '60000');
        
        expect(store.state.breakdown.totalSalary).toBe(60000);
        expect(typeof store.state.breakdown.totalSalary).toBe('number');
      });

      test('should recalculate all breakdown amounts based on percentages', () => {
        store.commit('updateTotalSalary', 50000);
        
        const { salaryBreakdown } = store.state.breakdown;
        
        expect(salaryBreakdown.basic.amount).toBe(30000); // 60% of 50000
        expect(salaryBreakdown.house.amount).toBe(12500); // 25% of 50000
        expect(salaryBreakdown.medical.amount).toBe(5000); // 10% of 50000
        expect(salaryBreakdown.transport.amount).toBe(2500); // 5% of 50000
        expect(salaryBreakdown.lfa.amount).toBe(0); // 0% of 50000
      });

      test('should handle zero total salary', () => {
        store.commit('updateTotalSalary', 0);
        
        const { salaryBreakdown } = store.state.breakdown;
        
        Object.values(salaryBreakdown).forEach(breakdown => {
          expect(breakdown.amount).toBe(0);
        });
      });

      test('should round calculated amounts', () => {
        store.commit('updateTotalSalary', 33333); // Will create decimal amounts
        
        const { salaryBreakdown } = store.state.breakdown;
        
        // Check that all amounts are integers
        Object.values(salaryBreakdown).forEach(breakdown => {
          expect(Number.isInteger(breakdown.amount)).toBe(true);
        });
      });
    });

    describe('changeBreakdownPercentage', () => {
      beforeEach(() => {
        store.commit('updateTotalSalary', 50000);
      });

      test('should update specific part percentage', () => {
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 70 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(70);
      });

      test('should convert string percentage to number', () => {
        store.commit('changeBreakdownPercentage', { part: 'house', value: '30' });
        
        expect(store.state.breakdown.salaryBreakdown.house.percentage).toBe(30);
        expect(typeof store.state.breakdown.salaryBreakdown.house.percentage).toBe('number');
      });

      test('should recalculate amount based on new percentage', () => {
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 70 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(35000); // 70% of 50000
      });

      test('should update total salary based on new breakdown', () => {
        const initialTotal = store.state.breakdown.totalSalary;
        
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 50 });
        
        const newTotal = store.state.breakdown.totalSalary;
        expect(newTotal).not.toBe(initialTotal);
        expect(newTotal).toBe(45000); // Recalculated from all amounts
      });

      test('should handle zero percentage', () => {
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 0 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(0);
        expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(0);
      });

      test('should handle decimal percentages', () => {
        store.commit('changeBreakdownPercentage', { part: 'basic', value: 65.5 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(65.5);
        expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(32750); // 65.5% of 50000
      });
    });

    describe('changeBreakdownAmount', () => {
      beforeEach(() => {
        store.commit('updateTotalSalary', 50000);
      });

      test('should update specific part amount', () => {
        store.commit('changeBreakdownAmount', { part: 'basic', value: 40000 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(40000);
      });

      test('should convert string amount to number', () => {
        store.commit('changeBreakdownAmount', { part: 'house', value: '15000' });
        
        expect(store.state.breakdown.salaryBreakdown.house.amount).toBe(15000);
        expect(typeof store.state.breakdown.salaryBreakdown.house.amount).toBe('number');
      });

      test('should recalculate total salary from all amounts', () => {
        store.commit('changeBreakdownAmount', { part: 'basic', value: 40000 });
        
        // Total should be sum of all amounts
        const expectedTotal = 40000 + 12500 + 5000 + 2500 + 0; // basic + house + medical + transport + lfa
        expect(store.state.breakdown.totalSalary).toBe(expectedTotal);
      });

      test('should recalculate percentage based on new amount and total', () => {
        store.commit('changeBreakdownAmount', { part: 'basic', value: 25000 });
        
        const newTotal = store.state.breakdown.totalSalary;
        const expectedPercentage = (25000 * 100) / newTotal;
        
        expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBeCloseTo(expectedPercentage, 10);
      });

      test('should handle zero amount', () => {
        store.commit('changeBreakdownAmount', { part: 'basic', value: 0 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(0);
        expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(0);
      });

      test('should handle large amounts', () => {
        store.commit('changeBreakdownAmount', { part: 'basic', value: 100000 });
        
        expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(100000);
        
        const newTotal = store.state.breakdown.totalSalary;
        expect(newTotal).toBeGreaterThan(100000);
      });
    });
  });

  describe('Helper Functions', () => {
    test('getTotalSalary function should calculate correctly', () => {
      // This tests the internal getTotalSalary function indirectly
      store.commit('changeBreakdownAmount', { part: 'basic', value: 30000 });
      store.commit('changeBreakdownAmount', { part: 'house', value: 15000 });
      store.commit('changeBreakdownAmount', { part: 'medical', value: 3000 });
      store.commit('changeBreakdownAmount', { part: 'transport', value: 2000 });
      store.commit('changeBreakdownAmount', { part: 'lfa', value: 0 });
      
      expect(store.state.breakdown.totalSalary).toBe(50000);
    });
  });

  describe('Integration Tests', () => {
    test('should maintain consistency between amounts and percentages', () => {
      store.commit('updateTotalSalary', 60000);
      
      // Change one percentage
      store.commit('changeBreakdownPercentage', { part: 'basic', value: 50 });
      
      // Check that the percentage was set correctly
      expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(50);
      
      // Check that the amount was calculated based on the original total
      const expectedAmount = 60000 * 0.5;
      expect(store.state.breakdown.salaryBreakdown.basic.amount).toBeCloseTo(expectedAmount, 0);
    });

    test('should maintain consistency when changing amounts', () => {
      store.commit('updateTotalSalary', 60000);
      
      // Change one amount
      store.commit('changeBreakdownAmount', { part: 'basic', value: 40000 });
      
      // Check that percentage was recalculated
      const newTotal = store.state.breakdown.totalSalary;
      const expectedPercentage = (40000 / newTotal) * 100;
      
      expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBeCloseTo(expectedPercentage, 10);
    });

    test('should handle multiple consecutive updates', () => {
      store.commit('updateTotalSalary', 50000);
      store.commit('changeBreakdownPercentage', { part: 'basic', value: 55 });
      store.commit('changeBreakdownAmount', { part: 'house', value: 20000 });
      store.commit('changeBreakdownPercentage', { part: 'medical', value: 8 });
      
      // Total percentage should still be calculable
      const totalPercentage = store.getters.totalPercentage;
      expect(typeof totalPercentage).toBe('number');
      expect(totalPercentage).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle division by zero in percentage calculation', () => {
      // Set all amounts to zero
      store.state.breakdown.salaryBreakdown.basic.amount = 0;
      store.state.breakdown.salaryBreakdown.house.amount = 0;
      store.state.breakdown.salaryBreakdown.medical.amount = 0;
      store.state.breakdown.salaryBreakdown.transport.amount = 0;
      store.state.breakdown.salaryBreakdown.lfa.amount = 0;
      store.state.breakdown.totalSalary = 0;
      
      // This should not crash
      expect(() => {
        store.commit('changeBreakdownAmount', { part: 'basic', value: 1000 });
      }).not.toThrow();
    });

    test('should handle negative values gracefully', () => {
      store.commit('updateTotalSalary', 50000);
      
      // Try negative percentage (should convert to number)
      store.commit('changeBreakdownPercentage', { part: 'basic', value: -10 });
      expect(store.state.breakdown.salaryBreakdown.basic.percentage).toBe(-10);
      
      // Try negative amount (should convert to number)
      store.commit('changeBreakdownAmount', { part: 'house', value: -5000 });
      expect(store.state.breakdown.salaryBreakdown.house.amount).toBe(-5000);
    });

    test('should handle very large numbers', () => {
      store.commit('updateTotalSalary', 999999999);
      
      expect(store.state.breakdown.totalSalary).toBe(999999999);
      expect(store.state.breakdown.salaryBreakdown.basic.amount).toBeGreaterThan(0);
    });

    test('should handle decimal inputs', () => {
      store.commit('updateTotalSalary', 50000.75);
      
      expect(store.state.breakdown.totalSalary).toBe(50000.75);
      
      store.commit('changeBreakdownAmount', { part: 'basic', value: 30000.50 });
      expect(store.state.breakdown.salaryBreakdown.basic.amount).toBe(30000.50);
    });
  });
});