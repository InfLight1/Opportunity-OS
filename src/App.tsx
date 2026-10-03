import { useEffect, useMemo, useState } from 'react'
import type { CommitState, Opportunity } from '@/engine/types'
import { buildSchedule } from '@/engine/schedule'
import { loadFormData, saveFormData, type ProfileFormData } from '@/form-data'
import { fixtureProfile } from '@/engine/fixtures'
import opportunitiesData from '@/data/opportunities.json'
import { autoUncommit, committedOpportunities, loadCommitState, saveCommitState, toggleCommit } from '@/lib/commit-state'
import { planForForm, profileToFormData } from '@/lib/profile-model'
import { buildCards, buildThisWeek, buildTimeline, nextActionText, type ToolProfile } from '@/lib/tool-view'
import { Header } from '@/components/tool/Header'
import { ThisWeekStrip } from '@/components/tool/ThisWeekStrip'
import { OpportunityList } from '@/components/tool/OpportunityList'
import { WeeksTimeline } from '@/components/tool/WeeksTimeline'
import { ProfileDrawer } from '@/components/tool/ProfileDrawer'
import { Notice, type NoticeProps } from '@/components/tool/Notice'

const OPPORTUNITIES = opportunitiesData as unknown as Opportunity[]
const KNOWN_IDS = OPPORTUNITIES.map((o) => o.id)
const TITLES: Record<string, string> = Object.fromEntries(OPPORTUNITIES.map((o) => [o.id, o.title]))
const DEADLINES: Record<string, string> = Object.fromEntries(OPPORTUNITIES.map((o) => [o.id, o.deadline]))
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

  useEffect(() => { saveFormData(formData) }, [formData])
  useEffect(() => { saveCommitState(localStorage, commits) }, [commits])

  const { plan, assets } = useMemo(() => planForForm(formData, OPPORTUNITIES, today), [formData, today])
  const tiered = plan.tiered_opportunities
  const profile: ToolProfile = useMemo(() => ({
    grade: formData.grade, region: formData.region, weeklyCapacityHours: formData.weekly_capacity_hours, busyWeeks: formData.busy_weeks,
  }), [formData])

  const schedule = useMemo(
    () => buildSchedule(committedOpportunities(commits, tiered, today), today, profile.weeklyCapacityHours, profile.busyWeeks),
    [commits, tiered, today, profile],
  )
  const cards = useMemo(() => buildCards(plan, assets, profile, commits, schedule, today), [plan, assets, profile, commits, schedule, today])
  const columns = useMemo(() => buildTimeline(schedule, TITLES, DEADLINES, profile.busyWeeks), [schedule, profile])
  const thisWeek = buildThisWeek(schedule)
  const nextAction = nextActionText(plan, assets, schedule)

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
    const nextPlan = planForForm(next, OPPORTUNITIES, today).plan
    const { state, uncommitted } = autoUncommit(commits, nextPlan.tiered_opportunities, today)
    setFormData(next)
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
      <main id="tool" className="mx-auto max-w-[1120px] space-y-12 px-8 py-12">
        <div className="space-y-4">
          <h1 tabIndex={-1} id="tool-heading" className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em] outline-none">Your plan</h1>
          {notice && <Notice {...notice} onDismiss={() => setNotice(null)} />}
          <ThisWeekStrip week={thisWeek} nextAction={nextAction} />
        </div>
        <section aria-labelledby="opps" className="space-y-4">
          <h2 id="opps" className="text-[28px] font-semibold leading-[1.2] tracking-[-0.01em]">Opportunities</h2>
          <OpportunityList cards={cards} onToggleCommit={handleToggleCommit} onAskWhy={() => {}} />
        </section>
        <WeeksTimeline columns={columns} hasCommits={schedule.items.length > 0} titles={TITLES} previewHours={null} />
      </main>
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
