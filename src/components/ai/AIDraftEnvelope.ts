export type AIDraftSource = "ai" | "deterministic";

export type AIDraftTone = "warm" | "concise" | "legacy";

export type AIDraftConfidence = "high" | "medium" | "low";

export type AIDraftKind = "biography" | "timeline-story" | "relationship";

export interface AIDraftEnvelope {
  kind: AIDraftKind;
  /** Draft body. For relationship the explanation text only. */
  body: string;
  source: AIDraftSource;
  /** Guaranteed non-empty after normalization. */
  privacyReminder: string;
  /** Guaranteed non-empty after normalization. */
  fallbackNote: string;
  /** `null` for relationship envelopes; otherwise the tone requested. */
  tone: AIDraftTone | null;
  /** Only set for relationship envelopes. */
  confidence?: AIDraftConfidence;
  factsUsed: string[];
  eventsUsed: string[];
  /** Derived chip labels; never undefined. */
  generatedFrom: string[];
  missingContext: string[];
  /** Always a superset of `DEFAULT_REVIEW_CHECKLIST`. */
  reviewChecklist: string[];
  warnings: string[];
  cached?: boolean;
  historyId?: string;
  /** Relationship-specific raw label (kept for clipboard payload). */
  relationshipLabel?: string;
  /** Relationship-specific path visualization; empty for other kinds. */
  path?: Array<{ id: string; name: string }>;
}

/** Shape accepted by `normalizeAIResponse` so every kind can supply its own
 * privacy, fallback, and derivation defaults without the normalizer needing
 * to know which page is calling it. */
export interface NormalizeFallbacks {
  privacy: string;
  fallbackNote: string;
  factsUsed?: string[];
  eventsUsed?: string[];
  missingContext?: string[];
  generatedFrom?: string[];
}

export const DEFAULT_REVIEW_CHECKLIST = [
  "Check names",
  "Check dates",
  "Check sensitive details",
  "Ask a family reviewer before saving as final",
] as const;

export const FAMILY_REVIEW_REMINDER =
  "Confirm names, dates, and sensitive details with a family reviewer before saving as final.";

export const AI_DEEP_LINK_TARGETS = [
  "relationship",
  "biography",
  "timeline-story",
] as const;

export type AIDeepLinkTarget = (typeof AI_DEEP_LINK_TARGETS)[number];

/** Exact badge text for the source pill on `AIDraftMeta`. */
export const SOURCE_BADGE_TEXT: Record<AIDraftSource, string> = {
  ai: "AI-assisted draft",
  deterministic: "Deterministic fallback",
};

/** Per-kind default privacy reminder used when the backend omits `privacyReminder`
 * and `fallbackNote` both end up empty. Keeps the privacy invariant tight. */
export const DEFAULT_PRIVACY_REMINDER: Record<AIDraftKind, string> = {
  biography: "AI drafts stay inside this family space until reviewed.",
  "timeline-story":
    "AI timeline stories stay inside this family space until reviewed.",
  relationship: "This explanation only uses data inside this FamilySpace.",
};

export const DEFAULT_FALLBACK_NOTE: Record<AIDraftKind, string> = {
  biography:
    "Generated with deterministic fallback from the member profile fields.",
  "timeline-story":
    "Generated with deterministic fallback from the FamilySpace timeline.",
  relationship:
    "Explanation derived deterministically from the archive relationship graph.",
};
