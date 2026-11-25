// Package engine is a line-by-line port of src/utils/taxEngine.js (and the slab/rule modules it
// imports). It keeps JavaScript value semantics via jsval so outputs and error messages match the
// JS engine byte for byte; see services/tax-go/NOTES.md for the JS quirks reproduced on purpose.
package engine

import (
	"math"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"github.com/nadimtuhin/tax-calculator/services/tax-go/jsval"
)

type Value = jsval.Value

// JSError is a thrown JS error: Name is "Error" or "TypeError".
type JSError struct {
	Name    string
	Message string
}

func (e *JSError) Error() string { return e.Message }

func throw(msg string)     { panic(&JSError{Name: "Error", Message: msg}) }
func throwType(msg string) { panic(&JSError{Name: "TypeError", Message: msg}) }

// catch turns a thrown *JSError back into a returned error; other panics propagate.
func catch(err *error) {
	if r := recover(); r != nil {
		je, ok := r.(*JSError)
		if !ok {
			panic(r)
		}
		*err = je
	}
}

func itoa(n int) string { return strconv.Itoa(n) }

func pad2(n int) string {
	if n < 10 {
		return "0" + itoa(n)
	}
	return itoa(n)
}

// get is a property read on any JS value; only plain objects have the properties the engine reads.
func get(v Value, key string) Value {
	if o, ok := v.(*jsval.Object); ok {
		return o.Get(key)
	}
	return jsval.Undefined
}

// orDefault applies a destructuring default (only for undefined).
func orDefault(v, def Value) Value {
	if jsval.IsUndefined(v) {
		return def
	}
	return v
}

// destructure reads the named properties of a destructured parameter. A null argument throws
// V8's TypeError for the first property; primitives destructure to undefined fields.
func destructure(args Value, first string) Value {
	if args == nil {
		throwType("Cannot read properties of null (reading '" + first + "')")
	}
	if jsval.IsUndefined(args) {
		return jsval.NewObject()
	}
	return args
}

// fiscalYear is the result of normalizeFiscalYear: a canonical year, or (when the alias lookup hit
// an Object.prototype member) the String() of that member.
type fiscalYear struct {
	s     string
	proto bool
}

const jsWS = `[\t\n\v\f\r \x{a0}\x{1680}\x{2000}-\x{200a}\x{2028}\x{2029}\x{202f}\x{205f}\x{3000}\x{feff}]`

// ci spells a word as ASCII-only case-insensitive classes (JS /i without /u never folds non-ASCII
// letters onto ASCII ones; Go's (?i) would, e.g. ſ→s, K→k).
func ci(word string) string {
	var b strings.Builder
	for _, r := range word {
		b.WriteString("[" + strings.ToLower(string(r)) + strings.ToUpper(string(r)) + "]")
	}
	return b.String()
}

var (
	assessmentYearRe = regexp.MustCompile(`^(?:` + ci("ay") + `\b|` + ci("assessment") + jsWS + `*` + ci("year") + `\b)`)
	fiscalPrefixRe   = regexp.MustCompile(`^(?:` + ci("fy") + `|` + ci("fiscal") + jsWS + `*` + ci("year") + `|` + ci("income") + jsWS + `*` + ci("year") + `|` + ci("iy") + `)` + jsWS + `*[:=-]?` + jsWS + `*`)
	jsWSRun          = regexp.MustCompile(jsWS + `+`)
	dashReplacer     = strings.NewReplacer("–", "-", "—", "-", "/", "-")
)

func normalizeFiscalYear(yearInput Value) fiscalYear {
	if jsval.IsUndefined(yearInput) || yearInput == nil || yearInput == "" {
		return fiscalYear{s: DefaultFiscalYear}
	}
	var raw string
	if fy, ok := yearInput.(fiscalYear); ok {
		raw = jsval.Trim(fy.s)
	} else {
		raw = jsval.Trim(jsval.ToString(yearInput))
	}
	if assessmentYearRe.MatchString(raw) {
		throw(`Received Assessment Year "` + raw + `". Pass the Fiscal/Income Year instead — e.g. "2025-26" (for AY 2026-27) or "2026-27" (for AY 2027-28).`)
	}
	cleaned := fiscalPrefixRe.ReplaceAllLiteralString(raw, "")
	cleaned = jsWSRun.ReplaceAllLiteralString(cleaned, "")
	cleaned = dashReplacer.Replace(cleaned)
	if resolved, ok := yearAliases[cleaned]; ok {
		return fiscalYear{s: resolved}
	}
	if str, ok := objectPrototypeAliases[cleaned]; ok {
		return fiscalYear{s: str, proto: true}
	}
	throw(`Unsupported fiscal year "` + raw + `". Supported fiscal years: ` + strings.Join(SupportedFiscalYears, ", ") + `.`)
	return fiscalYear{}
}

func getSalaryExemptionRuleForYear(year string) salaryExemptionRule {
	if r, ok := salaryExemptionRulesByYear[year]; ok {
		return r
	}
	return salaryExemptionRulesByYear[DefaultFiscalYear]
}

func numberOrZero(v Value) float64 {
	n := jsval.ToNumber(v)
	if !jsval.Truthy(n) {
		return 0
	}
	return n
}

func nonNegative(v Value) float64 { return jsval.Max(0, numberOrZero(v)) }

