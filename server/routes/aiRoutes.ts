import { Router } from "express";
import { loadAppUser, requireSpaceMembership } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asNonEmptyString } from "./shared.js";
import { maybeAiRelationship } from "../relationship/aiExplain.js";
import { deterministicRelationship } from "../relationship/deterministic.js";
import {
  RelationshipMember,
  asStoredConfidence,
  asStoredSource,
  memberName,
  pathFromStoredIds,
} from "../relationship/types.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const biographyPrivacyReminder = "AI drafts stay inside this family space until reviewed.";
const timelinePrivacyReminder = "AI timeline stories stay inside this family space until reviewed.";

const aiLog = (
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" = "info",
) => {
  console[level](`[ai] ${event}`, data);
};

type BiographyTone = "warm" | "concise" | "legacy";
type BiographySource = "ai" | "deterministic";
type TimelineStoryTone = "warm" | "concise" | "legacy";
type TimelineStorySource = "ai" | "deterministic";
type BiographyMember = {
  slugId: string;
  fullName: string;
  displayName: string;
  gender: string;
  generation: number;
  familyBranchId: string;
  birthDate: string | null;
  deathDate: string | null;
  isDeceased: boolean;
  deceasedLabel: string | null;
  birthPlace: string | null;
  biography: string;
  notes: string;
  statusLabel: string;
  relationshipToRoot: string;
};

type BiographyGenerationResult = {
  biographyDraft: string;
  privacyReminder: string;
  fallbackNote: string;
  source: BiographySource;
};

type TimelineStoryEvent = {
  id: string;
  year: string;
  type: string;
  title: string;
  description: string;
  memberIds: string[];
  memberNames: string[];
  source: "timeline" | "member";
};

type TimelineStoryResult = {
  timelineStoryDraft: string;
  privacyReminder: string;
  fallbackNote: string;
  source: TimelineStorySource;
  eventCount: number;
  memberIds: string[];
};

type GenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

// ---------------------------------------------------------------------------
// Feature: ai-studio-experience — Enhanced_AI_Metadata helpers.
//
// All fields added below are optional and additive. Legacy clients reading
// only the minimal response shape (biographyDraft, privacyReminder,
// fallbackNote, source for biography; etc.) continue to work because
// the original fields and their ordering are preserved in every response.
// ---------------------------------------------------------------------------

const DEFAULT_REVIEW_CHECKLIST = [
  "Check names",
  "Check dates",
  "Check sensitive details",
  "Ask a family reviewer before saving as final",
] as const;

type ConfidenceLabel = "direct" | "inferred" | "uncertain" | "high-detail" | "medium-detail" | "low-detail";

const hasText = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

/** Plain-language `factsUsed` derived from the non-null member fields.
 * Never invents data — each chip restates an archive field verbatim. */
