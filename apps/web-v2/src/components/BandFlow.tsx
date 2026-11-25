import { useId, useMemo } from 'react'
import { BAND_COLORS, taka } from '../lib/scenario'

type Segment = {
  id: string
  name: string
  range: string
  tag?: string
  amount: number
  employer: number
  kind?: string
}

type Band = {
  rate_percent: number
  taxable_amount_bdt: number
  tax_bdt: number
  color: string
}

type Result = {
  income_summary: { exemptions_bdt: { total: number } }
}

const NH = 22
const SEGC = ['#1f3d30', '#2f6a4f', '#4d8c6f', '#7fae96']
const ribbon = (x0: number, w0: number, y0: number, x1: number, w1: number, y1: number) => {
  const m = (y0 + y1) / 2
  return `M${x0},${y0} C${x0},${m} ${x1},${m} ${x1},${y1} L${x1 + w1},${y1} C${x1 + w1},${m} ${x0 + w0},${m} ${x0 + w0},${y0} Z`
}

type Props = {
  segments: Segment[]
  result: Result | null
  bands: Band[]
  width: number
}

export function BandFlow({ segments, result, bands, width }: Props) {
  const rawId = useId()
  const uid = rawId.replace(/:/g, '') + '-'
  const grads = BAND_COLORS.map((c, i) => [c, BAND_COLORS[Math.min(i + 1, 5)]] as const)
  const tiers = [0, 1, 2, 3].map((i) => 30 + i * 150)

  const H = 30 + 3 * 150 + NH + 70

  const g = useMemo(() => {
    const W = width
    const GAP = 6
    const Y = tiers
    const r = result
    if (!r) return { nodes: [] as Node[], ribbons: [] as Ribbon[], labels: [] as Label[] }
    type Node = { id: string; x: number; y: number; w: number; c: string }
    type Ribbon = { id: string; fill: string; d: string }
    type Label = { id: string; x: number; y: number; a: 'start' | 'end'; l1: string; l2: string }

    const nodes: Node[] = []
    const ribbons: Ribbon[] = []
    const labels: Label[] = []
    const G = segments.reduce((a, b) => a + b.amount, 0) || 1
    const ex = Math.min(r.income_summary.exemptions_bdt.total, G)
    const tx = Math.max(G - ex, 0)
    const s0 = (W - GAP * (segments.length - 1)) / G
    let x = 0
    const srcPos: { x: number; w: number }[] = []
    const sal = segments.filter((q) => q.kind !== 'bonus')
    segments.forEach((sg, i) => {
      const w = sg.amount * s0
      nodes.push({
        id: 'a' + i,
        x,
        y: Y[0],
        w,
        c: sg.kind === 'bonus' ? '#c98a1b' : SEGC[sg.employer % 4],
      })
      srcPos.push({ x, w })
      const many = sal.length > 2
      const last = many && sg === sal[sal.length - 1]
      if (sg.kind !== 'bonus') {
        labels.push({
          id: 'la' + i,
          x: last ? x + w : x,
          y: Y[0] - 28,
          a: last ? 'end' : 'start',
          l1: many ? sg.name : sg.name + (sg.tag ? ' · ' + sg.tag : ''),
          l2: many ? sg.tag || sg.range : sg.range + ' · ' + taka(sg.amount),
        })
      }
      x += w + GAP
    })
    const s1 = W / G
    let gx = 0
    segments.forEach((sg, i) => {
      const w = sg.amount * s1
      ribbons.push({
        id: 'r0' + i,
        fill: sg.kind === 'bonus' ? `url(#${uid}bn)` : `url(#${uid}${Math.min(sg.employer, 3)})`,
        d: ribbon(srcPos[i].x, srcPos[i].w, Y[0] + NH, gx, w, Y[1]),
      })
      gx += w
    })
    nodes.push({ id: 'g', x: 0, y: Y[1], w: W, c: '#14201a' })
    labels.push({ id: 'lg', x: 0, y: Y[1] + NH + 18, a: 'start', l1: 'Income received', l2: taka(G) })
    const s2 = (W - (ex > 0 ? GAP : 0)) / G
    const exW = ex * s2
    const txW = tx * s2
    const txX = ex > 0 ? exW + GAP : 0
    if (ex > 0) {
      nodes.push({ id: 'ex', x: 0, y: Y[2], w: exW, c: '#a9a590' })
      ribbons.push({
        id: 'rex',
        fill: 'url(#hatch3)',
        d: ribbon(0, ex * s1, Y[1] + NH, 0, exW, Y[2]),
      })
      labels.push({ id: 'lex', x: 0, y: Y[2] + NH + 18, a: 'start', l1: 'Exempt income', l2: taka(ex) })
    }
    nodes.push({ id: 'tx', x: txX, y: Y[2], w: txW, c: '#0a5c3a' })
    ribbons.push({
      id: 'rtx',
      fill: `url(#${uid}1)`,
      d: ribbon(ex * s1, tx * s1, Y[1] + NH, txX, txW, Y[2]),
    })
    labels.push({ id: 'ltx', x: W, y: Y[2] - 28, a: 'end', l1: 'Taxable income', l2: taka(tx) })
    const s3 = (W - GAP * Math.max(bands.length - 1, 0)) / (tx || 1)
    let src = txX
    let bx = 0
    bands.forEach((b, i) => {
      const w = b.taxable_amount_bdt * s3
      const sw = b.taxable_amount_bdt * s2
      const ci = BAND_COLORS.indexOf(b.color)
      nodes.push({ id: 'b' + i, x: bx, y: Y[3], w, c: b.color })
      ribbons.push({
        id: 'rb' + i,
        fill: `url(#${uid}${ci})`,
        d: ribbon(src, sw, Y[2] + NH, bx, w, Y[3]),
      })
      const flip = bands.length > 2 && i % 2 === 1
      const edge = bx > W - 120
      labels.push({
        id: 'lb' + i,
        x: flip || edge ? bx + w : bx,
        y: Y[3] + NH + 18 + (flip ? 38 : 0),
        a: flip || edge ? 'end' : 'start',
        l1: b.rate_percent + '% slab',
        l2: b.rate_percent ? 'tax ' + taka(b.tax_bdt) : 'no tax',
      })
      src += sw
      bx += w + GAP
    })
    return { nodes, ribbons, labels }
  }, [segments, result, bands, width, uid])

  return (
    <svg viewBox={`0 0 ${width} ${H}`} className="flow" role="img" aria-label="Pay flowing into tax bands">
      <defs>
        <linearGradient id={uid + 'bn'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0a73a" stopOpacity=".6" />
          <stop offset="1" stopColor="#f0c96a" stopOpacity=".9" />
        </linearGradient>
        {grads.map((c, i) => (
          <linearGradient key={i} id={uid + i} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c[0]} stopOpacity=".5" />
            <stop offset="1" stopColor={c[1]} stopOpacity=".9" />
          </linearGradient>
        ))}
        <pattern id="hatch3" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#e8e4d8" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#cfc9b6" strokeWidth="2" />
        </pattern>
      </defs>
      {g.ribbons.map((p) => (
        <path key={p.id} d={p.d} fill={p.fill} />
      ))}
      {g.nodes.map((n) => (
        <rect key={n.id} x={n.x} y={n.y} width={Math.max(n.w, 3)} height={NH} rx={6} fill={n.c} />
      ))}
      {g.labels.map((t) => (
        <g key={t.id} transform={`translate(${t.x},${t.y})`}>
          <text textAnchor={t.a} className="l1">
            {t.l1}
          </text>
          <text textAnchor={t.a} y={15} className="l2">
            {t.l2}
          </text>
        </g>
      ))}
    </svg>
  )
}