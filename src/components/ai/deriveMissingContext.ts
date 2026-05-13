import type { FamilyMember, TimelineEvent } from "../../types/family";

const hasText = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function deriveMissingContextForBiography(
  member: FamilyMember,
): string[] {
  const hints: string[] = [];
  if (!hasText(member.birthDate)) hints.push("Add a birth date");
  if (!hasText(member.birthPlace)) hints.push("Add a birth place");
  if (!hasText(member.biography))
    hints.push("Record a short biography so the draft has framing");
  if (!hasText(member.notes))
    hints.push("Add notes with memories or anecdotes the draft can weave in");
  return hints;
}

const TIMELINE_EMPTY_HINTS = [
  "Add a birth event",
  "Add a marriage event",
  "Add a move event",
  "Add a reunion event",
  "Record a deceased event",
] as const;

export function deriveMissingContextForTimeline(
  timeline: TimelineEvent[],
): string[] {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [...TIMELINE_EMPTY_HINTS];
  }
  return [];
}
