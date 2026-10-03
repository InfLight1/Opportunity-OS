// ─── Tag taxonomy (locked; never free string) ────────────────────────────────

export type SkillTag =
  | 'python'
  | 'computer-vision'
  | 'data-analysis'
  | 'web-dev'
  | 'ai-ml'
  | 'research-writing'
  | 'public-speaking'
  | 'leadership';

export type ExperienceTag =
  | 'technical-project'
  | 'competition-experience'
  | 'portfolio-github'
  | 'writing-sample';

export type InterestTag =
  | 'ai-interest'
  | 'entrepreneurship'
  | 'stem-general'
  | 'social-impact';

export type StructuralTag =
  | 'team-required'
  | 'individual'
  | 'submission-format:demo'
  | 'submission-format:essay'
  | 'submission-format:pitch';

export type Tag = SkillTag | ExperienceTag | InterestTag | StructuralTag;

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  name: string;
  grade: number;
  region: string;
  interests: InterestTag[];
  skills: SkillTag[];
  assets: AssetLike[];
  weekly_capacity_hours: number;
  busy_weeks: BusyPeriod[];
}

export type AssetLike = {
  id: string;
  title: string;
  description: string;
  kind: string;
  tags: Tag[];
};

// ─── Opportunity ─────────────────────────────────────────────────────────────

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: string;
  description: string;
  grade_range: { min: number; max: number };
  location: Location;
  prerequisites: Tag[];
  required_tags: Tag[];
  helpful_tags: Tag[];
  deadline: string;
  effort_hours: number;
  participation: 'individual' | 'team-required';
  submission_format: 'submission-format:demo' | 'submission-format:essay' | 'submission-format:pitch';
  requirements: string[];
  source_url: string;
}

export type Location = { remote_ok: boolean; region: string | null };

// ─── Asset ───────────────────────────────────────────────────────────────────

export interface Asset {
  id: string;
  title: string;
  description: string;
  kind: string;
  tags: Tag[];
  supports: string[];
  reuse_count: number;
}

// ─── MatchResult ─────────────────────────────────────────────────────────────

export interface MatchResult {
  matched_required: Tag[];
  helpful_match_count: number;
  matched_helpful: Tag[];
  gap_count: number;
  reason: string;
}

// ─── ReuseLink ───────────────────────────────────────────────────────────────

export type ReuseLink = {
  opportunity_id: string;
  asset_ids: string[];
};

// ─── SharedGap ───────────────────────────────────────────────────────────────

export type SharedGap = {
  tag: Tag;
  affects: string[];
};

// ─── NextAction ──────────────────────────────────────────────────────────────

export type NextAction = {
  asset_id: string;
  opportunity_id: string;
};

// ─── BusyPeriod ──────────────────────────────────────────────────────────────

export type BusyPeriod = {
  start: string;
  end: string;
  label?: string;
};

// --- WeekBucket ---
// Rolling 7-day bucket from today (not a calendar week). ISO dates, end inclusive.

export type WeekBucket = {
  index: number;
  start: string;
  end: string;
  busy_days: number;
  capacity_hours: number;
};

// --- Schedule (AGENTS.md Scheduler) ---

export type Placement = { bucket: number; hours: number };

export type ScheduledItem = {
  opportunity_id: string;
  placements: Placement[];
  overflow_hours: number;
  start_by_bucket: number | null;
};

export type Schedule = {
  buckets: (WeekBucket & { load_hours: number; overloaded: boolean })[];
  items: ScheduledItem[];
};

// --- CommitState (AGENTS.md Commit state; persisted) ---

export type CommitState = { committed_ids: string[] };

// ─── Plan ────────────────────────────────────────────────────────────────────

export type OpportunityTier = 'SKIP' | 'FOCUS' | 'CONSIDER';

export type TieredOpportunity = {
  opportunity: Opportunity;
  tier: OpportunityTier;
  match: MatchResult;
  reuse_count: number;
  gap_count: number;
  has_busy_week_collision: boolean;
  eligible: boolean;
};

export type EligibilityResult = {
  eligible: boolean;
  reason: string;
};

export type Plan = {
  weekly_capacity_hours: number;
  busy_weeks: BusyPeriod[];
  tiered_opportunities: TieredOpportunity[];
  shared_gaps: SharedGap[];
  next_action: NextAction | null;
  weekly_load_warnings: WeeklyLoadWarning[];
};

export type WeeklyLoadWarning = {
  week_start: string;
  week_end: string;
  required_hours: number;
  available_hours: number;
  label?: string;
};
