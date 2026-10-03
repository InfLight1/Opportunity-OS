import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExperienceTag, InterestTag, SkillTag, Tag } from '@/engine/types'
import { emptyProject, type ProfileFormData } from '@/form-data'

const SKILL_OPTIONS: { value: SkillTag; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'computer-vision', label: 'Computer vision' },
  { value: 'data-analysis', label: 'Data analysis' },
  { value: 'web-dev', label: 'Web dev' },
  { value: 'ai-ml', label: 'AI/ML' },
  { value: 'research-writing', label: 'Research writing' },
  { value: 'public-speaking', label: 'Public speaking' },
  { value: 'leadership', label: 'Leadership' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceTag; label: string }[] = [
  { value: 'technical-project', label: 'Technical project' },
  { value: 'competition-experience', label: 'Competition experience' },
  { value: 'portfolio-github', label: 'Portfolio/GitHub' },
  { value: 'writing-sample', label: 'Writing sample' },
]

const INTEREST_OPTIONS: { value: InterestTag; label: string }[] = [
  { value: 'ai-interest', label: 'AI' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'stem-general', label: 'STEM' },
  { value: 'social-impact', label: 'Social impact' },
]

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function Chips<T extends Tag>({ value, options, onChange, label }: { value: T[]; options: { value: T; label: string }[]; onChange: (next: T[]) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(toggle(value, o.value))}
            className={`rounded-full border px-3 py-1 text-[13px] transition-colors ${on ? 'border-fog-2 bg-fog-2 text-ink' : 'border-input text-muted-foreground hover:text-foreground'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// Remount (new key) on each open so the draft starts from the saved profile.
export interface ProfileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ProfileFormData
  onSave: (next: ProfileFormData) => void
  demoData: ProfileFormData
}

export function ProfileDrawer({ open, onOpenChange, formData, onSave, demoData }: ProfileDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState(formData)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const set = (patch: Partial<ProfileFormData>) => setDraft((f) => ({ ...f, ...patch }))
  const num = (v: string) => (v === '' ? 0 : Number(v))

  return (
    <dialog
      ref={ref}
      aria-labelledby="profile-title"
      onClose={() => onOpenChange(false)}
      onClick={(e) => { if (e.target === ref.current) onOpenChange(false) }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-full max-h-none w-[440px] max-w-full border-l border-border bg-popover p-0 text-foreground backdrop:bg-black/60"
    >
      <form
        className="flex h-full flex-col"
        onSubmit={(e) => { e.preventDefault(); onSave(draft); onOpenChange(false) }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="profile-title" className="text-[18px] font-semibold">Profile</h2>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close profile" onClick={() => onOpenChange(false)}><X /></Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <Button type="button" variant="outline" size="sm" onClick={() => setDraft(demoData)}>Load demo profile</Button>

          <div className="grid grid-cols-[1fr_88px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-name">Name</Label>
              <Input id="pf-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-grade">Grade</Label>
              <Input id="pf-grade" type="number" min={1} max={12} value={draft.grade} onChange={(e) => set({ grade: num(e.target.value) })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-region">Region</Label>
            <Input id="pf-region" value={draft.region} placeholder="e.g. Dublin, CA, US" onChange={(e) => set({ region: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-hours">Hours you can spend each week</Label>
            <Input id="pf-hours" type="number" min={0} max={168} step={0.5} value={draft.weekly_capacity_hours} onChange={(e) => set({ weekly_capacity_hours: num(e.target.value) })} />
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Projects you've built</legend>
            <p className="text-[13px] text-muted-foreground">Projects are what count as proof.</p>
            {draft.projects.map((p, i) => (
              <div key={p.id || i} className="space-y-2 rounded-xl border border-border bg-card p-3">
                <div className="flex gap-2">
                  <Input aria-label="Project title" placeholder="Project title" value={p.title} onChange={(e) => set({ projects: draft.projects.map((q, j) => (j === i ? { ...q, title: e.target.value } : q)) })} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => set({ projects: draft.projects.filter((_, j) => j !== i) })}>Remove</Button>
                </div>
                <Input aria-label="Project description" placeholder="Description" value={p.description} onChange={(e) => set({ projects: draft.projects.map((q, j) => (j === i ? { ...q, description: e.target.value } : q)) })} />
                <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-muted-foreground">What this project shows</p>
                <Chips<Tag>
                  label={`What ${p.title || 'this project'} shows`}
                  value={p.tags}
                  options={[...EXPERIENCE_OPTIONS, ...SKILL_OPTIONS]}
                  onChange={(next) => set({ projects: draft.projects.map((q, j) => (j === i ? { ...q, tags: next } : q)) })}
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ projects: [...draft.projects, emptyProject()] })}>+ Add project</Button>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Skills</legend>
            <Chips<SkillTag> label="Skills" value={draft.skills} options={SKILL_OPTIONS} onChange={(next) => set({ skills: next })} />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Interests</legend>
            <Chips<InterestTag> label="Interests" value={draft.interests} options={INTEREST_OPTIONS} onChange={(next) => set({ interests: next })} />
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Busy periods (exams, travel)</legend>
            {draft.busy_weeks.map((w, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr] gap-2 rounded-xl border border-border bg-card p-3">
                <Input aria-label="Busy from" type="date" value={w.start || ''} onChange={(e) => set({ busy_weeks: draft.busy_weeks.map((b, j) => (j === i ? { ...b, start: e.target.value } : b)) })} />
                <Input aria-label="Busy until" type="date" value={w.end || ''} onChange={(e) => set({ busy_weeks: draft.busy_weeks.map((b, j) => (j === i ? { ...b, end: e.target.value } : b)) })} />
                <Input aria-label="Label" placeholder="Label, e.g. Midterms" value={w.label || ''} onChange={(e) => set({ busy_weeks: draft.busy_weeks.map((b, j) => (j === i ? { ...b, label: e.target.value } : b)) })} />
                <Button type="button" variant="ghost" size="sm" onClick={() => set({ busy_weeks: draft.busy_weeks.filter((_, j) => j !== i) })}>Remove</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => set({ busy_weeks: [...draft.busy_weeks, { start: '', end: '', label: '' }] })}>+ Add busy period</Button>
          </fieldset>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit">Save profile</Button>
        </div>
      </form>
    </dialog>
  )
}
