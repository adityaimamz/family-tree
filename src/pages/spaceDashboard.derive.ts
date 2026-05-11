import {
  BookOpen,
  Calendar,
  ClipboardList,
  GitBranch,
  Images,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export type ArchiveChecklistItem = {
  label: string;
  detail: string;
  complete: boolean;
};

export type SuggestedStep = {
  title: string;
  description: string;
  to: "tree" | "members" | "timeline" | "gallery" | "stories";
  icon: LucideIcon;
};

export type CompletionLabel = "Archive foundation" | "Growing archive" | "Publication-ready archive";

export type ArchiveSignal = string;

export type DashboardCounts = {
  membersCount: number;
  generations: number;
  timelineCount: number;
  galleryCount: number;
  storiesCount: number;
};

// =============================================================================
// Pure Derivation Functions
// =============================================================================

/**
 * Determines if the archive has enough context for AI-assisted features.
 * Returns true when there are at least 2 members, or any timeline events, or any story drafts.
 */
export function deriveAiReady(counts: DashboardCounts): boolean {
  const { membersCount, timelineCount, storiesCount } = counts;
  return membersCount >= 2 || timelineCount > 0 || storiesCount > 0;
}

/**
 * Derives the 6-item archive checklist based on current counts and AI readiness.
 * The 6th item detail is aiReady-aware.
 */
export function deriveArchiveChecklist(
  counts: DashboardCounts,
  aiReady: boolean,
): ArchiveChecklistItem[] {
  const { membersCount, generations, timelineCount, galleryCount, storiesCount } = counts;

  return [
    {
      label: "Family tree started",
      detail:
        membersCount > 0
          ? "The archive has a visible relationship base."
          : "Add the first family member record.",
      complete: membersCount > 0,
    },
    {
      label: "At least 3 members preserved",
      detail:
        membersCount >= 3
          ? `${membersCount} member records preserved.`
          : "Start with the relatives closest to the root family.",
      complete: membersCount >= 3,
    },
    {
      label: "More than 1 generation connected",
      detail:
        generations > 1
          ? `${generations} generations are connected in this archive.`
          : "Connect parents, children, or elders to show continuity.",
      complete: generations > 1,
    },
    {
      label: "Timeline has events",
      detail:
        timelineCount > 0
          ? `${timelineCount} milestones can anchor family stories.`
          : "Add dates that explain moves, weddings, reunions, or births.",
      complete: timelineCount > 0,
    },
    {
      label: "Photos connected",
      detail:
        galleryCount > 0
          ? `${galleryCount} photo memories are stored in this archive.`
          : "Connect old photos to their family context.",
      complete: galleryCount > 0,
    },
    {
      label: "Story drafts started or AI assistant ready",
      detail:
        storiesCount > 0
          ? `${storiesCount} story drafts are waiting for review.`
          : aiReady
            ? "There is enough archive context to start AI-assisted drafts."
            : "Add members or milestones before using AI-assisted drafts.",
      complete: storiesCount > 0 || aiReady,
    },
  ];
}

/**
 * Derives the completion label based on the completion percentage.
 * - 0-30%: "Archive foundation"
 * - 31-70%: "Growing archive"
 * - 71-100%: "Publication-ready archive"
 */
export function deriveCompletionLabel(percent: number): CompletionLabel {
  if (percent <= 30) return "Archive foundation";
  if (percent <= 70) return "Growing archive";
  return "Publication-ready archive";
}

/**
 * Derives 1-3 suggested steps in priority order:
 * members gap → generations gap → timeline gap → gallery gap → stories gap → AI-assisted
 */
export function deriveSuggestedSteps(counts: DashboardCounts): SuggestedStep[] {
  const { membersCount, generations, timelineCount, galleryCount, storiesCount } = counts;
  const steps: SuggestedStep[] = [];

  // Members gap
  if (membersCount === 0) {
    steps.push({
      title: "Add the first family member",
      description: "Create the root record so this archive has a starting point.",
      to: "members",
      icon: Users,
    });
  }

  // Generations gap
  if (membersCount > 0 && generations < 2) {
    steps.push({
      title: "Connect another generation",
      description: "Add parents, children, or elders so the tree shows continuity.",
      to: "members",
      icon: GitBranch,
    });
  }

  // Timeline gap
  if (timelineCount === 0) {
    steps.push({
      title: "Add the first milestone",
      description: "Anchor the archive with a birth, move, wedding, reunion, or milestone.",
      to: "timeline",
      icon: Calendar,
    });
  }

  // Gallery gap
  if (galleryCount === 0) {
    steps.push({
      title: "Connect a photo memory",
      description: "Save one photo with context so it becomes part of the family record.",
      to: "gallery",
      icon: Images,
    });
  }

  // Stories gap
  if (storiesCount === 0) {
    steps.push({
      title: "Draft the first family story",
      description: "Capture a remembered moment before it stays only in conversation.",
      to: "stories",
      icon: BookOpen,
    });
  }

  // All gaps filled - return AI-assisted steps
  if (steps.length === 0) {
    steps.push(
      {
        title: "Explain a relationship",
        description: "Open the tree and ask how two relatives are connected.",
        to: "tree",
        icon: GitBranch,
      },
      {
        title: "Generate a biography",
        description: "Start from a member profile and turn short notes into a warm draft.",
        to: "members",
        icon: BookOpen,
      },
      {
        title: "Create a timeline story",
        description: "Turn preserved milestones into a readable family journey.",
        to: "timeline",
        icon: ClipboardList,
      },
    );
  }

  return steps.slice(0, 3);
}

/**
 * Derives 5 formatted signal strings in fixed order:
 * 1. relatives available
 * 2. generations connected
 * 3. milestones can become anchors
 * 4. photo memories have context
 * 5. story drafts waiting
 */
export function deriveArchiveSignals(counts: DashboardCounts): ArchiveSignal[] {
  const { membersCount, generations, timelineCount, galleryCount, storiesCount } = counts;

  return [
    `${membersCount} relatives are available for browsing.`,
    `${generations} generations are connected in this archive.`,
    `${timelineCount} milestones can become story anchors.`,
    `${galleryCount} photo memories have saved context.`,
    `${storiesCount} story drafts are waiting for review.`,
  ];
}


export type AIRecommendationKey =
  | "relationship"
  | "biography"
  | "timeline-story"
  | "review-stories";

export interface AIRecommendation {
  key: AIRecommendationKey;
  title: string;
  description: string;
  /** Relative path under `/app/:spaceSlug/`. */
  to: string;
}

export interface AIReadinessInput {
  membersCount: number;
  timelineCount: number;
  storiesCount: number;
  memberWithNotesId: string | null;
}

/**
 * Pure derivation. Each recommendation appears iff its archive-signal rule
 * is satisfied; the array is empty iff none of the four rules hold so the
 * block can render its own empty state.
 */
export function deriveAIReadinessRecommendations(
  input: AIReadinessInput,
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];

  if (input.membersCount >= 2) {
    recommendations.push({
      key: "relationship",
      title: "Explain a relationship",
      description:
        "Open the tree and ask how two relatives are connected, in plain language.",
      to: "tree?ai=relationship",
    });
  }

  if (input.memberWithNotesId) {
    recommendations.push({
      key: "biography",
      title: "Generate a biography",
      description:
        "Turn the notes you already saved into a reviewable biography draft.",
      to: `members/${input.memberWithNotesId}?ai=biography`,
    });
  }

  if (input.timelineCount > 0) {
    recommendations.push({
      key: "timeline-story",
      title: "Create a timeline story",
      description:
        "Weave your saved milestones into a warm, readable family journey.",
      to: "timeline?ai=timeline-story",
    });
  }

  if (input.storiesCount > 0) {
    recommendations.push({
      key: "review-stories",
      title: "Review story drafts",
      description:
        "Continue refining saved drafts before they become final archive stories.",
      to: "stories",
    });
  }

  return recommendations;
}
