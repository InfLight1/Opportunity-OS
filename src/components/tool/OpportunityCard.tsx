import { Check, Clock, ExternalLink, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { shortDate } from '@/lib/exit-reason'
import { formatHours, relativeDays, TIER_WORD, type OpportunityCardModel } from '@/lib/tool-view'

const SOON_DAYS = 30

const TIER_CLASS = { FOCUS: 'focus', CONSIDER: 'consider', SKIP: 'notnow' } as const

export function TierBadge({ card }: { card: Pick<OpportunityCardModel, 'tier' | 'expired'> }) {
  if (card.expired) return <span className="tierword closed"><Lock className="size-3" aria-hidden="true" />Closed</span>
  return (
    <span className={`tierword ${TIER_CLASS[card.tier]}`}>
      {card.tier === 'SKIP' && <Lock className="size-3" aria-hidden="true" />}
      {TIER_WORD[card.tier]}
    </span>
  )
}

export interface OpportunityCardProps {
  card: OpportunityCardModel
  onToggleCommit: (id: string) => void
  onAskWhy?: (id: string) => void
  onRemove?: (id: string) => void
  /** Replaces the footer (used by the add-your-own draft card). */
  footer?: ReactNode
  badge?: ReactNode
}

export function OpportunityCard({ card, onToggleCommit, onAskWhy, onRemove, footer, badge }: OpportunityCardProps) {
  const locked = !card.committable
  const lockId = `lock-${card.id}`
  // A near deadline stands out only on cards you can still act on.
  const soon = !locked && !card.expired && card.deadline !== '' && card.daysLeft <= SOON_DAYS
  // Lines that say what's missing or what collides are the card's catch.
  const shows = card.reasons.filter((r) => r.startsWith('Your projects show'))
  const catches = card.reasons.filter((r) => !r.startsWith('Your projects show'))
  const variant = locked && !footer ? 'notnow' : TIER_CLASS[card.tier]
  return (
    <article className={`card ${variant} ${card.committed ? 'is-committed' : ''}`} aria-label={card.title}>
      <div className="card-top">
        {badge ?? <TierBadge card={card} />}
        <span className={`mono inline-flex items-center gap-1.5 ${soon ? 'soon' : ''}`}>
          {soon && <Clock className="size-3.5" aria-hidden="true" />}
          {card.deadline ? <>due {shortDate(card.deadline)} · {relativeDays(card.daysLeft)}</> : 'no deadline yet'}
        </span>
      </div>
      <div>
        <h4>
          {card.sourceUrl ? (
            <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5">
              {card.title}<ExternalLink className="mt-1.5 size-3.5 shrink-0 opacity-60" aria-label="(opens organiser page)" />
            </a>
          ) : card.title}
        </h4>
        {card.organization && <span className="org">{card.organization}</span>}
        <p className="hrs"><span className="mono">{card.effortHours > 0 ? `~${formatHours(card.effortHours)} h` : 'effort not given'}</span>{card.effortHours > 0 && ' (estimate)'}</p>
      </div>
      {!locked && shows.length > 0 && <ul className="shows">{shows.map((r) => <li key={r}>{r}</li>)}</ul>}
      {!locked && catches.map((r) => <p key={r} className="catch"><em>Catch</em>{r}</p>)}
      <div className="card-foot">
        {footer ?? (locked ? (
          <>
            <span id={lockId} className="lockwhy">{card.lockReason}</span>
            {onAskWhy && <Button size="sm" variant="ghost" onClick={() => onAskWhy(card.id)} aria-describedby={lockId}>Ask why</Button>}
            {card.userAdded && onRemove && <Button size="sm" variant="ghost" onClick={() => onRemove(card.id)}>Remove</Button>}
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant={card.committed ? 'outline' : 'default'}
              aria-pressed={card.committed}
              onClick={() => onToggleCommit(card.id)}
            >
              {card.committed && <Check aria-hidden="true" />}
              {card.committed ? 'Committed' : 'Commit'}
            </Button>
            {onAskWhy && <Button size="sm" variant="outline" onClick={() => onAskWhy(card.id)}>Ask why</Button>}
            {card.committed && card.startByBucketStart && (
              <span className="startby">Start by week of <span className="mono">{shortDate(card.startByBucketStart)}</span></span>
            )}
            {card.userAdded && onRemove && <Button size="sm" variant="ghost" onClick={() => onRemove(card.id)}>Remove</Button>}
          </>
        ))}
      </div>
    </article>
  )
}
