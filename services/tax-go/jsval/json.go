package jsval

import (
	"errors"
	"math"
	"strconv"
	"strings"
	"unicode/utf16"
	"unicode/utf8"
)

// ParseJSON is JSON.parse: objects keep key order (duplicate keys keep the first position and
// the last value), numbers are float64 (overflow becomes ±Infinity).
// Known gap: a lone UTF-16 surrogate escape becomes U+FFFD, since Go strings are UTF-8.
func ParseJSON(data []byte) (Value, error) {
	p := &jsonParser{s: data}
	p.skipWS()
	v, err := p.value(0)
	if err != nil {
		return nil, err
	}
	p.skipWS()
	if p.i != len(p.s) {
		return nil, p.errorf("unexpected trailing data")
	}
	return v, nil
}

const maxJSONDepth = 512

type jsonParser struct {
	s []byte
	i int
}

func (p *jsonParser) errorf(msg string) error {
	return errors.New("invalid JSON at offset " + strconv.Itoa(p.i) + ": " + msg)
}

func (p *jsonParser) skipWS() {
	for p.i < len(p.s) {
		switch p.s[p.i] {
		case ' ', '\t', '\n', '\r':
			p.i++
		default:
			return
		}
	}
}

func (p *jsonParser) value(depth int) (Value, error) {
	if depth > maxJSONDepth {
		return nil, p.errorf("nesting too deep")
	}
	if p.i >= len(p.s) {
		return nil, p.errorf("unexpected end of input")
	}
	switch c := p.s[p.i]; {
	case c == '{':
		return p.object(depth)
	case c == '[':
		return p.array(depth)
	case c == '"':
		return p.str()
	case c == '-' || (c >= '0' && c <= '9'):
		return p.number()
	case p.literal("true"):
		return true, nil
	case p.literal("false"):
		return false, nil
	case p.literal("null"):
		return nil, nil
	}
	return nil, p.errorf("unexpected character")
}

func (p *jsonParser) literal(word string) bool {
	if strings.HasPrefix(string(p.s[p.i:min(len(p.s), p.i+len(word))]), word) {
		p.i += len(word)
		return true
	}
	return false
}

func (p *jsonParser) object(depth int) (Value, error) {
	p.i++
	o := NewObject()
	p.skipWS()
	if p.i < len(p.s) && p.s[p.i] == '}' {
		p.i++
		return o, nil
	}
	for {
		p.skipWS()
		if p.i >= len(p.s) || p.s[p.i] != '"' {
			return nil, p.errorf("expected string key")
		}
		k, err := p.str()
		if err != nil {
			return nil, err
		}
		p.skipWS()
		if p.i >= len(p.s) || p.s[p.i] != ':' {
			return nil, p.errorf("expected ':'")
		}
		p.i++
		p.skipWS()
		v, err := p.value(depth + 1)
		if err != nil {
			return nil, err
		}
		o.Set(k.(string), v)
		p.skipWS()
		if p.i < len(p.s) && p.s[p.i] == ',' {
			p.i++
			continue
		}
		if p.i < len(p.s) && p.s[p.i] == '}' {
			p.i++
			return o, nil
		}
		return nil, p.errorf("expected ',' or '}'")
	}
}

func (p *jsonParser) array(depth int) (Value, error) {
	p.i++
	arr := []Value{}
	p.skipWS()
	if p.i < len(p.s) && p.s[p.i] == ']' {
		p.i++
		return arr, nil
	}
	for {
		p.skipWS()
		v, err := p.value(depth + 1)
		if err != nil {
			return nil, err
		}
		arr = append(arr, v)
		p.skipWS()
		if p.i < len(p.s) && p.s[p.i] == ',' {
			p.i++
			continue
		}
		if p.i < len(p.s) && p.s[p.i] == ']' {
			p.i++
			return arr, nil
		}
		return nil, p.errorf("expected ',' or ']'")
	}
}

func (p *jsonParser) number() (Value, error) {
	start := p.i
	if p.s[p.i] == '-' {
		p.i++
	}
	digits := func() int {
		n := 0
		for p.i < len(p.s) && p.s[p.i] >= '0' && p.s[p.i] <= '9' {
			p.i++
			n++
		}
		return n
	}
	if p.i < len(p.s) && p.s[p.i] == '0' {
		p.i++
	} else if digits() == 0 {
		return nil, p.errorf("invalid number")
	}
	if p.i < len(p.s) && p.s[p.i] == '.' {
		p.i++
		if digits() == 0 {
			return nil, p.errorf("invalid number")
		}
	}
	if p.i < len(p.s) && (p.s[p.i] == 'e' || p.s[p.i] == 'E') {
		p.i++
		if p.i < len(p.s) && (p.s[p.i] == '+' || p.s[p.i] == '-') {
			p.i++
		}
		if digits() == 0 {
			return nil, p.errorf("invalid number")
		}
	}
	f, err := strconv.ParseFloat(string(p.s[start:p.i]), 64)
	if err != nil && !isRangeErr(err) {
		return nil, p.errorf("invalid number")
	}
	return f, nil
}

