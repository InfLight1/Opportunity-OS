import { describe, it, expect } from 'vitest'
import { emptyFormData, loadFormData, saveFormData, type ProfileFormData } from './form-data'

const store = new Map<string, string>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
  clear: () => { store.clear() },
  key: () => null,
  get length(): number { return store.size },
}

describe('emptyFormData', () => {
  it('has empty name and region', () => {
    const f = emptyFormData()
    expect(f.name).toBe('')
    expect(f.region).toBe('')
  })

  it('has default grade and capacity', () => {
    const f = emptyFormData()
    expect(f.grade).toBe(0)
    expect(f.weekly_capacity_hours).toBe(0)
  })

  it('has a single empty project', () => {
    const f = emptyFormData()
    expect(f.projects.length).toBe(1)
    expect(f.projects[0].title).toBe('')
  })

  it('has a single empty busy week', () => {
    const f = emptyFormData()
    expect(f.busy_weeks.length).toBe(1)
    expect(f.busy_weeks[0].start).toBe('')
    expect(f.busy_weeks[0].end).toBe('')
  })

  it('has empty tag arrays', () => {
    const f = emptyFormData()
    expect(f.interests.length).toBe(0)
    expect(f.skills.length).toBe(0)
  })
})

describe('saveFormData no-throw on clean storage', () => {
  it('does not throw on save with valid form data', () => {
    const form: ProfileFormData = emptyFormData()
    form.name = 'Test'
    form.grade = 10
    form.region = 'US'

    expect(() => saveFormData(form)).not.toThrow()
  })
})

describe('loadFormData with a saved profile', () => {
  it('loads a saved profile with projects and busy weeks from key opportunity-os:profile', () => {
    store.clear()
    const saved: ProfileFormData = {
      name: 'Test',
      grade: 10,
      region: 'US',
      interests: ['ai-interest'],
      skills: ['python'],
      projects: [
        { id: 'p1', title: 'Tennis Analytics App', description: 'cv', tags: ['computer-vision', 'python'] },
        { id: 'p2', title: 'Essay', description: '', tags: ['writing-sample'] },
      ],
      weekly_capacity_hours: 10,
      busy_weeks: [{ start: '2026-10-20', end: '2026-10-27', label: 'Midterms' }],
    }
    store.set('opportunity-os:profile', JSON.stringify(saved))

    const loaded = loadFormData()

    expect(loaded).not.toBeNull()
    expect(loaded).toEqual(saved)
  })

  it('round-trips through saveFormData under the same key', () => {
    store.clear()
    const form = emptyFormData()
    form.name = 'Test'
    form.projects = [{ id: 'p1', title: 'Project', description: '', tags: ['python'] }]
    saveFormData(form)

    expect(store.has('opportunity-os:profile')).toBe(true)
    expect(loadFormData()).toEqual(form)
  })

  it('drops malformed project entries and non-string tags', () => {
    store.clear()
    store.set('opportunity-os:profile', JSON.stringify({
      name: 'Test',
      projects: [null, 5, { id: 'p1', title: 'Ok', description: 'd', tags: ['python', 7] }],
    }))

    const loaded = loadFormData()

    expect(loaded?.projects).toEqual([{ id: 'p1', title: 'Ok', description: 'd', tags: ['python'] }])
  })
})