const computeBiographyFactsUsed = (member: BiographyMember | null): string[] => {
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

const computeBiographyMissingContext = (
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

const computeBiographyGeneratedFrom = (
  tone: BiographyTone,
  factsUsed: string[],
): string[] => {
  const chips: string[] = [`Tone: ${tone}`];
  if (factsUsed.length > 0) {
    chips.push(`${factsUsed.length} member profile fields`);
  }
  return chips;
};

const computeBiographyConfidenceLabel = (factsUsed: string[]): ConfidenceLabel => {
  if (factsUsed.length >= 5) return "high-detail";
  if (factsUsed.length >= 3) return "medium-detail";
  return "low-detail";
};

const computeTimelineEventsUsed = (events: TimelineStoryEvent[]): string[] =>
  events.map((event) => `${event.year}: ${event.title}`);

const computeTimelineMissingContext = (events: TimelineStoryEvent[]): string[] => {
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

const computeTimelineGeneratedFrom = (
  tone: TimelineStoryTone,
  eventCount: number,
  memberCount: number,
): string[] => {
  const chips: string[] = [`Tone: ${tone}`];
  if (eventCount > 0) chips.push(`${eventCount} milestones`);
  if (memberCount > 0) chips.push(`${memberCount} relatives`);
  return chips;
};

const mapConfidenceToLabel = (
  confidence: "high" | "medium" | "low",
): "direct" | "inferred" | "uncertain" => {
  if (confidence === "high") return "direct";
  if (confidence === "medium") return "inferred";
  return "uncertain";
};

const normalizeBiographyTone = (value: unknown): BiographyTone => {
  if (value === "concise" || value === "legacy" || value === "warm") return value;
  return "warm";
};

const normalizeTimelineStoryTone = (value: unknown): TimelineStoryTone => {
  if (value === "concise" || value === "legacy" || value === "warm") return value;
  return "warm";
};

/**
 * Try to extract a JSON string value for a given key from possibly-truncated text.
 * Falls back to regex extraction when JSON.parse fails (e.g. when LLM output is cut off).
 */
const extractJsonStringValue = (text: string, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    // Match "key": "value" — value may contain escaped characters
    const pattern = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, "s");
    const m = pattern.exec(text);
    if (m && m[1] && m[1].trim().length > 20) {
      // Unescape common JSON escapes
      return m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
  }
  return undefined;
};

const parseAiBiographyJson = (text: string) => {
  // First try: full JSON parse
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try {
      const raw = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        biographyDraft: (raw.biographyDraft ?? raw.biography_draft ?? raw.draft) as string | undefined,
        privacyReminder: (raw.privacyReminder ?? raw.privacy_reminder) as string | undefined,
        fallbackNote: (raw.fallbackNote ?? raw.fallback_note) as string | undefined,
      } as Partial<BiographyGenerationResult>;
    } catch {
      // JSON incomplete — fall through to regex extraction
    }
  }
  // Fallback: regex extraction from truncated JSON
  const draft = extractJsonStringValue(text, "biographyDraft", "biography_draft", "draft");
  if (!draft) return null;
  return {
    biographyDraft: draft,
    privacyReminder: extractJsonStringValue(text, "privacyReminder", "privacy_reminder"),
    fallbackNote: extractJsonStringValue(text, "fallbackNote", "fallback_note"),
  } as Partial<BiographyGenerationResult>;
};

const parseAiTimelineStoryJson = (text: string) => {
  // First try: full JSON parse
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try {
      const raw = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        timelineStoryDraft: (raw.timelineStoryDraft ?? raw.timeline_story_draft ?? raw.story_draft ?? raw.draft ?? raw.story) as string | undefined,
        privacyReminder: (raw.privacyReminder ?? raw.privacy_reminder) as string | undefined,
        fallbackNote: (raw.fallbackNote ?? raw.fallback_note) as string | undefined,
      } as Partial<TimelineStoryResult>;
    } catch {
      // JSON incomplete — fall through to regex extraction
    }
  }
  // Fallback: regex extraction from truncated JSON
  const draft = extractJsonStringValue(text, "timelineStoryDraft", "timeline_story_draft", "story_draft", "draft", "story");
  if (!draft) return null;
  return {
    timelineStoryDraft: draft,
    privacyReminder: extractJsonStringValue(text, "privacyReminder", "privacy_reminder"),
    fallbackNote: extractJsonStringValue(text, "fallbackNote", "fallback_note"),
  } as Partial<TimelineStoryResult>;
};

const compactLines = (values: Array<string | null | undefined>) =>
  values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

// Map branch slugs to human-readable names
const mapBranchName = (slug: string | null): string => {
  if (!slug) return "Not recorded";
  if (slug === "garis-utama") return "Main Line";
  if (slug === "cabang-kedua") return "Second Branch";
  return slug;
};

// Map relationship to root to human-readable labels
const mapRelationshipToRoot = (value: string | null): string => {
  if (!value) return "Family Member";
  if (value === "root" || value === "Family Founder") return "Family Founder";
  if (value === "spouse" || value === "Spouse") return "Spouse";
  if (value === "child" || value === "Child") return "Child";
  if (value === "grandchild" || value === "Grandchild") return "Grandchild";
  if (value === "in-law" || value === "In-Law") return "In-Law";
  return value;
};

const memberDisplayName = (member: { displayName?: string | null; fullName: string }) =>
  member.displayName?.trim() || member.fullName;

const timelineSortValue = (year: string) => {
  const match = /\d{4}/.exec(year);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[0]);
};

