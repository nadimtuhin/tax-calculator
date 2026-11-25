package engine

import (
	"slices"
	"time"

	"github.com/nadimtuhin/tax-calculator/services/tax-go/jsval"
)

// Constants and rule tables from src/utils/taxEngine.js, taxSlabs*.js and fa2026Rules.js.
// Tables are built fresh on each call so callers can never mutate shared state.

var SupportedFiscalYears = []string{"2023-24", "2024-25", "2025-26", "2026-27"}

const (
	DefaultComparisonFromYear = "2025-26"
	DefaultComparisonToYear   = "2026-27"
	MaxSafeBDTAmount          = 9007199254740991
	lakh                      = 100000
	lifeInsurancePolicyRate   = 0.10
	lifeInsuranceCapRule      = "10% of policy sum assured"
	disabledDependentAllow    = 50000
	minimumTaxFirstTime       = 1000
)

// DefaultFiscalYear mirrors DEFAULT_FISCAL_YEAR: computed once at start-up from the local clock.
var DefaultFiscalYear = ResolveDefaultFiscalYear(time.Now(), SupportedFiscalYears)

// GetDefaultFiscalYear is getDefaultFiscalYear: the most recently completed 1 July–30 June year.
func GetDefaultFiscalYear(date time.Time) string {
	endYear := date.Year()
	if date.Month() < time.July {
		endYear--
	}
	suffix := endYear % 100
	if suffix < 0 {
		suffix = -suffix // never reached for real dates; keeps the format well-formed
	}
	return itoa(endYear-1) + "-" + pad2(suffix)
}

// ResolveDefaultFiscalYear is resolveDefaultFiscalYear.
func ResolveDefaultFiscalYear(date time.Time, supported []string) string {
	preferred := GetDefaultFiscalYear(date)
	if len(supported) == 0 || slices.Contains(supported, preferred) {
		return preferred
	}
	sorted := slices.Clone(supported)
	slices.Sort(sorted)
	var notLater []string
	for _, y := range sorted {
		if y <= preferred {
			notLater = append(notLater, y)
		}
	}
	if len(notLater) > 0 {
		return notLater[len(notLater)-1]
	}
	return sorted[0]
}

type yearMeta struct {
	label, assessmentYear, notes string
	slabRatesPercent             []float64
	autoPromotesAge65            bool
}

var fiscalYearMetadata = map[string]yearMeta{
	"2023-24": {
		label:             "FY 2023-2024",
		assessmentYear:    "2024-25",
		slabRatesPercent:  []float64{0, 5, 10, 15, 20, 25},
		autoPromotesAge65: false,
		notes:             "Income Year 2023-24 (Assessment Year 2024-25). 6 slabs (0%, 5%, 10%, 15%, 20%, 25%; no 30% band before Finance Act 2024); ITA 2023 Para 27 single-pool employment exemption min(1/3 gross, BDT 4.5L); location-tiered minimum tax above threshold (BDT 3,000-5,000); Section 78 rebate min(3% taxable, 15% eligible investment, BDT 10L); Mutual Fund cap BDT 5L.",
	},
	"2024-25": {
		label:             "FY 2024-2025",
		assessmentYear:    "2025-26",
		slabRatesPercent:  []float64{0, 5, 10, 15, 20, 25, 30},
		autoPromotesAge65: false,
		notes:             "Income Year 2024-25 (Assessment Year 2025-26). 7 slabs (0%, 5%, 10%, 15%, 20%, 25%, 30%); Para 27 single-pool employment exemption min(1/3 gross, BDT 5L per Finance Ordinance 2025); location-tiered minimum tax above threshold (BDT 3,000-5,000); Section 78 rebate min(3% taxable, 15% eligible investment, BDT 10L); Mutual Fund cap BDT 5L.",
	},
	"2025-26": {
		label:             "FY 2025-2026",
		assessmentYear:    "2026-27",
		slabRatesPercent:  []float64{0, 10, 15, 20, 25, 30},
		autoPromotesAge65: true,
		notes:             "Income Year 2025-26 (Assessment Year 2026-27). Enacted Finance Act 2026 Schedule 1 400k-family thresholds; 6 slabs (5% bracket removed); Para 27 single-pool employment exemption min(1/3 gross, BDT 5L); unified BDT 5,000 minimum tax above threshold (BDT 1,000 for first-time filers); Section 78 rebate min(3% taxable, 10% eligible investment, BDT 7.5L); Mutual Fund BDT 5L sub-limit removed.",
	},
	"2026-27": {
		label:             "FY 2026-2027",
		assessmentYear:    "2027-28",
		slabRatesPercent:  []float64{0, 10, 15, 20, 25, 30},
		autoPromotesAge65: true,
		notes:             "Income Year 2026-27 (Assessment Year 2027-28). Finance Act 2026 400k-family thresholds; 6 slabs; Para 27 single-pool employment exemption min(1/3 gross, BDT 5L); unified BDT 5,000 minimum tax above threshold (BDT 1,000 for first-time filers); Section 78 rebate min(3% taxable, 10% eligible investment, BDT 7.5L); Mutual Fund uncapped.",
	},
}