func calculateEmploymentExemption(grossSalary float64, year string) float64 {
	safeGross := jsval.Max(0, numberOrZero(grossSalary))
	if safeGross <= 0 {
		return 0
	}
	rule := getSalaryExemptionRuleForYear(year)
	return jsval.Min(jsval.Round(safeGross/3), rule.maxAmount)
}

func getInvestmentInstrumentCapsForYear(year string) map[string]Value {
	if c, ok := investmentInstrumentCapsByYear[year]; ok {
		return c
	}
	return investmentInstrumentCapsByYear[DefaultFiscalYear]
}

func usesFa2026RebateBase(year string) bool { return year == "2025-26" || year == "2026-27" }

// calculateRebateIncomeBase with no exclusions: max(0, nonNegative(income) - 0).
func calculateRebateIncomeBase(taxableIncome float64) float64 {
	return jsval.Max(0, nonNegative(taxableIncome)-0)
}

func rebateRuleFor(year, fallback string) rebateRule {
	if r, ok := rebateRulesByYear[year]; ok {
		return r
	}
	return rebateRulesByYear[fallback]
}

func calculateMaxRebateableInvestment(taxableIncome float64, year string) float64 {
	var safeIncome float64
	if usesFa2026RebateBase(year) {
		safeIncome = calculateRebateIncomeBase(taxableIncome)
	} else {
		safeIncome = jsval.Max(0, numberOrZero(taxableIncome))
	}
	if safeIncome <= 0 {
		return 0
	}
	rule := rebateRuleFor(year, DefaultFiscalYear)
	return jsval.Round(jsval.Min(
		float64(rule.taxableIncomeRate*safeIncome)/rule.investmentRate,
		rule.maxCap/rule.investmentRate,
	))
}

func normalizeDisabledDependentCount(v Value) float64 {
	if v == true {
		return 1
	}
	n := jsval.ToNumber(v)
	if math.IsNaN(n) || math.IsInf(n, 0) || n <= 0 {
		return 0
	}
	return math.Floor(n)
}

// thresholdProfile is the {category, age, parentOfDisabled} object the engine passes around.
type thresholdProfile struct {
	category         string
	age              Value
	parentOfDisabled bool
}

func (p thresholdProfile) disabledDependentCount() float64 {
	fromCount := normalizeDisabledDependentCount(jsval.Undefined)
	fromLegacyFlag := normalizeDisabledDependentCount(p.parentOfDisabled)
	return jsval.Max(fromCount, fromLegacyFlag, p.legacyCategoryCount())
}

func (p thresholdProfile) legacyCategoryCount() float64 {
	if p.category == "parent_disabled" {
		return 1
	}
	return 0
}

// ageAtLeast65 is `age >= 65` for age = null or a number.
func ageAtLeast65(age Value) bool {
	n, ok := age.(float64)
	return ok && n >= 65
}

func getTaxFreeThresholdForYear(year string, p thresholdProfile) float64 {
	if year == "2025-26" || year == "2026-27" {
		table := taxFreeThresholdsByYear[year]
		baseCategory := p.category
		if p.category == "parent_disabled" {
			baseCategory = "general"
		}
		threshold, ok := lookup(table, baseCategory)
		if !ok || threshold == 0 || baseCategory == "parent_disabled" {
			threshold, _ = lookup(table, "general")
		}
		if ageAtLeast65(p.age) && baseCategory != "disabled" && baseCategory != "freedom_fighter" && baseCategory != "third_gender" {
			threshold, _ = lookup(table, "senior")
		}
		threshold += float64(p.disabledDependentCount() * disabledDependentAllow)
		return threshold
	}
	table, ok := taxFreeThresholdsByYear[year]
	if !ok {
		table = taxFreeThresholdsByYear["2024-25"]
	}
	parentExtra, _ := lookup(table, "parent_disabled")
	var base float64
	if p.category == "parent_disabled" {
		base, _ = lookup(table, "general")
	} else if v, ok := lookup(table, p.category); ok && v != 0 {
		base = v
	} else {
		base, _ = lookup(table, "general")
	}
	if p.disabledDependentCount() > 0 {
		base += parentExtra
	}
	return base
}

func getMinimumTaxForYear(year, location string, firstTimeFiler bool) float64 {
	if year == "2025-26" || year == "2026-27" {
		if firstTimeFiler {
			return minimumTaxFirstTime
		}
		if v, ok := lookup(minimumTaxByYear[year], location); ok && v != 0 {
			return v
		}
		v, _ := lookup(minimumTaxByYear[year], "district")
		return v
	}
	table, ok := minimumTaxByYear[year]
	if !ok {
		table = minimumTaxByYear["2024-25"]
	}
	if v, ok := lookup(table, location); ok && v != 0 {
		return v
	}
	v, _ := lookup(table, "dhaka")
	return v
}

type slab struct {
	title        string
	lower, upper float64
	rate         float64
}

func formatLakh(lakhs float64) string {
	return jsval.NumberToString(jsval.StringToNumber(jsval.ToFixed(lakhs, 2)))
}

func formatRange(from, to float64) string {
	toLakh := "UP"
	if !math.IsInf(to, 1) {
		toLakh = formatLakh(to / lakh)
	}
	return "[" + formatLakh(from/lakh) + "-" + toLakh + " lakh]"
}

