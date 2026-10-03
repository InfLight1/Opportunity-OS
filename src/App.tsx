import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { SkillTag, ExperienceTag, InterestTag, BusyPeriod, Plan as EnginePlan, Asset, Tag, Opportunity } from '@/engine/types'
import { fixtureProfile } from '@/engine/fixtures'
import opportunitiesData from '@/data/opportunities.json'
import { runEngine as engineRunEngine, type ProfileInput } from '@/engine/run-engine'
import { buildPlanView, type PlanRow } from './lib/plan-view'
import { buildReuseView } from './lib/reuse-view'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'

interface ProjectData {
  id: string
  title: string
  description: string
  tags: Tag[]
}

function emptyProject(): ProjectData {
  return { id: String(Date.now()), title: '', description: '', tags: [] }
}

function emptyFormData(): ProfileFormData {
  return {
    name: '',
    grade: 0,
    region: '',
    interests: [],
    skills: [],
    projects: [emptyProject()],
    weekly_capacity_hours: 0,
    busy_weeks: [{ start: '', end: '', label: '' }],
  }
}

interface ProfileFormData {
  name: string
  grade: number
  region: string
  interests: InterestTag[]
  skills: SkillTag[]
  projects: ProjectData[]
  weekly_capacity_hours: number
  busy_weeks: BusyPeriod[]
}

const STORAGE_KEY = 'opportunity-os:profile'

function loadFormData(): ProfileFormData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object') return null
    const p = parsed as Record<string, unknown>
    const def = emptyFormData()
    const normalizeStringOrEmpty = (v: unknown) => (typeof v === 'string' ? v : '')
    const normalizeProjects =(): ProjectData[] => {
      const raw = p.projects
      if (!Array.isArray(raw)) return [emptyProject()]
      const result: ProjectData[] = []
      for (const item of raw) {
        if (item === null || typeof item !== 'object') continue
        const obj = item as Record<string, unknown>
        let id: string
        if (typeof obj.id === 'string' && obj.id) id = obj.id
        else id = emptyProject().id
        const title = normalizeStringOrEmpty(obj.title)
        const description = normalizeStringOrEmpty(obj.description)
        let tags: Tag[]
        if (Array.isArray(obj.tags)) {
          tags = []
          for (const t of obj.tags as unknown[]) {
            if (typeof t === 'string') tags = [...tags, t]
          }
        } else {
          tags = []
        }
        result = [...result, { id, title, description, tags }]
      }
      if (result.length === 0) return [emptyProject()]
      return result
    }
    const normalizeBusyWeeks = (): BusyPeriod[] => {
      const raw = p.busy_weeks
      if (!Array.isArray(raw)) return def.busy_weeks
      const result: BusyPeriod[] = []
      for (const item of raw) {
        if (item === null || typeof item !== 'object') continue
        const obj = item as Record<string, unknown>
        const bw: BusyPeriod = {
          start: normalizeStringOrEmpty(obj.start),
          end: normalizeStringOrEmpty(obj.end),
          label: normalizeStringOrEmpty(obj.label),
        }
        result = [...result, bw]
      }
      return result
    }
    const normalizeTagArray = <T extends string>(raw: unknown): T[] => {
      if (!Array.isArray(raw)) return []
      const result: T[] = []
      for (const item of raw as unknown[]) {
        if (typeof item === 'string') result = [...result, item]
      }
      return result
    }
    const merged: ProfileFormData = {
      name: typeof p.name === 'string' ? p.name : def.name,
      grade: typeof p.grade === 'number' ? p.grade : def.grade,
      region: typeof p.region === 'string' ? p.region : def.region,
      interests: normalizeTagArray<InterestTag>(p.interests),
      skills: normalizeTagArray<SkillTag>(p.skills),
      projects: normalizeProjects(),
      weekly_capacity_hours: typeof p.weekly_capacity_hours === 'number' ? p.weekly_capacity_hours : def.weekly_capacity_hours,
      busy_weeks: normalizeBusyWeeks(),
    }
    return merged
  } catch {
    return null
  }
}

const OPPORTUNITIES = opportunitiesData as unknown as Opportunity[]

const SKILL_OPTIONS: { value: SkillTag; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'computer-vision', label: 'Computer Vision' },
  { value: 'data-analysis', label: 'Data Analysis' },
  { value: 'web-dev', label: 'Web Dev' },
  { value: 'ai-ml', label: 'AI/ML' },
  { value: 'research-writing', label: 'Research Writing' },
  { value: 'public-speaking', label: 'Public Speaking' },
  { value: 'leadership', label: 'Leadership' },
]

