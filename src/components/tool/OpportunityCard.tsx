import { Check, ExternalLink, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { shortDate } from '@/lib/exit-reason'
import { formatHours, relativeDays, TIER_WORD, type OpportunityCardModel } from '@/lib/tool-view'

const BADGE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium uppercase tracking-[0.06em]'

export function TierBadge({ card }: { card: Pick<OpportunityCardModel, 'tier' | 'expired'> }) {
  if (card.expired) return <span className={`${BADGE} border border-border text-muted-foreground`}><Lock className="size-3" aria-hidden="true" />Closed</span>
  if (card.tier === 'FOCUS') return <span className={`${BADGE} bg-fog-1 text-ink`}>{TIER_WORD.FOCUS}</span>
  if (card.tier === 'CONSIDER') return <span className={`${BADGE} border border-fog-2 text-fog-2`}>{TIER_WORD.CONSIDER}</span>
  return <span className={`${BADGE} border border-border text-muted-foreground`}><Lock className="size-3" aria-hidden="true" />{TIER_WORD.SKIP}</span>
}

export interface OpportunityCardProps {
  card: OpportunityCardModel
  onToggleCommit: (id: string) => void
  onAskWhy?: (id: string) => void
  /** Replaces the footer (used by the add-your-own draft card). */
  footer?: ReactNode
  badge?: ReactNode
}

export function OpportunityCard({ card, onToggleCommit, onAskWhy, footer, badge }: OpportunityCardProps) {
  const locked = !card.committable
  const lockId = `lock-${card.id}`
  return (
    <article
      className={[
        'flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors duration-200',
        card.committed ? 'border-fog-2' : 'border-border',
        locked ? 'text-muted-foreground' : '',
      ].join(' ')}
      aria-label={card.title}
    >
      <div className="flex items-center justify-between gap-3 text-[13px] tabular-nums">
        {badge ?? <TierBadge card={card} />}
        <span className="text-muted-foreground">
          {card.deadline ? <>due {shortDate(card.deadline)} · {relativeDays(card.daysLeft)}</> : 'no deadline yet'}
        </span>
      </div>
      <div>
        <h3 className={`text-[18px] font-semibold leading-[1.3] ${locked ? 'text-muted-foreground' : 'text-foreground'}`}>
          {card.sourceUrl ? (
            <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 hover:underline">
              {card.title}<ExternalLink className="mt-1 size-3.5 shrink-0 text-muted-foreground" aria-label="(opens organiser page)" />
            </a>
          ) : card.title}
        </h3>
        {card.organization && <p className="text-[13px] text-muted-foreground">{card.organization}</p>}
        <p className="mt-1 text-[13px] text-muted-foreground tabular-nums">
          {card.effortHours > 0 ? `~${formatHours(card.effortHours)} h (estimate)` : 'effort not given'}
        </p>
      </div>
      {!locked && card.reasons.length > 0 && (
        <ul className="space-y-1 text-[15px] text-muted-foreground">
          {card.reasons.slice(0, 3).map((r) => <li key={r}>{r}</li>)}
        </ul>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {footer ?? (locked ? (
          <>
            <Button size="sm" variant="outline" disabled aria-describedby={lockId}>
              <Lock aria-hidden="true" />Commit
            </Button>
            <span id={lockId} className="text-[13px] text-muted-foreground">{card.lockReason}</span>
            {onAskWhy && <Button size="sm" variant="ghost" onClick={() => onAskWhy(card.id)}>Ask why</Button>}
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant={card.committed ? 'outline' : 'default'}
              aria-pressed={card.committed}
              onClick={() => onToggleCommit(card.id)}
              className={card.committed ? 'border-accent-blue' : ''}
            >
              {card.committed && <Check aria-hidden="true" />}
              {card.committed ? 'Committed' : 'Commit'}
            </Button>
            {onAskWhy && <Button size="sm" variant="ghost" onClick={() => onAskWhy(card.id)}>Ask why</Button>}
            {card.committed && card.startByBucketStart && (
              <span className="text-[13px] text-muted-foreground tabular-nums">Start by week of {shortDate(card.startByBucketStart)}</span>
            )}
          </>
        ))}
      </div>
    </article>
  )
}
