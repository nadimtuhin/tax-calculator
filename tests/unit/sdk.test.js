import { calculateTax2024, calculateTax2025, calculateTax2026, INCOME, INVESTMENT } from '@/sdk/index';

const defaultSalary = { basic: 0, house: 0, medical: 0, transport: 0, others: 0, bonus: 0 };
const dhaka = { category: 'general', age: 30, location: 'dhaka' };

// ─── FY 2024-25 ────────────────────────────────────────────────────────────

describe('SDK FY 2024-25', () => {
  test('zero income → payableTax 0', () => {
    const result = calculateTax2024({ profile: dhaka, salary: defaultSalary });
    expect(result.payableTax).toBe(0);
    expect(result.taxableIncome).toBe(0);
  });

  test('general threshold is 350,000', () => {
    const result = calculateTax2024({ profile: dhaka, salary: defaultSalary });
    expect(result.threshold).toBe(350000);
  });

  test('female threshold is 400,000', () => {
    const profile = { ...dhaka, category: 'female' };
    const result = calculateTax2024({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(400000);
  });

  test('senior citizen (age 65) gets 400,000 threshold', () => {
    const profile = { ...dhaka, age: 65 };
    const result = calculateTax2024({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(400000);
  });

  test('freedom fighter threshold is 500,000', () => {
    const profile = { ...dhaka, category: 'freedom_fighter' };
    const result = calculateTax2024({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(500000);
  });

  test('income at threshold → no minimum tax (not exceeded)', () => {
    const salary = { ...defaultSalary, basic: 350000 };
    const result = calculateTax2024({ profile: dhaka, salary });
    expect(result.payableTax).toBe(0);
    expect(result.isMinimumTaxApplied).toBe(false);
    expect(result.calculatedTax).toBe(0);
  });

  test('income 10,000 over threshold → 5% on 10,000 = 500', () => {
    // basic = 360,000; no exemptions; taxable = 360,000; tax = 5% on 10,000 = 500
    const salary = { ...defaultSalary, basic: 360000 };
    const result = calculateTax2024({ profile: dhaka, salary });
    expect(result.calculatedTax).toBe(500);
  });

  test('minimum tax applied for district location (3,000)', () => {
    const profile = { ...dhaka, location: 'district' };
    const salary = { ...defaultSalary, basic: 355000 }; // tiny taxable income
    const result = calculateTax2024({ profile, salary });
    expect(result.isMinimumTaxApplied).toBe(true);
    expect(result.minimumTax).toBe(3000);
    expect(result.totalTax).toBe(3000);
  });

  test('other_city minimum tax is 4,000', () => {
    const profile = { ...dhaka, location: 'other_city' };
    const salary = { ...defaultSalary, basic: 355000 };
    const result = calculateTax2024({ profile, salary });
    expect(result.minimumTax).toBe(4000);
  });

  test('dhaka minimum tax is 5,000', () => {
    const salary = { ...defaultSalary, basic: 355000 };
    const result = calculateTax2024({ profile: dhaka, salary });
    expect(result.minimumTax).toBe(5000);
  });

  test('investment rebate reduces payable tax', () => {
    const salary = { ...defaultSalary, basic: 600000 };
    const investments = [{ name: 'DPS', amount: 50000 }];
    const result = calculateTax2024({ profile: dhaka, salary, investments });
    // rebate = 15% of min(50000, 20% of ~600k, 1cr) = 15% of 50000 = 7500
    expect(result.investmentRebate).toBe(7500);
    expect(result.payableTax).toBe(result.totalTax - result.investmentRebate);
  });

  test('TDS reduces payable tax', () => {
    const salary = { ...defaultSalary, basic: 600000 };
    const result = calculateTax2024({ profile: dhaka, salary, tds: 5000 });
    expect(result.payableTax).toBe(Math.max(0, result.totalTax - 5000 - result.investmentRebate));
  });

  test('salary exemption: capped at 450,000 or 1/3 gross', () => {
    // house = 300k, medical = 100k, transport = 100k → allowances = 500k
    // gross = 1500k, 1/3 = 500k → min(500k, 500k, 450k) = 450,000
    const salary = { basic: 1000000, house: 300000, medical: 100000, transport: 100000, others: 0, bonus: 0 };
    const result = calculateTax2024({ profile: dhaka, salary });
    expect(result.salaryExemption).toBe(450000);
  });

  test('returns slabs array with correct structure', () => {
    const result = calculateTax2024({ profile: dhaka, salary: defaultSalary });
    expect(Array.isArray(result.slabs)).toBe(true);
    expect(result.slabs.length).toBeGreaterThan(0);
    // First slab should be the threshold slab at 0%
    expect(result.slabs[0][3]).toBe(0);
    // Second slab should be 5%
    expect(result.slabs[1][3]).toBe(5);
  });
});

// ─── FY 2025-26 ────────────────────────────────────────────────────────────

describe('SDK FY 2025-26', () => {
  test('general threshold raised to 375,000', () => {
    const result = calculateTax2025({ profile: dhaka, salary: defaultSalary });
    expect(result.threshold).toBe(375000);
  });

  test('female threshold is 425,000', () => {
    const profile = { ...dhaka, category: 'female' };
    const result = calculateTax2025({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(425000);
  });

  test('disabled threshold is 500,000', () => {
    const profile = { ...dhaka, category: 'disabled' };
    const result = calculateTax2025({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(500000);
  });

  test('freedom fighter threshold is 525,000', () => {
    const profile = { ...dhaka, category: 'freedom_fighter' };
    const result = calculateTax2025({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(525000);
  });

  test('senior citizen (age 65) gets 425,000', () => {
    const profile = { ...dhaka, age: 65 };
    const result = calculateTax2025({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(425000);
  });

  test('no 5% slab — second slab is 10%', () => {
    const result = calculateTax2025({ profile: dhaka, salary: defaultSalary });
    expect(result.slabs[1][3]).toBe(10);
  });

  test('income 10,000 over threshold → 10% on 10,000 = 1,000', () => {
    const salary = { ...defaultSalary, basic: 385000 };
    const result = calculateTax2025({ profile: dhaka, salary });
    expect(result.calculatedTax).toBe(1000);
  });

  test('flat minimum tax 5,000 for all locations', () => {
    for (const location of ['dhaka', 'chittagong', 'other_city', 'district']) {
      const profile = { ...dhaka, location };
      const salary = { ...defaultSalary, basic: 380000 };
      const result = calculateTax2025({ profile, salary });
      expect(result.minimumTax).toBe(5000);
    }
  });

  test('investment rebate: new formula min(3% income, 15% investment, 10L)', () => {
    const salary = { ...defaultSalary, basic: 800000 };
    const investments = [{ name: 'DPS', amount: 100000 }];
    const result = calculateTax2025({ profile: dhaka, salary, investments });
    // taxable = 800k; 3% = 24000; 15% of 100k = 15000; cap = 1000000
    expect(result.investmentRebate).toBe(Math.min(800000 * 0.03, 100000 * 0.15, 1000000));
  });

  test('salary exemption cap raised to 500,000', () => {
    // house = 300k, medical = 100k, transport = 100k → allowances = 500k
    // gross = 1500k, 1/3 = 500k → min(500k, 500k, 500k) = 500,000
    const salary = { basic: 1000000, house: 300000, medical: 100000, transport: 100000, others: 0, bonus: 0 };
    const result = calculateTax2025({ profile: dhaka, salary });
    expect(result.salaryExemption).toBe(500000);
  });

  test('payableTax cannot be negative', () => {
    const salary = { ...defaultSalary, basic: 380000 };
    const result = calculateTax2025({ profile: dhaka, salary, tds: 100000 });
    expect(result.payableTax).toBe(0);
  });
});

// ─── FY 2026-27 ────────────────────────────────────────────────────────────

describe('SDK FY 2026-27', () => {
  test('general threshold same as 2025-26: 375,000', () => {
    const result = calculateTax2026({ profile: dhaka, salary: defaultSalary });
    expect(result.threshold).toBe(375000);
  });

  test('july_warrior category threshold is 525,000 (new in FY 2026-27)', () => {
    const profile = { ...dhaka, category: 'july_warrior' };
    const result = calculateTax2026({ profile, salary: defaultSalary });
    expect(result.threshold).toBe(525000);
  });

  test('same slab structure as 2025-26 (no 5% bracket)', () => {
    const result = calculateTax2026({ profile: dhaka, salary: defaultSalary });
    expect(result.slabs[1][3]).toBe(10);
  });

  test('flat minimum tax 5,000 for all locations', () => {
    for (const location of ['dhaka', 'chittagong', 'other_city', 'district']) {
      const profile = { ...dhaka, location };
      const salary = { ...defaultSalary, basic: 380000 };
      const result = calculateTax2026({ profile, salary });
      expect(result.minimumTax).toBe(5000);
    }
  });

  test('investment rebate same formula as 2025-26', () => {
    const salary = { ...defaultSalary, basic: 800000 };
    const investments = [{ name: 'DPS', amount: 100000 }];
    const result = calculateTax2026({ profile: dhaka, salary, investments });
    expect(result.investmentRebate).toBe(Math.min(800000 * 0.03, 100000 * 0.15, 1000000));
  });

  test('july_warrior age >= 65 does not override to senior', () => {
    const profile = { ...dhaka, category: 'july_warrior', age: 70 };
    const result = calculateTax2026({ profile, salary: defaultSalary });
    // july_warrior at 65 should keep 525k (not downgrade to senior 425k)
    expect(result.threshold).toBe(525000);
  });

  test('returns complete output shape', () => {
    const result = calculateTax2026({ profile: dhaka, salary: defaultSalary });
    expect(result).toHaveProperty('threshold');
    expect(result).toHaveProperty('salaryExemption');
    expect(result).toHaveProperty('taxableIncome');
    expect(result).toHaveProperty('slabs');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('calculatedTax');
    expect(result).toHaveProperty('minimumTax');
    expect(result).toHaveProperty('investmentRebate');
    expect(result).toHaveProperty('totalTax');
    expect(result).toHaveProperty('isMinimumTaxApplied');
    expect(result).toHaveProperty('payableTax');
  });
});

// ─── INCOME / INVESTMENT DSL syntax ────────────────────────────────────────

describe('INCOME / INVESTMENT DSL syntax', () => {
  test('INCOME array salary matches equivalent plain object', () => {
    const arraySalary = [
      INCOME.BASIC(50000 * 12),
      INCOME.HOUSE(25000 * 12),
      INCOME.MEDICAL(5000 * 12),
      INCOME.TRANSPORT(3000 * 12),
      INCOME.BONUS(50000),
    ];
    const objSalary = {
      basic: 600000, house: 300000, medical: 60000,
      transport: 36000, others: 0, bonus: 50000,
    };
    const r1 = calculateTax2025({ profile: dhaka, salary: arraySalary });
    const r2 = calculateTax2025({ profile: dhaka, salary: objSalary });
    expect(r1.taxableIncome).toBe(r2.taxableIncome);
    expect(r1.payableTax).toBe(r2.payableTax);
  });

  test('INVESTMENT.DPS builder produces correct rebate', () => {
    const result = calculateTax2025({
      profile: dhaka,
      salary: [INCOME.BASIC(50000 * 12)],
      investments: [INVESTMENT.DPS(120000)],
    });
    // taxable ≈ 600k; 3% = 18000; 15% of 120k = 18000; rebate = 18000
    expect(result.investmentRebate).toBe(18000);
  });

  test('multiple INVESTMENT types are summed', () => {
    const result = calculateTax2025({
      profile: dhaka,
      salary: [INCOME.BASIC(50000 * 12)],
      investments: [
        INVESTMENT.DPS(60000),
        INVESTMENT.LIFE_INSURANCE(60000),
      ],
    });
    // total investment = 120k; same rebate as single 120k
    const resultSingle = calculateTax2025({
      profile: dhaka,
      salary: [INCOME.BASIC(50000 * 12)],
      investments: [INVESTMENT.DPS(120000)],
    });
    expect(result.investmentRebate).toBe(resultSingle.investmentRebate);
  });

  test('omitted INCOME components default to zero', () => {
    const result = calculateTax2025({
      profile: dhaka,
      salary: [INCOME.BASIC(375000)],
    });
    // only basic; no allowances → salaryExemption = 0; taxable = 375000
    expect(result.salaryExemption).toBe(0);
    expect(result.taxableIncome).toBe(375000);
  });

  test('INCOME / INVESTMENT DSL works with 2024 and 2026 too', () => {
    const salary = [INCOME.BASIC(50000 * 12), INCOME.HOUSE(20000 * 12)];
    const investments = [INVESTMENT.SAVINGS_CERTIFICATE(100000)];

    const r24 = calculateTax2024({ profile: dhaka, salary, investments });
    const r26 = calculateTax2026({ profile: dhaka, salary, investments });
    expect(r24.threshold).toBe(350000);
    expect(r26.threshold).toBe(375000);
    expect(typeof r24.payableTax).toBe('number');
    expect(typeof r26.payableTax).toBe('number');
  });
});
