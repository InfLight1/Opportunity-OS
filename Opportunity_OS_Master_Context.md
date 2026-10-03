# Opportunity OS — Master Project Context

## Purpose
Master context for handing Opportunity OS to another AI for continued design and iteration. This document preserves the latest explicitly discussed direction and labels proposals/open questions rather than silently treating them as decisions.

---

## 1. Project identity

**Name:** Opportunity OS  
**Primary context:** Dublin HacX 2026, a 12-hour high-school hackathon.  
**Initial audience:** High-school students with many competitions, internships, programs, scholarships, and other opportunities but limited time.  
**Long-term audience discussed:** College students and workforce candidates.

### Core one-sentence idea

> Students often have more opportunities than they have time to pursue; Opportunity OS analyzes their profile, interests, existing work, and available time to narrow a large set of opportunities into a focused action plan, while identifying ways to reuse existing work across multiple opportunities.

---

# 2. Problem statement

Students often have many opportunities available to them, but do not know how to use their limited time to maximize their effort and results.

The problem is not simply finding opportunities. The student needs to decide:

- Which opportunities should I focus on?
- Which fit my interests, skills, experience, and goals?
- Which are realistic given my available time?
- Which should I deprioritize?
- What existing projects, essays, portfolio pieces, or other work can be reused?
- What should I work on next?

### Core framing

> **Students have too many opportunities and too little time. Opportunity OS helps them decide where to focus their limited effort and how to maximize the work they already do.**

---

# 3. Proposed solution

Opportunity OS takes a student's:

- profile
- interests
- experience
- skills
- goals
- existing projects/work
- commitments
- available time

and compares that information against a set of opportunities.

It narrows the opportunity landscape into a focused plan.

The intended output is:

```text
FOCUS
→ Opportunities worth pursuing

REUSE
→ Existing work that can support multiple opportunities

GAPS
→ Missing requirements or preparation

PLAN
→ What to work on next
```

The product should support the student's decision rather than pretend there is one objectively correct answer.

---

# 4. Core thesis

The strongest current framing is:

> **Don't optimize each application separately. Optimize the portfolio of opportunities you're pursuing.**

A student may be able to use one project, essay, portfolio item, or other piece of work across multiple opportunities.

Instead of:

```text
Opportunity A → separate work
Opportunity B → separate work
Opportunity C → separate work
```

Opportunity OS can identify:

```text
                 Existing Project
                  /      |                        ↓       ↓        ↓
                A        B        C
```

The product therefore helps the student get more mileage out of work they are already doing.

This aligns with the user's broader philosophy of building substantial projects and continuing to improve/reuse them across multiple contests and opportunities.

---

# 5. Why this is different from simple opportunity search

A basic opportunity platform:

```text
Find opportunities
        ↓
Show opportunities
        ↓
Student applies
```

Opportunity OS:

```text
Student profile + interests + existing work + time
                    ↓
            Opportunity landscape
                    ↓
                 FILTER
                    ↓
                  MATCH
                    ↓
             CONSIDER EFFORT
                    ↓
               FIND OVERLAP
                    ↓
              PRODUCE PLAN
```

The goal is not maximizing listings or applications. It is helping the student allocate limited effort.

---

# 6. Exact intended output

The product should produce an **Opportunity Action Plan**, not primarily a profile report or abstract analysis.

Example:

```text
YOUR OPPORTUNITY PLAN

FOCUS ON THESE

1. AI Research Internship
   Why: Strong connection to your CS + AI projects
   Deadline: Oct 18
   Effort: ~6 hours
   Action: Prepare project portfolio + application

2. Congressional App Challenge
   Why: Your existing tennis analytics project fits
   Deadline: Oct 30
   Effort: ~4 hours additional work
   Action: Finish demo + project explanation

3. DECA
   Why: Same project can be reused
   Deadline: Nov 5
   Effort: ~3 hours additional work
   Action: Adapt existing project materials


DO NOT PRIORITIZE RIGHT NOW

Scholarship X
→ Low connection to your current profile

Competition Y
→ Requires an essay/project you don't currently have

Program Z
→ Deadline conflicts with another priority


MAXIMIZE YOUR WORK

Tennis Analytics Project
    ├── Congressional App Challenge
    ├── DECA
    └── Portfolio

Build once → reuse across 3 opportunities.


NEXT ACTION

Finish the project demo.
This supports 3 opportunities.
```

