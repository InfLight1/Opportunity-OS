import { ChevronRight } from 'lucide-react'
import type { OpportunityCardModel } from '@/lib/tool-view'
import { OpportunityCard } from './OpportunityCard'

export interface OpportunityListProps {
  cards: OpportunityCardModel[]
  onToggleCommit: (id: string) => void
  onAskWhy: (id: string) => void
  onRemove?: (id: string) => void
}

function Group({ title, cards, onToggleCommit, onAskWhy, onRemove }: { title: string } & OpportunityListProps) {
  if (cards.length === 0) return null
  return (
    <section aria-label={title} className="space-y-4">
      <h3 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{title} <span className="tabular-nums">({cards.length})</span></h3>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((c) => <OpportunityCard key={c.id} card={c} onToggleCommit={onToggleCommit} onAskWhy={onAskWhy} onRemove={onRemove} />)}
      </div>
    </section>
  )
}

export function OpportunityList({ cards, onToggleCommit, onAskWhy, onRemove }: OpportunityListProps) {
  const skipped = cards.filter((c) => c.tier === 'SKIP')
  return (
    <div className="space-y-8">
      <Group title="Focus" cards={cards.filter((c) => c.tier === 'FOCUS')} onToggleCommit={onToggleCommit} onAskWhy={onAskWhy} onRemove={onRemove} />
      <Group title="Consider" cards={cards.filter((c) => c.tier === 'CONSIDER')} onToggleCommit={onToggleCommit} onAskWhy={onAskWhy} onRemove={onRemove} />
      {skipped.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden="true" />
            Not now <span className="tabular-nums">({skipped.length})</span>
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {skipped.map((c) => <OpportunityCard key={c.id} card={c} onToggleCommit={onToggleCommit} onAskWhy={onAskWhy} onRemove={onRemove} />)}
          </div>
        </details>
      )}
    </div>
  )
}
