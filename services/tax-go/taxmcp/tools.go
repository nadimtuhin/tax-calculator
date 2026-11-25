package taxmcp

import (
	_ "embed"
	"encoding/json"
	"strings"

	"github.com/nadimtuhin/tax-calculator/services/tax-go/engine"
	"github.com/nadimtuhin/tax-calculator/services/tax-go/jsval"
)

// toolsJSON is the tools/list result of the JS server (packages/mcp/src/server.js),
// with the date-dependent year defaults left as {{placeholders}}.
//
//go:embed tools.json
var toolsJSON string

type toolDef struct {
	Name        string          `json:"name"`
	Title       string          `json:"title"`
	Description string          `json:"description"`
	InputSchema json.RawMessage `json:"inputSchema"`
	Annotations struct {
		ReadOnlyHint    bool `json:"readOnlyHint"`
		DestructiveHint bool `json:"destructiveHint"`
		IdempotentHint  bool `json:"idempotentHint"`
		OpenWorldHint   bool `json:"openWorldHint"`
	} `json:"annotations"`
}

func loadToolDefs() []toolDef {
	src := strings.NewReplacer(
		"{{DEFAULT_FISCAL_YEAR}}", engine.DefaultFiscalYear,
		"{{DEFAULT_COMPARISON_FROM_YEAR}}", engine.DefaultComparisonFromYear,
		"{{DEFAULT_COMPARISON_TO_YEAR}}", engine.DefaultComparisonToYear,
	).Replace(toolsJSON)
	var defs []toolDef
	if err := json.Unmarshal([]byte(src), &defs); err != nil {
		panic("taxmcp: bad tools.json: " + err.Error())
	}
	return defs
}

func nonNegative() numberSchema { return numberSchema{hasMin: true} }

var (
	categorySchema = enumSchema(engine.AllAcceptedCategories)
	locationSchema = enumSchema(engine.Locations)
	ageSchema      = numberSchema{isInt: true, hasMin: true, hasMax: true, max: 150}

	incomeSchema = objectSchema{
		{key: "period", s: enumSchema{"annual", "monthly"}, deflt: "annual"},
		{key: "gross_salary", s: nonNegative()},
		{key: "use_standard_breakdown", s: booleanSchema{}},
		{key: "apply_exemption", s: booleanSchema{}},
		{key: "basic", s: nonNegative()},
		{key: "house", s: nonNegative()},
		{key: "medical", s: nonNegative()},
		{key: "transport", s: nonNegative()},
		{key: "lfa", s: nonNegative()},
		{key: "employer_rpf", s: nonNegative()},
		{key: "others", s: nonNegative()},
		{key: "bonus", s: nonNegative()},
		{key: "bonus2", s: nonNegative()},
		{key: "additional_income", s: nonNegative()},
	}

	investmentsSchema = unionSchema{
		nonNegative(),
		objectSchema{
			{key: "total", s: nonNegative()},
			{key: "dps", s: nonNegative()},
			{key: "life_insurance", s: nonNegative()},
			{key: "life_insurance_policy_value", s: nonNegative()},
			{key: "stocks", s: nonNegative()},
			{key: "savings_certificate", s: nonNegative()},
			{key: "mutual_fund", s: nonNegative()},
			{key: "others", s: nonNegative()},
			{key: "apply_instrument_caps", s: literalTrue{}},
		},
	}
)

// profileFields are shared by calculate_tax and compare_years, after their year field(s).
func profileFields() []field {
	return []field{
		{key: "category", s: categorySchema, deflt: "general"},
		{key: "age", s: ageSchema},
		{key: "parent_of_disabled", s: booleanSchema{}},
		{key: "location", s: locationSchema, deflt: "dhaka"},
		{key: "first_time_filer", s: booleanSchema{}},
		{key: "taxable_income", s: nonNegative()},
		{key: "income", s: incomeSchema},
		{key: "investments", s: investmentsSchema},
		{key: "tds", s: nonNegative(), deflt: 0.0},
	}
}

type tool struct {
	def   toolDef
	input objectSchema
	run   func(args jsval.Value) (jsval.Value, error)
}

func listYears(jsval.Value) (jsval.Value, error) { return engine.ListSupportedYears(), nil }

func rulesForYear(a jsval.Value) (jsval.Value, error) { return engine.GetRulesForYear(a) }

func calculate(a jsval.Value) (jsval.Value, error) { return engine.CalculateTaxForYear(a) }

func compare(a jsval.Value) (jsval.Value, error) { return engine.CompareTaxYears(a) }

func newTools() []tool {
	inputs := map[string]objectSchema{
		"list_years": {},
		"get_rules": {
			{key: "year", s: stringSchema{}, deflt: engine.DefaultFiscalYear},
			{key: "category", s: categorySchema, deflt: "general"},
			{key: "age", s: ageSchema},
			{key: "parent_of_disabled", s: booleanSchema{}},
		},
		"calculate_tax": append(objectSchema{
			{key: "year", s: stringSchema{}, deflt: engine.DefaultFiscalYear},
		}, profileFields()...),
		"compare_years": append(objectSchema{
			{key: "from_year", s: stringSchema{}, deflt: engine.DefaultComparisonFromYear},
			{key: "to_year", s: stringSchema{}, deflt: engine.DefaultComparisonToYear},
		}, profileFields()...),
	}
	runs := map[string]func(jsval.Value) (jsval.Value, error){
		"list_years":    listYears,
		"get_rules":     rulesForYear,
		"calculate_tax": calculate,
		"compare_years": compare,
	}
	var tools []tool
	for _, d := range loadToolDefs() {
		in, ok := inputs[d.Name]
		if !ok || runs[d.Name] == nil {
			panic("taxmcp: no handler for tool " + d.Name)
		}
		tools = append(tools, tool{def: d, input: in, run: runs[d.Name]})
	}
	return tools
}

// call validates raw JSON arguments like the JS server and runs the tool.
// It returns the text content and whether the result is an error.
func (t tool) call(rawArgs []byte) (string, bool) {
	var args jsval.Value = jsval.NewObject()
	if len(rawArgs) > 0 {
		parsed, err := jsval.ParseJSON(rawArgs)
		if err != nil {
			return "Input validation error: Invalid arguments for tool " + t.def.Name + ": " + err.Error(), true
		}
		args = parsed
	}
	// The JS server never sees a top-level "__proto__" key: it is dropped before zod runs.
	if obj, ok := args.(*jsval.Object); ok && !jsval.IsUndefined(obj.Get("__proto__")) {
		obj = obj.Clone()
		obj.Delete("__proto__")
		args = obj
	}
	parsed, issues := t.input.parse(args)
	if len(issues) > 0 {
		msgs := make([]string, len(issues))
		for i, is := range issues {
			msgs[i] = is.String()
		}
		return "Input validation error: Invalid arguments for tool " + t.def.Name + ": " + strings.Join(msgs, ", "), true
	}
	out, err := t.run(parsed)
	if err != nil {
		return jsval.MustStringify(jsval.Obj("error", engineMessage(err)), "  "), true
	}
	return jsval.MustStringify(out, "  "), false
}

func engineMessage(err error) string {
	if je, ok := err.(*engine.JSError); ok {
		return je.Message
	}
	return err.Error()
}
