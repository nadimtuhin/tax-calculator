# Bangladesh Tax Calculator - Side-by-Side Comparison Implementation Plan
## FY 2024-2025 vs FY 2025-2026

### Project Overview
Implement a side-by-side tax calculator that shows tax calculations for both FY 2024-2025 (current) and FY 2025-2026 (new rules) without breaking existing functionality.

### Tax Rules Summary

#### FY 2024-2025 (Current)
- **Tax-free thresholds:**
  - General: ৳3.5L
  - Women/Senior (65+): ৳4L
  - Disabled: ৳4.75L
  - Freedom Fighter: ৳5L
  - Third Gender: ৳4.75L
- **Tax slabs:** 7 slabs (0%, 5%, 10%, 15%, 20%, 25%, 30%)
- **Minimum tax:** ৳3,000-৳5,000 (location-based)

#### FY 2025-2026 (New)
- **Tax-free thresholds:**
  - General: ৳3.75L (+৳25K)
  - Women/Senior (65+): ৳4.25L (+৳25K)
  - Disabled: ৳5L (+৳25K)
  - Freedom Fighter: ৳5.25L (+৳25K)
  - Third Gender: ৳5L (+৳25K)
- **Tax slabs:** 6 slabs (0%, 10%, 15%, 20%, 25%, 30%) - **5% bracket removed**
- **Minimum tax:** ৳5,000 (unified)

### Implementation Strategy

#### Phase 1: Core Infrastructure (High Priority)
1. **Create new tax utilities** (separate files to avoid breaking changes)
   - `src/utils/taxSlabs2025.js`
   - `src/calculateTaxBreakdown2025.js`

2. **Extend Vuex store** (non-breaking additions)
   - New getters for 2025 calculations
   - Maintain all existing getters

3. **Create new components**
   - `src/components/Calculation-2025.vue`
   - Copy structure from existing `Calculation-2024.vue`

#### Phase 2: UI Implementation (Medium Priority)
4. **Update layout**
   - Modify `src/pages/Home.vue` for side-by-side display
   - Responsive design: side-by-side on desktop, stacked on mobile
   - Preserve existing mobile experience

5. **Add comparison features**
   - Highlight differences between tax years
   - Show savings/additional tax amounts
   - Visual indicators for changes

#### Phase 3: Testing (High Priority)
6. **Comprehensive test suite**
   - Unit tests for all new utilities and components
   - Integration tests for dual calculations
   - E2E tests for complete workflows
   - Regression tests for existing functionality

### File Structure

#### New Files (Additions Only)
```
src/
├── utils/
│   ├── taxSlabs.js (existing - untouched)
│   ├── taxSlabs2025.js (new)
│   └── taxComparison.js (new - for comparison logic)
├── components/
│   ├── Calculation-2024.vue (existing - untouched)
│   ├── Calculation-2025.vue (new)
│   └── TaxComparison.vue (new - for highlighting differences)
└── calculateTaxBreakdown2025.js (new)

tests/
├── unit/
│   ├── (existing tests - untouched)
│   ├── taxSlabs2025.test.js (new)
│   ├── calculateTaxBreakdown2025.test.js (new)
│   ├── calculation2025.test.js (new)
│   └── taxComparison.test.js (new)
├── integration/
│   ├── sideBySideCalculation.test.js (new)
│   └── dualCalculationAccuracy.test.js (new)
└── e2e/
    ├── dual-tax-calculation.spec.js (new)
    └── comparison-workflows.spec.js (new)
```

### Detailed Task List

#### Core Development Tasks
- [ ] **Task 3:** Create taxSlabs2025.js utility with new tax rates and thresholds
- [ ] **Task 4:** Create calculateTaxBreakdown2025.js for new slab calculations
- [ ] **Task 5:** Extend Vuex store with 2025 tax getters (non-breaking)
- [ ] **Task 6:** Create Calculation-2025.vue component (copy existing structure)
- [ ] **Task 7:** Modify Home.vue to show responsive side-by-side layout
- [ ] **Task 8:** Add comparison highlighting and tax difference display