const buildTimelineStoryEvents = (
  members: Array<{
    slugId: string;
    fullName: string;
    displayName: string;
    birthDate: string | null;
    marriageDate: string | null;
    deathDate: string | null;
    spouseIds: string[];
  }>,
  timelineEvents: Array<{
    slugId: string;
    year: string;
    type: string;
    title: string;
    description: string;
    relatedMemberIds: string[];
    memberIds: string[];
  }>,
): TimelineStoryEvent[] => {
  const memberById = new Map(members.map((member) => [member.slugId, member]));
  const events: TimelineStoryEvent[] = timelineEvents.map((event) => {
    const relatedIds = Array.from(new Set([...(event.relatedMemberIds ?? []), ...(event.memberIds ?? [])]));
    return {
      id: event.slugId,
      year: event.year,
      type: event.type,
      title: event.title,
      description: event.description,
      memberIds: relatedIds,
      memberNames: relatedIds.map((id) => memberById.get(id)).filter((m): m is Exclude<typeof m, undefined> => Boolean(m)).map((member) => memberDisplayName(member)),
      source: "timeline",
    };
  });

  const marriageKeys = new Set<string>();
  for (const member of members) {
    const name = memberDisplayName(member);
    if (member.birthDate) {
      events.push({
        id: `member-birth-${member.slugId}`,
        year: member.birthDate,
        type: "Birth",
        title: `${name} was born`,
        description: `${name}'s birth is recorded in the family archive.`,
        memberIds: [member.slugId],
        memberNames: [name],
        source: "member",
      });
    }

    if (member.marriageDate) {
      const spouseIds = member.spouseIds?.length ? member.spouseIds : [];
      const spouseNames = spouseIds.map((id) => memberById.get(id)).filter((m): m is Exclude<typeof m, undefined> => Boolean(m)).map((spouse) => memberDisplayName(spouse));
      const key = [member.slugId, ...spouseIds].sort((a, b) => a.localeCompare(b)).join("-");
      if (!marriageKeys.has(key)) {
        marriageKeys.add(key);
        events.push({
          id: `member-marriage-${key}`,
          year: member.marriageDate,
          type: "Marriage",
          title: spouseNames.length ? `${name} married ${spouseNames.join(" and ")}` : `${name}'s marriage was recorded`,
          description: spouseNames.length
            ? `${name} and ${spouseNames.join(" and ")} are connected by a marriage record.`
            : `${name}'s marriage date is recorded in the family archive.`,
          memberIds: Array.from(new Set([member.slugId, ...spouseIds])),
          memberNames: [name, ...spouseNames],
          source: "member",
        });
      }
    }

    if (member.deathDate) {
      events.push({
        id: `member-death-${member.slugId}`,
        year: member.deathDate,
        type: "Deceased",
        title: `${name} passed away`,
        description: `${name}'s passing is recorded in the family archive.`,
        memberIds: [member.slugId],
        memberNames: [name],
        source: "member",
      });
    }
  }

  return events.sort((a, b) => timelineSortValue(a.year) - timelineSortValue(b.year) || a.title.localeCompare(b.title));
};

const deterministicTimelineStory = (
  familySpaceName: string,
  events: TimelineStoryEvent[],
  tone: TimelineStoryTone,
): TimelineStoryResult => {
  const memberIds = Array.from(new Set(events.flatMap((event) => event.memberIds)));
  if (!events.length) {
    return {
      timelineStoryDraft: `${familySpaceName} does not have timeline events recorded yet. Add births, marriages, moves, reunions, photos, and family milestones to turn this archive into a readable family journey.`,
      privacyReminder: timelinePrivacyReminder,
      fallbackNote: "Generated with deterministic fallback because no timeline events were available.",
      source: "deterministic",
      eventCount: 0,
      memberIds,
    };
  }

  const firstEvent = events[0];
  const lastEvent = events.at(-1);

  if (!firstEvent || !lastEvent) {
    throw new Error("Unexpected empty events array after length check");
  }
  const typeSummary = Array.from(new Set(events.map((event) => event.type))).join(", ");
  const eventLines = events.slice(0, 9).map((event) => {
    const people = event.memberNames.length ? ` involving ${event.memberNames.join(", ")}` : "";
    return `${event.year}: ${event.title}${people}. ${event.description}`;
  });

  let timelineStoryDraft: string;
  if (tone === "concise") {
    timelineStoryDraft = [
      `${familySpaceName}'s timeline currently spans from ${firstEvent.year} to ${lastEvent.year}.`,
      `The archive connects ${events.length} recorded milestones across ${typeSummary}.`,
      eventLines.join(" "),
      "This draft uses only timeline and member records already stored inside the FamilySpace.",
    ].join(" ");
  } else if (tone === "legacy") {
    timelineStoryDraft = [
      `${familySpaceName} is preserved through a sequence of family milestones, beginning with ${firstEvent.title} and continuing through ${lastEvent.title}.`,
      `Across ${events.length} moments, the archive traces ${typeSummary.toLowerCase()} as part of a shared family inheritance.`,
      eventLines.join(" "),
      "Together, these records create a first family journey draft for relatives to review, correct, and enrich with photos or source notes.",
    ].join(" ");
  } else {
    timelineStoryDraft = [
      `${familySpaceName}'s story unfolds through the milestones its family has chosen to preserve.`,
      `From ${firstEvent.year} to ${lastEvent.year}, the archive connects ${events.length} moments of birth, relationship, memory, and change.`,
      eventLines.join(" "),
      "Read together, these records become more than dates: they form a warm first draft of the family's journey across generations.",
    ].join(" ");
  }

  return {
    timelineStoryDraft,
    privacyReminder: timelinePrivacyReminder,
    fallbackNote: "Generated with deterministic fallback from FamilySpace timeline and member data.",
    source: "deterministic",
    eventCount: events.length,
    memberIds,
  };
};