func buildSlabs(threshold float64, amountsLakh, rates []float64) []slab {
	widths := []float64{threshold}
	for _, l := range amountsLakh {
		widths = append(widths, float64(l*lakh))
	}
	cumulative := 0.0
	var slabs []slab
	for i, width := range widths {
		from := cumulative
		to := cumulative + width
		kind := "Next"
		if i == 0 {
			kind = "First"
		}
		slabs = append(slabs, slab{kind + " Tk" + formatLakh(width/lakh) + " lakh " + formatRange(from, to), from, to, rates[i]})
		cumulative = to
	}
	return append(slabs, slab{"Above " + formatRange(cumulative, math.Inf(1)), cumulative, math.Inf(1), rates[len(rates)-1]})
}

func calculateTaxSlabsForYear(year string, threshold float64) []slab {
	switch year {
	case "2026-27", "2025-26":
		return buildSlabs(threshold, []float64{3, 4, 5, 20}, []float64{0, 10, 15, 20, 25, 30})
	case "2023-24":
		return buildSlabs(threshold, []float64{1, 3, 4, 5}, []float64{0, 5, 10, 15, 20, 25})
	}
	return buildSlabs(threshold, []float64{1, 4, 5, 5, 20}, []float64{0, 5, 10, 15, 20, 25, 30})
}

type slabRow struct {
	id     string
	slab   slab
	amount float64
	cut    float64
}

func calculateSlabBreakdown(taxable float64, slabs []slab, idPrefix string) []slabRow {
	rows := make([]slabRow, len(slabs))
	for i, s := range slabs {
		amount := 0.0
		if taxable >= s.lower && taxable <= s.upper {
			amount = taxable - s.lower
		} else if taxable >= s.lower && taxable >= s.upper {
			amount = s.upper - s.lower
		}
		cut := jsval.Round(float64(amount/100) * s.rate)
		id := idPrefix + "-" + itoa(i) + "-" + jsval.NumberToString(s.lower) + "-" + jsval.NumberToString(s.upper) + "-" + jsval.NumberToString(s.rate)
		rows[i] = slabRow{id, s, amount, cut}
	}
	return rows
}

func sumSlabTax(rows []slabRow) float64 {
	carry := 0.0
	for i := len(rows) - 1; i >= 0; i-- {
		carry = carry + rows[i].cut
	}
	return jsval.Round(carry)
}

func calculateInvestmentRebateForYear(year string, taxableIncome, eligible float64) float64 {
	switch year {
	case "2026-27":
		threePercentOfBase := calculateRebateIncomeBase(taxableIncome) * 0.03
		tenPercent := eligible * 0.10
		return jsval.Round(jsval.Max(0, jsval.Min(threePercentOfBase, tenPercent, 750000)))
	case "2025-26":
		base := calculateRebateIncomeBase(taxableIncome)
		if base <= 0 || eligible <= 0 {
			return 0
		}
		return jsval.Round(jsval.Min(0.03*base, 0.10*eligible, 750000))
	}
	rules := rebateRuleFor(year, "2024-25")
	incomeCap := taxableIncome * rules.taxableIncomeRate
	investmentShare := eligible * rules.investmentRate
	return jsval.Round(jsval.Max(0, jsval.Min(incomeCap, investmentShare, rules.maxCap)))
}

type finalSummary struct {
	taxAfterRebate, totalTax, minimumTaxAmount, payable, excessTds float64
	isMinimumTaxApplied                                            bool
}

func calculateFinalTaxSummary(calculatedTax, minimumTax, totalTds, investmentRebate, taxableIncome, threshold float64) finalSummary {
	const otherRebate, rebateClawback = 0.0, 0.0
	isAbove := taxableIncome > threshold
	effectiveMinimumTax := 0.0
	if isAbove {
		effectiveMinimumTax = minimumTax
	}
	taxAfterRebate := jsval.Max(0, calculatedTax-investmentRebate-otherRebate)
	taxBeforeClawback := 0.0
	if isAbove {
		taxBeforeClawback = jsval.Max(taxAfterRebate, effectiveMinimumTax)
	}
	totalTax := taxBeforeClawback + rebateClawback
	return finalSummary{
		taxAfterRebate:      taxAfterRebate,
		totalTax:            totalTax,
		minimumTaxAmount:    effectiveMinimumTax,
		payable:             jsval.Max(0, totalTax-totalTds),
		excessTds:           jsval.Max(0, totalTds-totalTax),
		isMinimumTaxApplied: isAbove && taxAfterRebate < effectiveMinimumTax,
	}
}

// assertSafeAmount returns the value as a number once it passes the JS checks.
func assertSafeAmount(value Value, field string) float64 {
	n, ok := value.(float64)
	if !ok || math.IsNaN(n) || math.IsInf(n, 0) || n < 0 {
		throw(`"` + field + `" must be a finite non-negative number (received ` + jsval.ToString(value) + `).`)
	}
	if n > MaxSafeBDTAmount {
		throw(`"` + field + `" exceeds maximum safe BDT amount (9007199254740991).`)
	}
	return n
}

type profile struct {
	category, effectiveCategory, location string
	age                                   Value // number or null
	parentOfDisabled, firstTimeFiler      bool
}