The exact names, dates, and numbers above are illustrative, not fixed project data.

---

# 7. Broad project process

## 1. Filter

Remove opportunities the student cannot realistically pursue.

Discussed factors:

- eligibility
- grade/age
- deadline
- location
- prerequisites
- unavailable commitments

Concept:

```text
20 opportunities
       ↓
Eligibility + constraints
       ↓
13 viable opportunities
```

Numbers are illustrative.

## 2. Match

Determine which remaining opportunities connect to:

- interests
- skills
- projects
- experience
- goals

```text
13 viable
    ↓
Profile + interests + experience
    ↓
7 meaningfully connected opportunities
```

Again, the numbers are illustrative.

## 3. Consider effort

Consider:

- application effort
- preparation required
- deadline
- available time
- existing commitments
- busy periods
- conflicts

The purpose is to expose practical tradeoffs, not calculate a universal value score.

## 4. Find overlap

Identify work/assets that can satisfy requirements across multiple opportunities.

```text
Tennis Analytics Project
        ├── Congressional App Challenge
        ├── DECA
        └── Portfolio
```

Also identify shared preparation:

```text
Missing:
Strong technical project write-up

             ↓

      ┌──────┼──────┐
      ↓      ↓      ↓
     CAC    DECA   Internship
```

## 5. Produce plan

```text
FOCUS
→ opportunities worth pursuing

DEPRIORITIZE
→ weaker, blocked, or impractical options

REUSE
→ existing project / essay / portfolio assets

GAPS
→ missing requirements or preparation

NEXT ACTION
→ concrete immediate work
```

---

# 8. Profile model

Opportunity OS is intended to model more than a resume.

```text
YOU
├── Experience
│   ├── Projects
│   ├── Activities
│   ├── Roles / competitions
│   └── Achievements
├── Skills
├── Interests
├── Goals
├── Existing work
│   ├── Essays
│   ├── Project write-ups
│   ├── Portfolio
│   └── GitHub / links
└── Commitments & availability
    ├── School
    ├── Sports
    ├── Ongoing activities
    ├── Busy periods
    └── Realistic weekly capacity
```

The profile is intended to be useful for matching and planning.

---

# 9. Asset / evidence graph

A major concept is treating existing work as reusable assets.

Explicitly discussed assets include:

- project write-up
- essay spine
- portfolio
- recommender
- competition history
- test scores
- GitHub
- substantial projects
- writing / essays
- competition experience

The core graph:

```text
Student evidence
      ↓
    Assets
      ↓
Requirements
      ↓
Opportunities
```

A more detailed flow:

```text
EVIDENCE
"Built a tennis video-analysis project"
        ↓
ASSETS
- Technical project
- Computer vision experience
- GitHub portfolio
- Project write-up
        ↓
REQUIREMENTS
"Demonstrated technical work"
"Portfolio link"
        ↓
OPPORTUNITIES
- Opportunity A
- Opportunity B
- Opportunity C
```

### Proposed evidence layer

A later refinement was:

```text
RAW PROFILE
     ↓
  EVIDENCE
     ↓
   ASSETS
     ↓
REQUIREMENTS
     ↓
OPPORTUNITIES
     ↓
DECISION CONTEXT
```

This is a proposed refinement intended to make connections auditable.

---

# 10. Avoid false precision

This is a current design preference.

Do **not** make exact fit percentages such as:

```text
92% match
87% fit
```

