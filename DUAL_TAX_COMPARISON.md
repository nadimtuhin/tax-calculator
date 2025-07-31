# Dual Tax Comparison Feature

This document describes the dual tax comparison feature that allows users to compare Bangladesh income tax calculations between fiscal years 2024-2025 and 2025-2026.

## Overview

The Bangladesh Tax Calculator now supports side-by-side comparison of tax calculations between two fiscal years:
- **Current Tax Year (2024-2025)**: The previous tax structure
- **New Tax Year (2025-2026)**: The updated tax structure with revised rates and thresholds

## Key Changes in FY 2025-2026

### Tax-Free Thresholds (Increased by ৳25,000)
- **General Taxpayer**: ৳350,000 → ৳375,000
- **Female Taxpayer**: ৳400,000 → ৳425,000  
- **Senior Citizen (65+)**: ৳400,000 → ৳425,000
- **Disabled Person**: ৳475,000 → ৳500,000
- **Freedom Fighter**: ৳500,000 → ৳525,000
- **Third Gender**: ৳475,000 → ৳500,000

### Tax Slab Structure Changes
#### FY 2024-2025 (7 slabs including 5% bracket):
- 0% on income up to threshold
- 5% on next ৳100,000
- 10% on next ৳300,000
- 15% on next ৳400,000
- 20% on next ৳500,000
- 25% on next ৳2,000,000
- 30% on remaining income

#### FY 2025-2026 (6 slabs, 5% bracket removed):
- 0% on income up to threshold
- 10% on next ৳300,000
- 15% on next ৳400,000
- 20% on next ৳500,000
- 25% on next ৳2,000,000
- 30% on remaining income

### Minimum Tax Changes
#### FY 2024-2025 (Location-based):
- Dhaka/Chittagong: ৳5,000
- Other City Areas: ৳4,000
- District Areas: ৳3,000

#### FY 2025-2026 (Unified):
- All locations: ৳5,000

### Investment Rebate Changes
#### FY 2024-2025:
- Fixed 15% rebate on investment
- Maximum 3% of taxable income or ৳10 lakh

#### FY 2025-2026 (Progressive rates):
- 10% for income up to ৳5.5 lakh
- 12.5% for income ৳5.5-8 lakh  
- 15% for income ৳8-11 lakh
- 17.5% for income ৳11-16 lakh
- 20% for income above ৳16 lakh
- Maximum 20% of taxable income or ৳10 lakh

## User Interface

### Side-by-Side Layout
The calculator displays both tax calculations simultaneously:
- **Left Panel**: FY 2024-2025 calculation
- **Right Panel**: FY 2025-2026 calculation
- **Comparison Summary**: Shows tax savings or additional tax at the bottom

### Comparison Indicators
- **Green Badge**: Shows tax savings in FY 2025-2026
- **Red Badge**: Shows additional tax in FY 2025-2026
- **Expandable Details**: Click to see detailed breakdown comparison

### Responsive Design
- **Desktop**: Side-by-side panels
- **Tablet**: Responsive columns
- **Mobile**: Stacked layout

## How to Use

1. **Enter Taxpayer Information**:
   - Select taxpayer category (General, Female, Senior, etc.)
   - Choose location (affects minimum tax in 2024-25)
   - Enter age if applicable

2. **Input Salary Details**:
   - Monthly salary amounts
   - Bonus amounts
   - Other income

3. **Add Deductions**:
   - House rent allowance
   - Medical allowance  
   - Transport allowance

4. **Investment Information**:
   - DPS contributions
   - Life insurance premiums
   - Stock investments
   - Savings certificates
   - Mutual funds

5. **Review Comparison**:
   - Compare total tax amounts
   - Check savings or additional tax
   - Review detailed breakdowns

## Understanding the Results

### Tax Calculation Differences
Due to structural changes, the impact varies by income level:
- **Lower incomes**: Generally benefit from higher thresholds
- **Middle incomes**: May see mixed results due to 5% bracket removal
- **Higher incomes**: May see different rebate percentages

### When 2025-26 Results in Higher Tax
- Removal of 5% bracket means first taxable income is taxed at 10%
- For some income ranges, the ৳25,000 threshold increase doesn't fully offset the rate change

### When 2025-26 Results in Lower Tax  
- Higher tax-free thresholds benefit all taxpayers
- Progressive investment rebate rates benefit higher earners
- Unified minimum tax benefits taxpayers in district areas

## Technical Implementation

### Non-Breaking Design
- All existing functionality remains unchanged
- New 2025-26 calculations run in parallel
- Original 2024-25 calculations preserved for comparison

### Performance Optimized
- Efficient dual calculations
- Responsive updates on input changes
- Mobile-optimized rendering

### Comprehensive Testing
- Unit tests for all calculation functions
- Integration tests for component interactions
- End-to-end tests for user workflows
- Edge case testing for boundary values

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Touch-friendly mobile interface

## Future Enhancements

Potential future improvements:
- Historical year comparisons
- Export comparison reports
- Save comparison scenarios
- Advanced filtering options
- Chart visualizations

## Support

For technical issues or questions about the tax calculations:
1. Check the [GitHub Issues](https://github.com/nadimtuhin/tax-calculator/issues)
2. Review the tax calculation logic in the source code
3. Consult official Bangladesh tax authority guidelines

## Contributing

To contribute to the dual comparison feature:
1. Review the implementation in `/src/components/` and `/src/utils/`
2. Run the comprehensive test suite
3. Follow the existing code patterns
4. Submit pull requests with detailed descriptions

---

*This feature helps taxpayers understand the impact of Bangladesh's tax structure changes and make informed financial decisions.*