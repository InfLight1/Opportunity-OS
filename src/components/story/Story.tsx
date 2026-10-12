import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Threads } from '@/components/Threads'
import { useRevealOnEnter } from '@/hooks/use-reveal-on-enter'
import { useCountUp } from '@/hooks/use-count-up'
import { heroChipWidth, layoutHeroChips, type ChipSpot } from '@/lib/hero-layout'
import { humanTag, shortDate } from '@/lib/exit-reason'
import type { StoryData, StoryExit, StoryPileCard, StoryReuseFan } from '@/lib/story-data'

export interface StoryProps {
  data: StoryData
  onOpenPlanner: () => void
  reducedMotion: boolean
}

const CHIP_H = 74

function Chip({ card, spot, width, i }: { card: StoryPileCard; spot?: ChipSpot; width?: number; i: number }) {
  const style = {
    ['--r' as string]: `${spot ? spot.rotate : [-1, 1, -0.5, 0.5][i % 4]}deg`,
    ['--d' as string]: `${7 + (i * 3) % 5}s`,
    ['--dl' as string]: `${-(i * 0.7)}s`,
    ...(spot ? { left: spot.x, top: spot.y, width } : {}),
  } as React.CSSProperties
  return (
    <li className="chip" style={style}>
      <strong title={card.title}>{card.title}</strong>
      <span className="meta">
        <span>{card.deadline ? `due ${shortDate(card.deadline)}` : 'no deadline'}</span>
        <span className="h">~{card.effortHours} h</span>
      </span>
    </li>
  )
}

function HeroBeat({ data, onOpenPlanner, onSeeHow, reducedMotion }: {
  data: StoryData; onOpenPlanner: () => void; onSeeHow: () => void; reducedMotion: boolean
}) {
  const heroRef = useRef<HTMLElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const [spots, setSpots] = useState<{ list: ChipSpot[]; width: number } | null>(null)
  const total = useCountUp(data.total, 900, 600, reducedMotion)
  const work = useCountUp(data.totalEffortHours, 1300, 700, reducedMotion)
  const weekly = useCountUp(data.weeklyCapacityHours, 900, 800, reducedMotion)

  // Wide screens: spread the chips over the city, clear of the headline. Narrow: a simple grid.
  useLayoutEffect(() => {
    const hero = heroRef.current
    const copy = copyRef.current
    if (!hero || !copy) return
    const place = () => {
      const h = hero.getBoundingClientRect()
      if (h.width <= 960) { setSpots(null); return }
      const c = copy.getBoundingClientRect()
      const width = heroChipWidth(h.width)
      const copyBox = { x: c.left - h.left - 24, y: c.top - h.top - 24, w: c.width + 48, h: c.height + 48 }
      // Chips cluster to the right of the headline, level with it; the band only grows if all 10 don't fit.
      const rightOf = copyBox.x + copyBox.w
      // Stay inside the first screen, so no chip hides below the fold on short laptops.
      const visibleH = Math.min(h.height, window.innerHeight - Math.max(0, h.top))
      const tryBand = (extra: number, gap: number, stagger: boolean, scatter: number) => layoutHeroChips({
        width: h.width, height: visibleH, count: data.pile.length, chip: { w: width, h: CHIP_H }, gap, pad: gap, stagger, scatter,
        avoid: [copyBox],
        region: { x: rightOf + gap, y: copyBox.y - extra, w: h.width - rightOf - gap, h: copyBox.h + extra * 2 },
      })
      // Loosest look first; tighter packing only when the screen is small.
      const tries: [number, number, boolean, number][] = [
        [0.12, 18, true, 1], [0.25, 18, true, 1], [0.25, 18, true, 0.28], [1, 18, true, 0.28], [1, 12, true, 0.28], [1, 12, false, 0.28],
      ]
      const list = tries.map(([f, gap, stagger, scatter]) => tryBand(visibleH * f, gap, stagger, scatter)).find((l) => l.length === data.pile.length) ?? []
      setSpots(list.length === data.pile.length ? { list, width } : null)
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(hero)
    return () => ro.disconnect()
  }, [data.pile.length])

  const chips = (
    <ul className={`chips ${spots ? 'placed' : ''}`} aria-label="The pile: every opportunity on the list">
      {data.pile.map((c, i) => <Chip key={c.id} card={c} i={i} spot={spots?.list[i]} width={spots?.width} />)}
    </ul>
  )

  return (
    <section ref={heroRef} className="hero" aria-labelledby="beat-0">
      <div className="city" aria-hidden="true" />
      {spots && chips}
      <div className="wrap hero-in">
        <div ref={copyRef} className="hero-copy">
          <span className="rule" aria-hidden="true" />
          <h1 id="beat-0">Too many opportunities.<span className="l2">Too little time.</span></h1>
          <p className="hero-line">For students juggling more opportunities than hours.</p>
          <div className="stats">
            <div className="stat"><b>{total}</b><span>opportunities</span></div>
            <div className="stat"><b>{work} h</b><span>of work, estimated</span></div>
            <div className="stat"><b>{weekly} h</b><span>a week to spend</span></div>
          </div>
          <div className="cta-row">
            <Button onClick={onOpenPlanner}>Open the planner <ArrowRight aria-hidden="true" /></Button>
            <Button variant="outline" onClick={onSeeHow}>See how it narrows</Button>
          </div>
        </div>
      </div>
      {!spots && chips}
    </section>
  )
}

function FunnelBeat({ total, remaining, exits, titles, reducedMotion }: {
  total: number; remaining: number; exits: StoryExit[]; titles: string[]; reducedMotion: boolean
}) {
  const [ref, revealed] = useRevealOnEnter<HTMLDivElement>()
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!revealed || reducedMotion) return
    const timers = exits.map((_, i) => window.setTimeout(() => setStep(i + 1), 400 + i * 360))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [revealed, reducedMotion, exits])
  const shown = reducedMotion ? exits.length : step
  const outReason = new Map(exits.slice(0, shown).map((e) => [e.title, e.reason]))
  const done = shown === exits.length
  return (
    <section className="sec" aria-labelledby="beat-1">
      <div className="wrap">
        <div ref={ref} className="spined funnel">
          <span className="stop" aria-hidden="true" />
          <div className="funnel-side">
            <h2 id="beat-1">Most of them aren't for you.</h2>
            <p className="count"><span className="n">{total - shown}</span><span className="of">of {total}</span></p>
            <p className="count-note">{done ? 'left, each exit with its reason' : ''}</p>
          </div>
          <ul className="exits">
            {titles.map((t) => {
              const reason = outReason.get(t)
              return (
                <li key={t} className={`exit ${reason !== undefined ? 'out' : ''}`}>
                  <h3>{t}</h3>
                  {reason !== undefined && <span className="why"><em>Out</em>{reason}</span>}
                </li>
              )
            })}
          </ul>
          <p className="sr-only" aria-live="polite">{done ? `${remaining} of ${total} left.` : ''}</p>
        </div>
      </div>
    </section>
  )
}

