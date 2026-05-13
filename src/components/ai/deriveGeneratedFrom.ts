import type { AIDraftTone } from "./AIDraftEnvelope";
import type { FamilyMember } from "../../types/family";

const hasText = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

export function deriveGeneratedFrom(
  member: FamilyMember,
  tone: AIDraftTone,
): string[] {
  const chips: string[] = [`Tone: ${tone}`];
  const displayName = member.displayName?.trim() || member.fullName?.trim();
  if (displayName) chips.push(`Display name: ${displayName}`);
  if (hasText(member.birthDate)) chips.push("Birth date on file");
  if (hasText(member.birthPlace)) chips.push("Birth place on file");
  if (hasText(member.biography)) chips.push("Existing biography on file");
  if (hasText(member.notes)) chips.push("Notes on file");
  return chips;
}

export interface TimelineGenerateFromInput {
  tone: AIDraftTone;
  memberCount: number;
  eventCount: number;
  generationsCount?: number;
}

export function deriveGeneratedFromTimeline({
  tone,
  memberCount,
  eventCount,
  generationsCount,
}: TimelineGenerateFromInput): string[] {
  const chips: string[] = [`Tone: ${tone}`];
  if (eventCount > 0) chips.push(`${eventCount} milestones`);
  if (memberCount > 0) chips.push(`${memberCount} relatives`);
  if (generationsCount && generationsCount > 0) {
    chips.push(`${generationsCount} generations`);
  }
  return chips;
}
