import { calculateSlabBreakdown } from './utils/taxEngine.js';

export default function calculateTaxBreakdown(taxableSalary, slabs) {
  return calculateSlabBreakdown(taxableSalary, slabs, 'slab');
}
