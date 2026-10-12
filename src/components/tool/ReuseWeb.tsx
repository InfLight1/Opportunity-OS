import { Threads, type ThreadState } from '@/components/Threads'
import { humanTag } from '@/lib/exit-reason'
import type { ReuseOppState, ReuseWebModel } from '@/lib/reuse-web'
import { SectionHeader } from './SectionHeader'

export interface ReuseWebProps {
  model: ReuseWebModel
  reducedMotion: boolean
}

const STATE: Record<ReuseOppState, ThreadState> = { committed: 'committed', pursuable: 'open', skipped: 'locked' }

export function ReuseWeb({ model }: ReuseWebProps) {
  const missing = new Set(model.projects.filter((p) => p.missing).map((p) => p.id))
  // Every tag that links some project to this opportunity, in first-seen order.
  const via = (oppId: string) => [...new Set(model.threads.filter((t) => t.opportunityId === oppId).flatMap((t) => t.matchedTags))].map(humanTag).join(' · ')
  return (
    <section id="reuse-section" aria-labelledby="reuse" className="psec">
      <div className="wrap">
        <SectionHeader
          id="reuse"
          eyebrow="Reuse"
          title="One project, several doors"
          description="Each thread is a tag your project shows that the opportunity asks for. Bright threads lead to what you've committed; dashed ones are locked."
        />
        {model.threads.length === 0 ? (
          <p className="empty">Add a project in your profile to see which opportunities it opens.</p>
        ) : (
          <Threads
            planner
            sources={model.projects}
            dests={model.opportunities.map((o) => ({
              id: o.id, title: o.title, state: STATE[o.state], via: via(o.id),
              note: o.state === 'skipped' && o.skipReason ? `Locked: ${o.skipReason}` : undefined,
            }))}
            links={model.threads.map((t) => {
              const o = model.opportunities.find((x) => x.id === t.opportunityId)
              const state = o ? STATE[o.state] : 'open'
              return { from: t.projectId, to: t.opportunityId, state: missing.has(t.projectId) ? 'locked' : state }
            })}
          />
        )}
      </div>
    </section>
  )
}
