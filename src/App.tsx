import { useEffect, useMemo, useState } from 'react'
import type { CommitState, Opportunity } from '@/engine/types'
import { buildSchedule } from '@/engine/schedule'
import { loadFormData, saveFormData, type ProfileFormData } from '@/form-data'
import { fixtureProfile } from '@/engine/fixtures'
import opportunitiesData from '@/data/opportunities.json'
import { autoUncommit, committedOpportunities, droppedCommits, loadCommitState, saveCommitState, toggleCommit } from '@/lib/commit-state'
import { planForForm, profileToFormData } from '@/lib/profile-model'
import { buildCards, buildThisWeek, buildTimeline, cardLockReason, nextActionText, type ToolProfile } from '@/lib/tool-view'
import { buildReuseWeb } from '@/lib/reuse-web'
import { anyCombinationOverloads } from '@/lib/what-if'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { buildStoryData } from '@/lib/story-data'
import { Story } from '@/components/story/Story'
import { buildDraft } from '@/lib/draft-card'
import { askWhyTemplate } from '@/lib/ask-why-template'
import { AddYourOwn } from '@/components/tool/AddYourOwn'
import { AskWhy } from '@/components/tool/AskWhy'
import { Header } from '@/components/tool/Header'
import { ThisWeekStrip } from '@/components/tool/ThisWeekStrip'
import { OpportunityList } from '@/components/tool/OpportunityList'
import { WeeksTimeline } from '@/components/tool/WeeksTimeline'
import { ProfileDrawer } from '@/components/tool/ProfileDrawer'
import { Notice, type NoticeProps } from '@/components/tool/Notice'
import { ReuseWeb } from '@/components/tool/ReuseWeb'
import { WhatIfPreview } from '@/components/tool/WhatIfPreview'

const OPPORTUNITIES = opportunitiesData as unknown as Opportunity[]
const KNOWN_IDS = OPPORTUNITIES.map((o) => o.id)
const DEMO_FORM = profileToFormData(fixtureProfile)

type Mode = 'story' | 'tool'

/** Local calendar date as ISO (not UTC). */
function localToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function readMode(): Mode {
  return new URLSearchParams(window.location.search).get('mode') === 'tool' ? 'tool' : 'story'
}

