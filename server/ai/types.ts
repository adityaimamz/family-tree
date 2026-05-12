export type BiographyTone = "warm" | "concise" | "legacy";
export type BiographySource = "ai" | "deterministic";
export type TimelineStoryTone = "warm" | "concise" | "legacy";
export type TimelineStorySource = "ai" | "deterministic";
export type ConfidenceLabel =
  | "direct"
  | "inferred"
  | "uncertain"
  | "high-detail"
  | "medium-detail"
  | "low-detail";

export type BiographyMember = {
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

export type BiographyGenerationResult = {
  biographyDraft: string;
  privacyReminder: string;
  fallbackNote: string;
  source: BiographySource;
};

export type TimelineStoryEvent = {
  id: string;
  year: string;
  type: string;
  title: string;
  description: string;
  memberIds: string[];
  memberNames: string[];
  source: "timeline" | "member";
};

export type TimelineStoryResult = {
  timelineStoryDraft: string;
  privacyReminder: string;
  fallbackNote: string;
  source: TimelineStorySource;
  eventCount: number;
  memberIds: string[];
};

export type GenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};
