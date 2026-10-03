import { humanTag } from '@/lib/exit-reason'
import type { ReuseWebModel } from '@/lib/reuse-web'
import { SectionHeader } from './SectionHeader'

export interface ReuseWebProps {
  model: ReuseWebModel
  reducedMotion: boolean
}

const W = 1056
const ROW = 52
const PROJ_W = 248
const OPP_X = 620
const NODE_H = 36

export function ReuseWeb({ model, reducedMotion }: ReuseWebProps) {
  if (model.threads.length === 0) {
    return (
      <section id="reuse-section" aria-labelledby="reuse" className="space-y-6">
        <SectionHeader
          id="reuse"
          eyebrow="Reuse"
          title="One project, several doors"
          description="Each thread is a tag your project shows that the opportunity asks for. Bright threads lead to what you've committed; dashed ones are locked."
        />
        <p className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">Add a project in your profile to see which opportunities it opens.</p>
      </section>
    )
  }
  const rows = Math.max(model.projects.length, model.opportunities.length)
  const H = rows * ROW + 8
  const projY = (i: number) => {
    const offset = ((rows - model.projects.length) * ROW) / 2
    return 4 + offset + i * ROW
  }
  const oppY = (i: number) => 4 + i * ROW
  const pIndex = new Map(model.projects.map((p, i) => [p.id, i]))
  const oIndex = new Map(model.opportunities.map((o, i) => [o.id, i]))
  const oState = new Map(model.opportunities.map((o) => [o.id, o.state]))
  const missing = new Set(model.projects.filter((p) => p.missing).map((p) => p.id))

  return (
    <section id="reuse-section" aria-labelledby="reuse" className="space-y-6">
      <SectionHeader
        id="reuse"
        eyebrow="Reuse"
        title="One project, several doors"
        description="Each thread is a tag your project shows that the opportunity asks for. Bright threads lead to what you've committed; dashed ones are locked."
      />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-hidden="true" focusable="false">
        {model.threads.map((t) => {
          const pi = pIndex.get(t.projectId)
          const oi = oIndex.get(t.opportunityId)
          if (pi === undefined || oi === undefined) return null
          const x1 = PROJ_W
          const y1 = projY(pi) + NODE_H / 2
          const x2 = OPP_X
          const y2 = oppY(oi) + NODE_H / 2
          const state = oState.get(t.opportunityId)
          const dashed = state === 'skipped' || missing.has(t.projectId)
          const mid = (x1 + x2) / 2
          return (
            <g key={`${t.projectId}-${t.opportunityId}`} opacity={state === 'skipped' ? 0.5 : 1}>
              <path
                d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                fill="none"
                stroke={state === 'committed' ? 'var(--fog-1)' : 'var(--fog-3)'}
                strokeWidth={state === 'committed' ? 2 : 1}
                strokeDasharray={dashed ? '4 4' : undefined}
                className={reducedMotion ? '' : 'transition-[stroke] duration-200'}
              />
              <text x={x2 - 10} y={y2 - 6} textAnchor="end" fontSize="11" fill="var(--muted-text)" stroke="var(--ink)" strokeWidth={4} paintOrder="stroke">
                {t.matchedTags.map(humanTag).join(' · ')}
              </text>
            </g>
          )
        })}
        {model.projects.map((p, i) => (
          <g key={p.id}>
            <rect
              x={0.5} y={projY(i) + 0.5} width={PROJ_W - 1} height={NODE_H} rx={8}
              fill={p.missing ? 'transparent' : 'var(--surface-2)'}
              stroke={p.missing ? 'var(--fog-3)' : 'var(--fog-2)'}
              strokeDasharray={p.missing ? '4 4' : undefined}
            />
            <text x={14} y={projY(i) + NODE_H / 2 + 5} fontSize="13" fill={p.missing ? 'var(--muted-text)' : 'var(--text)'} fontWeight={p.missing ? 400 : 600}>
              {p.title.length > 34 ? `${p.title.slice(0, 33)}…` : p.title}
            </text>
          </g>
        ))}
        {model.opportunities.map((o, i) => (
          <g key={o.id}>
            <rect
              x={OPP_X + 0.5} y={oppY(i) + 0.5} width={W - OPP_X - 1} height={NODE_H} rx={8}
              fill="var(--surface)"
              stroke={o.state === 'committed' ? 'var(--fog-1)' : 'var(--hairline)'}
              strokeDasharray={o.state === 'skipped' ? '4 4' : undefined}
            />
            <text x={OPP_X + 14} y={oppY(i) + NODE_H / 2 + 5} fontSize="13" fill={o.state === 'skipped' ? 'var(--muted-text)' : 'var(--text)'}>
              {o.title.length > 34 ? `${o.title.slice(0, 33)}…` : o.title}
              {o.state === 'skipped' && <tspan fill="var(--muted-text)" fontSize="11">{`  ${o.skipReason}`}</tspan>}
              {o.state === 'committed' && <tspan fill="var(--muted-text)" fontSize="11">{'  committed'}</tspan>}
            </text>
          </g>
        ))}
      </svg>
      <ul className="sr-only">
        {model.projects.map((p) => (
          <li key={p.id}>
            {p.title}:{' '}
            {model.threads.filter((t) => t.projectId === p.id).map((t) => {
              const o = model.opportunities.find((x) => x.id === t.opportunityId)
              if (!o) return ''
              const note = o.state === 'skipped' ? ` (not now: ${o.skipReason})` : o.state === 'committed' ? ' (committed)' : ''
              return `${o.title}${note}, via ${t.matchedTags.map(humanTag).join(', ')}`
            }).join('; ')}
          </li>
        ))}
      </ul>
    </section>
  )
}