function ReuseBeat({ fan }: { fan: StoryReuseFan }) {
  return (
    <section className="sec" aria-labelledby="beat-3">
      <div className="wrap">
        <div className="spined">
          <span className="stop" aria-hidden="true" />
          <h2 id="beat-3">One project. Several doors.</h2>
          <p className="lead" style={{ marginTop: 14 }}>Each thread is a tag {fan.project.title} shows that the opportunity asks for.</p>
          <Threads
            sources={[{ id: fan.project.id, title: fan.project.title }]}
            dests={fan.targets.map((t) => ({ id: t.id, title: t.title, state: 'open', via: t.matchedTags.map(humanTag).join(' · ') }))}
            links={fan.targets.map((t) => ({ from: fan.project.id, to: t.id, state: 'open' }))}
          />
        </div>
      </div>
    </section>
  )
}

function HandoffBeat({ onOpenPlanner }: { onOpenPlanner: () => void }) {
  return (
    <section className="handoff-sec" aria-labelledby="beat-4">
      <div className="wrap">
        <div className="spined handoff">
          <span className="stop end" aria-hidden="true" />
          <h2 id="beat-4">Now plan your weeks.</h2>
          <Button onClick={onOpenPlanner}>Open the planner</Button>
        </div>
      </div>
    </section>
  )
}

export function Story({ data, onOpenPlanner, reducedMotion }: StoryProps) {
  return (
    <>
      <HeroBeat
        data={data}
        onOpenPlanner={onOpenPlanner}
        onSeeHow={() => document.getElementById('beat-1')?.closest('section')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })}
        reducedMotion={reducedMotion}
      />
      <div className="story">
        <FunnelBeat total={data.total} remaining={data.remaining} exits={data.exits} titles={data.titles} reducedMotion={reducedMotion} />
        {data.reuseFan && <ReuseBeat fan={data.reuseFan} />}
        <HandoffBeat onOpenPlanner={onOpenPlanner} />
      </div>
    </>
  )
}
