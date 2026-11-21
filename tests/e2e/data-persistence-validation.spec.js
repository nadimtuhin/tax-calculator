import { test, expect } from '@playwright/test';
import { selectCategory, selectedCategory } from './helpers/category.js';
import {
  FY_2025,
  calcPanel,
  setMonthly,
  expectHeadingAmount,
} from './helpers/fa2026-calc-ui.js';

// The app persists the Vuex store under localStorage key '0.8' (vuex-persistedstate).
const STORE_KEY = '0.8';

const readStore = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), STORE_KEY);

const julyBasic = (page) => page.getByRole('spinbutton', { name: 'July basic', exact: true });

const importFile = (page, name, content) =>
  page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  });

test.describe('Data Persistence and Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('tax-calculator-never-star', 'true'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(calcPanel(page, FY_2025)).toBeVisible();
  });

  test.describe('localStorage Persistence', () => {
    test('should persist taxpayer profile across sessions', async ({ page }) => {
      await selectCategory(page, 'female');
      await page.locator('#profile-location').selectOption('chittagong');
      await expect.poll(async () => (await readStore(page))?.salaries?.taxpayerProfile?.category).toBe('female');

      await page.reload();
      await expect(page.locator('main')).toBeVisible();
      expect(await selectedCategory(page)).toBe('female');
      await expect(page.locator('#profile-location')).toHaveValue('chittagong');
    });

    test('should persist salary data across sessions', async ({ page }) => {
      await setMonthly(page, 'basic', 60000);
      await expectHeadingAmount(page, FY_2025, 8000);
      await expect.poll(async () => (await readStore(page))?.salaries?.months?.[0]?.breakdown?.basic).toBe(60000);

      await page.reload();
      await expect(julyBasic(page)).toHaveValue('60000');
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should persist calculation results across sessions', async ({ page }) => {
      await setMonthly(page, 'basic', 100000);
      await selectCategory(page, 'female');
      await expectHeadingAmount(page, FY_2025, 37500);
      await expect.poll(async () => (await readStore(page))?.salaries?.taxpayerProfile?.category).toBe('female');

      await page.reload();
      await expectHeadingAmount(page, FY_2025, 37500);
    });

    test('should survive localStorage being unavailable for writes', async ({ page }) => {
      await page.evaluate(() => {
        Storage.prototype.setItem = () => {
          throw new DOMException('quota', 'QuotaExceededError');
        };
      });
      await setMonthly(page, 'basic', 60000);
      // Calculation keeps working even though nothing can be saved
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should migrate a legacy saved state and keep entered values', async ({ page }) => {
      // Legacy state without the newer fields (investments policyValue, profile defaults, ...)
      await page.evaluate((key) => {
        const months = Array.from({ length: 12 }, (_, i) => ({
          name: String(i),
          salary: 60000,
          tds: 0,
          breakdown: { basic: 60000, house: 0, medical: 0, transport: 0, others: 0 },
        }));
        localStorage.setItem(key, JSON.stringify({ salaries: { months } }));
      }, STORE_KEY);
      await page.reload();

      await expect(julyBasic(page)).toHaveValue('60000');
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should fall back to defaults when saved state is corrupted', async ({ page }) => {
      await page.evaluate((key) => localStorage.setItem(key, '{not valid json'), STORE_KEY);
      await page.reload();

      await expect(page.locator('main')).toBeVisible();
      await expect(julyBasic(page)).toHaveValue('0');
      await expectHeadingAmount(page, FY_2025, 0);
    });
  });

  test.describe('Data Import/Export Functionality', () => {
    test('should export current tax data as a JSON download', async ({ page }) => {
      await setMonthly(page, 'basic', 60000);
      await selectCategory(page, 'female');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export your tax data' }).click(),
      ]);
      expect(download.suggestedFilename()).toBe('tax-data-2024-25.json');

      const stream = await download.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));

      expect(exported.taxpayerProfile.category).toBe('female');
      expect(exported.salaries).toHaveLength(12);
      expect(exported.salaries[0].breakdown.basic).toBe(60000);
      expect(Array.isArray(exported.investments)).toBe(true);
    });

    test('should round-trip: export, reset, import restores the same tax', async ({ page }) => {
      await setMonthly(page, 'basic', 80000);
      await selectCategory(page, 'female');
      await expectHeadingAmount(page, FY_2025, 19000);

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export your tax data' }).click(),
      ]);
      const stream = await download.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const exportedJson = Buffer.concat(chunks).toString('utf8');

      await page.getByRole('button', { name: 'Reset all tax data' }).click();
      await page.getByRole('button', { name: 'Confirm reset' }).click();
      await expectHeadingAmount(page, FY_2025, 0);

      await importFile(page, 'backup.json', exportedJson);
      await expect(page.getByText('Data imported successfully!')).toBeVisible();
      await expect(julyBasic(page)).toHaveValue('80000');
      expect(await selectedCategory(page)).toBe('female');
      await expectHeadingAmount(page, FY_2025, 19000);
    });

    test('should import tax data successfully', async ({ page }) => {
      const names = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
      const months = names.map((name) => ({
        id: name,
        salary: 60000,
        tds: 0,
        breakdown: { basic: 60000, house: 0, medical: 0, transport: 0, others: 0 },
      }));
      await importFile(page, 'tax.json', JSON.stringify({ salaries: months, taxpayerProfile: { category: 'general' } }));

      await expect(page.getByText('Data imported successfully!')).toBeVisible();
      await expect(julyBasic(page)).toHaveValue('60000');
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should reject corrupted import files without changing existing data', async ({ page }) => {
      await setMonthly(page, 'basic', 60000);
      await expectHeadingAmount(page, FY_2025, 8000);

      await importFile(page, 'bad.json', '{ this is not json');

      await expect(page.getByText('Error importing data. Please check the file format.')).toBeVisible();
      await expect(julyBasic(page)).toHaveValue('60000');
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should treat script content in imported data as inert text', async ({ page }) => {
      const dialogs = [];
      page.on('dialog', (d) => {
        dialogs.push(d.message());
        d.dismiss();
      });
      await importFile(
        page,
        'xss.json',
        JSON.stringify({
          taxpayerProfile: { category: '<script>alert("xss")</script>', location: '<img src=x onerror=alert(1)>' },
          investments: [{ name: '<script>alert(2)</script>', amount: 1000 }],
        })
      );

      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(500);
      expect(dialogs).toEqual([]);
      await expect(page.locator('main script, main img[src="x"]')).toHaveCount(0);
    });

    test('should cancel reset without losing data', async ({ page }) => {
      await setMonthly(page, 'basic', 60000);
      await page.getByRole('button', { name: 'Reset all tax data' }).click();
      await page.getByRole('button', { name: 'Cancel' }).click();

      await expect(julyBasic(page)).toHaveValue('60000');
      await expectHeadingAmount(page, FY_2025, 8000);
    });
  });

  test.describe('Form Validation', () => {
    test('should treat an emptied salary field as zero', async ({ page }) => {
      await setMonthly(page, 'basic', 60000);
      await expectHeadingAmount(page, FY_2025, 8000);

      await julyBasic(page).fill('');
      await expectHeadingAmount(page, FY_2025, 0);
    });

    test('should clamp negative salary input to zero', async ({ page }) => {
      await julyBasic(page).fill('-5000');
      await expect(julyBasic(page)).toHaveValue('0');
      await expectHeadingAmount(page, FY_2025, 0);
    });

    test('should declare numeric bounds on salary and investment inputs', async ({ page }) => {
      await expect(julyBasic(page)).toHaveAttribute('min', '0');
      await expect(julyBasic(page)).toHaveAttribute('max', '999999');
      const dps = page.getByRole('spinbutton', { name: 'DPS amount', exact: true });
      await expect(dps).toHaveAttribute('min', '0');
    });

    test('should switch to senior category when age reaches 65', async ({ page }) => {
      await page.locator('#profile-age').fill('64');
      expect(await selectedCategory(page)).toBe('general');
      await page.locator('#profile-age').fill('65');
      await expect.poll(() => selectedCategory(page)).toBe('senior');
    });

    test('should cap the DPS rebate base at 120,000 even for huge investments', async ({ page }) => {
      await setMonthly(page, 'basic', 100000); // taxable 800k
      await page.getByRole('spinbutton', { name: 'DPS amount', exact: true }).fill('9000000');

      // DPS eligible amount capped at 120,000 -> rebate 12,000 -> 45,000 - 12,000
      await expectHeadingAmount(page, FY_2025, 33000);
    });

    test('should keep results consistent between both fiscal years', async ({ page }) => {
      await setMonthly(page, 'basic', 70000);
      await expectHeadingAmount(page, 'FY 2025-2026', 16000);
      await expectHeadingAmount(page, 'FY 2026-2027', 16000);
    });
  });

  test.describe('Data Integrity and Recovery', () => {
    test('should recover from reload mid-edit', async ({ page }) => {
      await setMonthly(page, 'basic', 60000);
      await expect.poll(async () => (await readStore(page))?.salaries?.months?.[0]?.breakdown?.basic).toBe(60000);
      await page.reload();
      await expect(page.locator('main')).toBeVisible();
      await expectHeadingAmount(page, FY_2025, 8000);
    });

    test('should load the latest saved data when a second tab opens', async ({ context, page }) => {
      await setMonthly(page, 'basic', 60000);
      await expect.poll(async () => (await readStore(page))?.salaries?.months?.[0]?.breakdown?.basic).toBe(60000);

      const second = await context.newPage();
      await second.goto('/');
      await expect(second.getByRole('spinbutton', { name: 'July basic', exact: true })).toHaveValue('60000');
      await second.close();
    });

    test('should reset every input to defaults', async ({ page }) => {
      await setMonthly(page, 'basic', 80000);
      await selectCategory(page, 'female');
      await page.getByRole('spinbutton', { name: 'DPS amount', exact: true }).fill('50000');

      await page.getByRole('button', { name: 'Reset all tax data' }).click();
      await page.getByRole('button', { name: 'Confirm reset' }).click();

      await expect(page.getByText('All data has been reset!')).toBeVisible();
      await expect(julyBasic(page)).toHaveValue('0');
      await expect(page.getByRole('spinbutton', { name: 'DPS amount', exact: true })).toHaveValue('0');
      await expect.poll(() => selectedCategory(page)).toBe('general');
      await expectHeadingAmount(page, FY_2025, 0);
    });
  });
});