The concern is that a comprehensive rubric would be subjective and could create false precision.

Instead, expose the underlying evidence and practical factors.

Example:

```text
AI Research Internship

Eligibility
✓ Meets stated student requirement

Relevant evidence
✓ Python experience
✓ Computer-vision project
✓ AI/CS interest
✓ GitHub portfolio

Potential gaps
• No formal research experience
• Limited research-style writing

Time
• Requires preparation
• Conflicts with a known busy period
```

The system gives the student information needed for a decision.

---

# 11. Avoid arbitrary value scores

Similarly, avoid:

```text
Opportunity A = 9.3 value
Opportunity B = 7.1 value
```

"Value" depends on the individual.

Instead, expose factors such as:

```text
Goal connection
Skill development
Portfolio contribution
Existing preparation
Application effort
Time requirements
Deadline conflicts
Reuse potential
```

The student decides what matters most.

---

# 12. Matching concept

Earlier, the idea evolved from standard resume/job matching.

Typical model:

```text
Job requirements
       ↕
Resume keywords
```

Opportunity OS:

```text
Opportunity
      ↕
Personal model
├── Experience
├── Skills
├── Interests
├── Goals
├── Existing work
├── Preferences / constraints
└── Time
```

Earlier broad thesis:

> A resume can tell you what you've done. Opportunity OS tries to understand who you are, what you want, what you're capable of, and what opportunities actually fit you.

For the hackathon, this is narrowed to student opportunity selection.

---

# 13. Opportunity data model

The refined project document proposed a curated local dataset of **30–50 real, currently open opportunities**, with realness as a trust signal.

Proposed fields:

```text
Opportunity
├── Title
├── Organization
├── Type
├── Short description
├── Eligibility rules
├── Required / helpful skills
├── Requirements bundle
├── Deadline
├── Estimated hours-to-apply
├── Value / growth areas
├── Application requirements
└── Source link
```

The proposed hackathon implementation uses local JSON.

Live scraping and a broad crawler were explicitly considered out of scope.

### Open scope question

Later discussion questioned whether 30–50 opportunities is too much pre-hackathon work. A possible alternative is 15–25 very well-structured opportunities.

This is **proposed, not decided**.

---

# 14. Time personalization

Time is a first-class constraint, but not a separate time-management product.

The student can have:

- standing commitments
- known busy periods
- realistic weekly capacity

Opportunity selection then considers whether applications can realistically fit.

Concept:

```text
Opportunity
    ↓
8 hours/week required
    ↓
Limited student availability
    ↓
Conflict / tradeoff
```

Calendar integration and automatic schedule optimization were explicitly left out of the MVP.

---

# 15. Opportunity collisions

A collision occurs when opportunities or their application work compete for limited time.

```text
Opportunity A deadline ─────┐
                            │
Opportunity B deadline ─────┼── Finals week
                            │
Opportunity C deadline ─────┘
```

The product can surface:

- overlapping deadlines
- simultaneous commitments
- busy-period clashes
- opportunity cost

The purpose is to make tradeoffs visible.

---

# 16. Portfolio selection

Instead of treating applications independently, the system can consider the subset of opportunities that can realistically be pursued together.

```text
20 opportunities
      ↓
Eligibility
      ↓
Relevant opportunities
      ↓
Time constraints
      ↓
Shared assets / reuse
      ↓
Focused opportunity portfolio
```

The exact optimization algorithm is still an **open question**.

Do not assume a particular optimization method unless later decided.

---

# 17. Leverage / reuse

The concept previously used "leverage score." The latest discussion suggests avoiding a subjective numerical leverage score.

Instead:

```text
PROJECT WRITE-UP

Supports:
✓ Opportunity A
✓ Opportunity B
✓ Opportunity C

Satisfies:
6 requirements

Estimated additional preparation:
2 hours
```

The underlying relationships are the evidence.

The term **leverage** remains useful conceptually.

---