const deterministicBiography = (
  member: BiographyMember | null,
  notes: string,
  tone: BiographyTone,
): BiographyGenerationResult => {
  const name = member?.displayName?.trim() || member?.fullName?.trim() || "This family member";
  const branchName = mapBranchName(member?.familyBranchId ?? null);
  const relToRoot = mapRelationshipToRoot(member?.relationshipToRoot ?? null);
  
  let statusText = null;
  if (member?.isDeceased) {
    statusText = `${name} is marked in the archive as ${member.deceasedLabel || member.statusLabel || "deceased"}.`;
  } else if (member?.statusLabel) {
    statusText = `${name}'s profile status: ${member.statusLabel}.`;
  }

  const identityFacts = member
    ? compactLines([
        relToRoot ? `${name} is recorded as ${relToRoot}.` : null,
        branchName === "Not recorded" ? null : `This profile belongs to the ${branchName} branch.`,
        Number.isFinite(member.generation) ? `The archive places this record in generation ${member.generation}.` : null,
        member.birthDate || member.birthPlace
          ? `${name}'s birth context: ${compactLines([member.birthDate, member.birthPlace]).join(", ")}.`
          : null,
        statusText,
      ])
    : [];
  const profileContext = member ? compactLines([member.biography, member.notes]) : [];
  const noteSentence = `Family notes: ${notes.trim()}`;
  const sourceContext = profileContext.length
    ? ` Existing profile context: ${profileContext.join(" ")}`
    : "";

  let biographyDraft: string;
  if (tone === "concise") {
    biographyDraft = compactLines([
      identityFacts[0],
      noteSentence,
      "This draft keeps only details already present in the family archive and the notes provided for review.",
    ]).join(" ");
  } else if (tone === "legacy") {
    biographyDraft = compactLines([
      `${name}'s story is preserved as part of the family's living archive.`,
      ...identityFacts,
      `${noteSentence}${sourceContext}`,
      "The draft is ready for family review, correction, and source confirmation before it becomes the final biography.",
    ]).join(" ");
  } else {
    biographyDraft = compactLines([
      `${name} is remembered through the relationships, milestones, and small details preserved by the family.`,
      ...identityFacts,
      `${noteSentence}${sourceContext}`,
      "Together, these details form a warm first draft that can be refined by relatives who know the story best.",
    ]).join(" ");
  }

  return {
    biographyDraft,
    privacyReminder: biographyPrivacyReminder,
    fallbackNote: "Generated with deterministic fallback from FamilySpace data and submitted notes.",
    source: "deterministic",
  };
};

