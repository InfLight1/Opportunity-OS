import { useState } from 'react'
import { Check, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Opportunity, Tag } from '@/engine/types'
import type { ChecklistItem } from '@/lib/draft-card'
import { humanTag } from '@/lib/exit-reason'
import { TIER_WORD, type OpportunityCardModel } from '@/lib/tool-view'
import { OpportunityCard } from './OpportunityCard'
import { SectionHeader } from './SectionHeader'

// Seam (DESIGN-BRIEF s6). Paste intake is wired later; while llmAvailable is
// false the paste box is disabled and the manual form is the only path.
export interface AddYourOwnProps {
  draft: { card: OpportunityCardModel; checklist: ChecklistItem[] } | null
  intakeMode?: 'paste' | 'manual'
  llmAvailable?: boolean
  onSubmitText?: (text: string) => void
  onSubmitManual: (fields: Partial<Opportunity>) => void
  onAdd: () => void
  onDiscard: () => void
  /** Shown next to the location field: regions must match exactly. */
  profileRegion?: string
}

const ASKS_FOR: Tag[] = [
  'technical-project', 'portfolio-github', 'competition-experience', 'writing-sample',
  'python', 'computer-vision', 'data-analysis', 'web-dev', 'ai-ml', 'research-writing', 'public-speaking', 'leadership',
]

const ICON = { ok: Check, fail: X, missing: Minus }
const WORD = { ok: 'OK', fail: 'No', missing: 'Missing' }

function Field({ id, label, full = false, children }: { id: string; label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={`field ${full ? 'full' : ''}`}><label htmlFor={id}>{label}</label>{children}</div>
}

export function AddYourOwn({ draft, intakeMode = 'manual', llmAvailable = false, onSubmitText, onSubmitManual, onAdd, onDiscard, profileRegion }: AddYourOwnProps) {
  const [text, setText] = useState('')
  const [f, setF] = useState({ title: '', organization: '', url: '', deadline: '', effort: '', gmin: '', gmax: '', online: true, region: '' })
  const [tags, setTags] = useState<Tag[]>([])
  const pasteOn = llmAvailable && onSubmitText !== undefined
  const n = (v: string) => (v.trim() === '' ? NaN : Number(v))

  function submitManual(e: React.FormEvent) {
    e.preventDefault()
    const gmin = n(f.gmin)
    const gmax = n(f.gmax)
    const effort = n(f.effort)
    onSubmitManual({
      title: f.title,
      organization: f.organization,
      source_url: f.url,
      deadline: f.deadline,
      effort_hours: Number.isFinite(effort) ? effort : undefined,
      grade_range: Number.isFinite(gmin) && Number.isFinite(gmax) ? { min: gmin, max: gmax } : undefined,
      location: f.online ? { remote_ok: true, region: null } : { remote_ok: false, region: f.region },
      required_tags: tags,
    })
  }

  return (
    <section id="add-section" aria-labelledby="add-own" className="psec">
      <div className="wrap">
        <SectionHeader id="add-own" eyebrow="Your list" title="Add your own" description="Found something not on the list? The same rules check it before it joins your plan." />
        <div className="add">
          <div>
            <div className="field">
              <label htmlFor="paste">Paste the opportunity text</label>
              <textarea id="paste" value={text} disabled={!pasteOn} onChange={(e) => setText(e.target.value)} aria-describedby="paste-note" />
              <p id="paste-note" className={`help ${pasteOn ? '' : 'off'}`}>
                {pasteOn ? 'Fields are pulled from your text; you confirm them below.' : 'Reading pasted text needs the AI extractor, which is off. Fill in manually below.'}
              </p>
              {pasteOn && intakeMode === 'paste' && (
                <div><Button size="sm" variant="outline" disabled={!text.trim()} onClick={() => onSubmitText?.(text)}>Read it</Button></div>
              )}
            </div>

            <form onSubmit={submitManual} className="manual" aria-label="Fill in manually">
              <span className="fs-label">Fill in manually</span>
              <div className="grid-f">
                <Field id="ao-title" label="Title" full><input id="ao-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
                <Field id="ao-org" label="Organizer"><input id="ao-org" value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} /></Field>
                <Field id="ao-url" label="Link"><input id="ao-url" type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
                <Field id="ao-deadline" label="Deadline"><input id="ao-deadline" type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
                <Field id="ao-effort" label="Hours it takes (estimate)"><input id="ao-effort" type="number" min={0.5} step={0.5} inputMode="decimal" value={f.effort} onChange={(e) => setF({ ...f, effort: e.target.value })} /></Field>
                <Field id="ao-gmin" label="Lowest grade"><input id="ao-gmin" type="number" min={1} max={12} inputMode="numeric" value={f.gmin} onChange={(e) => setF({ ...f, gmin: e.target.value })} /></Field>
                <Field id="ao-gmax" label="Highest grade"><input id="ao-gmax" type="number" min={1} max={12} inputMode="numeric" value={f.gmax} onChange={(e) => setF({ ...f, gmax: e.target.value })} /></Field>
                <div className="full">
                  <label className="check"><input type="checkbox" checked={f.online} onChange={(e) => setF({ ...f, online: e.target.checked })} />Online, open from anywhere</label>
                </div>
                {!f.online && (
                  <div className="field full">
                    <label htmlFor="ao-region">Where it is held</label>
                    <input id="ao-region" placeholder="City, State, Country" aria-describedby="ao-region-note" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />
                    <p id="ao-region-note" className="help">
                      Checked as an exact match against your profile region{profileRegion ? ` (${profileRegion})` : ''}. Anything else counts as somewhere you can't attend. If people can join from anywhere, tick Online instead.
                    </p>
                  </div>
                )}
                <fieldset className="full" style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="fs-label">What it asks for</legend>
                  <div className="tagpick">
                    {ASKS_FOR.map((t) => {
                      const on = tags.includes(t)
                      return (
                        <button key={t} type="button" aria-pressed={on} className="pill-toggle" onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}>
                          {humanTag(t)}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
                <div className="full"><Button type="submit">Check it</Button></div>
              </div>
            </form>
          </div>

          <div className={`result ${draft ? 'filled' : ''}`}>
            {draft ? (
              <>
                <OpportunityCard
                  card={draft.card}
                  onToggleCommit={() => {}}
                  badge={<span className="tierword draft">Draft{draft.card.deadline && draft.card.effortHours > 0 ? ` · ${TIER_WORD[draft.card.tier]}` : ''}</span>}
                  footer={
                    <>
                      <Button size="sm" onClick={onAdd} disabled={draft.checklist.some((i) => i.status === 'missing')}>Add to my list</Button>
                      <Button size="sm" variant="ghost" onClick={onDiscard}>Discard</Button>
                      {!draft.card.committable && draft.card.lockReason && <span className="lockwhy">{draft.card.lockReason}</span>}
                    </>
                  }
                />
                <div>
                  <h3 className="fs-label" style={{ color: 'var(--nr-blue-hi)' }}>Registration checklist</h3>
                  <ul className="checklist">
                    {draft.checklist.map((i) => {
                      const Icon = ICON[i.status]
                      return (
                        <li key={i.label}>
                          <Icon className={`mt-1 size-4 shrink-0 ${i.status === 'ok' ? 'ok' : 'bad'}`} aria-hidden="true" />
                          <span><span className="font-medium">{i.label}</span> <span className="sr-only">({WORD[i.status]})</span><span className="text-[var(--nr-muted)]">· {i.detail}</span></span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="ghost-route" aria-hidden="true" />
                <p>Fill in the form and press "Check it" to see the card and what still blocks it.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
