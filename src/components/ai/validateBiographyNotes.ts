export interface NotesValidation {
  warn: boolean;
  allowOverride: true;
  message: string;
}

export const NOTES_WARNING_MESSAGE =
  "Add at least 40 characters of notes so the draft has real detail to work with";

export function validateBiographyNotes(notes: string): NotesValidation {
  const trimmed = typeof notes === "string" ? notes.replace(/\s+/g, "") : "";
  return {
    warn: trimmed.length < 40,
    allowOverride: true,
    message: NOTES_WARNING_MESSAGE,
  };
}
