// Package jsval reproduces the JavaScript value semantics the tax engine relies on:
// undefined vs null, ToNumber, ToString, truthiness, Math.round, and insertion-ordered objects.
//
// A Value is one of: Undefined, nil (null), bool, float64, string, []Value, *Object.
package jsval

import (
	"math"
	"math/big"
	"strconv"
	"strings"
)

type Value = any

type undefinedType struct{}

// Undefined is JavaScript's undefined (a missing property).
var Undefined Value = undefinedType{}

func IsUndefined(v Value) bool { _, ok := v.(undefinedType); return ok }

// IsNullish reports v === null || v === undefined.
func IsNullish(v Value) bool { return v == nil || IsUndefined(v) }

// Coalesce is the ?? operator.
func Coalesce(v, fallback Value) Value {
	if IsNullish(v) {
		return fallback
	}
	return v
}

// Object is a plain JS object with insertion-ordered string keys.
type Object struct {
	keys []string
	vals map[string]Value
}

func NewObject() *Object { return &Object{vals: map[string]Value{}} }

// Obj builds an object from alternating key, value arguments.
func Obj(kv ...any) *Object {
	o := NewObject()
	for i := 0; i < len(kv); i += 2 {
		o.Set(kv[i].(string), kv[i+1])
	}
	return o
}

func (o *Object) Set(key string, v Value) {
	if _, ok := o.vals[key]; !ok {
		o.keys = append(o.keys, key)
	}
	o.vals[key] = v
}

// Get returns Undefined for a missing key, like a JS property read.
func (o *Object) Get(key string) Value {
	if o == nil {
		return Undefined
	}
	if v, ok := o.vals[key]; ok {
		return v
	}
	return Undefined
}

func (o *Object) Delete(key string) {
	if _, ok := o.vals[key]; !ok {
		return
	}
	delete(o.vals, key)
	for i, k := range o.keys {
		if k == key {
			o.keys = append(o.keys[:i:i], o.keys[i+1:]...)
			break
		}
	}
}

// Keys returns keys in JS property order: array-index keys ascending, then insertion order.
func (o *Object) Keys() []string {
	var idx, rest []string
	for _, k := range o.keys {
		if isArrayIndex(k) {
			idx = append(idx, k)
		} else {
			rest = append(rest, k)
		}
	}
	if len(idx) > 1 {
		sortIndexKeys(idx)
	}
	return append(idx, rest...)
}

// Clone is a shallow copy ({...o}).
func (o *Object) Clone() *Object {
	c := NewObject()
	c.Assign(o)
	return c
}

// Assign copies o's own properties onto c, like a spread.
func (c *Object) Assign(o *Object) {
	if o == nil {
		return
	}
	for _, k := range o.Keys() {
		c.Set(k, o.vals[k])
	}
}

func isArrayIndex(k string) bool {
	if k == "" || len(k) > 10 || (len(k) > 1 && k[0] == '0') {
		return false
	}
	for i := 0; i < len(k); i++ {
		if k[i] < '0' || k[i] > '9' {
			return false
		}
	}
	n, _ := strconv.ParseUint(k, 10, 64)
	return n < 1<<32-1
}

func sortIndexKeys(keys []string) {
	for i := 1; i < len(keys); i++ {
		for j := i; j > 0; j-- {
			a, _ := strconv.ParseUint(keys[j-1], 10, 64)
			b, _ := strconv.ParseUint(keys[j], 10, 64)
			if a <= b {
				break
			}
			keys[j-1], keys[j] = keys[j], keys[j-1]
		}
	}
}

// TypeOf is the typeof operator (objects, arrays and null are "object").
func TypeOf(v Value) string {
	switch v.(type) {
	case undefinedType:
		return "undefined"
	case nil, []Value, *Object:
		return "object"
	case bool:
		return "boolean"
	case float64:
		return "number"
	case string:
		return "string"
	}
	panic("jsval: unsupported value type")
}

func IsArray(v Value) bool { _, ok := v.([]Value); return ok }

// Truthy is ToBoolean.
func Truthy(v Value) bool {
	switch x := v.(type) {
	case undefinedType, nil:
		return false
	case bool:
		return x
	case float64:
		return x != 0 && !math.IsNaN(x)
	case string:
		return x != ""
	}
	return true
}

// StrictEquals is === for the primitive comparisons the engine makes.
func StrictEquals(v Value, w Value) bool {
	switch x := v.(type) {
	case undefinedType:
		return IsUndefined(w)
	case nil:
		return w == nil
	case bool:
		y, ok := w.(bool)
		return ok && x == y
	case float64:
		y, ok := w.(float64)
		return ok && x == y
	case string:
		y, ok := w.(string)
		return ok && x == y
	case *Object:
		y, ok := w.(*Object)
		return ok && x == y
	}
	return false
}