# 18. Gaps and shared gaps

The system can identify missing requirements.

Example:

```text
Opportunity
    ↓
Requires research experience
    ↓
Student has:
✓ Technical project
✓ Python
✓ AI interest
✗ Formal research experience
```

Possible output:

```text
GAP
Formal research experience

POSSIBLE NEXT ACTION
Develop / document a research-style project
```

The system should not claim that a proposed action is universally optimal.

A particularly interesting proposed extension is identifying a gap that affects several opportunities:

```text
CURRENT PROFILE
✓ Python
✓ Computer vision project
✓ GitHub
✗ Research writing
✗ Formal research experience

             ↓

SHARED GAP
Research-style project documentation

             ↓

Potentially relevant to:
A
B
C
```

---

# 19. Conceptual architecture

```text
                    USER
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
      Evidence             Constraints
          │                     │
          ↓                     ↓
       Assets              Time / deadlines
          │                     │
          └──────────┬──────────┘
                     ↓
               Opportunities
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Matches     Gaps     Conflicts
          │          │          │
          └──────────┼──────────┘
                     ↓
              Decision context
                     │
          ┌──────────┼──────────┐
          ↓          ↓          ↓
       Focus       Prepare     Deprioritize
                     │
                     ↓
                   Plan
```

---

# 20. Earlier technical architecture

The refined project document proposed:

```text
Frontend
  Profile editor
  Calibrated profile view
  Discover feed
  Opportunity detail
  Plan

        ↓

Calibration layer
  Profile content → assets & capabilities
  (deterministic rules)

        ↓

Decision layer
  Asset graph
  Leverage
  Constrained portfolio selector
  Fit dimensions
  Evidence
  Gaps
  Conflict flags
  Tradeoffs

        ↓

Local JSON
  Profile
  Availability model
  Opportunities
  Saved plan items
```

It proposed a single-page app with local state and no backend for the demo.

The uploaded document proposed keeping the core decision system rule-based/deterministic, with an LLM optionally polishing prose rather than being the core decision-maker.

---

# 21. Calibration

The earlier refined document proposed converting natural-language profile information into structured assets/capabilities.

Example:

```text
"I built a tennis video analysis app."
                 ↓
- Project
- Technical project evidence
- Computer vision evidence
- Portfolio evidence
```

The student could see a summary and correct it.

### Important refinement

The later discussion identified that some inferred assets may not be justified.

For example, a long-term activity does not automatically mean a recommender is available.

If calibration is retained, the system should distinguish between verified/evidence-backed assets and uncertain/potential assets.

This is a refinement, not a locked implementation rule.

---

# 22. UX concepts

## Home screen

Earlier proposed:

```text
Good afternoon, [Name]

Your focus:
AI · Computer Vision · Building useful software

Real availability:
~11 hrs/week
2 busy weeks flagged

Your profile:
6 assets · 3 strong themes · 2 known gaps


FOCUS
[Opportunity card]
[Opportunity card]
[Opportunity card]


PLAN
2 deadlines this month
1 in a busy week

One asset supports 3 applications

Skip one application
→ free 6 hrs
→ another gets stronger
```

This is a concept, not final UI.

## Opportunity card

Earlier proposed:

```text
[Title]                         [status]

[Organization] · [Type]
Deadline [date] · ~[hours] to apply

Why it fits:
[specific profile connection]

Watch for:
[gap or time conflict]

Next step:
[one concrete action]

[Understand fit]  [Add to plan]
```

The latest direction is to make this more action-oriented than an abstract fit report.

---

# 23. Recommended current output layout

```text
FOCUS
────────────────────
Opportunity A
Opportunity B
Opportunity C


REUSE
────────────────────
Tennis Analytics Project
→ A
→ B
→ C


GAPS
────────────────────
Research writing
→ affects A + B


NEXT
────────────────────
Finish project write-up
```

This is the clearest current representation of the product purpose.

---

