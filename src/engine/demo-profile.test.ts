import { describe, it, expect } from 'vitest';
import { fixtureProfile } from './fixtures';
import type { ProfileFormData } from '../form-data';

// Re-implementation of App.tsx fixtureToFormData — keep engine tests isolated
function fixtureToFormData(fixture: typeof fixtureProfile): ProfileFormData {
  const projects = fixture.assets.map((a) => ({ id: a.id, title: a.title, description: a.description, tags: [...(a.tags ?? [])] }));
  return {
    name: fixture.name,
    grade: fixture.grade,
    region: fixture.region,
    interests: [...fixture.interests],
    skills: [...fixture.skills],
    projects,
    weekly_capacity_hours: fixture.weekly_capacity_hours,
    busy_weeks: fixture.busy_weeks.map((bw) => ({ ...bw })),
  };
}

describe('demo profile: Rudra Goel', () => {
  it('fixture has grade 10', () => {
    expect(fixtureProfile.grade).toBe(10);
  });

  it('fixture has capacity 10', () => {
    expect(fixtureProfile.weekly_capacity_hours).toBe(10);
  });

  it('fixture name is Rudra Goel', () => {
    expect(fixtureProfile.name).toBe('Rudra Goel');
  });

  it('fixtureToFormData normalization succeeds with correct shape', () => {
    const form = fixtureToFormData(fixtureProfile);
    expect(form.name).toBe('Rudra Goel');
    expect(form.grade).toBe(10);
    expect(form.weekly_capacity_hours).toBe(10);
    expect(form.projects).toHaveLength(1);
  });

  it('tennis asset has exactly the correct tags', () => {
    const tennis = fixtureProfile.assets.find(a => a.id === 'asset-tennis');
    expect(tennis).toBeDefined();
    if (!tennis) throw new Error('tennis asset not found');
    const expectedTags: string[] = [ 'technical-project', 'computer-vision', 'python', 'portfolio-github', 'data-analysis' ];
    expect(tennis.tags).toEqual(expectedTags);
  });
});
