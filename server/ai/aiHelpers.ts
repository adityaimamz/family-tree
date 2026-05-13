import type {
  BiographyMember,
  BiographyTone,
  TimelineStoryTone,
  TimelineStoryEvent,
  ConfidenceLabel,
} from "./types.js";

export const DEFAULT_REVIEW_CHECKLIST = [
  "Check names",
  "Check dates",
  "Check sensitive details",
  "Ask a family reviewer before saving as final",
] as const;

export const hasText = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

/** Plain-language `factsUsed` derived from the non-null member fields.
 * Never invents data — each chip restates an archive field verbatim. */
export const computeBiographyFactsUsed = (member: BiographyMember | null): string[] => {
  if (!member) return [];
  const facts: string[] = [];
  const displayName = (member.displayName || member.fullName || "").trim();
  if (displayName) facts.push(`Display name: ${displayName}`);
  const rel = mapRelationshipToRoot(member.relationshipToRoot ?? null);
  if (rel && rel !== "Family Member") facts.push(`Relationship to root: ${rel}`);
  const birthDate = (member.birthDate ?? "").trim();
  if (birthDate) facts.push(`Birth date: ${birthDate}`);
  const birthPlace = (member.birthPlace ?? "").trim();
  if (birthPlace) facts.push(`Birth place: ${birthPlace}`);
  if (hasText(member.biography)) facts.push("Existing biography on file");
  if (hasText(member.notes)) facts.push("Notes on file");
  if (hasText(member.statusLabel)) facts.push(`Status: ${member.statusLabel.trim()}`);
  return facts;
};

export const computeBiographyMissingContext = (
  member: BiographyMember | null,
): string[] => {
  if (!member) return [];
  const hints: string[] = [];
  if (!hasText(member.birthDate)) hints.push("Add a birth date");
  if (!hasText(member.birthPlace)) hints.push("Add a birth place");
  if (!hasText(member.biography))
    hints.push("Record a short biography so the draft has framing");
  if (!hasText(member.notes))
    hints.push("Add notes with memories or anecdotes the draft can weave in");
  return hints;
};

export const computeBiographyGeneratedFrom = (
  tone: BiographyTone,
  factsUsed: string[],
): string[] => {
  const chips: string[] = [`Tone: ${tone}`];
  if (factsUsed.length > 0) {
    chips.push(`${factsUsed.length} member profile fields`);
  }
  return chips;
};

export const computeBiographyConfidenceLabel = (factsUsed: string[]): ConfidenceLabel => {
  if (factsUsed.length >= 5) return "high-detail";
  if (factsUsed.length >= 3) return "medium-detail";
  return "low-detail";
};

export const computeTimelineEventsUsed = (events: TimelineStoryEvent[]): string[] =>
  events.map((event) => `${event.year}: ${event.title}`);

export const computeTimelineMissingContext = (events: TimelineStoryEvent[]): string[] => {
  if (events.length === 0) {
    return [
      "Add a birth event",
      "Add a marriage event",
      "Add a move event",
      "Add a reunion event",
      "Record a deceased event",
    ];
  }
  const presentTypes = new Set(events.map((event) => event.type.toLowerCase()));
  const hints: string[] = [];
  if (!presentTypes.has("birth")) hints.push("Add a birth event");
  if (!presentTypes.has("marriage")) hints.push("Add a marriage event");
  if (!presentTypes.has("deceased")) hints.push("Record a deceased event");
  return hints;
};

export const computeTimelineGeneratedFrom = (
  tone: TimelineStoryTone,
  eventCount: number,
  memberCount: number,
): string[] => {
  const chips: string[] = [`Tone: ${tone}`];
  if (eventCount > 0) chips.push(`${eventCount} milestones`);
  if (memberCount > 0) chips.push(`${memberCount} relatives`);
  return chips;
};

export const mapConfidenceToLabel = (
  confidence: "high" | "medium" | "low",
): "direct" | "inferred" | "uncertain" => {
  if (confidence === "high") return "direct";
  if (confidence === "medium") return "inferred";
  return "uncertain";
};

export const normalizeBiographyTone = (value: unknown): BiographyTone => {
  if (value === "concise" || value === "legacy" || value === "warm") return value;
  return "warm";
};

export const normalizeTimelineStoryTone = (value: unknown): TimelineStoryTone => {
  if (value === "concise" || value === "legacy" || value === "warm") return value;
  return "warm";
};

// Map branch slugs to human-readable names
export const mapBranchName = (slug: string | null): string => {
  if (!slug) return "Not recorded";
  if (slug === "garis-utama") return "Main Line";
  if (slug === "cabang-kedua") return "Second Branch";
  return slug;
};

// Map relationship to root to human-readable labels
export const mapRelationshipToRoot = (value: string | null): string => {
  if (!value) return "Family Member";
  if (value === "root" || value === "Family Founder") return "Family Founder";
  if (value === "spouse" || value === "Spouse") return "Spouse";
  if (value === "child" || value === "Child") return "Child";
  if (value === "grandchild" || value === "Grandchild") return "Grandchild";
  if (value === "in-law" || value === "In-Law") return "In-Law";
  return value;
};

export const memberDisplayName = (member: { displayName?: string | null; fullName: string }) =>
  member.displayName?.trim() || member.fullName;

export const timelineSortValue = (year: string) => {
  const match = /\d{4}/.exec(year);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[0]);
};

export const compactLines = (values: Array<string | null | undefined>) =>
  values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
