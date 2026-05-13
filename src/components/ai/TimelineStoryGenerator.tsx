import { AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  Clipboard,
  Edit3,
  FileText,
  RefreshCw,
  Route,
  Sparkles,
} from "lucide-react";
import { useCallback, useReducer, useRef, useState } from "react";
import { iconStroke } from "../ui";
import type { SpaceSummary } from "../../types/family";
import { useAIDraft } from "../../hooks/useAIDraft";
import { useRoleGate, type Role } from "../../hooks/useRoleGate";
import { useAIStudioDeepLink } from "../../hooks/useAIStudioDeepLink";
import { spaceFetch, apiErrorMessage } from "../../lib/api";
import {
  AIDraftResultCard,
  ReadableBody,
  AIDraftSkeleton,
  AIErrorState,
  AIToneSelector,
  buildTimelineStoryGenerateBody,
  deriveGeneratedFromTimeline,
  deriveMissingContextForTimeline,
  type AIDraftTone,
  type NormalizeFallbacks,
  type TimelineStoryGenerateRequest,
} from "./index";
import { editModeReducer, createInitialEditState } from "./editModeReducer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimelineStoryGeneratorProps {
  spaceSlug: string;
  familySpaceName: string;
  role: Role | null;
  panelId: string;
  summary: SpaceSummary | null;
  timelineCount: number;
  memberCount: number;
  generationsCount: number;
  addToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a story title from the events-used list. Extracts the first and
 * last four-digit year to form a span. Falls back to a generic title. */