const maybeAiBiography = async (
  fallback: BiographyGenerationResult,
  member: BiographyMember | null,
  notes: string,
  tone: BiographyTone,
): Promise<BiographyGenerationResult> => {
  const apiKey = process.env.VERTEX_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    aiLog("biography_fallback_no_api_key", {
      feature: "biography",
      tone,
      hasMember: Boolean(member),
      notesLength: notes.length,
    }, "warn");
    return fallback;
  }

  const model = process.env.VERTEX_MODEL || "gemini-2.5-flash";
  const endpoint =
    process.env.VERTEX_AI_GENERATE_URL ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = [
    "You draft private family biographies for WarisanAI.",
    "Use only the member profile fields and short notes supplied below.",
    "Do not invent dates, places, achievements, occupations, names, or events.",
    "Every fact in the biography must be traceable to the member profile or the notes.",
    "Write in English, with a respectful family-archive voice.",
    `Tone: ${tone}.`,
    `Privacy reminder must be exactly: ${biographyPrivacyReminder}`,
    "Return compact JSON with keys: biographyDraft, privacyReminder, fallbackNote.",
    `Member profile: ${JSON.stringify(member)}`,
    `Short notes: ${notes}`,
  ].join("\n");

  const startedAt = Date.now();
  aiLog("biography_llm_request_start", {
    feature: "biography",
    model,
    endpointMode: process.env.VERTEX_AI_GENERATE_URL ? "custom" : "default",
    tone,
    hasMember: Boolean(member),
    notesLength: notes.length,
  });

  try {
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      aiLog("biography_llm_response_not_ok", {
        feature: "biography",
        model,
        status: response.status,
        durationMs: Date.now() - startedAt,
        errorPreview: errorText.slice(0, 500),
        fallback: true,
      }, "warn");
      return fallback;
    }
    const data = (await response.json()) as GenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") ?? "";
    const parsed = parseAiBiographyJson(text);
    if (!parsed?.biographyDraft || typeof parsed.biographyDraft !== "string") {
      aiLog("biography_llm_invalid_json", {
        feature: "biography",
        model,
        durationMs: Date.now() - startedAt,
        responseTextLength: text.length,
        rawResponsePreview: text.slice(0, 500),
        fallback: true,
      }, "warn");
      return fallback;
    }

    aiLog("biography_llm_success", {
      feature: "biography",
      model,
      durationMs: Date.now() - startedAt,
      draftLength: parsed.biographyDraft.length,
      source: "ai",
    });
    return {
      biographyDraft: parsed.biographyDraft.trim(),
      privacyReminder: biographyPrivacyReminder,
      fallbackNote: typeof parsed.fallbackNote === "string" && parsed.fallbackNote.trim()
        ? parsed.fallbackNote.trim()
        : "Generated by AI from FamilySpace data and submitted notes.",
      source: "ai",
    };
  } catch (error) {
    aiLog("biography_llm_error", {
      feature: "biography",
      model,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
      fallback: true,
    }, "warn");
    return fallback;
  }
};

const maybeAiTimelineStory = async (
  fallback: TimelineStoryResult,
  familySpaceName: string,
  events: TimelineStoryEvent[],
  tone: TimelineStoryTone,
): Promise<TimelineStoryResult> => {
  const apiKey = process.env.VERTEX_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    aiLog("timeline_story_fallback_no_api_key", {
      feature: "timeline_story",
      tone,
      eventCount: events.length,
      memberCount: fallback.memberIds.length,
    }, "warn");
    return fallback;
  }

  const model = process.env.VERTEX_MODEL || "gemini-2.5-flash";
  const endpoint =
    process.env.VERTEX_AI_GENERATE_URL ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const compactEvents = events.map((event) => ({
    year: event.year,
    type: event.type,
    title: event.title,
    description: event.description,
    memberNames: event.memberNames,
    source: event.source,
  }));
  const prompt = [
    "You draft private family timeline stories for WarisanAI.",
    "Use only the supplied deterministic timeline result and evidence list.",
    "Do not invent dates, places, people, occupations, achievements, or extra events.",
    "Every sentence must be traceable to the deterministic draft or evidence list.",
    "Write in English, with a warm private family archive voice.",
    `Tone: ${tone}.`,
    `Privacy reminder must be exactly: ${timelinePrivacyReminder}`,
    "Return compact JSON with keys: timelineStoryDraft, privacyReminder, fallbackNote.",
    `FamilySpace: ${familySpaceName}`,
    `Deterministic timeline result: ${JSON.stringify(fallback)}`,
    `Evidence list: ${JSON.stringify(compactEvents)}`,
  ].join("\n");

  const startedAt = Date.now();
  aiLog("timeline_story_llm_request_start", {
    feature: "timeline_story",
    model,
    endpointMode: process.env.VERTEX_AI_GENERATE_URL ? "custom" : "default",
    tone,
    eventCount: events.length,
    memberCount: fallback.memberIds.length,
  });

  try {
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.28,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      aiLog("timeline_story_llm_response_not_ok", {
        feature: "timeline_story",
        model,
        status: response.status,
        durationMs: Date.now() - startedAt,
        errorPreview: errorText.slice(0, 500),
        fallback: true,
      }, "warn");
      return fallback;
    }
    const data = (await response.json()) as GenerateContentResponse;
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join("\n") ?? "";
    const parsed = parseAiTimelineStoryJson(text);
    if (!parsed?.timelineStoryDraft || typeof parsed.timelineStoryDraft !== "string") {
      aiLog("timeline_story_llm_invalid_json", {
        feature: "timeline_story",
        model,
        durationMs: Date.now() - startedAt,
        responseTextLength: text.length,
        rawResponsePreview: text.slice(0, 500),
        fallback: true,
      }, "warn");
      return fallback;
    }

    aiLog("timeline_story_llm_success", {
      feature: "timeline_story",
      model,
      durationMs: Date.now() - startedAt,
      draftLength: parsed.timelineStoryDraft.length,
      source: "ai",
    });
    return {
      timelineStoryDraft: parsed.timelineStoryDraft.trim(),
      privacyReminder: timelinePrivacyReminder,
      fallbackNote: typeof parsed.fallbackNote === "string" && parsed.fallbackNote.trim()
        ? parsed.fallbackNote.trim()
        : "Generated by AI from FamilySpace timeline and member data.",
      source: "ai",
      eventCount: fallback.eventCount,
      memberIds: fallback.memberIds,
    };
  } catch (error) {
    aiLog("timeline_story_llm_error", {
      feature: "timeline_story",
      model,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
      fallback: true,
    }, "warn");
    return fallback;
  }
};