func resolveEffectiveProfile(category, age, parentOfDisabled, location, firstTimeFiler Value, year fiscalYear) profile {
	cat, isStr := category.(string)
	if !isStr || !slices.Contains(AllAcceptedCategories, cat) {
		throw(`Unsupported category "` + jsval.ToString(category) + `". Supported categories: ` + strings.Join(AllAcceptedCategories, ", ") + `.`)
	}
	loc, isStr := location.(string)
	if !isStr || !slices.Contains(Locations, loc) {
		throw(`Unsupported location "` + jsval.ToString(location) + `". Supported locations: ` + strings.Join(Locations, ", ") + `.`)
	}
	if !jsval.IsNullish(age) {
		n, ok := age.(float64)
		if !ok || !jsval.IsInteger(n) || n < 0 || n > 150 {
			throw(`"age" must be an integer between 0 and 150 (received ` + jsval.ToString(age) + `).`)
		}
	}
	baseCategory := cat
	if cat == "parent_disabled" {
		baseCategory = "general"
	}
	// resolveDisabledDependentCount({category, parentOfDisabled, disabledDependentCount: undefined})
	dependentCount := jsval.Max(
		normalizeDisabledDependentCount(jsval.Undefined),
		normalizeDisabledDependentCount(parentOfDisabled),
		thresholdProfile{category: cat}.legacyCategoryCount(),
	)
	autoPromotes := !year.proto && fiscalYearMetadata[year.s].autoPromotesAge65
	effective := baseCategory
	if autoPromotes && ageAtLeast65(age) && baseCategory != "disabled" && baseCategory != "freedom_fighter" && baseCategory != "third_gender" {
		effective = "senior"
	}
	return profile{
		category:          cat,
		effectiveCategory: effective,
		age:               jsval.Coalesce(age, nil),
		parentOfDisabled:  dependentCount > 0,
		location:          loc,
		firstTimeFiler:    jsval.Truthy(firstTimeFiler),
	}
}

func (p profile) threshold() thresholdProfile {
	return thresholdProfile{category: p.category, age: p.age, parentOfDisabled: p.parentOfDisabled}
}

func exemptionsObject(singlePool, maxCap float64) *jsval.Object {
	return jsval.Obj(
		"single_pool", singlePool,
		"max_cap_bdt", maxCap,
		"house", 0.0,
		"medical", 0.0,
		"transport", 0.0,
		"lfa", 0.0,
		"total", singlePool,
	)
}

var componentKeys = []string{"basic", "house", "medical", "transport", "lfa", "employer_rpf", "others"}

