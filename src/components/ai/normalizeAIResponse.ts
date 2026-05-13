import {
  AIDraftConfidence,
  AIDraftEnvelope,
  AIDraftKind,
  AIDraftSource,
  AIDraftTone,
  DEFAULT_FALLBACK_NOTE,
  DEFAULT_PRIVACY_REMINDER,
  DEFAULT_REVIEW_CHECKLIST,
  NormalizeFallbacks,
} from "./AIDraftEnvelope";

const VALID_TONES: readonly AIDraftTone[] = ["warm", "concise", "legacy"];
const VALID_CONFIDENCE: readonly AIDraftConfidence[] = [
  "high",
  "medium",
  "low",
];

/** Reads a string field, stripping surrounding whitespace. Returns `""`
 * when the value is missing or not a string. */
const readString = (raw: unknown, key: string): string => {
  if (raw === null || typeof raw !== "object") return "";
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
};

/** Reads an array of strings, dropping any non-string entries (defensive
 * against legacy payloads). Always returns an array. */
const readStringArray = (raw: unknown, key: string): string[] => {
  if (raw === null || typeof raw !== "object") return [];
  const value = (raw as Record<string, unknown>)[key];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
};

/** Read the raw `source` string without coercion. */
const readRawSource = (raw: unknown): string => readString(raw, "source");

/** Read the raw `tone` string without coercion. */
const readRawTone = (raw: unknown): string => readString(raw, "tone");

const readRawConfidence = (raw: unknown): string =>
  readString(raw, "confidence");

/** Merge backend checklist items with the four required defaults in document
 * order. De-duplication is case-insensitive on trimmed content so small
 * casing variations from the model do not produce duplicate bullets. */
const mergeReviewChecklist = (backendItems: string[]): string[] => {
  const merged: string[] = [];
  const seen = new Set<string>();
  const push = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  };
  for (const item of backendItems) push(item);
  for (const item of DEFAULT_REVIEW_CHECKLIST) push(item);
  return merged;
};

/** Coerce any value to the canonical `"ai" | "deterministic"` union. Anything
 * that is not literally `"ai"` becomes `"deterministic"` (fail safe). */
const coerceSource = (rawSource: string): AIDraftSource =>
  rawSource === "ai" ? "ai" : "deterministic";

const coerceConfidence = (raw: string): AIDraftConfidence | undefined => {
  return (VALID_CONFIDENCE as readonly string[]).includes(raw)
    ? (raw as AIDraftConfidence)
    : undefined;
};

