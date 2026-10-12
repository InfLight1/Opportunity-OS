import { describe, expect, it } from 'vitest'
import { heroChipWidth, layoutHeroChips, overlaps, type Rect } from './hero-layout'

const CHIP_H = 74

// Headline block roughly where the hero copy sits on wide screens.
function heroCase(width: number, height: number) {
  const headline: Rect = { x: 56, y: height / 2 - 230, w: Math.min(640, width * 0.46), h: 460 }
  // Chips cluster to the right of the headline, never below it.
  const region: Rect = { x: headline.x + headline.w + 24, y: 0, w: width, h: height }
  return { width, height, count: 10, chip: { w: heroChipWidth(width), h: CHIP_H }, avoid: [headline], region }
}

const SIZES: [number, number][] = [[1440, 832], [1280, 732], [1100, 700], [1920, 1012]]

describe('layoutHeroChips', () => {
  it.each(SIZES)('places all 10 chips at %ix%i', (w, h) => {
    expect(layoutHeroChips(heroCase(w, h))).toHaveLength(10)
  })

  it.each(SIZES)('keeps every chip inside the hero at %ix%i', (w, h) => {
    const c = heroCase(w, h)
    for (const s of layoutHeroChips(c)) {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.x + c.chip.w).toBeLessThanOrEqual(w)
      expect(s.y + c.chip.h).toBeLessThanOrEqual(h)
    }
  })

  it.each(SIZES)('never covers the headline block at %ix%i', (w, h) => {
    const c = heroCase(w, h)
    for (const s of layoutHeroChips(c)) {
      expect(overlaps({ x: s.x, y: s.y, ...c.chip }, c.avoid[0])).toBe(false)
    }
  })

  it.each(SIZES)('no two chips overlap at %ix%i', (w, h) => {
    const c = heroCase(w, h)
    const rects = layoutHeroChips(c).map((s) => ({ x: s.x, y: s.y, ...c.chip }))
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j])).toBe(false)
    }
  })

  it.each(SIZES)('keeps every chip to the right of the headline at %ix%i', (w, h) => {
    const c = heroCase(w, h)
    for (const s of layoutHeroChips(c)) expect(s.x).toBeGreaterThanOrEqual(c.region.x)
  })

  it.each([[1280, 652], [1100, 632]])('fits all 10 beside the headline on a short %ix%i first screen without staggered rows', (w, h) => {
    const headline: Rect = { x: 28, y: h / 2 - 210, w: Math.min(640, w * 0.46) + 48, h: 420 }
    const region: Rect = { x: headline.x + headline.w + 12, y: 0, w: w, h }
    const spots = layoutHeroChips({ width: w, height: h, count: 10, chip: { w: heroChipWidth(w), h: CHIP_H }, avoid: [headline], region, gap: 12, pad: 12, stagger: false })
    expect(spots).toHaveLength(10)
    for (const s of spots) {
      expect(s.x).toBeGreaterThanOrEqual(region.x)
      expect(s.y + CHIP_H).toBeLessThanOrEqual(h)
    }
  })

  it('uses narrower chips on smaller heroes, within 196-236 px', () => {
    expect(heroChipWidth(1920)).toBe(236)
    expect(heroChipWidth(1100)).toBeLessThan(236)
    expect(heroChipWidth(800)).toBe(196)
  })

  it('a looser scatter still never overlaps, at the largest size', () => {
    const c = { ...heroCase(1920, 1012), scatter: 1 }
    const rects = layoutHeroChips(c).map((s) => ({ x: s.x, y: s.y, ...c.chip }))
    expect(rects).toHaveLength(10)
    for (let i = 0; i < rects.length; i++) {
      expect(overlaps(rects[i], c.avoid[0])).toBe(false)
      for (let j = i + 1; j < rects.length; j++) expect(overlaps(rects[i], rects[j])).toBe(false)
    }
  })

  it('is deterministic', () => {
    expect(layoutHeroChips(heroCase(1440, 832))).toEqual(layoutHeroChips(heroCase(1440, 832)))
  })

  it('spreads chips out: they reach both the top and bottom thirds', () => {
    const ys = layoutHeroChips(heroCase(1440, 832)).map((s) => s.y + CHIP_H / 2)
    expect(Math.min(...ys)).toBeLessThan(832 / 3)
    expect(Math.max(...ys)).toBeGreaterThan((832 * 2) / 3)
  })

  it('returns fewer spots instead of overlapping when space runs out', () => {
    const tiny = layoutHeroChips({ width: 600, height: 300, count: 10, chip: { w: 236, h: CHIP_H }, avoid: [] })
    expect(tiny.length).toBeLessThan(10)
    expect(tiny.length).toBeGreaterThan(0)
  })

  it('returns nothing for an empty request', () => {
    expect(layoutHeroChips({ ...heroCase(1440, 832), count: 0 })).toEqual([])
    expect(layoutHeroChips({ ...heroCase(1440, 832), width: 0 })).toEqual([])
  })
})