func resolveIncomeInputs(taxableIncome, income Value, yearIn fiscalYear) *jsval.Object {
	// Re-normalizing String(P) of a prototype alias never matches again, so this throws for it.
	year := normalizeFiscalYear(yearIn)
	exemptionRule := getSalaryExemptionRuleForYear(year.s)
	directTaxable := taxableIncome

	if !jsval.IsNullish(directTaxable) && !jsval.IsNullish(income) {
		throw(`Provide either "taxable_income" or "income" components, not both.`)
	}
	if jsval.IsNullish(directTaxable) && (!jsval.Truthy(income) || jsval.TypeOf(income) != "object") {
		throw(`Provide either "taxable_income" (annual BDT) or "income" (salary components / gross_salary).`)
	}

	if !jsval.IsNullish(directTaxable) {
		n := assertSafeAmount(directTaxable, "taxable_income")
		return jsval.Obj(
			"mode", "taxable_income",
			"period", "annual",
			"gross_income_bdt", n,
			"exemptions_bdt", exemptionsObject(0, exemptionRule.maxAmount),
			"components_annual_bdt", nil,
			"taxable_income_bdt", n,
		)
	}

	period := get(income, "period")
	if !jsval.Truthy(period) {
		period = "annual"
	}
	if period != "annual" && period != "monthly" {
		throw(`Unsupported income.period "` + jsval.ToString(period) + `". Expected "annual" or "monthly".`)
	}
	multiplier := 1.0
	if period == "monthly" {
		multiplier = 12
	}

	hasGross := !jsval.IsNullish(get(income, "gross_salary"))
	hasComponents := false
	for _, k := range componentKeys {
		if !jsval.IsNullish(get(income, k)) {
			hasComponents = true
			break
		}
	}
	if hasGross && hasComponents {
		throw(`Provide either "income.gross_salary" OR itemized components ("basic", "house", "medical", "transport", "lfa", "employer_rpf", "others"), not both.`)
	}
	if !hasGross && !hasComponents &&
		jsval.IsUndefined(get(income, "bonus")) &&
		jsval.IsUndefined(get(income, "bonus2")) &&
		jsval.IsUndefined(get(income, "additional_income")) {
		throw(`Income object is empty. Provide "gross_salary" or itemized salary components ("basic", "house", "medical", "transport", "others", "bonus").`)
	}

	bonus := assertSafeAmount(jsval.Coalesce(get(income, "bonus"), 0.0), "income.bonus")
	bonus2 := assertSafeAmount(jsval.Coalesce(get(income, "bonus2"), 0.0), "income.bonus2")
	additional := assertSafeAmount(jsval.Coalesce(get(income, "additional_income"), 0.0), "income.additional_income")

	applyExemption := get(income, "apply_exemption") != false

	if hasGross {
		gross := assertSafeAmount(get(income, "gross_salary"), "income.gross_salary")
		annualBase := assertSafeAmount(float64(gross*multiplier), "annualized income.gross_salary")
		totalGross := assertSafeAmount(annualBase+bonus+bonus2+additional, "computed gross_income_bdt")
		totalExempt := 0.0
		if applyExemption {
			totalExempt = calculateEmploymentExemption(totalGross, year.s)
		}
		taxableSalary := assertSafeAmount(jsval.Max(0, totalGross-totalExempt), "computed taxable_income_bdt")

		if jsval.Truthy(get(income, "use_standard_breakdown")) {
			basic := jsval.Round(annualBase * standardSalarySplit.basic)
			house := jsval.Round(annualBase * standardSalarySplit.house)
			medical := jsval.Round(annualBase * standardSalarySplit.medical)
			transport := annualBase - basic - house - medical
			return jsval.Obj(
				"mode", "gross_salary_standard_split",
				"period", period,
				"gross_income_bdt", totalGross,
				"exemptions_bdt", exemptionsObject(totalExempt, exemptionRule.maxAmount),
				"components_annual_bdt", jsval.Obj(
					"basic", basic,
					"house", house,
					"medical", medical,
					"transport", transport,
					"lfa", 0.0,
					"employer_rpf", 0.0,
					"others", 0.0,
					"bonus", bonus,
					"bonus2", bonus2,
					"additional_income", additional,
				),
				"taxable_income_bdt", taxableSalary,
			)
		}
		return jsval.Obj(
			"mode", "gross_salary_unsplit",
			"period", period,
			"gross_income_bdt", totalGross,
			"exemptions_bdt", exemptionsObject(totalExempt, exemptionRule.maxAmount),
			"components_annual_bdt", jsval.Obj(
				"gross_salary", annualBase,
				"bonus", bonus,
				"bonus2", bonus2,
				"additional_income", additional,
			),
			"taxable_income_bdt", taxableSalary,
		)
	}

	annual := jsval.NewObject()
	annualOf := map[string]float64{}
	for _, k := range componentKeys {
		raw := assertSafeAmount(jsval.Coalesce(get(income, k), 0.0), "income."+k)
		a := assertSafeAmount(float64(raw*multiplier), "annualized income."+k)
		annual.Set(k, a)
		annualOf[k] = a
	}
	// calculateSalaryExemptions: left-to-right sum, then the single-pool exemption.
	grossSalary := annualOf["basic"] + annualOf["house"] + annualOf["medical"] + annualOf["transport"] +
		annualOf["lfa"] + annualOf["employer_rpf"] + annualOf["others"] + bonus + bonus2 + additional
	calcExempt := calculateEmploymentExemption(grossSalary, year.s)
	totalExempt := 0.0
	if applyExemption {
		totalExempt = calcExempt
	}
	taxableSalary := jsval.Max(0, grossSalary-totalExempt)
	assertSafeAmount(grossSalary, "computed gross_income_bdt")
	assertSafeAmount(taxableSalary, "computed taxable_income_bdt")

	components := annual.Clone()
	components.Set("bonus", bonus)
	components.Set("bonus2", bonus2)
	components.Set("additional_income", additional)
	return jsval.Obj(
		"mode", "components",
		"period", period,
		"gross_income_bdt", grossSalary,
		"exemptions_bdt", exemptionsObject(totalExempt, exemptionRule.maxAmount),
		"components_annual_bdt", components,
		"taxable_income_bdt", taxableSalary,
	)
}

