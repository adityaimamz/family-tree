import { useCallback, useReducer, useState } from "react";
import type { FamilyMember } from "../types/family";
import { useAIDraft } from "./useAIDraft";
import type { AIDraftStatus } from "./useAIDraft";
import { useRoleGate, type Role } from "./useRoleGate";
import { editModeReducer, createInitialEditState } from "../components/ai/editModeReducer";
import type { EditModeState, EditModeAction } from "../components/ai/editModeReducer";
import {
  buildBiographyGenerateBody,
  buildSaveBiographyBody,
  validateBiographyNotes,
  deriveGeneratedFrom,
  deriveMissingContextForBiography,
  type AIDraftTone,
  type BiographyGenerateRequest,
  type NormalizeFallbacks,
  type AIDraftEnvelope,
  type NotesValidation,
} from "../components/ai/index";
import type { RolePermissions } from "./useRoleGate";
import { spaceFetch, apiErrorMessage } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAIBiographyStudioOptions {
  member: FamilyMember;
  spaceSlug: string;
  role: Role | null;
  onSaveMember: (member: FamilyMember, previousId?: string) => Promise<void>;
  addToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}

export interface UseAIBiographyStudioReturn {
  // State
  tone: AIDraftTone;
  notes: string;
  showDataDisclosure: boolean;
  notesWarningOverridden: boolean;
  confirmRegenerate: boolean;
  isSavingBiography: boolean;
  isSavingStory: boolean;
  editState: EditModeState;
  // Computed
  notesValidation: NotesValidation;
  showNotesWarning: boolean;
  currentDraft: string;
  permissions: RolePermissions;
  // Draft state from useAIDraft
  status: AIDraftStatus;
  envelope: AIDraftEnvelope | null;
  error: string;
  isBusy: boolean;
  // Setters
  setTone: (tone: AIDraftTone) => void;
  /** Sets notes and resets the notesWarningOverridden flag. */
  setNotes: (notes: string) => void;
  setShowDataDisclosure: React.Dispatch<React.SetStateAction<boolean>>;
  setConfirmRegenerate: (confirm: boolean) => void;
  // Handlers
  handleGenerate: () => void;
  handleGenerateAnyway: () => void;
  handleRegenerate: () => void;
  handleConfirmRegenerate: () => void;
  handleCopy: () => Promise<void>;
  handleEditDraft: () => void;
  handleSaveEdits: () => void;
  handleCancelEdit: () => void;
  handleSaveBiography: () => Promise<void>;
  handleSaveStory: () => Promise<void>;
  editDispatch: React.Dispatch<EditModeAction>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAIBiographyStudio(
  options: UseAIBiographyStudioOptions,
): UseAIBiographyStudioReturn {
  const { member, spaceSlug, role, onSaveMember, addToast } = options;

  const permissions = useRoleGate(role);

  const [tone, setTone] = useState<AIDraftTone>("warm");
  const [notes, setNotes] = useState(member.notes || "");
  const [showDataDisclosure, setShowDataDisclosure] = useState(false);
  const [notesWarningOverridden, setNotesWarningOverridden] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [isSavingBiography, setIsSavingBiography] = useState(false);
  const [isSavingStory, setIsSavingStory] = useState(false);

  const [editState, editDispatch] = useReducer(
    editModeReducer,
    createInitialEditState(""),
  );

  const fallbacks: NormalizeFallbacks = {
    privacy: "AI drafts stay inside this family space until reviewed.",
    fallbackNote:
      "Generated with deterministic fallback from the member profile fields.",
    factsUsed: deriveGeneratedFrom(member, tone),
    missingContext: deriveMissingContextForBiography(member),
    generatedFrom: deriveGeneratedFrom(member, tone),
  };

  const {
    status,
    envelope,
    error,
    isBusy,
    generate,
    regenerate,
  } = useAIDraft<BiographyGenerateRequest>(spaceSlug, {
    kind: "biography",
    endpoint: "/ai/generate-biography",
    buildBody: buildBiographyGenerateBody,
    fallbacks,
    tone: () => tone,
  });

  // Notes validation (Property 13 / Requirement 8.1).
  const notesValidation = validateBiographyNotes(notes);
  const showNotesWarning =
    notesValidation.warn && !notesWarningOverridden && permissions.canGenerate;

  const handleGenerate = useCallback(() => {
    if (!permissions.canGenerate) return;
    setNotesWarningOverridden(false);
    void generate({ memberId: member.id, notes: notes.trim(), tone });
  }, [permissions.canGenerate, generate, member.id, notes, tone]);

  const handleGenerateAnyway = useCallback(() => {
    setNotesWarningOverridden(true);
    void generate({ memberId: member.id, notes: notes.trim(), tone });
  }, [generate, member.id, notes, tone]);

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

  // Wrap setNotes to also reset the warning override flag (mirrors original onChange behavior).
  const handleSetNotes = useCallback((value: string) => {
    setNotes(value);
    setNotesWarningOverridden(false);
  }, []);

  const handleSaveBiography = useCallback(async () => {
    if (!permissions.canSave || !currentDraft) return;
    setIsSavingBiography(true);
    try {
      const updated = buildSaveBiographyBody(member, currentDraft);
      await onSaveMember(updated, member.id);
      addToast("Biography saved", "success");
    } catch {
      addToast("Failed to save biography", "error");
    } finally {
      setIsSavingBiography(false);
    }
  }, [permissions.canSave, currentDraft, member, onSaveMember, addToast]);

  const handleSaveStory = useCallback(async () => {
    if (!permissions.canSave || !currentDraft) return;
    setIsSavingStory(true);
    try {
      const response = await spaceFetch(spaceSlug, "/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${member.displayName || member.fullName} biography draft`,
          content: currentDraft,
          origin: "ai_biography",
          relatedMemberIds: [member.id],
          sourceNoteIds: [],
        }),
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to save story draft."));
      }
      addToast("Story draft saved", "success");
    } catch {
      addToast("Failed to save story draft", "error");
    } finally {
      setIsSavingStory(false);
    }
  }, [permissions.canSave, currentDraft, spaceSlug, member, addToast]);

  return {
    // State
    tone,
    notes,
    showDataDisclosure,
    notesWarningOverridden,
    confirmRegenerate,
    isSavingBiography,
    isSavingStory,
    editState,
    // Computed
    notesValidation,
    showNotesWarning,
    currentDraft,
    permissions,
    // Draft state from useAIDraft
    status,
    envelope,
    error,
    isBusy,
    // Setters
    setTone,
    setNotes: handleSetNotes,
    setShowDataDisclosure,
    setConfirmRegenerate,
    // Handlers
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
    editDispatch,
  };
}
