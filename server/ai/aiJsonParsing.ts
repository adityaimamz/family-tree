import type { BiographyGenerationResult, TimelineStoryResult } from "./types.js";

/**
 * Try to extract a JSON string value for a given key from possibly-truncated text.
 * Falls back to regex extraction when JSON.parse fails (e.g. when LLM output is cut off).
 */
export const extractJsonStringValue = (text: string, ...keys: string[]): string | undefined => {
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

export const parseAiBiographyJson = (text: string): Partial<BiographyGenerationResult> | null => {
  // First try: full JSON parse
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try {
      const raw = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        biographyDraft: (raw.biographyDraft ?? raw.biography_draft ?? raw.draft) as
          | string
          | undefined,
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

export const parseAiTimelineStoryJson = (text: string): Partial<TimelineStoryResult> | null => {
  // First try: full JSON parse
  const match = /\{[\s\S]*\}/.exec(text);
  if (match) {
    try {
      const raw = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        timelineStoryDraft: (raw.timelineStoryDraft ??
          raw.timeline_story_draft ??
          raw.story_draft ??
          raw.draft ??
          raw.story) as string | undefined,
        privacyReminder: (raw.privacyReminder ?? raw.privacy_reminder) as string | undefined,
        fallbackNote: (raw.fallbackNote ?? raw.fallback_note) as string | undefined,
      } as Partial<TimelineStoryResult>;
    } catch {
      // JSON incomplete — fall through to regex extraction
    }
  }
  // Fallback: regex extraction from truncated JSON
  const draft = extractJsonStringValue(
    text,
    "timelineStoryDraft",
    "timeline_story_draft",
    "story_draft",
    "draft",
    "story",
  );
  if (!draft) return null;
  return {
    timelineStoryDraft: draft,
    privacyReminder: extractJsonStringValue(text, "privacyReminder", "privacy_reminder"),
    fallbackNote: extractJsonStringValue(text, "fallbackNote", "fallback_note"),
  } as Partial<TimelineStoryResult>;
};