const EXPERIENCE_OPTIONS: { value: ExperienceTag; label: string }[] = [
  { value: 'technical-project', label: 'Technical Project' },
  { value: 'competition-experience', label: 'Competition Experience' },
  { value: 'portfolio-github', label: 'Portfolio/GitHub' },
  { value: 'writing-sample', label: 'Writing Sample' },
]

const INTEREST_OPTIONS: { value: InterestTag; label: string }[] = [
  { value: 'ai-interest', label: 'AI Interest' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'stem-general', label: 'STEM General' },
  { value: 'social-impact', label: 'Social Impact' },
]

function fixtureToFormData(fixture: typeof fixtureProfile): ProfileFormData {
  const projects = fixture.assets.map((a) => ({ id: a.id, title: a.title, description: a.description, tags: [...(a.tags ?? [])] }))
  return {
    name: fixture.name,
    grade: fixture.grade,
    region: fixture.region,
    interests: [...fixture.interests],
    skills: [...fixture.skills],
    projects,
    weekly_capacity_hours: fixture.weekly_capacity_hours,
    busy_weeks: fixture.busy_weeks.map((bw) => ({ ...bw })),
  }
}

function assetsFromProfile(form: ProfileFormData): Asset[] {
  return form.projects
    .filter((p) => p.title.trim())
    .map((p) => ({ id: p.id, title: p.title, description: p.description, kind: 'project', tags: p.tags ?? [], supports: [], reuse_count: 0 }))
}

function buildInput(form: ProfileFormData): ProfileInput {
  const rawAssets = assetsFromProfile(form)
  return {
    name: form.name,
    grade: form.grade,
    region: form.region,
    interests: form.interests,
    skills: form.skills,
    assets: rawAssets,
    weekly_capacity_hours: form.weekly_capacity_hours,
    busy_weeks: form.busy_weeks,
  }
}

function runEngine(form: ProfileFormData, today: string): { plan: EnginePlan | null; assets: Asset[] } {
  if (!form.name.trim() || !form.projects.some((p) => p.title.trim())) return { plan: buildEmptyPlan(), assets: [] }
  const input = buildInput(form)
  const result = engineRunEngine(input, OPPORTUNITIES as ReturnType<typeof opportunitiesData>[number][], today)
  return { plan: result.plan, assets: result.assets }
}

function buildEmptyPlan(): EnginePlan {
  return {
    weekly_capacity_hours: 0,
    busy_weeks: [],
    tiered_opportunities: [],
    shared_gaps: [],
    next_action: null,
    weekly_load_warnings: [],
  }
}