const isDev = (): boolean => {
  try {
    return Boolean(
      (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV,
    );
  } catch {
    return false;
  }
};

export interface NormalizeRequest {
  kind: AIDraftKind;
  tone?: AIDraftTone;
}

/**
 * Canonicalize a raw backend AI response into a strict `AIDraftEnvelope`.
 *
 * `raw` is accepted as `unknown` and every read is defensive; the backend
 * contract is additive, but malformed payloads (network errors injecting
 * HTML, older deploys, proxies) must never throw here.
 */
export function normalizeAIResponse(
  raw: unknown,
  request: NormalizeRequest,
  fallbacks: NormalizeFallbacks,
): AIDraftEnvelope {
  const source = coerceSource(readRawSource(raw));

  // Body text varies per kind. We accept all three possible fields so legacy
  // surfaces keep rendering, and prefer the one that actually carries text.
  const biographyDraft = readString(raw, "biographyDraft");
  const timelineDraft = readString(raw, "timelineStoryDraft");
  const explanation = readString(raw, "explanation");
  let body = "";
  switch (request.kind) {
    case "biography":
      body = biographyDraft || timelineDraft || explanation;
      break;
    case "timeline-story":
      body = timelineDraft || biographyDraft || explanation;
      break;
    case "relationship":
      body = explanation || biographyDraft || timelineDraft;
      break;
  }

  // Privacy / fallback cascade: backend → request fallbacks → per-kind default.
  const rawPrivacy = readString(raw, "privacyReminder").trim();
  const rawFallback = readString(raw, "fallbackNote").trim();
  const privacyReminder =
    rawPrivacy ||
    rawFallback ||
    fallbacks.privacy.trim() ||
    DEFAULT_PRIVACY_REMINDER[request.kind];
  const fallbackNote =
    rawFallback ||
    fallbacks.fallbackNote.trim() ||
    DEFAULT_FALLBACK_NOTE[request.kind];

  // Tone. The requested tone always wins (Property 3 / Requirement 13.4).
  // Only biography and timeline-story envelopes carry a tone; relationship
  // envelopes stay tone-agnostic.
  let tone: AIDraftTone | null = null;
  if (request.kind !== "relationship") {
    const requested =
      request.tone && VALID_TONES.includes(request.tone)
        ? request.tone
        : "warm";
    const backendTone = readRawTone(raw);
    if (
      backendTone &&
      VALID_TONES.includes(backendTone as AIDraftTone) &&
      backendTone !== requested
    ) {
      if (isDev()) {
        // Dev-only signal; never surfaced to users (Requirement 13.4).
        // eslint-disable-next-line no-console
        console.warn(
          `[AI] backend tone "${backendTone}" differed from requested "${requested}"; requested tone wins.`,
        );
      }
    }
    tone = requested;
  }

  const factsUsed = readStringArray(raw, "factsUsed");
  const eventsUsed = readStringArray(raw, "eventsUsed");
  const backendMissing = readStringArray(raw, "missingContextSuggestions");
  const backendGeneratedFrom = readStringArray(raw, "generatedFrom");
  const warnings = readStringArray(raw, "warnings");

  const factsForEnvelope = factsUsed.length ? factsUsed : fallbacks.factsUsed ?? [];
  const eventsForEnvelope = eventsUsed.length
    ? eventsUsed
    : fallbacks.eventsUsed ?? [];
  const missingContext = backendMissing.length
    ? backendMissing
    : fallbacks.missingContext ?? [];
  const generatedFrom = backendGeneratedFrom.length
    ? backendGeneratedFrom
    : fallbacks.generatedFrom ?? [];

  const reviewChecklist = mergeReviewChecklist(
    readStringArray(raw, "reviewChecklist"),
  );

  // Relationship-specific fields. All optional; kept as-is for the panel.
  const relationshipLabel = readString(raw, "relationshipLabel").trim() || undefined;
  const rawPath = (raw as { path?: unknown } | null | undefined)?.path;
  const path: Array<{ id: string; name: string }> = Array.isArray(rawPath)
    ? rawPath
        .map((step) => {
          if (step === null || typeof step !== "object") return null;
          const id = typeof (step as { id?: unknown }).id === "string"
            ? (step as { id: string }).id
            : "";
          const name =
            typeof (step as { name?: unknown }).name === "string"
              ? (step as { name: string }).name
              : "";
          if (!id) return null;
          return { id, name };
        })
        .filter((step): step is { id: string; name: string } => step !== null)
    : [];
  const confidence =
    request.kind === "relationship"
      ? coerceConfidence(readRawConfidence(raw))
      : undefined;

  const cachedValue = (raw as { cached?: unknown } | null | undefined)?.cached;
  const cached = typeof cachedValue === "boolean" ? cachedValue : undefined;
  const historyId = readString(raw, "historyId").trim() || undefined;

  return {
    kind: request.kind,
    body,
    source,
    privacyReminder,
    fallbackNote,
    tone,
    confidence,
    factsUsed: factsForEnvelope,
    eventsUsed: eventsForEnvelope,
    generatedFrom,
    missingContext,
    reviewChecklist,
    warnings,
    cached,
    historyId,
    relationshipLabel: request.kind === "relationship" ? relationshipLabel : undefined,
    path: request.kind === "relationship" ? path : undefined,
  };
}
