export interface EditModeState {
  active: boolean;
  draft: string;
}

export type EditModeAction =
  | { type: "setActive"; active: boolean }
  | { type: "saveEdits" }
  | { type: "cancel" }
  | { type: "setDraft"; draft: string }
  | { type: "regenerate" }
  | { type: "blur" }
  | { type: "rerender" }
  | { type: "toneChange" }
  | { type: "noteChange" };

export function editModeReducer(
  state: EditModeState,
  action: EditModeAction,
): EditModeState {
  switch (action.type) {
    case "setActive":
      return { ...state, active: action.active };
    case "saveEdits":
    case "cancel":
      return { ...state, active: false };
    case "setDraft":
      return { ...state, draft: action.draft };
    // All other actions leave `active` unchanged.
    case "regenerate":
    case "blur":
    case "rerender":
    case "toneChange":
    case "noteChange":
      return state;
    default:
      return state;
  }
}

export function createInitialEditState(draft: string = ""): EditModeState {
  return { active: false, draft };
}