/**
 * Checks whether a cached relationship explanation is still fresh
 * based on the current state of the relationship graph.
 *
 * @param cached - The cached RelationshipExplanationHistory record
 * @param relationshipMembers - The current list of RelationshipMember objects
 * @returns true if the cache is still valid, false if stale
 */
const isCacheFresh = (
  cached: { pathMemberIds: string[]; fromMemberId: string; toMemberId: string },
  relationshipMembers: RelationshipMember[],
): boolean => {
  // Build a map of current members by ID
  const memberById = new Map(relationshipMembers.map((m) => [m.id, m]));

  // Verify every id in the cached path exists in the current members
  for (const id of cached.pathMemberIds) {
    if (!memberById.has(id)) {
      return false;
    }
  }

  // Recompute the deterministic relationship and compare path IDs
  const recomputed = deterministicRelationship(
    relationshipMembers,
    cached.fromMemberId,
    cached.toMemberId,
  );

  if (!recomputed) {
    return false;
  }

  const recomputedIds = recomputed.path.map((p) => p.id);

  // Compare lengths first for early exit
  if (recomputedIds.length !== cached.pathMemberIds.length) {
    return false;
  }

  // Compare element-wise
  for (let i = 0; i < recomputedIds.length; i++) {
    if (recomputedIds[i] !== cached.pathMemberIds[i]) {
      return false;
    }
  }

  return true;
};

export const aiRoutes = Router();

aiRoutes.post("/api/spaces/:spaceSlug/ai/generate-biography", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const memberId = asNonEmptyString(req.body?.memberId);
    const notes = asNonEmptyString(req.body?.notes);
    const tone = normalizeBiographyTone(req.body?.tone);

    if (!notes) {
      res.status(400).json({ error: "notes are required." });
      return;
    }

    if (notes.length > 6000) {
      res.status(400).json({ error: "notes must be 6000 characters or fewer." });
      return;
    }

    const member = memberId
      ? await prisma.familyMember.findUnique({
          where: {
            familySpaceId_slugId: {
              familySpaceId: req.familySpace.id,
              slugId: memberId,
            },
          },
          select: {
            slugId: true,
            fullName: true,
            displayName: true,
            gender: true,
            generation: true,
            familyBranchId: true,
            birthDate: true,
            deathDate: true,
            isDeceased: true,
            deceasedLabel: true,
            birthPlace: true,
            biography: true,
            notes: true,
            statusLabel: true,
            relationshipToRoot: true,
          },
        })
      : null;

    if (memberId && !member) {
      res.status(404).json({ error: "Member was not found in this FamilySpace." });
      return;
    }

    aiLog("biography_request", {
      feature: "biography",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      appUserId: req.appUser?.id ?? null,
      tone,
      hasMember: Boolean(member),
      notesLength: notes.length,
    });
    const fallback = deterministicBiography(member, notes, tone);
    const result = await maybeAiBiography(fallback, member, notes, tone);

    // Feature: ai-studio-experience (additive).
    // Compute Enhanced_AI_Metadata server-side from archive data only.
    // These fields are optional on the wire; legacy clients ignore them
    // and the frontend `normalizeAIResponse` tolerates their absence.
    const factsUsed = computeBiographyFactsUsed(member);
    const missingContextSuggestions = computeBiographyMissingContext(member);
    const generatedFrom = computeBiographyGeneratedFrom(tone, factsUsed);
    const confidenceLabel = computeBiographyConfidenceLabel(factsUsed);

    aiLog("biography_response", {
      feature: "biography",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      source: result.source,
      draftLength: result.biographyDraft.length,
    });
    res.json({
      // Pre-existing fields — order, names, and types preserved exactly.
      biographyDraft: result.biographyDraft,
      privacyReminder: result.privacyReminder,
      fallbackNote: result.fallbackNote,
      source: result.source,
      // Enhanced_AI_Metadata (all optional on the wire).
      tone,
      factsUsed,
      missingContextSuggestions,
      reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
      generatedFrom,
      confidenceLabel,
      warnings: [] as string[],
    });
  } catch (error) {
    handleError(res, error, "Failed to generate biography");
  }
});