var TaxpayerCategories = []string{"general", "female", "senior", "disabled", "third_gender", "freedom_fighter"}

var AllAcceptedCategories = append(slices.Clone(TaxpayerCategories), "parent_disabled")

var Locations = []string{"dhaka", "chittagong", "other_city", "district"}

type salaryExemptionRule struct {
	maxAmount float64
	rule      string
}

var salaryExemptionRulesByYear = map[string]salaryExemptionRule{
	"2023-24": {450000, "min(1/3 of gross employment income, BDT 450,000)"},
	"2024-25": {500000, "min(1/3 of gross employment income, BDT 500,000)"},
	"2025-26": {500000, "min(1/3 of gross employment income, BDT 500,000)"},
	"2026-27": {500000, "min(1/3 of gross employment income, BDT 500,000)"},
}

func salaryExemptionRuleObject(r salaryExemptionRule) *jsval.Object {
	return jsval.Obj(
		"model", "single_pool",
		"fraction", 1.0/3,
		"maxAmount", r.maxAmount,
		"rule", r.rule,
	)
}

func salaryExemptionCaps() *jsval.Object {
	return jsval.Obj(
		"model", "single_pool",
		"fraction", 1.0/3,
		"maxAmount", 500000.0,
		"maxAmountByYear", jsval.Obj(
			"2023-24", 450000.0,
			"2024-25", 500000.0,
			"2025-26", 500000.0,
			"2026-27", 500000.0,
		),
		"rule", "min(1/3 of gross employment income, BDT 500,000; BDT 450,000 in FY 2023-24) per ITA 2023 Sixth Schedule Part 1 Para 27",
	)
}

var standardSalarySplit = struct{ basic, house, medical float64 }{0.6, 0.25, 0.1}

// instrumentKeys is Object.keys() of every INVESTMENT_INSTRUMENT_CAPS_BY_YEAR entry.
var instrumentKeys = []string{"dps", "life_insurance", "stocks", "savings_certificate", "mutual_fund", "others", "philanthropic_donation"}

// investmentCaps maps instrument key to its cap; nil means uncapped (JS null).
var investmentInstrumentCapsByYear = map[string]map[string]jsval.Value{
	"2023-24": {"dps": 120000.0, "life_insurance": nil, "stocks": nil, "savings_certificate": 500000.0, "mutual_fund": 500000.0, "others": nil, "philanthropic_donation": 0.0},
	"2024-25": {"dps": 120000.0, "life_insurance": nil, "stocks": nil, "savings_certificate": 500000.0, "mutual_fund": 500000.0, "others": nil, "philanthropic_donation": 0.0},
	"2025-26": {"dps": 120000.0, "life_insurance": nil, "stocks": nil, "savings_certificate": 500000.0, "mutual_fund": nil, "others": nil, "philanthropic_donation": 0.0},
	"2026-27": {"dps": 120000.0, "life_insurance": nil, "stocks": nil, "savings_certificate": 500000.0, "mutual_fund": nil, "others": nil, "philanthropic_donation": nil},
}

func investmentCapsObject(year string) *jsval.Object {
	caps := investmentInstrumentCapsByYear[year]
	o := jsval.NewObject()
	for _, k := range instrumentKeys {
		o.Set(k, caps[k])
	}
	return o
}

func investmentCapsByYearObject() *jsval.Object {
	o := jsval.NewObject()
	for _, y := range SupportedFiscalYears {
		o.Set(y, investmentCapsObject(y))
	}
	return o
}