function TagMultiCheckbox({ value, tags, onChange }: { value: Tag[]; tags: readonly { value: Tag; label: string }[]; onChange: (next: Tag[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <button
          key={t.value}
          type="button"
          className={`rounded border px-3 py-1 text-sm transition-colors ${value.includes(t.value) ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
          onClick={() => {
            if (value.includes(t.value)) onChange(value.filter((v) => v !== t.value))
            else onChange([...value, t.value])
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function OpportunitiesTab() {
  const [filter, setFilter] = useState('all')
  const opps: Opportunity[] = OPPORTUNITIES
  const types = ['all', ...Array.from(new Set(opps.map((o) => o.type)))]
  const filtered = filter === 'all' ? opps : opps.filter((o) => o.type === filter)

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Opportunities</h2>
        <div className="flex gap-2 flex-wrap">
          {types.map((t) => (
            <Button key={String(t)} variant={filter === t ? 'default' : 'outline'} size="sm" onClick={() => setFilter(String(t))}>
              {t === 'all' ? 'All' : String(t)}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((opp) => (
          <a href={opp.source_url} target="_blank" rel="noopener noreferrer" key={opp.id} className="block">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{opp.title}</CardTitle>
                <CardDescription>{opp.organization} &mdash; {opp.type}</CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <span>Deadline: {opp.deadline}</span>
                <span>{opp.effort_hours}h effort</span>
              </CardFooter>
            </Card>
          </a>
        ))}
      </div>
    </>
  )
}

function PlanTab({ plan, assets }: { plan: EnginePlan; assets: Asset[] }) {
  const rows = buildPlanView(plan)

  function tierColor(tier: string): string {
    if (tier === 'FOCUS') return 'border-l-green-500'
    if (tier === 'CONSIDER') return 'border-l-yellow-400'
    return 'border-l-gray-300'
  }

  function rowBadgeColor(tier: string): string {
    if (tier === 'FOCUS') return 'bg-green-600 text-white'
    if (tier === 'CONSIDER') return 'bg-yellow-500 text-black'
    return 'bg-gray-300 text-gray-700'
  }

  // REUSE section: pursueable vs skipped by buildReuseView
  const reusedCategories = buildReuseView(plan, assets)

  function oppTitleById(id: string): string | undefined {
    for (const t of plan.tiered_opportunities) {
      if (t.opportunity.id === id) return t.opportunity.title
    }
    return undefined
  }

  return (
    <div className="space-y-6">
      {plan.shared_gaps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-700">Shared Gaps</CardTitle>
            <CardDescription>Required tags missing from all assets, appearing in multiple opps.</CardDescription>
          </CardHeader>
          <CardFooter className="pt-1 flex flex-wrap gap-2 pb-3">
            {plan.shared_gaps.map((g) => (
              <span key={g.tag} className="rounded border px-3 py-1 text-sm bg-muted">
                {g.tag} &mdash; affects: {g.affects.join(', ')}
              </span>
            ))}
          </CardFooter>
        </Card>
      )}

      {plan.next_action && (() => {
        const assetTitle = assets.find((a) => a.id === plan.next_action!.asset_id)?.title ?? plan.next_action.asset_id
        const oppEntry = plan.tiered_opportunities.find((t) => t.opportunity.id === plan.next_action!.opportunity_id)
        const oppTitle = oppEntry?.opportunity.title ?? plan.next_action.opportunity_id
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-blue-700">Recommended First Step</CardTitle>
            </CardHeader>
            <CardFooter className="pt-1 pb-3 text-sm">
              Work on: {assetTitle}
              <br />
              Supports: {oppTitle}
            </CardFooter>
          </Card>
        )
      })()}

      {plan.weekly_load_warnings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-600">Weekly load warnings</CardTitle>
            <CardDescription>Weeks where FOCUS effort exceeds capacity.</CardDescription>
          </CardHeader>
          <CardFooter className="pt-1 flex flex-col gap-2 pb-3">
            {plan.weekly_load_warnings.map((w, i) => (
              <div key={i} className="text-sm text-red-600">
                {w.week_start} to {w.week_end}: {w.required_hours}h required vs {w.available_hours}h available
                {w.label ? ` (${w.label})` : ''}
              </div>
            ))}
          </CardFooter>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">FOCUS ({rows.filter(r => r.tier === 'FOCUS').length})</h3>
        <div className="grid gap-3">
          {rows.filter(r => r.tier === 'FOCUS').map((r) => (
            <a href={plan.tiered_opportunities.find(t => t.opportunity.id === r.id)?.opportunity.source_url ?? '#'} target="_blank" rel="noopener noreferrer" key={r.id} className={`block rounded-lg border px-4 py-3 bg-card hover:bg-secondary ${tierColor(r.tier)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.title}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${rowBadgeColor(r.tier)}`} style={{ whiteSpace: 'nowrap' }}>{r.tier}</span>
              </div>
              <p className="text-xs text muted-foreground mt-1">{r.deadline} ~{r.effort_hours}h</p>
              {r.reasons.map((reason, i) => (<p key={i} className="text-xs text-muted-foreground" style={{ whiteSpace: 'pre-wrap' }}>{reason}</p>))}
            </a>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">CONSIDER ({rows.filter(r => r.tier === 'CONSIDER').length})</h3>
        <div className="grid gap-3">
          {rows.filter(r => r.tier === 'CONSIDER').map((r) => (
            <a href={plan.tiered_opportunities.find(t => t.opportunity.id === r.id)?.opportunity.source_url ?? '#'} target="_blank" rel="noopener noreferrer" key={r.id} className={`block rounded-lg border px-4 py-3 bg-card hover:bg-secondary ${tierColor(r.tier)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.title}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${rowBadgeColor(r.tier)}`} style={{ whiteSpace: 'nowrap' }}>{r.tier}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{r.deadline} ~{r.effort_hours}h</p>
              {r.reasons.map((reason, i) => (<p key={i} className="text-xs text-muted-foreground" style={{ whiteSpace: 'pre-wrap' }}>{reason}</p>))}
            </a>
          ))}
        </div>
      </div>

      {reusedCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-700">Reuse</CardTitle>
            <CardDescription>Your assets and the opportunities they support.</CardDescription>
          </CardHeader>
          <CardFooter className="pt-1 flex flex-col gap-2 pb-3">
            {reusedCategories.map((r) => (
              <div key={r.asset_id} className="text-sm">
                <strong>{r.asset_title}</strong>:{' '}
                {r.pursueable.length > 0 && (
                  <span>
                    pursue: <span className="text-green-700">{r.pursueable.map((sid) => oppTitleById(sid) ?? sid).join(', ')}</span>{' '}
                  </span>
                )}
                {r.skipped.length > 0 && (
                  <span>
                    skipped: <span className="text-muted-foreground">{r.skipped.map((sid) => oppTitleById(sid) ?? sid).join(', ')}</span>
                  </span>
                )}
              </div>
            ))}
          </CardFooter>
        </Card>
      )}

      <details>
        <summary className="cursor-pointer text-sm text-muted-foreground">SKIP ({rows.filter(r => r.tier === 'SKIP').length})</summary>
        {rows.filter(r => r.tier === 'SKIP').map((r) => (
          <span key={r.id} className="block text-xs py-1 pl-2">{r.title}{r.reasons.length > 0 ? ` — ${r.reasons[0]}` : ''}</span>
        ))}
      </details>
    </div>
  )
}

function ProfileTab({ onRun, formData, setFormData }: { onRun: () => void; formData: ProfileFormData; setFormData: (f: ProfileFormData) => void }) {
  const handleDemo = () => setFormData(fixtureToFormData(fixtureProfile))
  const handleChange = (next: ProfileFormData) => setFormData(next)

  const projects = [...formData.projects]

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profile</h2>
        <Button variant="outline" size="sm" onClick={handleDemo}>Load demo profile</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5">
          <Label>Name</Label>
          <Input type="text" value={formData.name} placeholder="Your name" onChange={(e) => handleChange({ ...formData, name: e.target.value })} />
        </label>
        <label className="space-y-1.5">
          <Label>Grade</Label>
          <Input type="number" min={1} max={12} value={formData.grade} placeholder="e.g. 10" onChange={(e) => handleChange({ ...formData, grade: e.target.value === '' ? 0 : Number(e.target.value) })} />
        </label>
        <label className="space-y-1.5">
          <Label>Region</Label>
          <Input type="text" value={formData.region} placeholder="e.g. IE-D" onChange={(e) => handleChange({ ...formData, region: e.target.value })} />
        </label>
      </div>

      <div className="space-y-1.5">
        <Label>Weekly capacity (hours)</Label>
        <Input type="number" min={0} max={168} value={formData.weekly_capacity_hours} step={0.5} placeholder="e.g. 8" onChange={(e) => handleChange({ ...formData, weekly_capacity_hours: e.target.value === '' ? 0 : Number(e.target.value) })} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-2 block">Skills (checkboxes only — Evidence rule)</legend>
        <div className="-m-2">
          {SKILL_OPTIONS.map((s) => (
            <label key={s.value} className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary has-not-aria-checked:border-primary has-not-aria-checked:text-primary m-2">
              <Checkbox checked={formData.skills.includes(s.value)} onCheckedChange={(next) => {
                if (next) handleChange({ ...formData, skills: [...formData.skills, s.value] })
                else handleChange({ ...formData, skills: formData.skills.filter((sk) => sk !== s.value) })
              }} />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-2 block">Interests (helpful_tags only)</legend>
        <div className="-m-2">
          {INTEREST_OPTIONS.map((i) => (
            <label key={i.value} className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-sm transition-colors hover:bg-secondary m-2">
              <Checkbox checked={formData.interests.includes(i.value)} onCheckedChange={(next) => {
                if (next) handleChange({ ...formData, interests: [...formData.interests, i.value] })
                else handleChange({ ...formData, interests: formData.interests.filter((t) => t !== i.value) })
              }} />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-2 block">Busy Weeks</legend>
        <div className="space-y-2">
          {formData.busy_weeks.map((week, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap">
              <Input type="text" placeholder="Start (YYYY-MM-DD)" value={week.start || ''} onChange={(e) => { const updated = [...formData.busy_weeks]; updated[i] = { ...updated[i], start: e.target.value }; handleChange({ ...formData, busy_weeks: updated }) }} className="flex-1 min-w-[140px]" />
              <span className="text-muted-foreground whitespace-nowrap">to</span>
              <Input type="text" placeholder="End (YYYY-MM-DD)" value={week.end || ''} onChange={(e) => { const updated = [...formData.busy_weeks]; updated[i] = { ...updated[i], end: e.target.value }; handleChange({ ...formData, busy_weeks: updated }) }} className="flex-1 min-w-[140px]" />
              <Input type="text" placeholder="Label (optional)" value={week.label || ''} className="w-40 shrink-0" onChange={(e) => { const updated = [...formData.busy_weeks]; updated[i] = { ...updated[i], label: e.target.value }; handleChange({ ...formData, busy_weeks: updated }) }} />
              <Button variant="ghost" size="sm" onClick={() => handleChange({ ...formData, busy_weeks: formData.busy_weeks.filter((_, j) => j !== i) })} type="button">Remove</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleChange({ ...formData, busy_weeks: [...formData.busy_weeks, { start: '', end: '', label: '' }] })}>+ Add busy week</Button>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-2 block">Projects (assets — tags satisfy Evidence rule)</legend>
        <div className="space-y-3">
          {projects.map((p, i) => (
            <Card key={p.id || i} className="relative">
              <div className="absolute top-2 right-2">
                <Button variant="ghost" size="sm" onClick={() => handleChange({ ...formData, projects: formData.projects.filter((_, j) => j !== i) })} type="button">Remove</Button>
              </div>
              <CardHeader className="pb-1 pt-6">
                <Input type="text" placeholder="Project title" value={p.title} onChange={(e) => { const updated = [...formData.projects]; updated[i] = { ...updated[i], title: e.target.value }; handleChange({ ...formData, projects: updated }) }} className="font-medium" />
              </CardHeader>
              <CardDescription className="px-4">
                <Input type="text" placeholder="Description" value={p.description} onChange={(e) => { const updated = [...formData.projects]; updated[i] = { ...updated[i], description: e.target.value }; handleChange({ ...formData, projects: updated }) }} />
              </CardDescription>
              <CardFooter className="pt-1">
                <Label className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Asset tags:</Label>
                <TagMultiCheckbox value={p.tags} tags={EXPERIENCE_OPTIONS.concat(SKILL_OPTIONS)} onChange={(next) => { const updated = [...formData.projects]; updated[i] = { ...updated[i], tags: next }; handleChange({ ...formData, projects: updated }) }} />
              </CardFooter>
            </Card>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleChange({ ...formData, projects: [...formData.projects, emptyProject()] })}>+ Add project</Button>
        </div>
      </fieldset>

      <div className="flex justify-end mt-4">
        <Button onClick={onRun}>Generate Plan</Button>
      </div>
    </>
  )
}

function Checkbox({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (next: boolean) => void }) {
  return (
    <input type="checkbox" className="size-[18px] shrink-0 rounded border-input text-primary focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
  )
}

export function App() {
  const [currentTab, setCurrentTab] = useState('profile')
  const [planData, setPlanData] = useState<EnginePlan | null>(null)
  const [assetsData, setAssetsData] = useState<Asset[]>([])
  const [formData, setFormData] = useState<ProfileFormData>(() => loadFormData() ?? emptyFormData())

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)) } catch { /* storage full or unavailable */ }
  }, [formData])

  const handleGenerate = () => {
    if (!formData.name.trim() || !formData.projects.some((p) => p.title.trim())) {
      setCurrentTab('profile')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    const result = runEngine(formData, today)
    if (result.plan) { setPlanData(result.plan); setAssetsData(result.assets); setCurrentTab('plan') } else { setCurrentTab('profile') }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 relative z-10">
          <h1 className="text-xl font-bold">Opportunity OS</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="plan">Plan</TabsTrigger>
          </TabsList>

          <div className="mt-6 rounded-lg border border-border bg-card p-6">
            <TabsContent value="profile" className="mt-0 space-y-4">
              {<ProfileTab onRun={handleGenerate} formData={formData} setFormData={setFormData} />}
            </TabsContent>

            <TabsContent value="opportunities" className="mt-0"><OpportunitiesTab /></TabsContent>

            <TabsContent value="plan" className="mt-0 space-y-4">
              {planData ? (
                <PlanTab plan={planData} assets={assetsData} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  <p>No plan yet.</p>
                  <Button variant="outline" onClick={() => setCurrentTab('profile')}>Fill profile and generate</Button>
                </div>
              )}</TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

export default App