aiRoutes.post("/api/spaces/:spaceSlug/ai/generate-timeline-story", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const tone = normalizeTimelineStoryTone(req.body?.tone);
    const [members, timelineEvents] = await prisma.$transaction([
      prisma.familyMember.findMany({
        where: { familySpaceId: req.familySpace.id },
        select: {
          slugId: true,
          fullName: true,
          displayName: true,
          birthDate: true,
          marriageDate: true,
          deathDate: true,
          spouseIds: true,
        },
        orderBy: [{ generation: "asc" }, { fullName: "asc" }],
      }),
      prisma.timelineEvent.findMany({
        where: { familySpaceId: req.familySpace.id },
        select: {
          slugId: true,
          year: true,
          type: true,
          title: true,
          description: true,
          relatedMemberIds: true,
          memberIds: true,
        },
        orderBy: [{ year: "asc" }, { title: "asc" }],
      }),
    ]);

    const events = buildTimelineStoryEvents(members, timelineEvents);
    aiLog("timeline_story_request", {
      feature: "timeline_story",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      appUserId: req.appUser?.id ?? null,
      tone,
      storedTimelineEventCount: timelineEvents.length,
      derivedEventCount: events.length,
      memberCount: members.length,
    });
    const fallback = deterministicTimelineStory(req.familySpace.name, events, tone);
    const result = await maybeAiTimelineStory(fallback, req.familySpace.name, events, tone);

    // Feature: ai-studio-experience (additive).
    const eventsUsed = computeTimelineEventsUsed(events);
    const missingContextSuggestions = computeTimelineMissingContext(events);
    const generatedFrom = computeTimelineGeneratedFrom(tone, events.length, members.length);

    aiLog("timeline_story_response", {
      feature: "timeline_story",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      source: result.source,
      eventCount: result.eventCount,
      draftLength: result.timelineStoryDraft.length,
    });
    res.json({
      // Pre-existing fields — order, names, and types preserved exactly.
      timelineStoryDraft: result.timelineStoryDraft,
      privacyReminder: result.privacyReminder,
      fallbackNote: result.fallbackNote,
      source: result.source,
      eventCount: result.eventCount,
      memberIds: result.memberIds,
      // Enhanced_AI_Metadata (all optional on the wire).
      tone,
      eventsUsed,
      missingContextSuggestions,
      reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
      generatedFrom,
      warnings: [] as string[],
    });
  } catch (error) {
    handleError(res, error, "Failed to generate timeline story");
  }
});

