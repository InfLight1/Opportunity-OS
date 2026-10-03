import { Button } from '@/components/ui/button'
import { formatHours } from '@/lib/tool-view'

export interface WhatIfPreviewProps {
  savedHours: number
  previewHours: number
  dropped: { id: string; title: string; reason: string }[]
  overloadedWeeks: string[]
  savedNeverOverloads: boolean | null
  onPreviewChange: (hours: number) => void
  onSave: (hours: number) => void
}

export function WhatIfPreview({ savedHours, previewHours, dropped, overloadedWeeks, savedNeverOverloads, onPreviewChange, onSave }: WhatIfPreviewProps) {
  const changed = previewHours !== savedHours
  return (
    <section aria-labelledby="whatif" className="space-y-4 rounded-xl border border-border bg-card p-5">
      <h2 id="whatif" className="text-[18px] font-semibold">What if you had more or less time?</h2>
      {savedNeverOverloads && (
        <p className="max-w-[68ch] text-[15px] text-muted-foreground">
          At {formatHours(savedHours)} h a week, no combination of what you can commit overloads a week. Drag lower to see where it breaks.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor="whatif-hours" className="text-[15px]">Try a different weekly budget</label>
        <input
          id="whatif-hours"
          type="range"
          min={0}
          max={30}
          step={0.5}
          value={previewHours}
          onChange={(e) => onPreviewChange(Number(e.target.value))}
          className="w-72 accent-[var(--accent-blue)]"
          aria-valuetext={`${formatHours(previewHours)} hours a week`}
        />
        <span className="w-20 text-[15px] font-semibold tabular-nums">{formatHours(previewHours)} h</span>
        {changed && (
          <>
            <Button size="sm" onClick={() => onSave(previewHours)}>Save as my weekly hours</Button>
            <Button size="sm" variant="ghost" onClick={() => onPreviewChange(savedHours)}>Reset to {formatHours(savedHours)} h</Button>
          </>
        )}
      </div>
      {changed && (
        <div className="space-y-1 text-[15px]" role="status" aria-live="polite">
          <p className="text-[13px] text-muted-foreground">Preview only. Nothing changes until you save.</p>
          {dropped.length > 0 ? (
            <p>
              <span className="font-medium">Can't be done in time at {formatHours(previewHours)} h a week</span>
              <span className="text-muted-foreground"> (would be uncommitted if you save): </span>
              {dropped.map((d) => `${d.title} (${d.reason})`).join('; ')}
            </p>
          ) : (
            <p>Everything you committed can still be done in time at {formatHours(previewHours)} h a week.</p>
          )}
          <p>
            {overloadedWeeks.length === 0
              ? 'No week has more planned than it can hold.'
              : <><span className="font-medium">More planned than the week can hold:</span> {overloadedWeeks.join(', ')}. You would have to work ahead or drop something; {overloadedWeeks.length === 1 ? 'the red week below says' : 'the red weeks below say'} what lands there.</>}
          </p>
        </div>
      )}
    </section>
  )
}
