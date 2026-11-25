// Package parity checks the Go engine against outputs recorded from the JS engine by gen-cases.mjs.
package parity

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/nadimtuhin/tax-calculator/services/tax-go/engine"
	"github.com/nadimtuhin/tax-calculator/services/tax-go/jsval"
)

// casesPath is where gen-cases.mjs writes by default; TAX_PARITY_CASES overrides it.
func casesPath() string {
	if p := os.Getenv("TAX_PARITY_CASES"); p != "" {
		return p
	}
	return "testdata/cases.jsonl"
}

// untag turns the {"$js": ...} markers back into JS values.
func untag(v jsval.Value) jsval.Value {
	switch x := v.(type) {
	case []jsval.Value:
		out := make([]jsval.Value, len(x))
		for i, el := range x {
			out[i] = untag(el)
		}
		return out
	case *jsval.Object:
		if keys := x.Keys(); len(keys) == 1 && keys[0] == "$js" {
			switch x.Get("$js") {
			case "undefined":
				return jsval.Undefined
			case "NaN":
				return math.NaN()
			case "Infinity":
				return math.Inf(1)
			case "-Infinity":
				return math.Inf(-1)
			case "-0":
				return math.Copysign(0, -1)
			}
		}
		out := jsval.NewObject()
		for _, k := range x.Keys() {
			out.Set(k, untag(x.Get(k)))
		}
		return out
	}
	return v
}

// diff reports the first difference between got and want, including key order, -0 and NaN.
func diff(path string, got, want jsval.Value) string {
	switch w := want.(type) {
	case *jsval.Object:
		g, ok := got.(*jsval.Object)
		if !ok {
			return fmt.Sprintf("%s: got %s, want object", path, describe(got))
		}
		gk, wk := g.Keys(), w.Keys()
		if strings.Join(gk, ",") != strings.Join(wk, ",") {
			return fmt.Sprintf("%s: keys %v, want %v", path, gk, wk)
		}
		for _, k := range wk {
			if d := diff(path+"."+k, g.Get(k), w.Get(k)); d != "" {
				return d
			}
		}
		return ""
	case []jsval.Value:
		g, ok := got.([]jsval.Value)
		if !ok || len(g) != len(w) {
			return fmt.Sprintf("%s: got %s, want array of %d", path, describe(got), len(w))
		}
		for i := range w {
			if d := diff(fmt.Sprintf("%s[%d]", path, i), g[i], w[i]); d != "" {
				return d
			}
		}
		return ""
	case float64:
		g, ok := got.(float64)
		if ok && (g == w && math.Signbit(g) == math.Signbit(w) || math.IsNaN(g) && math.IsNaN(w)) {
			return ""
		}
		return fmt.Sprintf("%s: got %s, want %s", path, describe(got), describe(want))
	}
	if got != want {
		return fmt.Sprintf("%s: got %s, want %s", path, describe(got), describe(want))
	}
	return ""
}

func describe(v jsval.Value) string {
	switch x := v.(type) {
	case float64:
		if x == 0 && math.Signbit(x) {
			return "-0"
		}
		return jsval.NumberToString(x)
	case *jsval.Object, []jsval.Value:
		s, _ := jsval.Stringify(x, "")
		if len(s) > 200 {
			s = s[:200] + "..."
		}
		return s
	}
	if jsval.IsUndefined(v) {
		return "undefined"
	}
	s, _ := jsval.Stringify(v, "")
	return s
}

// call runs one engine entry point, turning a thrown JS error into an {name, message} object.
func call(fn string, args jsval.Value) (out jsval.Value, thrown *jsval.Object, crash string) {
	defer func() {
		if r := recover(); r != nil {
			crash = fmt.Sprint("panic: ", r)
		}
	}()
	var err error
	switch fn {
	case "listSupportedYears":
		return engine.ListSupportedYears(), nil, ""
	case "getRulesForYear":
		out, err = engine.GetRulesForYear(args)
	case "calculateTaxForYear":
		out, err = engine.CalculateTaxForYear(args)
	case "compareTaxYears":
		out, err = engine.CompareTaxYears(args)
	default:
		return nil, nil, "unknown fn " + fn
	}
	if err != nil {
		je := err.(*engine.JSError)
		return nil, jsval.Obj("name", je.Name, "message", je.Message), ""
	}
	return out, nil, ""
}

func TestEngineParity(t *testing.T) {
	f, err := os.Open(casesPath())
	if err != nil {
		t.Fatalf("%v\nGenerate the cases first: node services/tax-go/parity/gen-cases.mjs", err)
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	sc.Buffer(make([]byte, 1<<20), 64<<20)

	if !sc.Scan() {
		t.Fatal("empty cases file")
	}
	header, err := jsval.ParseJSON(sc.Bytes())
	if err != nil {
		t.Fatal(err)
	}
	meta := header.(*jsval.Object).Get("meta").(*jsval.Object)
	if got, want := engine.DefaultFiscalYear, meta.Get("default_year"); got != want {
		t.Errorf("DefaultFiscalYear = %q, JS = %q", got, want)
	}
	for _, d := range meta.Get("dates").([]jsval.Value) {
		d := d.(*jsval.Object)
		ms := int64(d.Get("ms").(float64))
		if got := engine.ResolveDefaultFiscalYear(time.UnixMilli(ms), engine.SupportedFiscalYears); got != d.Get("out") {
			t.Errorf("ResolveDefaultFiscalYear(%d) = %q, JS = %q", ms, got, d.Get("out"))
		}
	}

	total, diffs := 0, 0
	for sc.Scan() {
		line := sc.Bytes()
		parsed, err := jsval.ParseJSON(line)
		if err != nil {
			t.Fatalf("case %d: %v", total+1, err)
		}
		c := parsed.(*jsval.Object)
		total++
		fn := c.Get("fn").(string)
		args := untag(c.Get("args"))
		got, thrown, crash := call(fn, args)

		var d string
		switch {
		case crash != "":
			d = crash
		case !jsval.IsUndefined(c.Get("error")):
			if thrown == nil {
				d = "returned a result, JS threw " + describe(c.Get("error"))
			} else {
				d = diff("error", thrown, c.Get("error"))
			}
		case thrown != nil:
			d = "threw " + describe(thrown) + ", JS returned a result"
		default:
			d = diff("out", got, untag(c.Get("out")))
		}
		if d != "" {
			diffs++
			if diffs <= 15 {
				t.Errorf("case %d %s (%s) args=%s\n  %s", total, fn, c.Get("source"), describe(c.Get("args")), d)
			}
		}
	}
	if err := sc.Err(); err != nil {
		t.Fatal(err)
	}
	if want := int(meta.Get("cases").(float64)); total != want {
		t.Errorf("read %d cases, header says %d", total, want)
	}
	t.Logf("engine parity: %d cases, %d diffs", total, diffs)
	if diffs > 0 {
		t.Errorf("engine parity: %d of %d cases differ", diffs, total)
	}
}
