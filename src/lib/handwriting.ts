import caveat from 'tegaki/fonts/caveat'
import parisienne from 'tegaki/fonts/parisienne'
import type { TegakiBundle, TegakiGlyphData } from 'tegaki'

/**
 * Tegaki's bundled fonts stop at ASCII. Portuguese needs ã ç é ê ó…, so we
 * synthesise those glyphs by drawing the base letter and then a small,
 * repositioned accent taken from the same font (~ ^ ` , ). The DOM overlay
 * still uses the real font for layout, so widths and spacing stay correct.
 */

type Stroke = TegakiGlyphData['s'][number]
type Pt = [number, number, number]

type Box = { minX: number; maxX: number; minY: number; maxY: number }

function points(glyph: TegakiGlyphData): Pt[] {
  return glyph.s.flatMap((s) => s.p as Pt[])
}

function bbox(glyph: TegakiGlyphData): Box {
  const pts = points(glyph)
  return {
    minX: Math.min(...pts.map((p) => p[0])),
    maxX: Math.max(...pts.map((p) => p[0])),
    minY: Math.min(...pts.map((p) => p[1])),
    maxY: Math.max(...pts.map((p) => p[1])),
  }
}

type Xform = { sx: number; sy: number; tx: number; ty: number; mirrorX?: boolean; cx?: number }

function transformStrokes(glyph: TegakiGlyphData, x: Xform, timeOffset: number, priority?: number): Stroke[] {
  const widthScale = (Math.abs(x.sx) + Math.abs(x.sy)) / 2
  const firstDelay = Math.min(...glyph.s.map((s) => s.d))
  return glyph.s.map((s) => ({
    p: (s.p as Pt[]).map(([px, py, w]) => {
      const mx = x.mirrorX && x.cx !== undefined ? 2 * x.cx - px : px
      return [mx * x.sx + x.tx, py * x.sy + x.ty, w * widthScale] as Pt
    }),
    d: timeOffset + (s.d - firstDelay),
    a: s.a,
    ...(priority !== undefined ? { r: priority } : {}),
  }))
}

const BREATH = 0.06 // pause between finishing the letter and dotting its accent

type MarkOptions = {
  scale: number
  /** vertical gap between letter and mark, in font units */
  gap: number
  /** below the letter (cedilla) instead of above */
  below?: boolean
  mirrorX?: boolean
  /** drop the base's own deferred marks (the dot of "i") */
  dropDots?: boolean
  /** shift the mark horizontally as a fraction of its own width */
  nudgeX?: number
}

function withMark(glyphs: Record<string, TegakiGlyphData>, base: string, mark: string, opt: MarkOptions): TegakiGlyphData {
  const b = glyphs[base]
  const m = glyphs[mark]
  if (!b || !m) throw new Error(`missing glyph for ${base} or ${mark}`)

  const baseStrokes = opt.dropDots ? b.s.filter((s) => (s.r ?? 0) >= 0) : b.s
  const baseEnd = Math.max(...baseStrokes.map((s) => s.d + s.a))
  const bb = bbox({ ...b, s: baseStrokes })
  const mb = bbox(m)

  const sx = opt.scale
  const sy = opt.scale
  const markW = (mb.maxX - mb.minX) * sx
  const markCenterX = ((mb.minX + mb.maxX) / 2) * sx
  const baseCenterX = (bb.minX + bb.maxX) / 2
  const tx = baseCenterX - markCenterX + markW * (opt.nudgeX ?? 0)

  const ty = opt.below ? bb.maxY + opt.gap - mb.minY * sy : bb.minY - opt.gap - mb.maxY * sy

  const markStrokes = transformStrokes(
    m,
    { sx, sy, tx, ty, mirrorX: opt.mirrorX, cx: (mb.minX + mb.maxX) / 2 },
    baseEnd + BREATH,
    -1,
  )

  return {
    w: b.w,
    t: baseEnd + BREATH + m.t,
    s: [...baseStrokes, ...markStrokes],
  }
}