func resolveInvestmentInputs(investments Value, taxableIncome float64, yearIn fiscalYear) *jsval.Object {
	year := normalizeFiscalYear(yearIn)
	caps := getInvestmentInstrumentCapsForYear(year.s)
	optimalCeiling := calculateMaxRebateableInvestment(taxableIncome, year.s)

	simple := func(total, caps Value) *jsval.Object {
		return jsval.Obj(
			"total_investment_bdt", total,
			"instrument_capped_investment_bdt", total,
			"eligible_investment_bdt", total,
			"max_rebateable_investment_bdt", optimalCeiling,
			"apply_instrument_caps", caps,
			"breakdown_bdt", nil,
		)
	}

	if jsval.IsNullish(investments) {
		return simple(0.0, true)
	}
	if n, ok := investments.(float64); ok {
		assertSafeAmount(n, "investments")
		return simple(n, false)
	}
	inv, ok := investments.(*jsval.Object)
	if !ok {
		throw(`"investments" must be a non-negative number (BDT) or an investment breakdown object.`)
	}

	hasTotal := !jsval.IsNullish(inv.Get("total"))
	hasInstruments := false
	for _, k := range instrumentKeys {
		if !jsval.IsNullish(inv.Get(k)) {
			hasInstruments = true
			break
		}
	}
	if hasTotal && hasInstruments {
		throw(`Provide either "investments.total" OR itemized investment fields, not both.`)
	}
	if hasTotal {
		total := assertSafeAmount(inv.Get("total"), "investments.total")
		return simple(total, false)
	}
	if inv.Get("apply_instrument_caps") == false {
		throw(`Statutory Sixth Schedule Part 3 instrument caps are mandatory for itemized investments; remove "apply_instrument_caps: false".`)
	}

	rawLife := assertSafeAmount(jsval.Coalesce(inv.Get("life_insurance"), 0.0), "investments.life_insurance")
	policyValue := inv.Get("life_insurance_policy_value")
	if rawLife > 0 && jsval.IsNullish(policyValue) {
		throw(`Provide "investments.life_insurance_policy_value" (policy sum assured in BDT) when "investments.life_insurance" > 0 so the statutory 10% cap can be enforced.`)
	}
	lifePolicyCap := 0.0
	if !jsval.IsNullish(policyValue) {
		pv := assertSafeAmount(policyValue, "investments.life_insurance_policy_value")
		lifePolicyCap = jsval.Round(pv * lifeInsurancePolicyRate)
	}

	breakdown := jsval.NewObject()
	rawTotal, cappedTotal := 0.0, 0.0
	for _, k := range instrumentKeys {
		val := assertSafeAmount(jsval.Coalesce(inv.Get(k), 0.0), "investments."+k)
		breakdown.Set(k, val)
		rawTotal += val
		var capV Value = caps[k]
		if k == "life_insurance" {
			capV = lifePolicyCap
		}
		if capV == nil {
			cappedTotal += val
		} else {
			cappedTotal += jsval.Min(val, capV.(float64))
		}
	}
	assertSafeAmount(rawTotal, "total_investment_bdt")
	assertSafeAmount(cappedTotal, "instrument_capped_investment_bdt")

	return jsval.Obj(
		"total_investment_bdt", rawTotal,
		"instrument_capped_investment_bdt", cappedTotal,
		"eligible_investment_bdt", cappedTotal,
		"max_rebateable_investment_bdt", optimalCeiling,
		"apply_instrument_caps", true,
		"life_insurance_policy_value_bdt", jsval.Coalesce(policyValue, nil),
		"life_insurance_cap_bdt", lifePolicyCap,
		"breakdown_bdt", breakdown,
	)
}

func formatSlabForOutput(s slab, index int) *jsval.Object {
	unbounded := math.IsInf(s.upper, 1)
	var upper, width Value = s.upper, s.upper - s.lower
	if unbounded {
		upper, width = nil, nil
	}
	return jsval.Obj(
		"index", float64(index),
		"title", s.title,
		"lower_bdt", s.lower,
		"upper_bdt", upper,
		"unbounded", unbounded,
		"width_bdt", width,
		"rate_percent", s.rate,
	)
}

func firstTimeFilerMinimumTax(year string) Value {
	if year == "2026-27" || year == "2025-26" {
		return float64(minimumTaxFirstTime)
	}
	return nil
}

func floatsToValues(xs []float64) []Value {
	out := make([]Value, len(xs))
	for i, x := range xs {
		out[i] = x
	}
	return out
}

func stringsToValues(xs []string) []Value {
	out := make([]Value, len(xs))
	for i, x := range xs {
		out[i] = x
	}
	return out
}

// ListSupportedYears is listSupportedYears().
func ListSupportedYears() *jsval.Object {
	years := make([]Value, 0, len(SupportedFiscalYears))
	for _, fy := range SupportedFiscalYears {
		meta := fiscalYearMetadata[fy]
		thresholds := taxFreeThresholdsByYear[fy]
		general, _ := lookup(thresholds, "general")
		parent, _ := lookup(thresholds, "parent_disabled")
		exemption := getSalaryExemptionRuleForYear(fy)
		years = append(years, jsval.Obj(
			"fiscal_year", fy,
			"label", meta.label,
			"assessment_year", meta.assessmentYear,
			"general_threshold_bdt", general,
			"parent_of_disabled_allowance_bdt", parent,
			"slab_count", float64(len(meta.slabRatesPercent)),
			"rates_percent", floatsToValues(meta.slabRatesPercent),
			"salary_exemption_formula", exemption.rule,
			"salary_exemption_cap_bdt", exemption.maxAmount,
			"rebate_formula", rebateRulesByYear[fy].formula,
			"investment_instrument_caps_bdt", investmentCapsObject(fy),
			"life_insurance_cap_rule", lifeInsuranceCapRule,
			"minimum_tax_bdt", kvObject(minimumTaxByYear[fy], ""),
			"first_time_filer_minimum_tax_bdt", firstTimeFilerMinimumTax(fy),
			"notes", meta.notes,
		))
	}
	categories := make([]Value, 0, len(TaxpayerCategories))
	for _, cat := range TaxpayerCategories {
		var notes Value = jsval.Undefined
		if cat == "senior" {
			notes = `Applies automatically in FY 2025-26 and FY 2026-27 when age >= 65 unless taxpayer has a higher threshold category (disabled, third_gender, freedom_fighter); pass category: "senior" explicitly for FY 2023-24 / FY 2024-25.`
		}
		categories = append(categories, jsval.Obj("value", cat, "notes", notes))
	}
	return jsval.Obj(
		"default_year", DefaultFiscalYear,
		"default_comparison", jsval.Obj(
			"from_year", DefaultComparisonFromYear,
			"to_year", DefaultComparisonToYear,
		),
		"supported_years", years,
		"categories", categories,
		"legacy_category_aliases", []Value{"parent_disabled"},
		"locations", stringsToValues(Locations),
		"salary_exemption_caps", salaryExemptionCaps(),
		"life_insurance_cap_rule", lifeInsuranceCapRule,
		"investment_instrument_caps_by_year_bdt", investmentCapsByYearObject(),
		"investment_instrument_caps_bdt", investmentCapsObject(DefaultFiscalYear),
	)
}

