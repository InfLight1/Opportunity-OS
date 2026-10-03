import { useEffect, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRevealOnEnter } from '@/hooks/use-reveal-on-enter'
import { humanTag } from '@/lib/exit-reason'
import type { StoryData, StoryExit, StoryReuseFan } from '@/lib/story-data'

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

// Fixed pseudo-random drift per chip (deterministic, no Math.random in render).
const CHIP_POS = [
  [8, 14], [62, 10], [80, 30], [18, 70], [70, 78], [40, 20], [6, 44], [86, 58], [30, 86], [55, 62],
]

function HeroBeat({ total, weeklyCapacityHours, titles, onSkip, reducedMotion }: {
  total: number; weeklyCapacityHours: number; titles: string[]; onSkip: () => void; reducedMotion: boolean
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => { if (window.scrollY > 40) setScrolled(true) }
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <section className={`story-hero ${BEAT} text-center`} aria-labelledby="beat-0">
      <div className="fog-layer fog-a" aria-hidden="true" />
      <div className="fog-layer fog-b" aria-hidden="true" />
      <div className="fog-layer fog-c" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(70%_70%_at_50%_50%,transparent_35%,black_80%)]" aria-hidden="true">
        {titles.slice(0, 10).map((t, i) => (
          <span
            key={t}
            className={`absolute whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-[13px] opacity-25 ${reducedMotion ? '' : 'drift-chip'}`}
            style={{
              left: `${CHIP_POS[i % CHIP_POS.length][0]}%`, top: `${CHIP_POS[i % CHIP_POS.length][1]}%`,
              ['--drift-dur' as string]: `${30 + (i * 7) % 16}s`,
              ['--drift-x' as string]: `${i % 2 ? -36 : 44}px`,
              ['--drift-y' as string]: `${i % 3 ? 20 : -28}px`,
            }}
          >{t}</span>
        ))}
      </div>
      <h1 id="beat-0" className={`${DISPLAY} max-w-[720px]`}>Too many opportunities. Too little time.</h1>
      <p className={`${COUNTER} mt-12`}>{total}</p>
      <p className="mt-3 text-[15px] text-muted-foreground tabular-nums">opportunities on your list · {weeklyCapacityHours} h a week to spend</p>
      <p className="mt-6 text-[18px]">For students juggling more opportunities than hours.</p>
      <div className="mt-10 flex items-center gap-3">
        <Button variant="outline" onClick={onSkip}>Skip to planner</Button>
      </div>
      <ArrowDown
        className={`absolute bottom-10 size-5 text-muted-foreground transition-opacity duration-500 ${scrolled ? 'opacity-0' : 'opacity-100'}`}
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
                <text x={ox - 12} y={y2 - 8} textAnchor="end" fontSize="12" fill="var(--muted-text)">{t.matchedTags.map(humanTag).join(' · ')}</text>
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
      <HeroBeat total={data.total} weeklyCapacityHours={data.weeklyCapacityHours} titles={data.titles} onSkip={onOpenPlanner} reducedMotion={reducedMotion} />
      <FunnelBeat total={data.total} remaining={data.remaining} exits={data.exits} titles={data.titles} reducedMotion={reducedMotion} />
      {data.reuseFan && <ReuseBeat fan={data.reuseFan} />}
      <HandoffBeat onOpenPlanner={onOpenPlanner} />
    </div>
  )
}
