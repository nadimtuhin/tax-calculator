import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoEnginePath = path.resolve(__dirname, '../../../src/utils/taxEngine.js');
const vendorEnginePath = path.resolve(__dirname, '../vendor/utils/taxEngine.js');

// Always prefer canonical repo source when inside a checkout so local runs never drift
// even if an interrupted `npm pack` left a temporary vendor/ directory behind.
const resolvedPath = fs.existsSync(repoEnginePath) ? repoEnginePath : vendorEnginePath;
const engine = await import(pathToFileURL(resolvedPath).href);

export const {
  SUPPORTED_FISCAL_YEARS,
  DEFAULT_FISCAL_YEAR,
  FISCAL_YEAR_OPTIONS,
  FISCAL_YEAR_METADATA,
  TAXPAYER_CATEGORIES,
  ALL_ACCEPTED_CATEGORIES,
  LOCATIONS,
  SALARY_EXEMPTION_CAPS,
  STANDARD_SALARY_SPLIT,
  INVESTMENT_INSTRUMENT_CAPS,
  TAX_FREE_THRESHOLDS_BY_YEAR,
  MINIMUM_TAX_BY_YEAR,
  REBATE_RULES_BY_YEAR,
  normalizeFiscalYear,
  calculateHouseExemption,
  calculateMedicalExemption,
  calculateTransportExemption,
  calculateLfaExemption,
  calculateSalaryExemptions,
  calculateMaxRebateableInvestment,
  getTaxFreeThresholdForYear,
  getMinimumTaxForYear,
  calculateTaxSlabsForYear,
  calculateSlabBreakdown,
  sumSlabTax,
  calculateInvestmentRebateForYear,
  calculateFinalTaxSummary,
  resolveEffectiveProfile,
  resolveIncomeInputs,
  resolveInvestmentInputs,
  listSupportedYears,
  getRulesForYear,
  calculateTaxForYear,
  compareTaxYears,
} = engine;
