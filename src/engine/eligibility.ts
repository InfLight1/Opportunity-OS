import type { Profile, Opportunity, Tag, MatchResult } from './types';

// ─── Eligibility (pass/fail) ────────────────────────────────────────────────

export function isEligible(
  profile: Profile,
  opportunity: Opportunity,
  today: string,
): boolean {
  if (!gradeAcceptsStudent(profile.grade, opportunity.grade_range)) return false;
  if (deadlinePassed(opportunity.deadline, today)) return false;
  if (!locationCompatible(profile.region, opportunity.location)) return false;
  return prerequisitesSatisfied(profile, opportunity);
}

export function filterEligibility(
  profile: Profile,
  opportunity: Opportunity,
  today: string,
): { eligible: boolean; reason: string } {
  if (!gradeAcceptsStudent(profile.grade, opportunity.grade_range)) {
    return {
      eligible: false,
      reason: `Ineligible: grade ${profile.grade} outside range ${opportunity.grade_range.min}-${opportunity.grade_range.max}`,
    };
  }

  if (deadlinePassed(opportunity.deadline, today)) {
    return {
      eligible: false,
      reason: `Ineligible: deadline passed (${opportunity.deadline} < ${today})`,
    };
  }

  if (!locationCompatible(profile.region, opportunity.location)) {
    return {
      eligible: false,
      reason: `Ineligible: location incompatible (no remote_ok, region ${opportunity.location.region} != ${profile.region})`,
    };
  }

  const missing = prerequisitesMissing(profile, opportunity);
  if (missing.length > 0) {
    return {
      eligible: false,
      reason: `Ineligible: missing prerequisite(s): ${missing.join(', ')}`,
    };
  }

  return {
    eligible: true,
    reason: `Eligible: grade ${profile.grade} within range ${opportunity.grade_range.min}-${opportunity.grade_range.max}`,
  };
}

function gradeAcceptsStudent(grade: number, gradeRange: { min: number; max: number }): boolean {
  return grade >= gradeRange.min && grade <= gradeRange.max;
}

function deadlinePassed(deadline: string, today: string): boolean {
  return deadline < today;
}

function locationCompatible(profileRegion: string, location: { remote_ok: boolean; region: string | null }): boolean {
  if (location.remote_ok) return true;
  if (!location.region) return true;
  return location.region === profileRegion;
}

function prerequisitesSatisfied(profile: Profile, opportunity: Opportunity): boolean {
  const allAssetTags = new Set<Tag>();
  for (const asset of profile.assets) {
    for (const tag of asset.tags) {
      allAssetTags.add(tag);
    }
  }
  for (const prereq of opportunity.prerequisites) {
    if (!allAssetTags.has(prereq)) return false;
  }
  return true;
}

function prerequisitesMissing(profile: Profile, opportunity: Opportunity): Tag[] {
  const allAssetTags = new Set<Tag>();
  for (const asset of profile.assets) {
    for (const tag of asset.tags) {
      allAssetTags.add(tag);
    }
  }
  const missing: Tag[] = [];
  for (const prereq of opportunity.prerequisites) {
    if (!allAssetTags.has(prereq)) {
      missing.push(prereq);
    }
  }
  return missing;
}

// ─── Tag matching (Evidence rule applied) ────────────────────────────────────

export function matchTags(
  profile: Profile,
  opportunity: Opportunity,
): MatchResult {
  // Collect tags from assets only (Evidence rule — no bare profile checkboxes)
  const heldAssetTags = new Set<Tag>();
  for (const asset of profile.assets) {
    for (const tag of asset.tags) {
      heldAssetTags.add(tag);
    }
  }

  // Required tags: find which are held by assets
  const matchedRequired: Tag[] = [];
  for (const tag of opportunity.required_tags) {
    if (heldAssetTags.has(tag)) {
      matchedRequired.push(tag);
    }
  }

  // Helpful tags: count how many distinct ones are held (no duplicates in profile.assets)
  const matchedHelpful: Tag[] = [];
  for (const tag of opportunity.helpful_tags) {
    if (heldAssetTags.has(tag)) {
      matchedHelpful.push(tag);
    }
  }

  // Gap = required tags NOT held by any asset
  const gap_count = opportunity.required_tags.filter(t => !heldAssetTags.has(t)).length;

  let reason: string;
  if (matchedRequired.length > 0 && matchedHelpful.length > 0) {
    reason = `Matched: ${formatTags(matchedRequired)} (${matchedRequired.length} required), ${formatTags(matchedHelpful)} (${matchedHelpful.length} helpful)`;
  } else if (matchedRequired.length > 0) {
    reason = `Matched: ${formatTags(matchedRequired)} (${matchedRequired.length} required tags)`;
  } else if (matchedHelpful.length > 0) {
    reason = `Matched: ${formatTags(matchedHelpful)} (${matchedHelpful.length} helpful tags)`;
  } else {
    reason = `No sufficient match (0 required, ${matchedHelpful.length} helpful)`;
  }

  return { matched_required: matchedRequired, helpful_match_count: matchedHelpful.length, matched_helpful: matchedHelpful, gap_count, reason };
}

export function passesMatching(
  profile: Profile,
  opportunity: Opportunity,
): boolean {
  const result = matchTags(profile, opportunity);
  return result.matched_required.length >= 1 || result.helpful_match_count >= 2;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatTags(tags: Tag[]): string {
  return tags.join(', ');
}

