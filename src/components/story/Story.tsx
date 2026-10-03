import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRevealOnEnter } from '@/hooks/use-reveal-on-enter'
import { useCountUp } from '@/hooks/use-count-up'
import { humanTag, shortDate } from '@/lib/exit-reason'
import type { StoryData, StoryExit, StoryPileCard, StoryReuseFan } from '@/lib/story-data'

export interface StoryProps {
  data: StoryData
  onOpenPlanner: () => void
  reducedMotion: boolean
}

const DISPLAY = 'text-[56px] font-semibold leading-[1.05] tracking-[-0.02em]'
const COUNTER = 'text-[72px] font-semibold leading-none tracking-[-0.03em] tabular-nums'
const BEAT = 'flex min-h-[calc(100svh-56px)] flex-col items-center justify-center px-8 py-24'

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [ref, revealed] = useRevealOnEnter<HTMLDivElement>()
  return <div ref={ref} data-revealed={revealed} className={`reveal ${className}`}>{children}</div>
}

// Card pile around the headline: [left %, top %, rotate deg, scale, opacity].
// Fixed values (deterministic); the centre column stays clear for the text.
const PILE_POS: [number, number, number, number, number][] = [
  [2, 7, -7, 0.92, 0.7], [22, 2, 4, 0.82, 0.5], [68, 3, -4, 0.86, 0.55], [84, 10, 6, 0.96, 0.75],
  [0, 40, 5, 0.86, 0.55], [85, 42, -6, 0.9, 0.65],
  [3, 73, -4, 0.96, 0.75], [20, 86, 6, 0.8, 0.45], [67, 85, -5, 0.84, 0.5], [83, 74, 4, 0.92, 0.7],
]

function HeroCard({ card, i, reducedMotion }: { card: StoryPileCard; i: number; reducedMotion: boolean }) {
  const [left, top, r, sc, o] = PILE_POS[i % PILE_POS.length]
  const style = {
    left: `${left}%`, top: `${top}%`,
    ['--r' as string]: `${r}deg`, ['--s' as string]: sc, ['--o' as string]: o,
    ['--d' as string]: `${200 + i * 90}ms`,
  } as React.CSSProperties
  const floatStyle = {
    ['--fx' as string]: `${i % 2 ? -10 : 12}px`, ['--fy' as string]: `${i % 3 ? 14 : -12}px`,
    ['--fd' as string]: `${7 + (i * 3) % 6}s`, ['--fdelay' as string]: `${1.2 + i * 0.09}s`,
  } as React.CSSProperties
  return (
    <div className={`hero-card absolute w-[210px] ${reducedMotion ? '' : 'hero-card-anim'}`} style={style}>
      <div className={reducedMotion ? '' : 'hero-float'} style={floatStyle}>
        <div className="rounded-xl border border-border bg-card/90 p-3.5">
          <p className="truncate text-[13px] font-semibold text-foreground">{card.title}</p>
          <p className="mt-1.5 flex items-center justify-between text-[12px] text-muted-foreground tabular-nums">
            <span>{card.deadline ? `due ${shortDate(card.deadline)}` : 'no deadline'}</span>
            <span>~{card.effortHours} h</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, unit, label }: { value: number; unit?: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-8">
      <p className="text-[56px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {value}{unit && <span className="ml-1 text-[28px] font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-2 text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
    </div>
  )
}

const LINE_1 = ['Too', 'many', 'opportunities.']
const LINE_2 = ['Too', 'little', 'time.']