function deriveStoryTitle(
  familySpaceName: string,
  eventsUsed: string[],
): string {
  if (!eventsUsed.length) return "Family timeline story draft";
  const years = eventsUsed
    .map((line) => {
      const match = line.match(/\d{4}/);
      return match ? Number.parseInt(match[0], 10) : null;
    })
    .filter((y): y is number => y !== null)
    .sort((a, b) => a - b);
  if (years.length === 0) return "Family timeline story draft";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last
    ? `${familySpaceName} timeline story ${first}`
    : `Family timeline story ${first}-${last}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimelineStoryGenerator({
  spaceSlug,
  familySpaceName,
  role,
  panelId,
  summary,
  timelineCount,
  memberCount,
  generationsCount,
  addToast,
}: TimelineStoryGeneratorProps) {
  const panelRef = useRef<HTMLElement>(null);
  useAIStudioDeepLink("timeline-story", panelRef);

  const permissions = useRoleGate(role);
  const [tone, setTone] = useState<AIDraftTone>("warm");
  const [showDataDisclosure, setShowDataDisclosure] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);

  const [editState, editDispatch] = useReducer(
    editModeReducer,
    createInitialEditState(""),
  );

  const fallbacks: NormalizeFallbacks = {
    privacy: "AI timeline stories stay inside this family space until reviewed.",
    fallbackNote:
      "Generated with deterministic fallback from the FamilySpace timeline.",
    generatedFrom: deriveGeneratedFromTimeline({
      tone,
      memberCount,
      eventCount: timelineCount,
      generationsCount,
    }),
    missingContext: deriveMissingContextForTimeline(
      // Pass an empty array when timelineCount is 0 to trigger the fixed hints.
      timelineCount > 0 ? [{ id: "x", year: "2000", type: "Other", title: "x", description: "" }] : [],
    ),
  };

  const {
    status,
    envelope,
    error,
    isBusy,
    generate,
    regenerate,
  } = useAIDraft<TimelineStoryGenerateRequest>(spaceSlug, {
    kind: "timeline-story",
    endpoint: "/ai/generate-timeline-story",
    buildBody: buildTimelineStoryGenerateBody,
    fallbacks,
    tone: () => tone,
  });

  const handleGenerate = useCallback(() => {
    if (!permissions.canGenerate) return;
    void generate({ tone });
  }, [permissions.canGenerate, generate, tone]);

  const handleRegenerate = useCallback(() => {
    if (editState.active) {
      setConfirmRegenerate(true);
      return;
    }
    void regenerate();
  }, [editState.active, regenerate]);

  const handleConfirmRegenerate = useCallback(() => {
    editDispatch({ type: "cancel" });
    setConfirmRegenerate(false);
    void regenerate();
  }, [regenerate]);

  const handleCopy = useCallback(async () => {
    if (!envelope) return;
    const text = editState.active ? editState.draft : envelope.body;
    try {
      await navigator.clipboard.writeText(text);
      addToast("Copied to clipboard", "success");
    } catch {
      addToast("Clipboard access was blocked", "error");
    }
  }, [envelope, editState, addToast]);

  const handleEditDraft = useCallback(() => {
    if (!envelope) return;
    editDispatch({ type: "setDraft", draft: envelope.body });
    editDispatch({ type: "setActive", active: true });
  }, [envelope]);

  const handleSaveEdits = useCallback(() => {
    editDispatch({ type: "saveEdits" });
  }, []);

  const handleCancelEdit = useCallback(() => {
    editDispatch({ type: "cancel" });
  }, []);

  const currentDraft = editState.active ? editState.draft : (envelope?.body ?? "");

  const handleSaveStory = useCallback(async () => {
    if (!permissions.canSave || !currentDraft) return;
    setIsSavingStory(true);
    try {
      const title = deriveStoryTitle(
        familySpaceName,
        envelope?.eventsUsed ?? [],
      );
      const response = await spaceFetch(spaceSlug, "/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: currentDraft,
          origin: "ai_timeline",
          relatedMemberIds: [],
          sourceNoteIds: [],
        }),
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to save story draft."));
      }
      addToast("Timeline story draft saved", "success");
    } catch {
      addToast("Failed to save story draft", "error");
    } finally {
      setIsSavingStory(false);
    }
  }, [permissions.canSave, currentDraft, spaceSlug, familySpaceName, envelope, addToast]);

  // Action buttons for the result card.
  const renderActions = () => {
    if (!envelope) return null;
    if (!permissions.canGenerate) return null;
    return (
      <>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px] active:scale-[0.98]"
        >
          <Clipboard className="h-4 w-4" strokeWidth={iconStroke} />
          Copy
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={handleRegenerate}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={iconStroke} />
          Regenerate
        </button>
        {!editState.active ? (
          <button
            type="button"
            onClick={handleEditDraft}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px] active:scale-[0.98]"
          >
            <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
            Edit draft
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSaveEdits}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sage-green/30 bg-sage-green/12 px-4 py-2 text-sm font-bold text-dark-green transition hover:bg-sage-green/20 active:translate-y-[1px] active:scale-[0.98]"
            >
              Save edits
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px] active:scale-[0.98]"
            >
              Cancel
            </button>
          </>
        )}
        <button
          type="button"
          disabled={isSavingStory || isBusy}
          onClick={() => void handleSaveStory()}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sage-green/30 bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:bg-warm-brown active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <FileText className="h-4 w-4" strokeWidth={iconStroke} />
          Save as Story
        </button>
      </>
    );
  };

  return (
    <section
      ref={panelRef}
      id={panelId}
      tabIndex={-1}
      aria-label="AI Timeline Story Generator"
      className="flex flex-col gap-5 rounded-[1.8rem] border border-border-soft bg-surface p-4 shadow-soft ring-1 ring-border-soft/60 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">
            AI Timeline Story
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-text-primary">
            Turn milestones into a readable family journey
          </h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
          <Calendar className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
      </div>

      {/* Archive-context panel */}
      <div className="grid gap-3 rounded-[1.35rem] border border-border-soft bg-background p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Members
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text-primary">
            {memberCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Timeline events
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text-primary">
            {timelineCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
            Generations
          </p>
          <p className="mt-1 font-display text-2xl font-bold text-text-primary">
            {generationsCount}
          </p>
        </div>
      </div>

      {/* What data will AI use? disclosure */}
      <div className="rounded-[1.35rem] border border-border-soft bg-background">
        <button
          type="button"
          onClick={() => setShowDataDisclosure((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px]"
        >
          <span>What data will AI use?</span>
          <ChevronDown
            className={`h-4 w-4 text-text-muted transition ${showDataDisclosure ? "rotate-180" : ""}`}
            strokeWidth={iconStroke}
          />
        </button>
        {showDataDisclosure && (
          <div className="border-t border-border-soft px-4 py-3 text-sm font-semibold leading-6 text-text-muted">
            <ul className="grid gap-1">
              <li>Member count: {memberCount}</li>
              <li>Timeline event count: {timelineCount}</li>
              <li>Generation count: {generationsCount}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Tone selector */}
      <AIToneSelector
        value={tone}
        onChange={setTone}
        variant="on-surface"
        disabled={!permissions.canGenerate}
      />

      {/* Primary action */}
      <button
        type="button"
        disabled={isBusy || !permissions.canGenerate}
        onClick={handleGenerate}
        className="group flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-dark-green px-5 py-3 text-sm font-extrabold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        <Route className="h-4 w-4" strokeWidth={iconStroke} />
        Create timeline story
      </button>

      {/* Role-gating banner */}
      {!permissions.canGenerate && (
        <p className="rounded-[1rem] border border-border-soft bg-surface-soft px-4 py-3 text-sm font-semibold leading-6 text-text-muted">
          This FamilySpace is read-only for your role. Owners and admins can save AI drafts.
        </p>
      )}

      {/* Loading skeleton */}
      {status === "loading" && <AIDraftSkeleton variant="on-surface" />}

      {/* Error state */}
      {status === "error" && error && (
        <AIErrorState
          message={error}
          onRetry={handleGenerate}
          variant="on-surface"
          disabled={isBusy}
        />
      )}

      {/* Confirm regenerate modal */}
      <AnimatePresence>
        {confirmRegenerate && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-text-primary/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2rem] border border-border-soft bg-surface p-6 shadow-warm">
              <h3 className="text-lg font-bold text-text-primary">
                Discard your edits and regenerate?
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Your current edits will be lost. The story will be regenerated
                with the same tone.
              </p>
              <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmRegenerate(false)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-soft transition hover:bg-surface-soft active:translate-y-[1px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRegenerate}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:bg-warm-brown active:translate-y-[1px]"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Result card — only rendered after first response (Requirement 5.5) */}
      <AnimatePresence mode="wait">
        {envelope && status !== "loading" && (
          <AIDraftResultCard
            key="timeline-story-result"
            envelope={envelope}
            mode={editState.active ? "editing" : "reading"}
            variant="on-surface"
            body={
              editState.active ? (
                <textarea
                  className="min-h-48 w-full resize-y rounded-[1rem] border border-border-soft bg-background p-4 text-sm font-semibold leading-7 text-text-primary outline-none shadow-soft transition focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
                  value={editState.draft}
                  onChange={(e) =>
                    editDispatch({ type: "setDraft", draft: e.target.value })
                  }
                />
              ) : (
                <ReadableBody text={envelope.body} variant="on-surface" />
              )
            }
            afterBody={
              envelope.eventsUsed.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
                    Events used
                  </p>
                  <ul className="grid gap-1 text-sm font-semibold leading-6 text-text-primary">
                    {envelope.eventsUsed.map((event) => (
                      <li key={event} className="flex items-start gap-2">
                        <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-sage-green" strokeWidth={iconStroke} />
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : undefined
            }
            actions={renderActions()}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