# 24. Dublin HacX orientation

Opportunity OS is being designed as a **competitive 12-hour solo high-school hackathon project**.

It needs both:

1. Genuine usefulness.
2. Enough technical and visual substance to stand out.

The project should therefore not attempt to become a full commercial platform during the event.

### Hackathon core

```text
INPUT
Profile + opportunities + time
        ↓
ANALYZE
Filter + match + effort + overlap
        ↓
OUTPUT
Focus + reuse + gaps + next action
```

The project should have one strong core rather than many disconnected features.

---

# 25. Competitive hackathon strengths

Potential strengths discussed:

### Clear problem

```text
Too many opportunities
+
Too little time
=
Poor prioritization
```

### Clear output

```text
Focus
Reuse
Gaps
Next action
```

### Technical spine

```text
Profile
  ↓
Assets
  ↓
Requirements
  ↓
Opportunities
  ↓
Constraints
  ↓
Portfolio decision
```

### Strong demo

A noisy list can become a focused action plan.

### Real utility

The system can be used for actual competitions, internships, programs, and other opportunities.

### Future expansion

The concept can extend to college and workforce opportunities.

These are reasons the project has a plausible competitive ceiling, not guarantees of winning.

---

# 26. Biggest hackathon risk

The concept is currently stronger as a **product idea** than as a guaranteed technically impressive implementation.

A weak version could become:

```text
Profile
   ↓
LLM
   ↓
Opportunity recommendations
```

That would risk looking like a generic AI recommendation wrapper.

The technical core should instead be visible:

```text
Profile
  ↓
Evidence / Assets
  ↓
Requirements
  ↓
Opportunities
  ↓
Constraints
  ↓
Overlap / portfolio analysis
  ↓
Action plan
```

The AI can assist with unstructured information, but the relationship and decision logic should be understandable.

---

# 27. Potential hackathon demo

Proposed sequence:

### 1. Establish the problem

```text
20 opportunities
8 hours/week
multiple deadlines
several existing projects
```

### 2. Enter profile

Example:

```text
Interested in:
AI
software
computer vision

Experience:
tennis analytics project
Speech & Debate
tennis

Existing work:
GitHub
project write-up
essays
```

### 3. Filter

```text
20 opportunities
      ↓
eligibility + constraints
      ↓
13 viable
```

### 4. Match

```text
13 viable
      ↓
profile / interests / experience
      ↓
7 connected
```

### 5. Consider effort

```text
7 connected
      ↓
time + deadlines + preparation
      ↓
3 practical priorities
```

### 6. Find overlap

```text
Tennis Analytics Project
      ├── Opportunity A
      ├── Opportunity B
      └── Portfolio
```

### 7. Produce plan

```text
FOCUS
A
B
C

REUSE
Tennis Analytics Project

GAP
Project write-up

NEXT
Finish project demo + write-up
```

The numbers and opportunities are illustrative.

---

# 28. Potential "wow" moment

The strongest demo moment discussed is:

> **One piece of work can support multiple applications.**

Concept:

```text
BEFORE

Application A → 8 hrs
Application B → 7 hrs
Application C → 6 hrs

Total → 21 hrs


OPPORTUNITY OS

Existing project
       ↓
A + B + C

Improve shared project materials
       ↓
one workstream
       ↓
multiple applications
```

This demonstrates the product's central leverage concept.

---

# 29. User's relevant real-world example

The user's Tennis Analytics App is a natural example of reuse:

```text
Tennis Analytics App
       ├── Congressional App Challenge
       ├── DECA
       └── General portfolio
```

The product should not assume every project belongs in every opportunity. It should identify such overlap when opportunity requirements actually support it.

---

# 30. Features explicitly discussed

## Profile
- Personal profile
- Interests
- Skills
- Experience
- Goals
- Existing projects
- Existing writing
- Portfolio / GitHub
- Commitments
- Availability