function HeroBeat({ data, onOpenPlanner, onSeeHow, reducedMotion }: {
  data: StoryData; onOpenPlanner: () => void; onSeeHow: () => void; reducedMotion: boolean
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => { if (window.scrollY > 40) setScrolled(true) }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const total = useCountUp(data.total, 900, 900, reducedMotion)
  const work = useCountUp(data.totalEffortHours, 1300, 1000, reducedMotion)
  const weekly = useCountUp(data.weeklyCapacityHours, 900, 1100, reducedMotion)
  // The gradient sits on each word: background-clip text does not reach transformed children.
  const word = (w: string, i: number, gradient = false) => (
    <span key={`${w}-${i}`} className={`inline-block ${gradient ? 'hero-gradient' : ''} ${reducedMotion ? '' : 'hero-word'}`} style={{ ['--d' as string]: `${i * 80}ms` } as React.CSSProperties}>
      {w}&nbsp;
    </span>
  )
  return (
    <section className={`story-hero ${BEAT} text-center`} aria-labelledby="beat-0">
      <div className="fog-layer fog-a" aria-hidden="true" />
      <div className="fog-layer fog-b" aria-hidden="true" />
      <div className="fog-layer fog-c" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {data.pile.slice(0, PILE_POS.length).map((c, i) => <HeroCard key={c.id} card={c} i={i} reducedMotion={reducedMotion} />)}
      </div>

      <h1 id="beat-0" className="max-w-[880px]">
        <span className="block text-[60px] font-semibold leading-[1.02] tracking-[-0.03em]">{LINE_1.map((w, i) => word(w, i))}</span>
        <span className="block pb-2 text-[84px] font-semibold leading-[1.02] tracking-[-0.035em]">{LINE_2.map((w, i) => word(w, i + 3, true))}</span>
      </h1>

      <div className={`mt-12 flex items-stretch divide-x divide-border ${reducedMotion ? '' : 'hero-rise'}`} style={{ ['--d' as string]: '700ms' } as React.CSSProperties}>
        <Stat value={total} label="opportunities" />
        <Stat value={work} unit="h" label="of work, estimated" />
        <Stat value={weekly} unit="h" label="a week to spend" />
      </div>
      <p className={`mt-8 text-[18px] ${reducedMotion ? '' : 'hero-rise'}`} style={{ ['--d' as string]: '900ms' } as React.CSSProperties}>
        For students juggling more opportunities than hours.
      </p>

      <div className={`mt-10 flex items-center gap-3 ${reducedMotion ? '' : 'hero-rise'}`} style={{ ['--d' as string]: '1100ms' } as React.CSSProperties}>
        <Button size="lg" className="h-10 px-5 text-[15px]" onClick={onOpenPlanner}>
          Open the planner <ArrowRight aria-hidden="true" />
        </Button>
        <Button size="lg" variant="outline" className="h-10 px-5 text-[15px]" onClick={onSeeHow}>See how it narrows</Button>
      </div>

      <ArrowDown
        className={`absolute bottom-8 size-5 text-muted-foreground transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'} ${reducedMotion ? '' : 'hero-cue'}`}
        aria-hidden="true"
      />
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
    const timers = exits.map((_, i) => window.setTimeout(() => setStep(i + 1), 400 + i * 120 * 3))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [revealed, reducedMotion, exits])
  const shown = reducedMotion ? exits.length : step
  const outReason = new Map(exits.slice(0, shown).map((e) => [e.title, e.reason]))
  return (
    <section className={BEAT} aria-labelledby="beat-1">
      <div ref={ref} className="w-full max-w-[1056px] text-center">
        <h2 id="beat-1" className={DISPLAY}>Most of them aren't for you.</h2>
        <p className="mt-8"><span className={COUNTER}>{total - shown}</span></p>
        <p className="mt-2 text-[15px] text-muted-foreground tabular-nums">
          {shown === exits.length ? `left of ${total}, each exit with its reason` : `of ${total}`}
        </p>
        <ul className="mt-12 grid grid-cols-5 gap-3 text-left">
          {titles.map((t) => {
            const reason = outReason.get(t)
            return (
              <li key={t} data-out={reason !== undefined} className="funnel-card flex min-h-[104px] flex-col justify-between rounded-xl border border-border bg-card p-3">
                <span className="funnel-title text-[13px] font-medium leading-snug">{t}</span>
                <span className="funnel-chip mt-2 self-start rounded-full border border-border px-2 py-0.5 text-[12px]">{reason ?? ''}</span>
              </li>
            )
          })}
        </ul>
        <p className="sr-only" aria-live="polite">{shown === exits.length ? `${remaining} of ${total} left.` : ''}</p>
      </div>
    </section>
  )
}

function ReuseBeat({ fan }: { fan: StoryReuseFan }) {
  const [ref, revealed] = useRevealOnEnter<HTMLDivElement>()
  const W = 1000
  const ROW = 64
  const H = Math.max(1, fan.targets.length) * ROW
  const px = 280
  const ox = 640
  return (
    <section className={BEAT} aria-labelledby="beat-3">
      <div ref={ref} data-revealed={revealed} className="w-full max-w-[1056px]">
        <h2 id="beat-3" className={`${DISPLAY} text-center`}>One project. Several doors.</h2>
        <p className="mx-auto mt-4 max-w-[68ch] text-center text-muted-foreground">Each thread is a tag {fan.project.title} shows that the opportunity asks for.</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="mt-12 w-full" aria-hidden="true">
          {fan.targets.map((t, i) => {
            const y1 = H / 2
            const y2 = i * ROW + ROW / 2
            return (
              <g key={t.id}>
                <path
                  d={`M${px},${y1} C${(px + ox) / 2},${y1} ${(px + ox) / 2},${y2} ${ox},${y2}`}
                  fill="none" stroke="var(--fog-2)" strokeWidth={1.5}
                  className="thread-draw" style={{ transitionDelay: `${i * 120}ms` }}
                />
                <text x={ox - 12} y={y2 - 8} textAnchor="end" fontSize="12" fill="var(--muted-text)" stroke="var(--ink)" strokeWidth={4} paintOrder="stroke">{t.matchedTags.map(humanTag).join(' · ')}</text>
                <rect x={ox} y={y2 - 20} width={W - ox} height={40} rx={10} fill="var(--surface)" stroke="var(--hairline)" />
                <text x={ox + 16} y={y2 + 5} fontSize="15" fill="var(--text)">{t.title}</text>
              </g>
            )
          })}
          <rect x={0} y={H / 2 - 24} width={px} height={48} rx={12} fill="var(--surface-2)" stroke="var(--fog-2)" />
          <text x={20} y={H / 2 + 5} fontSize="16" fontWeight={600} fill="var(--text)">{fan.project.title}</text>
        </svg>
        <ul className="sr-only">
          {fan.targets.map((t) => <li key={t.id}>{fan.project.title} to {t.title}, via {t.matchedTags.map(humanTag).join(', ')}</li>)}
        </ul>
      </div>
    </section>
  )
}

const PREVIEW_BARS = [4, 7, 10, 5]

function HandoffBeat({ onOpenPlanner }: { onOpenPlanner: () => void }) {
  return (
    <section className={BEAT} aria-labelledby="beat-4">
      <Reveal className="flex flex-col items-center text-center">
        <h2 id="beat-4" className={DISPLAY}>Now plan your weeks.</h2>
        <div className="mt-12 flex items-end gap-3" aria-hidden="true">
          {PREVIEW_BARS.map((h, i) => (
            <div key={i} className="flex h-[120px] w-16 flex-col justify-end rounded-lg border border-border bg-card p-1.5">
              <div className="rounded-[3px] bg-fog-2" style={{ height: `${h * 10}px` }} />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Preview</p>
        <Button className="mt-10" size="lg" onClick={onOpenPlanner}>Open the planner</Button>
      </Reveal>
    </section>
  )
}

export function Story({ data, onOpenPlanner, reducedMotion }: StoryProps) {
  return (
    <div>
      <HeroBeat
        data={data}
        onOpenPlanner={onOpenPlanner}
        onSeeHow={() => document.getElementById('beat-1')?.closest('section')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })}
        reducedMotion={reducedMotion}
      />
      <FunnelBeat total={data.total} remaining={data.remaining} exits={data.exits} titles={data.titles} reducedMotion={reducedMotion} />
      {data.reuseFan && <ReuseBeat fan={data.reuseFan} />}
      <HandoffBeat onOpenPlanner={onOpenPlanner} />
    </div>
  )
}
