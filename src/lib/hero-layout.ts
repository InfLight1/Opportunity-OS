// Story hero: spread the opportunity chips across the city image.
// Pure and deterministic (no Math.random): same size in, same layout out.

export interface Rect { x: number; y: number; w: number; h: number }

export interface ChipSpot { x: number; y: number; rotate: number }

export interface HeroLayoutInput {
  width: number
  height: number
  count: number
  chip: { w: number; h: number }
  /** Areas chips must stay clear of (the headline block, the nav shadow). */
  avoid: Rect[]
  /** Only place chips inside this area (default: the whole hero). */
  region?: Rect
  /** Minimum space kept around every chip. */
  gap?: number
  /** Space kept free along the hero edges. */
  pad?: number
  /** Offset every other row by half a chip (looser look); off packs tighter. */
  stagger?: boolean
  /** 0..1: how far each spot is nudged off the grid. Higher looks more scattered, fits fewer. */
  scatter?: number
}

/** Chip width for a hero this wide: narrower chips on smaller laptops so all of them fit. */
export function heroChipWidth(heroWidth: number): number {
  return Math.round(Math.min(236, Math.max(196, heroWidth * 0.165)))
}

export function overlaps(a: Rect, b: Rect, gap = 0): boolean {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap
}

function grow(r: Rect, by: number): Rect {
  return { x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 }
}

/**
 * Candidate spots on a staggered grid with a small fixed wobble, then
 * farthest-point picking so the chips spread over the whole free area
 * instead of bunching in one corner. Returns at most `count` spots
 * (fewer when the free area is too small).
 */
export function layoutHeroChips({ width, height, count, chip, avoid, region, gap = 18, pad = 24, stagger = true, scatter = 0.28 }: HeroLayoutInput): ChipSpot[] {
  if (count <= 0 || width <= 0 || height <= 0) return []
  const area = region ?? { x: 0, y: 0, w: width, h: height }
  const left = Math.max(pad, area.x)
  const top = Math.max(pad, area.y)
  const right = Math.min(width - pad, area.x + area.w)
  const bottom = Math.min(height - pad, area.y + area.h)
  const stepX = chip.w + gap
  const stepY = chip.h + gap
  const blocked = avoid.map((r) => grow(r, gap))
  const free: Rect[] = []
  let i = 0
  for (let row = 0, y = top; y + chip.h <= bottom; row++, y += stepY) {
    const shift = stagger && row % 2 === 1 ? stepX / 2 : 0
    for (let x = left + shift; x + chip.w <= right; x += stepX, i++) {
      // Fixed pseudo-random nudge so the grid reads as a scatter.
      const wobbleX = Math.round(((((i * 37) % 23) - 11) / 11) * scatter * 40)
      const wobbleY = Math.round(((((i * 53) % 17) - 8) / 8) * scatter * 28)
      const r = {
        x: Math.min(Math.max(left, x + wobbleX), right - chip.w),
        y: Math.min(Math.max(top, y + wobbleY), bottom - chip.h),
        w: chip.w,
        h: chip.h,
      }
      if (!blocked.some((b) => overlaps(r, b))) free.push(r)
    }
  }
  if (free.length === 0) return []

  const centre = (r: Rect) => ({ cx: r.x + r.w / 2, cy: r.y + r.h / 2 })
  // Start top-right (the brightest part of the city image), then always take
  // the free spot farthest from everything picked so far.
  const start = free.reduce((best, r) => (r.x - r.y > best.x - best.y ? r : best), free[0])
  const picked: Rect[] = [start]
  while (picked.length < count) {
    let best: Rect | null = null
    let bestD = -1
    for (const r of free) {
      if (picked.some((p) => overlaps(r, p, gap / 2))) continue
      const { cx, cy } = centre(r)
      const d = Math.min(...picked.map((p) => {
        const c = centre(p)
        return (cx - c.cx) ** 2 + (cy - c.cy) ** 2
      }))
      if (d > bestD) { bestD = d; best = r }
    }
    if (!best) break
    picked.push(best)
  }
  // Fill-in pass: if spreading left holes too small to reach, take any free spot that still fits.
  for (const r of free) {
    if (picked.length >= count) break
    if (!picked.some((p) => overlaps(r, p, gap / 2))) picked.push(r)
  }
  return picked.map((r, k) => ({ x: Math.round(r.x), y: Math.round(r.y), rotate: [-2, 1.5, -1, 2, -1.5, 1][k % 6] }))
}
