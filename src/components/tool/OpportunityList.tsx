import type { OpportunityCardModel } from '@/lib/tool-view'
import { OpportunityCard } from './OpportunityCard'

export interface OpportunityListProps {
  cards: OpportunityCardModel[]
  onToggleCommit: (id: string) => void
  onAskWhy: (id: string) => void
  onRemove?: (id: string) => void
}

function TierHead({ dot, title, count }: { dot: string; title: string; count: number }) {
  return (
    <div className="tier-h">
      <span className={`tdot ${dot}`} aria-hidden="true" />
      <h3>{title}</h3>
      <span className="c">{count}</span>
    </div>
  )
}

// Focus gets the wide lit grid; Consider and Not now share the side column.
export function OpportunityList({ cards, onToggleCommit, onAskWhy, onRemove }: OpportunityListProps) {
  const focus = cards.filter((c) => c.tier === 'FOCUS')
  const consider = cards.filter((c) => c.tier === 'CONSIDER')
  const skipped = cards.filter((c) => c.tier === 'SKIP')
  const card = (c: OpportunityCardModel) => <OpportunityCard key={c.id} card={c} onToggleCommit={onToggleCommit} onAskWhy={onAskWhy} onRemove={onRemove} />
  return (
    <div className="board">
      <section className="tier-focus" aria-label="Focus">
        <TierHead dot="focus" title="Focus" count={focus.length} />
        {focus.length > 0
          ? <div className="cards">{focus.map(card)}</div>
          : <p className="empty">Nothing is Focus yet. Add a project in Profile that shows what an opportunity asks for.</p>}
      </section>
      <div className="tier-side">
        {consider.length > 0 && (
          <section aria-label="Consider">
            <TierHead dot="consider" title="Consider" count={consider.length} />
            <div className="cards one">{consider.map(card)}</div>
          </section>
        )}
        {skipped.length > 0 && (
          <details aria-label="Not now">
            <summary className="notnow-toggle">
              <span className="tdot notnow" aria-hidden="true" />
              <h3>Not now</h3>
              <span className="c mono">{skipped.length}</span>
              <span className="show"><span className="show-word" aria-hidden="true" /><span className="sr-only">Show or hide</span></span>
            </summary>
            <p className="foot-note" style={{ margin: '-6px 0 14px' }}>Locked, each with its reason.</p>
            <div className="cards one">{skipped.map(card)}</div>
          </details>
        )}
      </div>
    </div>
  )
}