aiRoutes.post("/api/spaces/:spaceSlug/ai/explain-relationship", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const refresh = req.body?.refresh === true;
    const fromMemberId = asNonEmptyString(req.body?.fromMemberId);
    const toMemberId = asNonEmptyString(req.body?.toMemberId);
    if (!fromMemberId || !toMemberId) {
      res.status(400).json({ error: "fromMemberId and toMemberId are required." });
      return;
    }

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: req.familySpace.id },
      select: {
        slugId: true,
        fullName: true,
        displayName: true,
        gender: true,
        fatherId: true,
        motherId: true,
        spouseIds: true,
        formerSpouseIds: true,
        childrenIds: true,
        siblingIds: true,
      },
    });

    const relationshipMembers: RelationshipMember[] = members.map((member) => ({
      id: member.slugId,
      fullName: member.fullName,
      displayName: member.displayName,
      gender: member.gender,
      fatherId: member.fatherId,
      motherId: member.motherId,
      spouseIds: member.spouseIds ?? [],
      formerSpouseIds: member.formerSpouseIds ?? [],
      childrenIds: member.childrenIds ?? [],
      siblingIds: member.siblingIds ?? [],
    }));

    const memberMap = new Map(relationshipMembers.map((m) => [m.id, m]));
    const from = memberMap.get(fromMemberId);
    const to = memberMap.get(toMemberId);

    if (!from || !to) {
      res.status(404).json({ error: "One or both members were not found in this FamilySpace." });
      return;
    }

    if (!refresh) {
      const existing = await prisma.relationshipExplanationHistory.findUnique({
        where: {
          familySpaceId_fromMemberId_toMemberId: {
            familySpaceId: req.familySpace.id,
            fromMemberId,
            toMemberId,
          },
        },
      });
      if (existing) {
        // Check if the cached entry is still fresh based on current graph state
        const cacheIsFresh = isCacheFresh(existing, relationshipMembers);

        if (cacheIsFresh) {
          // Cache is fresh: increment viewCount, update lastViewedAt, respond with cached: true
          const updated = await prisma.relationshipExplanationHistory.update({
            where: { id: existing.id },
            data: {
              viewCount: { increment: 1 },
              lastViewedAt: new Date(),
            },
          });
          const path = pathFromStoredIds(updated.pathMemberIds, relationshipMembers);
          const cachedConfidence = asStoredConfidence(updated.confidence);
          aiLog("relationship_cached_response", {
            feature: "relationship",
            source: asStoredSource(updated.source),
            cached: true,
            historyId: updated.id,
          });
          res.json({
            // Pre-existing fields preserved exactly.
            relationshipLabel: updated.relationshipLabel,
            explanation: updated.explanation,
            path,
            pathMemberIds: updated.pathMemberIds,
            confidence: cachedConfidence,
            fallbackNote: updated.fallbackNote,
            source: asStoredSource(updated.source),
            cached: true,
            historyId: updated.id,
            // Enhanced_AI_Metadata (additive, optional).
            confidenceLabel: mapConfidenceToLabel(cachedConfidence),
            reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
            warnings: [] as string[],
          });
          return;
        }
        // Cache is stale: fall through to recompute-and-upsert branch
      }
    }

    const fallback = deterministicRelationship(relationshipMembers, fromMemberId, toMemberId);
    if (!fallback) {
      res.status(404).json({ error: "One or both members were not found in this FamilySpace." });
      return;
    }

    const result = await maybeAiRelationship(fallback, memberName(from), memberName(to));
    const pathMemberIds = result.path.map((item) => item.id);

    const history = await prisma.relationshipExplanationHistory.upsert({
      where: {
        familySpaceId_fromMemberId_toMemberId: {
          familySpaceId: req.familySpace.id,
          fromMemberId,
          toMemberId,
        },
      },
      create: {
        familySpaceId: req.familySpace.id,
        fromMemberId,
        toMemberId,
        relationshipLabel: result.relationshipLabel,
        explanation: result.explanation,
        fallbackNote: result.fallbackNote,
        pathMemberIds,
        confidence: result.confidence,
        source: result.source,
        createdById: req.appUser?.id ?? null,
      },
      update: {
        relationshipLabel: result.relationshipLabel,
        explanation: result.explanation,
        fallbackNote: result.fallbackNote,
        pathMemberIds,
        confidence: result.confidence,
        source: result.source,
      },
    });

    res.json({
      // Pre-existing fields preserved exactly.
      ...result,
      pathMemberIds,
      cached: false,
      historyId: history.id,
      // Enhanced_AI_Metadata (additive, optional).
      confidenceLabel: mapConfidenceToLabel(result.confidence),
      reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
      warnings: [] as string[],
    });
  } catch (error) {
    handleError(res, error, "Failed to explain relationship");
  }
});

aiRoutes.get("/api/spaces/:spaceSlug/ai/relationship-history", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const rows = await prisma.relationshipExplanationHistory.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        fromMemberId: true,
        toMemberId: true,
        relationshipLabel: true,
        explanation: true,
        pathMemberIds: true,
        confidence: true,
        source: true,
        fallbackNote: true,
        updatedAt: true,
        viewCount: true,
      },
    });

    res.json(rows);
  } catch (error) {
    handleError(res, error, "Failed to fetch relationship history");
  }
});
