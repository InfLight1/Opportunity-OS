// --- Ask why guard (AGENTS.md: every LLM output passes a pure check) ---
// Rejects LLM text that (a) names an opportunity title not in the dataset,
// (b) contains a number that is not in the structured input facts, or
// (c) mentions score, percent, % or match meter.

export type CheckResult = { ok: boolean; violations: string[] }

const BANNED = /\bscor(e|es|ed|ing)\b|\bpercent(age|ages|ile)?\b|%|\bmatch[- ]?meters?\b/i

// Sentence-start words dropped before the title lookup.
const LEADING = /^(?:(?:The|This|That|Your|A|An|Both|And|For|In|Like|Unlike|While|Since|Because|Also|So|But|It|Its)\s+)+/

// Words that make a capitalised phrase look like an opportunity name.
const NAME_WORDS = /\b(Challenge|Competition|Contest|Hackathon|Hacks?|Olympiad|Fair|Award|Awards|Prize|Search|Program|Programme|Summit|Scholarship|Appathon|Cup|Bowl|Games|Expo|Fellowship|Institute)\b/

/** Numbers as written ("12", "6.5", "2026"); a leading/trailing date part counts too. */
export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).map(n => String(Number(n)))
}

/** Capitalised multi-word phrases that contain an opportunity-name word. */
export function candidateTitles(text: string): string[] {
  const phrases = text.match(/(?:[A-Z0-9][\w'&-]*\s+){1,7}[A-Z0-9][\w'&-]*/g) ?? []
  return phrases.filter(p => NAME_WORDS.test(p)).map(p => p.trim().replace(LEADING, ''))
}

function titleKnown(phrase: string, titles: string[]): boolean {
  const p = phrase.toLowerCase()
  return titles.some(t => {
    const tl = t.toLowerCase()
    return tl.includes(p) || p.includes(tl)
  })
}

export function checkAskWhy(text: string, facts: unknown, datasetTitles: string[]): CheckResult {
  const violations: string[] = []
  if (!text.trim()) violations.push('empty text')

  const banned = text.match(BANNED)
  if (banned) violations.push(`banned word: ${banned[0]}`)

  const allowed = new Set(numbersIn(JSON.stringify(facts)))
  for (const t of datasetTitles) for (const n of numbersIn(t)) allowed.add(n)
  for (const n of numbersIn(text)) {
    if (!allowed.has(n)) violations.push(`number not in facts: ${n}`)
  }

  for (const phrase of candidateTitles(text)) {
    if (!titleKnown(phrase, datasetTitles)) violations.push(`unknown title: ${phrase}`)
  }

  return { ok: violations.length === 0, violations: [...new Set(violations)] }
}