## Opportunity processing
- Opportunity dataset
- Eligibility filtering
- Deadline handling
- Requirements
- Skills
- Opportunity descriptions
- Source links

## Matching
- Profile-to-opportunity connections
- Interest matching
- Skill matching
- Experience matching
- Existing project matching
- Goal connections

## Effort / constraints
- Application effort
- Preparation effort
- Available time
- Standing commitments
- Busy periods
- Deadline conflicts
- Opportunity collisions

## Asset / reuse system
- Assets derived from existing work
- Requirements connected to assets
- Multiple opportunities connected to shared assets
- Reuse detection
- Leverage
- Shared preparation
- Missing assets / gaps

## Decision output
- Opportunities to focus on
- Opportunities to deprioritize
- Gaps
- Reuse opportunities
- Next action
- Plan

## Long-term concepts
- Opportunity pipeline
- Living profile
- Workforce job matching
- College opportunity matching
- Career transitions
- Reskilling
- Dynamic profile updates

Not all belong in the hackathon MVP.

---

# 31. Explicit MVP exclusions

The refined document explicitly proposed leaving out:

- Live web scraping
- Comprehensive opportunity database
- Automated resume parsing
- Predictive success claims
- Precise fit percentages
- Calendar integration
- Automatic schedule optimization
- Black-box ML inference in the calibration layer
- Multi-user accounts
- Notifications
- Application submission
- Behavioral personalization / recommendation training

Later discussion reinforced:

- Do not build a generic AI opportunity recommender.
- Do not use arbitrary value scores.
- Do not use arbitrary fit percentages.
- Do not let nuanced reasoning overwhelm the clear product output.
- Do not turn this into an everything app.

---

# 32. Earlier brainstorming and evolution

The broader brainstorming narrowed to:

1. Counselor Intelligence
2. Opportunity OS
3. Where Is My Time?

## Counselor Intelligence

The original idea involved prioritizing counselor requests / student communications.

The user identified limitations:

- Counselors may have sequential / first-come-first-serve obligations.
- AI prioritization could conflict with how counselors are required to respond.
- Security/privacy concerns are significant.

It was therefore deprioritized.

## Where Is My Time?

The idea came from the user's experience of juggling:

- school
- competition projects
- passion projects
- research
- clubs
- hobbies
- tennis

Time tracking was useful but not sufficiently actionable alone.

A stronger version would have included what-if simulations and opportunity cost, such as what would have to be given up to add another commitment.

The user liked the demo potential but felt it needed a missing piece.

The eventual direction was to make **time a constraint inside Opportunity OS**, not a separate product.

---

# 33. Time OS relationship

The concepts can be connected:

```text
Opportunity
   ↓
Profile fit
+
Goal connection
+
Skill relevance
+
Growth
+
Time fit
+
Deadline conflicts
+
Reuse potential
```

But the hackathon remains focused on Opportunity OS.

---

# 34. Long-term expansion

The broader concept can move from high school to:

### High school

```text
Competitions
Internships
Volunteering
Programs
Scholarships
Clubs
```

### College

```text
Research
Internships
Fellowships
Jobs
Programs
```

### Workforce

```text
Jobs
Projects
Certifications
Promotions
Industry transitions
Reskilling
```

The underlying idea remains a richer model of the person rather than resume keyword matching.

This is future expansion, not the Dublin HacX MVP.

---

# 35. Product philosophy

Opportunity OS should be:

- genuinely useful
- technically credible
- realistic to build
- expandable
- useful beyond the hackathon
- based on a substantial project rather than a throwaway demo

The user prefers building a small number of high-impact projects and continuously improving/shipping them.

---

# 36. Current decisions

These are the strongest settled directions:

