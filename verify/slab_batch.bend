# Independent FY 2026-27 progressive slab gross tax (taxable after exemptions).
# scripts/bend-verify.mjs compares to calculateSlabBreakdown (JS engine).

def slice_tax(taxable, lo, hi, rate):
  switch taxable < lo:
    case 0:
      switch taxable > hi:
        case 0:
          return ((taxable - lo) * rate) / 100
        case _:
          return ((hi - lo) * rate) / 100
    case _:
      return 0

def gross_tax_2026(taxable):
  return slice_tax(taxable, 0, 400000, 0) + slice_tax(taxable, 400000, 700000, 10) + slice_tax(taxable, 700000, 1100000, 15) + slice_tax(taxable, 1100000, 1600000, 20) + slice_tax(taxable, 1600000, 3600000, 25) + slice_tax(taxable, 3600000, 16777215, 30)

def main():
  return [
    gross_tax_2026(0),
    gross_tax_2026(250000),
    gross_tax_2026(400000),
    gross_tax_2026(500000),
    gross_tax_2026(680000),
    gross_tax_2026(750000),
    gross_tax_2026(974000),
    gross_tax_2026(1252000),
    gross_tax_2026(1724000),
  ]