// ToString is String(v) / template-literal interpolation.
func ToString(v Value) string {
	switch x := v.(type) {
	case undefinedType:
		return "undefined"
	case nil:
		return "null"
	case bool:
		if x {
			return "true"
		}
		return "false"
	case float64:
		return NumberToString(x)
	case string:
		return x
	case []Value:
		parts := make([]string, len(x))
		for i, el := range x {
			if !IsNullish(el) {
				parts[i] = ToString(el)
			}
		}
		return strings.Join(parts, ",")
	case *Object:
		return "[object Object]"
	}
	panic("jsval: unsupported value type")
}

// ToNumber is Number(v).
func ToNumber(v Value) float64 {
	switch x := v.(type) {
	case undefinedType:
		return math.NaN()
	case nil:
		return 0
	case bool:
		if x {
			return 1
		}
		return 0
	case float64:
		return x
	case string:
		return StringToNumber(x)
	case []Value, *Object:
		return StringToNumber(ToString(x))
	}
	panic("jsval: unsupported value type")
}

// StringToNumber implements the StringNumericLiteral grammar.
func StringToNumber(s string) float64 {
	s = Trim(s)
	if s == "" {
		return 0
	}
	switch s {
	case "Infinity", "+Infinity":
		return math.Inf(1)
	case "-Infinity":
		return math.Inf(-1)
	}
	if len(s) > 2 && s[0] == '0' {
		base := 0
		switch s[1] {
		case 'x', 'X':
			base = 16
		case 'o', 'O':
			base = 8
		case 'b', 'B':
			base = 2
		}
		if base != 0 {
			n, ok := new(big.Int).SetString(s[2:], base)
			if !ok || strings.ContainsAny(s[2:], "_+-") {
				return math.NaN()
			}
			f, _ := new(big.Float).SetInt(n).Float64()
			return f
		}
	}
	if !isDecimalLiteral(s) {
		return math.NaN()
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil && !isRangeErr(err) {
		return math.NaN()
	}
	return f
}

func isRangeErr(err error) bool {
	ne, ok := err.(*strconv.NumError)
	return ok && ne.Err == strconv.ErrRange
}

func isDecimalLiteral(s string) bool {
	i := 0
	if s[i] == '+' || s[i] == '-' {
		i++
	}
	intDigits := 0
	for i < len(s) && s[i] >= '0' && s[i] <= '9' {
		i++
		intDigits++
	}
	fracDigits := 0
	if i < len(s) && s[i] == '.' {
		i++
		for i < len(s) && s[i] >= '0' && s[i] <= '9' {
			i++
			fracDigits++
		}
	}
	if intDigits+fracDigits == 0 {
		return false
	}
	if i < len(s) && (s[i] == 'e' || s[i] == 'E') {
		i++
		if i < len(s) && (s[i] == '+' || s[i] == '-') {
			i++
		}
		expDigits := 0
		for i < len(s) && s[i] >= '0' && s[i] <= '9' {
			i++
			expDigits++
		}
		if expDigits == 0 {
			return false
		}
	}
	return i == len(s)
}

// IsJSWhitespace matches the JS WhiteSpace + LineTerminator set used by trim() and \s.
func IsJSWhitespace(r rune) bool {
	switch r {
	case '\t', '\n', '\v', '\f', '\r', ' ', 0xa0, 0x1680, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff:
		return true
	}
	return r >= 0x2000 && r <= 0x200a
}

// Trim is String.prototype.trim.
func Trim(s string) string { return strings.TrimFunc(s, IsJSWhitespace) }

// Round is Math.round: nearest integer, ties toward +Infinity, sign of zero kept.
func Round(x float64) float64 {
	if math.IsNaN(x) || math.IsInf(x, 0) || x == 0 {
		return x
	}
	r := math.Floor(x)
	if x-r >= 0.5 {
		r++
	}
	if r == 0 && x < 0 {
		return math.Copysign(0, -1)
	}
	return r
}

// Max is Math.max over numbers (NaN wins; +0 beats -0).
func Max(xs ...float64) float64 {
	m := math.Inf(-1)
	for _, x := range xs {
		m = math.Max(m, x)
	}
	return m
}

// Min is Math.min over numbers (NaN wins; -0 beats +0).
func Min(xs ...float64) float64 {
	m := math.Inf(1)
	for _, x := range xs {
		m = math.Min(m, x)
	}
	return m
}

// IsInteger is Number.isInteger for a value already known to be a number.
func IsInteger(x float64) bool {
	return !math.IsNaN(x) && !math.IsInf(x, 0) && math.Trunc(x) == x
}