function stretched(glyphs: Record<string, TegakiGlyphData>, base: string, sx: number): TegakiGlyphData {
  const b = glyphs[base]
  if (!b) throw new Error(`missing glyph ${base}`)
  const bb = bbox(b)
  const margin = 60
  return {
    w: Math.round((bb.maxX - bb.minX) * sx + margin * 2),
    t: b.t,
    s: transformStrokes(b, { sx, sy: 1, tx: margin - bb.minX * sx, ty: 0 }, 0),
  }
}

function ellipsis(glyphs: Record<string, TegakiGlyphData>): TegakiGlyphData {
  const dot = glyphs['.']
  if (!dot) throw new Error('missing glyph .')
  const step = dot.w * 0.9
  const strokes: Stroke[] = []
  for (let i = 0; i < 3; i++) {
    strokes.push(...transformStrokes(dot, { sx: 1, sy: 1, tx: i * step, ty: 0 }, i * (dot.t + 0.08)))
  }
  return { w: Math.round(step * 3), t: dot.t * 3 + 0.16, s: strokes }
}

const LOWER_GAP = 55
const UPPER_GAP = 45

function synthesizeLatin(glyphs: Record<string, TegakiGlyphData>): Record<string, TegakiGlyphData> {
  const out: Record<string, TegakiGlyphData> = {}
  const add = (ch: string, g: TegakiGlyphData) => {
    out[ch] = g
  }

  const acute = (base: string, upper = false) =>
    withMark(glyphs, base, '`', { scale: 1.25, gap: upper ? UPPER_GAP : LOWER_GAP, mirrorX: true, dropDots: true, nudgeX: 0.1 })
  const grave = (base: string, upper = false) =>
    withMark(glyphs, base, '`', { scale: 1.25, gap: upper ? UPPER_GAP : LOWER_GAP, dropDots: true, nudgeX: -0.1 })
  const circ = (base: string, upper = false) => withMark(glyphs, base, '^', { scale: 0.55, gap: upper ? UPPER_GAP : LOWER_GAP })
  const tilde = (base: string, upper = false) => withMark(glyphs, base, '~', { scale: 0.75, gap: upper ? UPPER_GAP : LOWER_GAP })
  const cedilla = (base: string) => withMark(glyphs, base, ',', { scale: 0.8, gap: 10, below: true, nudgeX: 0.15 })

  add('á', acute('a')); add('à', grave('a')); add('â', circ('a')); add('ã', tilde('a'))
  add('é', acute('e')); add('è', grave('e')); add('ê', circ('e'))
  add('í', acute('i')); add('ì', grave('i')); add('î', circ('i'))
  add('ó', acute('o')); add('ò', grave('o')); add('ô', circ('o')); add('õ', tilde('o'))
  add('ú', acute('u')); add('ù', grave('u')); add('û', circ('u')); add('ü', withMark(glyphs, 'u', '"', { scale: 0.45, gap: LOWER_GAP }))
  add('ç', cedilla('c'))
  add('ñ', tilde('n'))

  add('Á', acute('A', true)); add('À', grave('A', true)); add('Â', circ('A', true)); add('Ã', tilde('A', true))
  add('É', acute('E', true)); add('È', grave('E', true)); add('Ê', circ('E', true))
  add('Í', acute('I', true)); add('Î', circ('I', true))
  add('Ó', acute('O', true)); add('Ô', circ('O', true)); add('Õ', tilde('O', true))
  add('Ú', acute('U', true)); add('Û', circ('U', true))
  add('Ç', cedilla('C'))

  add('—', stretched(glyphs, '-', 3.0))
  add('–', stretched(glyphs, '-', 1.8))
  add('…', ellipsis(glyphs))
  if (glyphs['"']) {
    add('“', glyphs['"']); add('”', glyphs['"'])
  }
  if (glyphs["'"]) {
    add('‘', glyphs["'"]); add('’', glyphs["'"])
  }
  return out
}

function extend(bundle: TegakiBundle): TegakiBundle {
  return {
    ...bundle,
    glyphData: { ...bundle.glyphData, ...synthesizeLatin(bundle.glyphData) },
  }
}

/** Body handwriting: relaxed, legible, used for the letter and the journey. */
export const inkFont: TegakiBundle = extend(caveat as unknown as TegakiBundle)

/** Signature script: names, greeting, sign-off. */
export const scriptFont: TegakiBundle = extend(parisienne as unknown as TegakiBundle)