- Opportunity OS is the primary Dublin HacX project.
- Initial audience is high-school students.
- Core problem: too many opportunities + limited time.
- Core output: narrow the opportunity list.
- The system should identify ways to reuse existing work across multiple opportunities.
- The product should produce an actionable plan.
- Time is a supporting constraint, not a separate time-management product.
- Exact fit percentages should not be central.
- Arbitrary universal value scores should not be central.
- Output should be clear and action-oriented rather than excessively nuanced.
- The project should have real utility beyond the hackathon.
- It needs to be realistic for one person in 12 hours.
- The asset / requirement / opportunity relationship is an important technical concept.
- The project should not become a generic LLM wrapper.

---

# 37. Open questions

1. What exact matching logic should determine the shortlist?
2. How should priority be determined without subjective scoring?
3. What exact portfolio-selection algorithm should be used?
4. How should available time be represented simply?
5. How many opportunities should be in the dataset?
6. Which opportunity categories should the hackathon dataset contain?
7. How much profile information should be entered manually vs extracted?
8. How should uncertain/inferred assets be represented?
9. What exact definition of "next action" should the system use?
10. Which UI interactions create the strongest demo?
11. How much LLM functionality is useful without making the project an LLM wrapper?
12. What technical algorithm makes the project sufficiently impressive while remaining feasible solo?

---

# 38. Proposed future directions

These are not MVP requirements:

- Larger opportunity database
- Structured public opportunity ingestion
- Dynamic / living profile
- Workforce job matching
- College opportunity matching
- Career transitions
- Reskilling
- Opportunity pipeline
- More sophisticated time planning
- Calendar integrations
- Behavioral personalization
- Recommendation training
- More advanced opportunity selection
- More sophisticated asset inference

---

# 39. Instructions to the next AI

Treat this file as the working source of truth.

1. Preserve the core problem: too many opportunities, too little time.
2. Preserve the core output: Focus, Reuse, Gaps, Next Action / Plan.
3. Label new ideas as **Proposed** rather than silently adding them.
4. Do not invent opportunity data, user research, hackathon facts, algorithm performance, or competitive results.
5. Challenge assumptions rather than automatically agreeing.
6. Avoid false precision, especially fit percentages and universal value scores.
7. Keep the 12-hour solo constraint in mind.
8. Keep the product concrete and action-oriented.
9. Preserve technical substance around assets, requirements, opportunities, constraints, overlap, and portfolio selection.
10. Do not turn the project into an everything app.
11. Distinguish current decisions from proposals/open questions.
12. Optimize for both real usefulness and strong hackathon presentation.

---

# 40. Final project snapshot

```text
                         OPPORTUNITY OS

                  "Too many opportunities.
                    Too little time."

                              │
                              ↓

              PROFILE + INTERESTS + EXISTING WORK
                              +
                         AVAILABLE TIME
                              │
                              ↓
                        OPPORTUNITIES
                              │
                              ↓
                           FILTER
                              │
                              ↓
                           MATCH
                              │
                              ↓
                      CONSIDER EFFORT
                              │
                              ↓
                        FIND OVERLAP
                              │
                              ↓
                       PRODUCE PLAN
                              │
             ┌────────────────┼────────────────┐
             ↓                ↓                ↓
           FOCUS             REUSE            GAPS
             │                │                │
             └────────────────┼────────────────┘
                              ↓
                         NEXT ACTION


CORE DIFFERENTIATOR:

Don't treat every application independently.

Find the small set of opportunities worth pursuing
and maximize the value of the work already being done.


HACKATHON MVP:

Profile
→ Opportunity dataset
→ Filter
→ Match
→ Effort / constraints
→ Asset + requirement graph
→ Reuse / overlap
→ Focused shortlist
→ Action plan
```

## Current phase

**Project refinement and technical/product design before Dublin HacX.**

**Primary unresolved challenge:** Define a strong, objective-enough decision/selection algorithm that produces a useful shortlist and reuse plan without falling back to arbitrary fit or value scoring.

**Primary product goal:** Make a student's opportunity landscape smaller, clearer, and more actionable while helping them get more mileage from work they are already doing.