// GetRulesForYear is getRulesForYear(args).
func GetRulesForYear(args Value) (out *jsval.Object, err error) {
	defer catch(&err)
	args = destructure(args, "year")
	year := normalizeFiscalYear(orDefault(get(args, "year"), DefaultFiscalYear))
	p := resolveEffectiveProfile(
		orDefault(get(args, "category"), "general"),
		orDefault(get(args, "age"), nil),
		orDefault(get(args, "parent_of_disabled"), false),
		"dhaka", false, year)
	if year.proto {
		throwType("Cannot destructure property 'parent_disabled' of 'rawThresholds' as it is undefined.")
	}
	fy := year.s
	meta := fiscalYearMetadata[fy]
	parentAllowance, _ := lookup(taxFreeThresholdsByYear[fy], "parent_disabled")
	effectiveThreshold := getTaxFreeThresholdForYear(fy, p.threshold())
	slabsOut := []Value{}
	for i, s := range calculateTaxSlabsForYear(fy, effectiveThreshold) {
		slabsOut = append(slabsOut, formatSlabForOutput(s, i))
	}
	rebate := rebateRulesByYear[fy]
	minTax := kvObject(minimumTaxByYear[fy], "")
	minTax.Set("first_time_filer_bdt", firstTimeFilerMinimumTax(fy))
	minTax.Set("applicable_only_above_threshold", true)

	return jsval.Obj(
		"fiscal_year", fy,
		"assessment_year", meta.assessmentYear,
		"label", meta.label,
		"notes", meta.notes,
		"thresholds_bdt", kvObject(taxFreeThresholdsByYear[fy], "parent_disabled"),
		"parent_of_disabled_allowance_bdt", parentAllowance,
		"requested_profile", jsval.Obj(
			"category", p.category,
			"effective_category", p.effectiveCategory,
			"age", p.age,
			"parent_of_disabled", p.parentOfDisabled,
			"effective_threshold_bdt", effectiveThreshold,
		),
		"slabs", slabsOut,
		"rebate_rules", jsval.Obj(
			"taxable_income_rate_percent", rebate.taxableIncomeRate*100,
			"investment_rate_percent", rebate.investmentRate*100,
			"max_cap_bdt", rebate.maxCap,
			"formula", rebate.formula,
		),
		"minimum_tax_bdt", minTax,
		"salary_exemption_rule", salaryExemptionRuleObject(getSalaryExemptionRuleForYear(fy)),
		"salary_exemption_caps", salaryExemptionCaps(),
		"investment_instrument_caps_bdt", investmentCapsObject(fy),
	), nil
}

// CalculateTaxForYear is calculateTaxForYear(args).
func CalculateTaxForYear(args Value) (out *jsval.Object, err error) {
	defer catch(&err)
	return calculateTaxForYear(destructure(args, "year")), nil
}

func calculateTaxForYear(args Value) *jsval.Object {
	year := normalizeFiscalYear(orDefault(get(args, "year"), DefaultFiscalYear))
	tds := assertSafeAmount(orDefault(get(args, "tds"), 0.0), "tds")
	p := resolveEffectiveProfile(
		orDefault(get(args, "category"), "general"),
		orDefault(get(args, "age"), nil),
		orDefault(get(args, "parent_of_disabled"), false),
		orDefault(get(args, "location"), "dhaka"),
		orDefault(get(args, "first_time_filer"), false),
		year)

	incomeSummary := resolveIncomeInputs(get(args, "taxable_income"), get(args, "income"), year)
	fy := year.s
	taxable := incomeSummary.Get("taxable_income_bdt").(float64)

	threshold := getTaxFreeThresholdForYear(fy, p.threshold())
	statutoryMinTax := getMinimumTaxForYear(fy, p.location, p.firstTimeFiler)
	idPrefix := "slab"
	switch fy {
	case "2026-27":
		idPrefix = "slab-2026"
	case "2025-26":
		idPrefix = "slab-2025"
	}
	rows := calculateSlabBreakdown(taxable, calculateTaxSlabsForYear(fy, threshold), idPrefix)
	grossTax := sumSlabTax(rows)

	investment := resolveInvestmentInputs(orDefault(get(args, "investments"), 0.0), taxable, year)
	rebate := calculateInvestmentRebateForYear(fy, taxable, investment.Get("eligible_investment_bdt").(float64))

	final := calculateFinalTaxSummary(grossTax, statutoryMinTax, tds, rebate, taxable, threshold)
	assertSafeAmount(tds+rebate, "tds + rebate")

	meta := fiscalYearMetadata[fy]
	breakdown := make([]Value, len(rows))
	for i, r := range rows {
		unbounded := math.IsInf(r.slab.upper, 1)
		var upper Value = r.slab.upper
		if unbounded {
			upper = nil
		}
		breakdown[i] = jsval.Obj(
			"index", float64(i),
			"id", r.id,
			"title", r.slab.title,
			"lower_bdt", r.slab.lower,
			"upper_bdt", upper,
			"unbounded", unbounded,
			"rate_percent", r.slab.rate,
			"taxable_amount_bdt", r.amount,
			"tax_bdt", r.cut,
		)
	}
	investmentSummary := investment.Clone()
	investmentSummary.Set("rebate_bdt", rebate)
	investmentSummary.Set("formula", rebateRulesByYear[fy].formula)

	return jsval.Obj(
		"fiscal_year", fy,
		"assessment_year", meta.assessmentYear,
		"label", meta.label,
		"profile", jsval.Obj(
			"category", p.category,
			"effective_category", p.effectiveCategory,
			"age", p.age,
			"parent_of_disabled", p.parentOfDisabled,
			"location", p.location,
			"first_time_filer", p.firstTimeFiler,
		),
		"tax_free_threshold_bdt", threshold,
		"income_summary", incomeSummary,
		"taxable_income_bdt", taxable,
		"slab_breakdown", breakdown,
		"gross_tax_bdt", grossTax,
		"rebate_bdt", rebate,
		"tax_after_rebate_bdt", final.taxAfterRebate,
		"statutory_minimum_tax_bdt", statutoryMinTax,
		"minimum_tax_bdt", final.minimumTaxAmount,
		"is_minimum_tax_applied", final.isMinimumTaxApplied,
		"below_tax_free_threshold", taxable <= threshold,
		"total_tax_bdt", final.totalTax,
		"investment_summary", investmentSummary,
		"tds_bdt", tds,
		"payable_tax_bdt", final.payable,
		"excess_tds_bdt", final.excessTds,
		"excess_tds_or_rebate_bdt", final.excessTds,
	)
}

