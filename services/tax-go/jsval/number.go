package jsval

import (
	"math"
	"math/big"
	"strconv"
	"strings"
)

// shortestDigits returns the shortest round-trip decimal digits of |x| and the exponent n
// such that |x| = 0.d1d2...dk × 10^n (the ECMAScript Number::toString decomposition).
func shortestDigits(x float64) (digits string, n int) {
	s := strconv.FormatFloat(math.Abs(x), 'e', -1, 64) // d.ddde±XX
	mant, exp, _ := strings.Cut(s, "e")
	e, _ := strconv.Atoi(exp)
	return strings.Replace(mant, ".", "", 1), e + 1
}

// NumberToString is Number.prototype.toString() (radix 10).
func NumberToString(x float64) string {
	switch {
	case math.IsNaN(x):
		return "NaN"
	case math.IsInf(x, 1):
		return "Infinity"
	case math.IsInf(x, -1):
		return "-Infinity"
	case x == 0:
		return "0"
	}
	sign := ""
	if x < 0 {
		sign = "-"
	}
	d, n := shortestDigits(x)
	k := len(d)
	switch {
	case k <= n && n <= 21:
		return sign + d + strings.Repeat("0", n-k)
	case 0 < n && n <= 21:
		return sign + d[:n] + "." + d[n:]
	case -6 < n && n <= 0:
		return sign + "0." + strings.Repeat("0", -n) + d
	}
	e := n - 1
	es := "+" + strconv.Itoa(e)
	if e < 0 {
		es = strconv.Itoa(e)
	}
	if k == 1 {
		return sign + d + "e" + es
	}
	return sign + d[:1] + "." + d[1:] + "e" + es
}

// ToFixed is Number.prototype.toFixed(digits): rounds the exact binary value, ties to the larger n.
func ToFixed(x float64, digits int) string {
	if math.IsNaN(x) {
		return "NaN"
	}
	if math.Abs(x) >= 1e21 || math.IsInf(x, 0) {
		return NumberToString(x)
	}
	sign := ""
	if x < 0 {
		sign = "-"
		x = -x
	}
	scale := new(big.Rat).SetInt(new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(digits)), nil))
	r := new(big.Rat).SetFloat64(x)
	r.Mul(r, scale)
	r.Add(r, big.NewRat(1, 2))
	n := new(big.Int).Quo(r.Num(), r.Denom()) // floor: both positive
	m := n.String()
	if digits == 0 {
		return sign + m
	}
	if len(m) <= digits {
		m = strings.Repeat("0", digits+1-len(m)) + m
	}
	cut := len(m) - digits
	return sign + m[:cut] + "." + m[cut:]
}

// ToLocaleStringEnUS is Number.prototype.toLocaleString('en-US') with default options:
// grouping separators and at most 3 fraction digits, rounding half away from zero on the
// shortest decimal representation (ICU behaviour).
func ToLocaleStringEnUS(x float64) string {
	switch {
	case math.IsNaN(x):
		return "NaN"
	case math.IsInf(x, 1):
		return "∞"
	case math.IsInf(x, -1):
		return "-∞"
	}
	sign := ""
	if math.Signbit(x) {
		sign = "-"
	}
	if x == 0 {
		return sign + "0"
	}
	d, n := shortestDigits(x)
	// Lay the digits out as integer part and fraction part.
	var intPart, frac string
	switch {
	case n <= 0:
		intPart, frac = "0", strings.Repeat("0", -n)+d
	case n >= len(d):
		intPart, frac = d+strings.Repeat("0", n-len(d)), ""
	default:
		intPart, frac = d[:n], d[n:]
	}
	const maxFrac = 3
	if len(frac) > maxFrac {
		roundUp := frac[maxFrac] >= '5'
		frac = frac[:maxFrac]
		if roundUp {
			intPart, frac = incrementDecimal(intPart, frac)
		}
	}
	frac = strings.TrimRight(frac, "0")
	intPart = strings.TrimLeft(intPart, "0")
	if intPart == "" {
		intPart = "0"
	}
	out := sign + groupThousands(intPart)
	if frac != "" {
		out += "." + frac
	}
	return out
}

func incrementDecimal(intPart, frac string) (string, string) {
	all := []byte(intPart + frac)
	i := len(all) - 1
	for ; i >= 0; i-- {
		if all[i] == '9' {
			all[i] = '0'
			continue
		}
		all[i]++
		break
	}
	s := string(all)
	if i < 0 {
		s = "1" + s
	}
	cut := len(s) - len(frac)
	return s[:cut], s[cut:]
}

func groupThousands(s string) string {
	if len(s) <= 3 {
		return s
	}
	var b strings.Builder
	first := len(s) % 3
	if first > 0 {
		b.WriteString(s[:first])
	}
	for i := first; i < len(s); i += 3 {
		if b.Len() > 0 {
			b.WriteByte(',')
		}
		b.WriteString(s[i : i+3])
	}
	return b.String()
}
