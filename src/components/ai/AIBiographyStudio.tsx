import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  Clipboard,
  Edit3,
  FileText,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";
import { iconStroke } from "../ui";
import type { FamilyMember } from "../../types/family";
import type { Role } from "../../hooks/useRoleGate";
import { useAIStudioDeepLink } from "../../hooks/useAIStudioDeepLink";
import { useAIBiographyStudio } from "../../hooks/useAIBiographyStudio";
import {
  AIDraftResultCard,
  ReadableBody,
  AIDraftSkeleton,
  AIErrorState,
  AIToneSelector,
} from "./index";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIBiographyStudioProps {
  member: FamilyMember;
  spaceSlug: string;
  role: Role | null;
  panelId: string;
  onSaveMember: (member: FamilyMember, previousId?: string) => Promise<void>;
  addToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIBiographyStudio({
  member,
  spaceSlug,
  role,
  panelId,
  onSaveMember,
  addToast,
}: AIBiographyStudioProps) {
  const panelRef = useRef<HTMLElement>(null);
  useAIStudioDeepLink("biography", panelRef);

  const {
    tone,
    setTone,
    notes,
    setNotes,
    showDataDisclosure,
    setShowDataDisclosure,
    confirmRegenerate,
    setConfirmRegenerate,
    isSavingBiography,
    isSavingStory,
    editState,
    editDispatch,
    notesValidation,
    showNotesWarning,
    currentDraft,
    permissions,
    status,
    envelope,
    error,
    isBusy,
    notesWarningOverridden,
    handleGenerate,
    handleGenerateAnyway,
    handleRegenerate,
    handleConfirmRegenerate,
    handleCopy,
    handleEditDraft,
    handleSaveEdits,
    handleCancelEdit,
    handleSaveBiography,
    handleSaveStory,
  } = useAIBiographyStudio({ member, spaceSlug, role, onSaveMember, addToast });

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
        {editState.active ? (
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
        ) : (
          <button
            type="button"
            onClick={handleEditDraft}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px] active:scale-[0.98]"
          >
            <Edit3 className="h-4 w-4" strokeWidth={iconStroke} />
            Edit draft
          </button>
        )}
        <button
          type="button"
          disabled={isSavingStory || isBusy}
          onClick={() => void handleSaveStory()}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-2 text-sm font-bold text-text-primary transition hover:bg-surface-soft active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <FileText className="h-4 w-4" strokeWidth={iconStroke} />
          Save as Story
        </button>
        <button
          type="button"
          disabled={isSavingBiography || isBusy}
          onClick={() => void handleSaveBiography()}
          className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-sage-green/30 bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:bg-warm-brown active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Save className="h-4 w-4" strokeWidth={iconStroke} />
          Save to Biography
        </button>
      </>
    );
  };

  return (
    <section
      ref={panelRef}
      id={panelId}
      tabIndex={-1}
      aria-label="AI Biography Studio"
      className="flex flex-col gap-5 rounded-[1.8rem] border border-border-soft bg-surface p-4 shadow-soft ring-1 ring-border-soft/60 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">
            AI Biography Studio
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-text-primary">
            Draft a biography from notes
          </h2>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
          <BookOpen className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
      </div>

      {/* Source-context panel */}
      <div className="grid gap-3 rounded-[1.35rem] border border-border-soft bg-background p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
          Source context
        </p>
        <div className="grid gap-2 text-sm font-semibold leading-6 text-text-primary">
          <p>
            <span className="text-text-muted">Name:</span>{" "}
            {member.displayName || member.fullName}
          </p>
          <p>
            <span className="text-text-muted">Relationship to root:</span>{" "}
            {member.relationshipToRoot || "Not recorded"}
          </p>
          {member.biography && (
            <p className="line-clamp-2">
              <span className="text-text-muted">Biography:</span>{" "}
              {member.biography}
            </p>
          )}
          {member.notes && (
            <p className="line-clamp-2">
              <span className="text-text-muted">Notes:</span> {member.notes}
            </p>
          )}
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
              <li>Display name: {member.displayName || member.fullName}</li>
              <li>Relationship to root: {member.relationshipToRoot || "—"}</li>
              <li>Birth date: {member.birthDate || "—"}</li>
              <li>Birth place: {member.birthPlace || "—"}</li>
              <li>Biography: {member.biography ? "on file" : "—"}</li>
              <li>Notes: {member.notes ? "on file" : "—"}</li>
              <li>Status: {member.statusLabel || "—"}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Notes textarea */}
      <label className="block">
        <span className="mb-2 block text-sm font-bold text-text-primary">
          Notes for the draft
        </span>
        <textarea
          disabled={!permissions.canGenerate}
          className="min-h-32 w-full resize-y rounded-[1.15rem] border border-border-soft bg-background p-4 text-sm font-semibold leading-6 text-text-primary outline-none shadow-soft transition placeholder:text-text-muted/60 hover:border-sage-green/40 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 disabled:cursor-not-allowed disabled:opacity-60"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
          }}
          placeholder="Write short notes about this family member — memories, anecdotes, facts the draft can weave in."
        />
      </label>

      {/* Notes warning (Requirement 8.1) */}
      {showNotesWarning && (
        <div className="flex flex-col gap-2 rounded-[1.15rem] border border-soft-gold/30 bg-soft-gold/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold leading-6 text-warm-brown">
            {notesValidation.message}
          </p>
          <button
            type="button"
            onClick={handleGenerateAnyway}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-warm-brown/25 bg-surface px-3 py-1.5 text-xs font-bold text-warm-brown transition hover:bg-soft-gold/15 active:translate-y-[1px] active:scale-[0.98]"
          >
            Generate anyway
          </button>
        </div>
      )}

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
        disabled={isBusy || !permissions.canGenerate || (!notes.trim() && !notesWarningOverridden)}
        onClick={showNotesWarning ? undefined : handleGenerate}
        className="group flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-dark-green px-5 py-3 text-sm font-extrabold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        <Sparkles className="h-4 w-4" strokeWidth={iconStroke} />
        Generate biography draft
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-text-primary/30 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="w-full max-w-md rounded-[2rem] border border-border-soft bg-surface p-6 shadow-warm"
            >
              <h3 className="text-lg font-bold text-text-primary">
                Discard your edits and regenerate from the original notes?
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">
                Your current edits will be lost. The draft will be regenerated
                with the same notes and tone.
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result card */}
      <AnimatePresence mode="wait">
        {envelope && status !== "loading" && (
          <AIDraftResultCard
            key="biography-result"
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
            actions={renderActions()}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