#### Testing Tasks
- [ ] **Task 9:** Write unit tests for taxSlabs2025.js utility functions
- [ ] **Task 10:** Write unit tests for calculateTaxBreakdown2025.js
- [ ] **Task 11:** Write unit tests for new Vuex store getters
- [ ] **Task 12:** Write unit tests for Calculation-2025.vue component
- [ ] **Task 13:** Write integration tests for side-by-side comparison functionality
- [ ] **Task 14:** Write integration tests for dual calculation accuracy
- [ ] **Task 15:** Write e2e tests for complete dual calculation workflow
- [ ] **Task 16:** Write e2e tests for responsive design on mobile/desktop
- [ ] **Task 17:** Test edge cases and boundary values for both tax years
- [ ] **Task 18:** Run all existing tests to ensure no regression

#### Quality Assurance Tasks
- [ ] **Task 19:** Performance testing for dual calculations impact
- [ ] **Task 20:** Add user documentation for new comparison feature
- [ ] **Task 21:** Create deployment checklist and rollback plan

### Test Scenarios

#### Unit Test Coverage
1. **Tax Slab Generation Tests**
   - Correct thresholds for all taxpayer categories (2025)
   - Proper 6-slab structure (no 5% bracket)
   - Boundary value testing at exact thresholds

2. **Tax Calculation Tests**
   - Zero tax below thresholds
   - Correct progressive taxation
   - Minimum tax application (new ৳5,000 rule)
   - Investment rebate calculations

3. **Component Tests**
   - Proper rendering of 2025 calculation component
   - Store integration and reactivity
   - Tax breakdown display accuracy

#### Integration Test Scenarios
1. **Side-by-Side Accuracy**
   - Same input produces different outputs for different tax years
   - Comparison highlighting works correctly
   - Tax difference calculations are accurate

2. **Store Integration**
   - Changes in taxpayer profile affect both calculations
   - Investment and salary changes reflect in both views
   - No interference between 2024 and 2025 calculations

#### E2E Test Workflows
1. **Complete User Journey**
   - Enter taxpayer profile → see both tax calculations
   - Modify salary/investments → both calculations update
   - View savings/additional tax information

2. **Responsive Design**
   - Desktop: side-by-side layout functions properly
   - Mobile: stacked layout maintains usability
   - Comparison features work on all screen sizes

### Edge Cases and Boundary Testing
1. **Tax Threshold Boundaries**
   - Income exactly at ৳375,000 vs ৳350,000
   - Different thresholds for special categories
   - Transition points between tax slabs

2. **Tax Calculation Differences**
   - Income ranges where 5% bracket removal has impact
   - Scenarios where 2025 rules result in lower tax
   - Cases where minimum tax changes affect final amount

3. **Special Scenarios**
   - Very high income spanning all slabs
   - Investment rebate cap differences
   - TDS and final payable amount variations

### Risk Mitigation

#### Backward Compatibility
- ✅ All existing files remain unchanged
- ✅ Existing functionality preserved
- ✅ Current users experience no disruption
- ✅ Easy rollback capability

#### Performance Considerations
- Minimize computational overhead of dual calculations
- Efficient store management to prevent memory leaks
- Optimize rendering for side-by-side layout

#### User Experience
- Clear visual distinction between tax years
- Intuitive comparison highlighting
- Responsive design maintains mobile usability
- Progressive enhancement approach

### Success Criteria
1. **Functionality**
   - ✅ Accurate tax calculations for both FY 2024-25 and 2025-26
   - ✅ Side-by-side comparison works seamlessly
   - ✅ All existing features continue to work

2. **Quality**
   - ✅ 100% test coverage for new functionality
   - ✅ Zero regression in existing tests
   - ✅ Performance impact < 10% on page load

3. **User Experience**
   - ✅ Responsive design works on all devices
   - ✅ Clear tax difference visualization
   - ✅ Intuitive navigation between tax years

### Deployment Strategy
1. **Development Phase**
   - Implement core functionality
   - Comprehensive testing
   - Code review and quality assurance

2. **Staging Deployment**
   - Deploy to staging environment
   - User acceptance testing
   - Performance validation

3. **Production Rollout**
   - Feature flag controlled release
   - Monitor for any issues
   - Gradual rollout to all users

4. **Post-Deployment**
   - Monitor user engagement
   - Collect feedback
   - Performance monitoring

### Rollback Plan
- Maintain separate feature branch until fully validated
- Database changes are additive only
- Configuration-based feature toggle
- Quick rollback procedure documented
- Monitoring alerts for any issues

---

**Project Timeline:** 2-3 weeks  
**Priority:** High (new tax year implementation)  
**Risk Level:** Low (non-breaking implementation)  
**Team:** Frontend development team with tax domain expertise