type kv struct {
	k string
	v float64
}

// Threshold tables in their JS key order (2025-26/2026-27 spread the FA2026 table then add parent_disabled).
var taxFreeThresholdsByYear = map[string][]kv{
	"2023-24": {{"general", 350000}, {"female", 400000}, {"senior", 400000}, {"disabled", 475000}, {"parent_disabled", 50000}, {"freedom_fighter", 500000}, {"third_gender", 475000}},
	"2024-25": {{"general", 350000}, {"female", 400000}, {"senior", 400000}, {"disabled", 475000}, {"parent_disabled", 50000}, {"freedom_fighter", 500000}, {"third_gender", 475000}},
	"2025-26": {{"general", 400000}, {"female", 450000}, {"senior", 450000}, {"disabled", 525000}, {"third_gender", 525000}, {"freedom_fighter", 550000}, {"parent_disabled", disabledDependentAllow}},
	"2026-27": {{"general", 400000}, {"female", 450000}, {"senior", 450000}, {"disabled", 525000}, {"third_gender", 525000}, {"freedom_fighter", 550000}, {"parent_disabled", disabledDependentAllow}},
}

var minimumTaxByYear = map[string][]kv{
	"2023-24": {{"dhaka", 5000}, {"chittagong", 5000}, {"other_city", 4000}, {"district", 3000}},
	"2024-25": {{"dhaka", 5000}, {"chittagong", 5000}, {"other_city", 4000}, {"district", 3000}},
	"2025-26": {{"dhaka", 5000}, {"chittagong", 5000}, {"other_city", 5000}, {"district", 5000}},
	"2026-27": {{"dhaka", 5000}, {"chittagong", 5000}, {"other_city", 5000}, {"district", 5000}},
}

func lookup(table []kv, key string) (float64, bool) {
	for _, e := range table {
		if e.k == key {
			return e.v, true
		}
	}
	return 0, false
}

func kvObject(table []kv, skip string) *jsval.Object {
	o := jsval.NewObject()
	for _, e := range table {
		if e.k != skip {
			o.Set(e.k, e.v)
		}
	}
	return o
}

type rebateRule struct {
	taxableIncomeRate, investmentRate, maxCap float64
	formula                                   string
}

var rebateRulesByYear = map[string]rebateRule{
	"2023-24": {0.03, 0.15, 1000000, "min(3% of taxable income, 15% of eligible investment, BDT 1,000,000)"},
	"2024-25": {0.03, 0.15, 1000000, "min(3% of taxable income, 15% of eligible investment, BDT 1,000,000)"},
	"2025-26": {0.03, 0.10, 750000, "min(3% of taxable income, 10% of eligible investment, BDT 750,000)"},
	"2026-27": {0.03, 0.10, 750000, "min(3% of taxable income, 10% of eligible investment, BDT 750,000)"},
}

var yearAliases = map[string]string{
	"2023": "2023-24", "2023-24": "2023-24", "2023-2024": "2023-24",
	"2024": "2024-25", "2024-25": "2024-25", "2024-2025": "2024-25",
	"2025": "2025-26", "2025-26": "2025-26", "2025-2026": "2025-26",
	"2026": "2026-27", "2026-27": "2026-27", "2026-2027": "2026-27",
}

// objectPrototypeAliases reproduces YEAR_ALIASES[cleaned] hitting an inherited Object.prototype
// member: the lookup is truthy, and String() of the member is what later error messages print.
var objectPrototypeAliases = map[string]string{
	"constructor":          "function Object() { [native code] }",
	"__defineGetter__":     "function __defineGetter__() { [native code] }",
	"__defineSetter__":     "function __defineSetter__() { [native code] }",
	"hasOwnProperty":       "function hasOwnProperty() { [native code] }",
	"__lookupGetter__":     "function __lookupGetter__() { [native code] }",
	"__lookupSetter__":     "function __lookupSetter__() { [native code] }",
	"isPrototypeOf":        "function isPrototypeOf() { [native code] }",
	"propertyIsEnumerable": "function propertyIsEnumerable() { [native code] }",
	"toString":             "function toString() { [native code] }",
	"valueOf":              "function valueOf() { [native code] }",
	"toLocaleString":       "function toLocaleString() { [native code] }",
	"__proto__":            "[object Object]",
}