export function App() {
  const [today] = useState(localToday)
  const [mode, setMode] = useState<Mode>(readMode)
  const [formData, setFormData] = useState<ProfileFormData>(() => loadFormData() ?? DEMO_FORM)
  const [commits, setCommits] = useState<CommitState>(() => loadCommitState(localStorage, KNOWN_IDS))
  const [notice, setNotice] = useState<Omit<NoticeProps, 'onDismiss'> | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileKey, setProfileKey] = useState(0)
  const [previewHours, setPreviewHours] = useState<number | null>(null)
  const reducedMotion = useReducedMotion()
  // Added opportunities live for this session only (no new storage key).
  const [userOpps, setUserOpps] = useState<Opportunity[]>([])
  const [draftFields, setDraftFields] = useState<Partial<Opportunity> | null>(null)
  const [askWhyId, setAskWhyId] = useState<string | null>(null)
  const allOpps = useMemo(() => [...OPPORTUNITIES, ...userOpps], [userOpps])
  const TITLES: Record<string, string> = useMemo(() => Object.fromEntries(allOpps.map((o) => [o.id, o.title])), [allOpps])
  const DEADLINES: Record<string, string> = useMemo(() => Object.fromEntries(allOpps.map((o) => [o.id, o.deadline])), [allOpps])

  useEffect(() => { saveFormData(formData) }, [formData])
  useEffect(() => { saveCommitState(localStorage, commits) }, [commits])

  const { plan, assets } = useMemo(() => planForForm(formData, allOpps, today), [formData, allOpps, today])
  const tiered = plan.tiered_opportunities
  const profile: ToolProfile = useMemo(() => ({
    grade: formData.grade, region: formData.region, weeklyCapacityHours: formData.weekly_capacity_hours, busyWeeks: formData.busy_weeks,
  }), [formData])

  const schedule = useMemo(
    () => buildSchedule(committedOpportunities(commits, tiered, today), today, profile.weeklyCapacityHours, profile.busyWeeks),
    [commits, tiered, today, profile],
  )
  const cards = useMemo(() => buildCards(plan, assets, profile, commits, schedule, today), [plan, assets, profile, commits, schedule, today])
  const thisWeek = buildThisWeek(schedule)
  const nextAction = nextActionText(plan, assets, schedule)

  const skipReasons = useMemo(
    () => Object.fromEntries(tiered.map((t) => [t.opportunity.id, cardLockReason(t, profile, assets, today)])),
    [tiered, profile, assets, today],
  )
  const reuseWeb = useMemo(() => buildReuseWeb(plan, assets, commits, skipReasons), [plan, assets, commits, skipReasons])
  const savedNeverOverloads = useMemo(
    () => (anyCombinationOverloads(tiered, today, profile.weeklyCapacityHours, profile.busyWeeks) === false),
    [tiered, today, profile],
  )

  // What-if: a non-destructive preview at another capacity (stored commits unchanged).
  const preview = useMemo(() => {
    if (previewHours === null || previewHours === profile.weeklyCapacityHours) return null
    const pPlan = planForForm(formData, allOpps, today, previewHours).plan
    const pProfile = { ...profile, weeklyCapacityHours: previewHours }
    const dropped = droppedCommits(commits, pPlan.tiered_opportunities, today).map((d) => {
      const t = pPlan.tiered_opportunities.find((x) => x.opportunity.id === d.id)!
      return { ...d, reason: cardLockReason(t, pProfile, assets, today) ?? d.reason }
    })
    const pSchedule = buildSchedule(committedOpportunities(commits, pPlan.tiered_opportunities, today), today, previewHours, profile.busyWeeks)
    return { dropped, schedule: pSchedule }
  }, [previewHours, profile, formData, today, commits, assets, allOpps])

  const shownSchedule = preview?.schedule ?? schedule
  const columns = useMemo(() => buildTimeline(shownSchedule, TITLES, DEADLINES, profile.busyWeeks), [shownSchedule, profile, TITLES, DEADLINES])

  const storyData = useMemo(() => buildStoryData(tiered, assets, {
    grade: formData.grade, region: formData.region, weekly_capacity_hours: formData.weekly_capacity_hours, busy_weeks: formData.busy_weeks, assets,
  }, today), [tiered, assets, formData, today])

  function openPlanner() {
    document.getElementById('tool')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
    document.getElementById('tool-heading')?.focus({ preventScroll: true })
  }

  const draft = useMemo(() => (draftFields ? buildDraft(draftFields, formData, allOpps, today) : null), [draftFields, formData, allOpps, today])

  function handleAddDraft() {
    if (!draft || !draft.complete) return
    const o = draft.opportunity
    setUserOpps((list) => [...list.filter((x) => x.id !== o.id), o])
    setDraftFields(null)
  }

  const askWhy = useMemo(() => {
    const t = askWhyId ? tiered.find((x) => x.opportunity.id === askWhyId) : undefined
    if (!t) return null
    const text = askWhyTemplate(t, {
      grade: formData.grade, region: formData.region, weeklyCapacityHours: formData.weekly_capacity_hours,
      busyWeeks: formData.busy_weeks, assets, tiered,
    }, today)
    return { id: t.opportunity.id, title: t.opportunity.title, text }
  }, [askWhyId, tiered, formData, assets, today])

  function handleSaveHours(hours: number) {
    handleSaveProfile({ ...formData, weekly_capacity_hours: hours })
    setPreviewHours(null)
  }

  function switchMode() {
    const next: Mode = mode === 'story' ? 'tool' : 'story'
    window.history.replaceState(null, '', next === 'tool' ? '?mode=tool' : window.location.pathname)
    setMode(next)
    window.scrollTo({ top: 0 })
  }

  function handleToggleCommit(id: string) {
    const t = tiered.find((x) => x.opportunity.id === id)
    if (t) setCommits((c) => toggleCommit(c, t, today))
  }

  function handleSaveProfile(next: ProfileFormData) {
    const nextPlan = planForForm(next, allOpps, today).plan
    const { state, uncommitted } = autoUncommit(commits, nextPlan.tiered_opportunities, today)
    setFormData(next)
    setPreviewHours(null)
    if (uncommitted.length > 0) {
      setCommits(state)
      setNotice({
        kind: 'uncommitted',
        message: 'These no longer fit your saved profile, so they were uncommitted:',
        items: uncommitted.map((d) => d.title),
      })
    }
  }

  function openProfile() {
    setProfileKey((k) => k + 1)
    setProfileOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header mode={mode} onToggleMode={switchMode} onOpenProfile={openProfile} />
      {mode === 'story' && <Story data={storyData} onOpenPlanner={openPlanner} reducedMotion={reducedMotion} />}
      <main id="tool" className="mx-auto max-w-[1120px] scroll-mt-14 space-y-12 px-8 py-12">
        <div className="space-y-4">
          <h1 tabIndex={-1} id="tool-heading" className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] outline-none">Your plan</h1>
          {notice && <Notice {...notice} onDismiss={() => setNotice(null)} />}
          <ThisWeekStrip week={thisWeek} nextAction={nextAction} />
        </div>
        <section aria-labelledby="opps" className="space-y-4">
          <h2 id="opps" className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em]">Opportunities</h2>
          <OpportunityList cards={cards} onToggleCommit={handleToggleCommit} onAskWhy={setAskWhyId} />
        </section>
        <WhatIfPreview
          savedHours={profile.weeklyCapacityHours}
          previewHours={previewHours ?? profile.weeklyCapacityHours}
          dropped={preview?.dropped ?? []}
          overloadedWeeks={shownSchedule.buckets.filter((b) => b.overloaded).length}
          savedNeverOverloads={savedNeverOverloads}
          onPreviewChange={setPreviewHours}
          onSave={handleSaveHours}
        />
        <WeeksTimeline columns={columns} hasCommits={shownSchedule.items.length > 0} titles={TITLES} previewHours={preview ? previewHours : null} />
        <ReuseWeb model={reuseWeb} reducedMotion={reducedMotion} />
        <AddYourOwn draft={draft} onSubmitManual={setDraftFields} onAdd={handleAddDraft} onDiscard={() => setDraftFields(null)} />
      </main>
      <footer className="mx-auto max-w-[1120px] border-t border-border px-8 py-8 text-[13px] text-muted-foreground">
        Rule-based. Every reason shown. AI only explains and extracts.
      </footer>
      {askWhy && (
        <AskWhy key={askWhy.id} opportunityId={askWhy.id} title={askWhy.title} templateText={askWhy.text} onClose={() => setAskWhyId(null)} />
      )}
      <ProfileDrawer
        key={profileKey}
        open={profileOpen}
        onOpenChange={setProfileOpen}
        formData={formData}
        onSave={handleSaveProfile}
        demoData={DEMO_FORM}
      />
    </div>
  )
}

export default App
