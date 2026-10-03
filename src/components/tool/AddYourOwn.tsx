import { useState } from 'react'
import { Check, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Opportunity, Tag } from '@/engine/types'
import type { ChecklistItem } from '@/lib/draft-card'
import { humanTag } from '@/lib/exit-reason'
import { TIER_WORD, type OpportunityCardModel } from '@/lib/tool-view'
import { OpportunityCard } from './OpportunityCard'

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
    <section aria-labelledby="add-own" className="space-y-4">
      <div>
        <h2 id="add-own" className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em]">Add your own</h2>
        <p className="mt-1 text-muted-foreground">Found something not on the list? The same rules check it.</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="paste">Paste the opportunity text</Label>
            <textarea
              id="paste"
              rows={3}
              value={text}
              disabled={!pasteOn}
              onChange={(e) => setText(e.target.value)}
              aria-describedby="paste-note"
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-[15px] disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p id="paste-note" className="text-[13px] text-muted-foreground">
              {pasteOn ? 'Fields are pulled from your text; you confirm them below.' : 'Reading pasted text needs the AI extractor, which is off. Fill in manually below.'}
            </p>
            {pasteOn && intakeMode === 'paste' && (
              <Button size="sm" variant="outline" disabled={!text.trim()} onClick={() => onSubmitText?.(text)}>Read it</Button>
            )}
          </div>

          <form onSubmit={submitManual} className="space-y-3" aria-label="Fill in manually">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Fill in manually</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5"><Label htmlFor="ao-title">Title</Label><Input id="ao-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ao-org">Organizer</Label><Input id="ao-org" value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ao-url">Link</Label><Input id="ao-url" type="url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ao-deadline">Deadline</Label><Input id="ao-deadline" type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ao-effort">Hours it takes (estimate)</Label><Input id="ao-effort" type="number" min={0.5} step={0.5} value={f.effort} onChange={(e) => setF({ ...f, effort: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ao-gmin">Lowest grade</Label><Input id="ao-gmin" type="number" min={1} max={12} value={f.gmin} onChange={(e) => setF({ ...f, gmin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ao-gmax">Highest grade</Label><Input id="ao-gmax" type="number" min={1} max={12} value={f.gmax} onChange={(e) => setF({ ...f, gmax: e.target.value })} /></div>
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.online} onChange={(e) => setF({ ...f, online: e.target.checked })} className="size-4 accent-[var(--accent-blue)]" />
                Online, open from anywhere
              </label>
              {!f.online && (
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="ao-region">Where it is held</Label>
                  <Input id="ao-region" placeholder="City, State, Country" aria-describedby="ao-region-note" value={f.region} onChange={(e) => setF({ ...f, region: e.target.value })} />
                  <p id="ao-region-note" className="text-[13px] text-muted-foreground">
                    Checked as an exact match against your profile region{profileRegion ? ` (${profileRegion})` : ''}. Anything else counts as somewhere you can't attend. If people can join from anywhere, tick Online instead.
                  </p>
                </div>
              )}
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">What it asks for</legend>
              <div className="flex flex-wrap gap-2">
                {ASKS_FOR.map((t) => {
                  const on = tags.includes(t)
                  return (
                    <button
                      key={t} type="button" aria-pressed={on}
                      onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])}
                      className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${on ? 'border-fog-2 bg-fog-2 text-ink' : 'border-input text-muted-foreground hover:text-foreground'}`}
                    >{humanTag(t)}</button>
                  )
                })}
              </div>
            </fieldset>
            <Button type="submit" variant="outline">Check it</Button>
          </form>
        </div>

        <div className="space-y-4">
          {draft ? (
            <>
              <OpportunityCard
                card={draft.card}
                onToggleCommit={() => {}}
                badge={
                  <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-fog-2 px-2.5 py-0.5 text-[12px] font-medium uppercase tracking-[0.06em] text-fog-2">
                    Draft{draft.card.deadline && draft.card.effortHours > 0 ? ` · ${TIER_WORD[draft.card.tier]}` : ''}
                  </span>
                }
                footer={
                  <>
                    <Button size="sm" onClick={onAdd} disabled={draft.checklist.some((i) => i.status === 'missing')}>Add to my list</Button>
                    <Button size="sm" variant="ghost" onClick={onDiscard}>Discard</Button>
                    {!draft.card.committable && draft.card.lockReason && <span className="text-[13px] text-muted-foreground">{draft.card.lockReason}</span>}
                  </>
                }
              />
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Registration checklist</h3>
                <ul className="mt-3 space-y-2">
                  {draft.checklist.map((i) => {
                    const Icon = ICON[i.status]
                    return (
                      <li key={i.label} className="flex items-start gap-3 text-[15px]">
                        <Icon className={`mt-1 size-4 shrink-0 ${i.status === 'ok' ? 'text-fog-1' : 'text-muted-foreground'}`} aria-hidden="true" />
                        <span><span className="font-medium">{i.label}</span> <span className="sr-only">({WORD[i.status]})</span><span className="text-muted-foreground">· {i.detail}</span></span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-muted-foreground">Fill in the form and press "Check it" to see the card and what still blocks it.</p>
          )}
        </div>
      </div>
    </section>
  )
}
