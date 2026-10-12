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

const MAX = 30

export function WhatIfPreview({ savedHours, previewHours, dropped, overloadedWeeks, savedNeverOverloads, onPreviewChange, onSave }: WhatIfPreviewProps) {
  const changed = previewHours !== savedHours
  const savedAt = Math.min(100, Math.max(0, (savedHours / MAX) * 100))
  return (
    <section aria-labelledby="whatif" className="whatif">
      <div>
        <h3 id="whatif">What if you had more or less time?</h3>
        <p className={`readout ${changed ? '' : 'unchanged'}`}>{formatHours(previewHours)}<span className="unit">h</span><small>a week</small></p>
        <div className="slider">
          <label htmlFor="whatif-hours">Try a different weekly budget</label>
          <input
            id="whatif-hours"
            type="range"
            min={0}
            max={MAX}
            step={0.5}
            value={previewHours}
            onChange={(e) => onPreviewChange(Number(e.target.value))}
            aria-valuetext={`${formatHours(previewHours)} hours a week`}
            aria-describedby="whatif-scale"
          />
          <div id="whatif-scale" className="ticks">
            <span className="t0" style={{ left: 0 }}>0 h</span>
            {savedHours > 2 && savedHours < MAX - 2 && (
              <span className="saved" style={{ left: `${savedAt}%` }}>saved {formatHours(savedHours)} h</span>
            )}
            <span className="tmax" style={{ left: '100%' }}>{MAX} h</span>
          </div>
        </div>
      </div>
      <div className="wi-panel" role="status" aria-live="polite">
        {!changed ? (
          <p className="calm">
            {savedNeverOverloads
              ? <>At {formatHours(savedHours)} h a week, no combination of what you can commit overloads a week. Drag lower to see where it breaks.</>
              : <>Drag to preview another weekly budget. Nothing changes until you save.</>}
          </p>
        ) : (
          <>
            <div className="wi-actions">
              <Button size="sm" onClick={() => onSave(previewHours)}>Save as my weekly hours</Button>
              <Button size="sm" variant="outline" onClick={() => onPreviewChange(savedHours)}>Reset to {formatHours(savedHours)} h</Button>
            </div>
            <p className="wi-note">Preview only. Nothing changes until you save.</p>
            {dropped.length > 0 ? (
              <p className="warn">
                <b>Can't be done in time at {formatHours(previewHours)} h a week</b> (would be uncommitted if you save): {dropped.map((d) => `${d.title} (${d.reason})`).join('; ')}
              </p>
            ) : (
              <p className="calm">Everything you committed can still be done in time at {formatHours(previewHours)} h a week.</p>
            )}
            {overloadedWeeks.length === 0
              ? <p className="calm">No week has more planned than it can hold.</p>
              : <p className="warn"><b>More planned than the week can hold:</b> {overloadedWeeks.join(', ')}. You would have to work ahead or drop something; {overloadedWeeks.length === 1 ? 'the orange week below says' : 'the orange weeks below say'} what lands there.</p>}
          </>
        )}
      </div>
    </section>
  )
}
