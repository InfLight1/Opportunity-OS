import type { SkillTag, ExperienceTag, InterestTag, BusyPeriod } from './engine/types'

export interface ProfileFormData {
  name: string
  grade: number
  region: string
  interests: InterestTag[]
  skills: SkillTag[]
  projects: ProjectData[]
  weekly_capacity_hours: number
  busy_weeks: BusyPeriod[]
}

interface ProjectData {
  id: string
  title: string
  description: string
  tags: import('./engine/types').Tag[]
}

export function emptyProject(): ProjectData {
  return { id: String(Date.now()), title: '', description: '', tags: [] }
}

export function emptyFormData(): ProfileFormData {
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

const STORAGE_KEY = 'opportunity-os:profile'

const DEFAULT_FORM = emptyFormData()

export function loadFormData(): ProfileFormData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object') return null
    const p = parsed as Record<string, unknown>

    const normalizeStringOrEmpty = (v: unknown): string => (typeof v === 'string' ? v : '')
    const normalizeProjects = (): ProjectData[] => {
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
        let tags: import('./engine/types').Tag[]
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
      if (!Array.isArray(raw)) return DEFAULT_FORM.busy_weeks
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
      name: typeof p.name === 'string' ? p.name : DEFAULT_FORM.name,
      grade: typeof p.grade === 'number' ? p.grade : DEFAULT_FORM.grade,
      region: typeof p.region === 'string' ? p.region : DEFAULT_FORM.region,
      interests: normalizeTagArray<InterestTag>(p.interests),
      skills: normalizeTagArray<SkillTag>(p.skills),
      projects: normalizeProjects(),
      weekly_capacity_hours: typeof p.weekly_capacity_hours === 'number' ? p.weekly_capacity_hours : DEFAULT_FORM.weekly_capacity_hours,
      busy_weeks: normalizeBusyWeeks(),
    }
    return merged
  } catch {
    return null
  }
}

export function saveFormData(formData: ProfileFormData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(formData)) } catch { /* storage full or unavailable */ }
}