// CompareTaxYears is compareTaxYears(args).
func CompareTaxYears(args Value) (out *jsval.Object, err error) {
	defer catch(&err)
	args = destructure(args, "from_year")
	fromYear := orDefault(get(args, "from_year"), DefaultComparisonFromYear)
	toYear := orDefault(get(args, "to_year"), DefaultComparisonToYear)
	shared := jsval.NewObject()
	if o, ok := args.(*jsval.Object); ok {
		for _, k := range o.Keys() {
			if k != "from_year" && k != "to_year" {
				shared.Set(k, o.Get(k))
			}
		}
	}
	withYear := func(y Value) *jsval.Object {
		a := shared.Clone()
		a.Set("year", y)
		return a
	}
	from := calculateTaxForYear(withYear(fromYear))
	to := calculateTaxForYear(withYear(toYear))
	num := func(o *jsval.Object, k string) float64 { return o.Get(k).(float64) }

	thresholdDiff := num(to, "tax_free_threshold_bdt") - num(from, "tax_free_threshold_bdt")
	grossTaxDiff := num(to, "gross_tax_bdt") - num(from, "gross_tax_bdt")
	rebateDiff := num(to, "rebate_bdt") - num(from, "rebate_bdt")
	totalTaxDiff := num(to, "total_tax_bdt") - num(from, "total_tax_bdt")
	payableDiff := num(to, "payable_tax_bdt") - num(from, "payable_tax_bdt")

	taxSavings, additionalTax := 0.0, 0.0
	if totalTaxDiff < 0 {
		taxSavings = math.Abs(totalTaxDiff)
	}
	if totalTaxDiff > 0 {
		additionalTax = totalTaxDiff
	}
	loc := jsval.ToLocaleStringEnUS
	fromLabel, toLabel := from.Get("label").(string), to.Get("label").(string)

	verdict := "no_change"
	summary := "Total tax remains BDT " + loc(num(to, "total_tax_bdt")) + " across " + fromLabel + " and " + toLabel
	if taxSavings > 0 {
		verdict = "savings"
		summary = "Total tax decreases by BDT " + loc(taxSavings) + " in " + toLabel + " vs " + fromLabel
	} else if additionalTax > 0 {
		verdict = "increase"
		summary = "Total tax increases by BDT " + loc(additionalTax) + " in " + toLabel + " vs " + fromLabel
	}
	fromPayable, toPayable := loc(num(from, "payable_tax_bdt")), loc(num(to, "payable_tax_bdt"))
	switch {
	case payableDiff > 0:
		summary += "; final payable after rebate and TDS increases by BDT " + loc(payableDiff) + " (BDT " + fromPayable + " -> BDT " + toPayable + ")."
	case payableDiff < 0:
		summary += "; final payable after rebate and TDS decreases by BDT " + loc(math.Abs(payableDiff)) + " (BDT " + fromPayable + " -> BDT " + toPayable + ")."
	default:
		summary += "; final payable after rebate and TDS stays BDT " + toPayable + "."
	}

	return jsval.Obj(
		"from_year", from.Get("fiscal_year"),
		"to_year", to.Get("fiscal_year"),
		"from", from,
		"to", to,
		"comparison", jsval.Obj(
			"threshold_diff_bdt", thresholdDiff,
			"gross_tax_diff_bdt", grossTaxDiff,
			"rebate_diff_bdt", rebateDiff,
			"total_tax_diff_bdt", totalTaxDiff,
			"payable_tax_diff_bdt", payableDiff,
			"tax_savings_bdt", taxSavings,
			"additional_tax_bdt", additionalTax,
			"verdict", verdict,
			"summary", summary,
		),
	), nil
}
