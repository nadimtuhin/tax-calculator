package taxmcp

import (
	"math"
	"strings"

	"github.com/nadimtuhin/tax-calculator/services/tax-go/jsval"
)

// The validators below reproduce the zod v4 schemas in packages/mcp/src/server.js:
// same checks, same issue order, same messages, and the same parsed output
// (shape-ordered keys, defaults filled in).

const maxSafeInteger = 9007199254740991

type issue struct {
	path []string
	msg  string
	// abort marks issues zod raises without `continue: true` (type and value
	// mismatches). Range checks and unrecognized keys keep going.
	abort bool
}

func (is issue) String() string {
	if len(is.path) == 0 {
		return is.msg
	}
	return strings.Join(is.path, ".") + ": " + is.msg
}

type schema interface {
	// parse returns the parsed value (Undefined when absent) and any issues, with paths relative to v.
	parse(v jsval.Value) (jsval.Value, []issue)
}

// receivedType names a value the way zod's English messages do.
func receivedType(v jsval.Value) string {
	switch x := v.(type) {
	case nil:
		return "null"
	case float64:
		switch {
		case math.IsNaN(x):
			return "NaN"
		case math.IsInf(x, 1):
			return "Infinity"
		case math.IsInf(x, -1):
			return "-Infinity"
		}
		return "number"
	case []jsval.Value:
		return "array"
	}
	if jsval.IsUndefined(v) {
		return "undefined"
	}
	return jsval.TypeOf(v)
}

func invalidType(expected string, v jsval.Value) issue {
	return issue{msg: "Invalid input: expected " + expected + ", received " + receivedType(v), abort: true}
}

// joinValues mirrors zod's util.joinValues for strings: each wrapped in double quotes, unescaped.
func joinValues(vals []string, sep string) string {
	q := make([]string, len(vals))
	for i, v := range vals {
		q[i] = `"` + v + `"`
	}
	return strings.Join(q, sep)
}

type numberSchema struct {
	isInt  bool
	min    float64
	hasMin bool
	max    float64
	hasMax bool
}

func (s numberSchema) parse(v jsval.Value) (jsval.Value, []issue) {
	x, ok := v.(float64)
	if !ok || math.IsNaN(x) || math.IsInf(x, 0) {
		return v, []issue{invalidType("number", v)}
	}
	var issues []issue
	if s.isInt {
		switch {
		case x != math.Trunc(x):
			return v, []issue{{msg: "Invalid input: expected int, received number", abort: true}}
		case x > maxSafeInteger:
			issues = append(issues, issue{msg: "Too big: expected int to be <=9007199254740991"})
		case x < -maxSafeInteger:
			issues = append(issues, issue{msg: "Too small: expected int to be >=-9007199254740991"})
		}
	}
	if s.hasMin && x < s.min {
		issues = append(issues, issue{msg: "Too small: expected number to be >=" + jsval.NumberToString(s.min)})
	}
	if s.hasMax && x > s.max {
		issues = append(issues, issue{msg: "Too big: expected number to be <=" + jsval.NumberToString(s.max)})
	}
	return v, issues
}

type stringSchema struct{}

func (stringSchema) parse(v jsval.Value) (jsval.Value, []issue) {
	if _, ok := v.(string); !ok {
		return v, []issue{invalidType("string", v)}
	}
	return v, nil
}

type booleanSchema struct{}

func (booleanSchema) parse(v jsval.Value) (jsval.Value, []issue) {
	if _, ok := v.(bool); !ok {
		return v, []issue{invalidType("boolean", v)}
	}
	return v, nil
}

type enumSchema []string

func (s enumSchema) parse(v jsval.Value) (jsval.Value, []issue) {
	if str, ok := v.(string); ok {
		for _, opt := range s {
			if opt == str {
				return v, nil
			}
		}
	}
	return v, []issue{{msg: "Invalid option: expected one of " + joinValues(s, "|"), abort: true}}
}

type literalTrue struct{}

func (literalTrue) parse(v jsval.Value) (jsval.Value, []issue) {
	if v != true {
		return v, []issue{{msg: "Invalid input: expected true", abort: true}}
	}
	return v, nil
}

type field struct {
	key string
	s   schema
	// deflt is applied when the key is absent (zod .default()).
	deflt jsval.Value
}

// objectSchema is a zod .strict() object.
type objectSchema []field

func (s objectSchema) parse(v jsval.Value) (jsval.Value, []issue) {
	in, ok := v.(*jsval.Object)
	if !ok {
		return v, []issue{invalidType("object", v)}
	}
	out := jsval.NewObject()
	var issues []issue
	known := map[string]bool{}
	for _, f := range s {
		known[f.key] = true
		fv := in.Get(f.key)
		if jsval.IsUndefined(fv) {
			if f.deflt != nil {
				out.Set(f.key, f.deflt)
			}
			continue
		}
		pv, fis := f.s.parse(fv)
		for _, is := range fis {
			is.path = append([]string{f.key}, is.path...)
			issues = append(issues, is)
		}
		out.Set(f.key, pv)
	}
	var unknown []string
	for _, k := range in.Keys() {
		if !known[k] {
			unknown = append(unknown, k)
		}
	}
	switch len(unknown) {
	case 0:
	case 1:
		issues = append(issues, issue{msg: "Unrecognized key: " + joinValues(unknown, ", ")})
	default:
		issues = append(issues, issue{msg: "Unrecognized keys: " + joinValues(unknown, ", ")})
	}
	return out, issues
}

// unionSchema follows zod v4: the first clean option wins; otherwise, if exactly one
// option failed without aborting, its issues stand; otherwise one "Invalid input".
type unionSchema []schema

func (s unionSchema) parse(v jsval.Value) (jsval.Value, []issue) {
	type result struct {
		out    jsval.Value
		issues []issue
	}
	var nonAborted []result
	for _, opt := range s {
		out, issues := opt.parse(v)
		if len(issues) == 0 {
			return out, nil
		}
		aborted := false
		for _, is := range issues {
			aborted = aborted || is.abort
		}
		if !aborted {
			nonAborted = append(nonAborted, result{out, issues})
		}
	}
	if len(nonAborted) == 1 {
		return nonAborted[0].out, nonAborted[0].issues
	}
	return v, []issue{{msg: "Invalid input", abort: true}}
}
