import type { Asset, Opportunity, Plan, Profile } from '../engine/types'
import { runEngine, type ProfileInput } from '../engine/run-engine'
import type { ProfileFormData } from '../form-data'

// --- Profile form -> engine input (moved out of App.tsx; pure) ---

export function profileToFormData(profile: Profile): ProfileFormData {
  return {
    name: profile.name,
    grade: profile.grade,
    region: profile.region,
    interests: [...profile.interests],
    skills: [...profile.skills],
    projects: profile.assets.map(a => ({ id: a.id, title: a.title, description: a.description, tags: [...(a.tags ?? [])] })),
    weekly_capacity_hours: profile.weekly_capacity_hours,
    busy_weeks: profile.busy_weeks.map(bw => ({ ...bw })),
  }
}

/** Projects with a title become assets (Evidence rule: only these tags count). */
export function assetsFromForm(form: ProfileFormData): Asset[] {
  return form.projects
    .filter(p => p.title.trim())
    .map(p => ({ id: p.id, title: p.title, description: p.description, kind: 'project', tags: [...(p.tags ?? [])], supports: [], reuse_count: 0 }))
}

export function formToInput(form: ProfileFormData, capacityOverride?: number): ProfileInput {
  return {
    name: form.name,
    grade: form.grade,
    region: form.region,
    interests: form.interests,
    skills: form.skills,
    assets: assetsFromForm(form),
    weekly_capacity_hours: capacityOverride ?? form.weekly_capacity_hours,
    busy_weeks: form.busy_weeks,
  }
}

export type PlanResult = { plan: Plan; assets: Asset[] }

/** Run the engine for the form; `capacityOverride` is the what-if preview. */
export function planForForm(form: ProfileFormData, opportunities: Opportunity[], today: string, capacityOverride?: number): PlanResult {
  return runEngine(formToInput(form, capacityOverride), opportunities, today)
}
