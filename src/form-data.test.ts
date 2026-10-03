import { describe, it, expect } from 'vitest'
import { emptyFormData, saveFormData, ProfileFormData } from './form-data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(global as any).localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  get length(): number { return 0 },
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