func (p *jsonParser) str() (Value, error) {
	p.i++
	var b strings.Builder
	for {
		if p.i >= len(p.s) {
			return nil, p.errorf("unterminated string")
		}
		c := p.s[p.i]
		switch {
		case c == '"':
			p.i++
			return b.String(), nil
		case c < 0x20:
			return nil, p.errorf("control character in string")
		case c == '\\':
			if err := p.escape(&b); err != nil {
				return nil, err
			}
		case c < utf8.RuneSelf:
			b.WriteByte(c)
			p.i++
		default:
			r, size := utf8.DecodeRune(p.s[p.i:])
			b.WriteRune(r) // invalid bytes become U+FFFD, as TextDecoder does
			p.i += size
		}
	}
}

func (p *jsonParser) escape(b *strings.Builder) error {
	p.i++
	if p.i >= len(p.s) {
		return p.errorf("bad escape")
	}
	c := p.s[p.i]
	p.i++
	switch c {
	case '"', '\\', '/':
		b.WriteByte(c)
	case 'b':
		b.WriteByte('\b')
	case 'f':
		b.WriteByte('\f')
	case 'n':
		b.WriteByte('\n')
	case 'r':
		b.WriteByte('\r')
	case 't':
		b.WriteByte('\t')
	case 'u':
		r, err := p.hex4()
		if err != nil {
			return err
		}
		if utf16.IsSurrogate(r) && r < 0xdc00 && p.i+1 < len(p.s) && p.s[p.i] == '\\' && p.s[p.i+1] == 'u' {
			save := p.i
			p.i += 2
			r2, err := p.hex4()
			if err != nil {
				return err
			}
			if pair := utf16.DecodeRune(r, r2); pair != utf8.RuneError {
				b.WriteRune(pair)
				return nil
			}
			p.i = save
		}
		b.WriteRune(r) // lone surrogates are written as U+FFFD
	default:
		return p.errorf("bad escape")
	}
	return nil
}

func (p *jsonParser) hex4() (rune, error) {
	if p.i+4 > len(p.s) {
		return 0, p.errorf("bad unicode escape")
	}
	n, err := strconv.ParseUint(string(p.s[p.i:p.i+4]), 16, 32)
	if err != nil {
		return 0, p.errorf("bad unicode escape")
	}
	p.i += 4
	return rune(n), nil
}

// Stringify is JSON.stringify(v, null, indent); indent "" gives the compact form.
// Undefined object members are omitted, undefined array elements and non-finite numbers
// become null. Returns ok=false where JSON.stringify returns undefined.
func Stringify(v Value, indent string) (string, bool) {
	if IsUndefined(v) {
		return "", false
	}
	var b strings.Builder
	writeJSON(&b, v, indent, "")
	return b.String(), true
}

// MustStringify is Stringify for values known to be serializable.
func MustStringify(v Value, indent string) string {
	s, ok := Stringify(v, indent)
	if !ok {
		panic("jsval: value is not JSON-serializable")
	}
	return s
}

func writeJSON(b *strings.Builder, v Value, indent, cur string) {
	switch x := v.(type) {
	case nil, undefinedType:
		b.WriteString("null")
	case bool:
		if x {
			b.WriteString("true")
		} else {
			b.WriteString("false")
		}
	case float64:
		if math.IsNaN(x) || math.IsInf(x, 0) {
			b.WriteString("null")
		} else {
			b.WriteString(NumberToString(x))
		}
	case string:
		QuoteJSON(b, x)
	case []Value:
		if len(x) == 0 {
			b.WriteString("[]")
			return
		}
		inner := cur + indent
		b.WriteByte('[')
		for i, el := range x {
			if i > 0 {
				b.WriteByte(',')
			}
			newline(b, indent, inner)
			writeJSON(b, el, indent, inner)
		}
		newline(b, indent, cur)
		b.WriteByte(']')
	case *Object:
		inner := cur + indent
		wrote := false
		b.WriteByte('{')
		for _, k := range x.Keys() {
			el := x.vals[k]
			if IsUndefined(el) {
				continue
			}
			if wrote {
				b.WriteByte(',')
			}
			wrote = true
			newline(b, indent, inner)
			QuoteJSON(b, k)
			b.WriteByte(':')
			if indent != "" {
				b.WriteByte(' ')
			}
			writeJSON(b, el, indent, inner)
		}
		if wrote {
			newline(b, indent, cur)
		}
		b.WriteByte('}')
	default:
		panic("jsval: unsupported value type")
	}
}

func newline(b *strings.Builder, indent, cur string) {
	if indent != "" {
		b.WriteByte('\n')
		b.WriteString(cur)
	}
}

// QuoteJSON writes s as JSON.stringify quotes a string.
func QuoteJSON(b *strings.Builder, s string) {
	const hex = "0123456789abcdef"
	b.WriteByte('"')
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch c {
		case '"':
			b.WriteString(`\"`)
		case '\\':
			b.WriteString(`\\`)
		case '\b':
			b.WriteString(`\b`)
		case '\f':
			b.WriteString(`\f`)
		case '\n':
			b.WriteString(`\n`)
		case '\r':
			b.WriteString(`\r`)
		case '\t':
			b.WriteString(`\t`)
		default:
			if c < 0x20 {
				b.WriteString(`\u00`)
				b.WriteByte(hex[c>>4])
				b.WriteByte(hex[c&0xf])
			} else {
				b.WriteByte(c)
			}
		}
	}
	b.WriteByte('"')
}
