import { useCallback, useRef, useState } from "react";
import type {
  AIDraftEnvelope,
  AIDraftTone,
  AIDraftKind,
  NormalizeFallbacks,
} from "../components/ai/AIDraftEnvelope";
import { normalizeAIResponse } from "../components/ai/normalizeAIResponse";
import { apiErrorMessage, spaceFetch } from "../lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIDraftStatus = "idle" | "loading" | "ready" | "error";

export interface UseAIDraftOptions<TReq> {
  kind: AIDraftKind;
  endpoint: string;
  buildBody: (req: TReq) => unknown;
  fallbacks: NormalizeFallbacks;
  tone?: () => AIDraftTone | undefined;
  onSuccess?: (env: AIDraftEnvelope) => void;
  onError?: (message: string) => void;
}

export interface UseAIDraftReturn<TReq> {
  status: AIDraftStatus;
  envelope: AIDraftEnvelope | null;
  error: string;
  lastRequest: TReq | null;
  isBusy: boolean;
  generate: (req: TReq) => Promise<void>;
  regenerate: () => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Pure reducer (exported for testing — Property 17)
// ---------------------------------------------------------------------------

export interface AIDraftState<TReq> {
  status: AIDraftStatus;
  envelope: AIDraftEnvelope | null;
  error: string;
  lastRequest: TReq | null;
}

export type AIDraftAction<TReq> =
  | { type: "start"; request: TReq }
  | { type: "success"; envelope: AIDraftEnvelope }
  | { type: "error"; message: string }
  | { type: "reset" };

export function aiDraftReducer<TReq>(
  state: AIDraftState<TReq>,
  action: AIDraftAction<TReq>,
): AIDraftState<TReq> {
  switch (action.type) {
    case "start":
      return {
        ...state,
        status: "loading",
        error: "",
        lastRequest: action.request,
      };
    case "success":
      return {
        ...state,
        status: "ready",
        envelope: action.envelope,
        error: "",
      };
    case "error":
      // Preserve the previous envelope so inline edits are not lost on retry.
      return {
        ...state,
        status: "error",
        error: action.message,
      };
    case "reset":
      return {
        status: "idle",
        envelope: null,
        error: "",
        lastRequest: null,
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Pure helper (exported for testing — Property 6)
// ---------------------------------------------------------------------------

/**
 * Returns `lastRequest` unchanged. This is the idempotent-regenerate
 * invariant: regenerate always reuses the exact previous request body.
 */
export function buildRegenerateBody<TReq>(lastRequest: TReq): TReq {
  return lastRequest;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAIDraft<TReq>(
  spaceSlug: string,
  options: UseAIDraftOptions<TReq>,
): UseAIDraftReturn<TReq> {
  const [state, setState] = useState<AIDraftState<TReq>>({
    status: "idle",
    envelope: null,
    error: "",
    lastRequest: null,
  });

  // Keep a ref to the latest options so the generate closure never goes stale.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Abort controller for in-flight requests.
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (req: TReq) => {
      const opts = optionsRef.current;

      // Abort any previous in-flight request.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) =>
        aiDraftReducer(prev, { type: "start", request: req }),
      );

      try {
        const body = opts.buildBody(req);
        const response = await spaceFetch(spaceSlug, opts.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!response.ok) {
          const message = await apiErrorMessage(
            response,
            "We could not reach the AI service. Please try again.",
          );
          setState((prev) =>
            aiDraftReducer(prev, { type: "error", message }),
          );
          opts.onError?.(message);
          return;
        }

        const raw: unknown = await response.json();
        const tone = opts.tone?.();
        const envelope = normalizeAIResponse(
          raw,
          { kind: opts.kind, tone },
          opts.fallbacks,
        );

        setState((prev) =>
          aiDraftReducer(prev, { type: "success", envelope }),
        );
        opts.onSuccess?.(envelope);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "We could not reach the AI service. Please try again.";
        setState((prev) =>
          aiDraftReducer(prev, { type: "error", message }),
        );
        optionsRef.current.onError?.(message);
      }
    },
    [spaceSlug],
  );

  const regenerate = useCallback(async () => {
    const last = state.lastRequest;
    if (last === null) return;
    await generate(buildRegenerateBody(last));
  }, [state.lastRequest, generate]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", envelope: null, error: "", lastRequest: null });
  }, []);

  return {
    status: state.status,
    envelope: state.envelope,
    error: state.error,
    lastRequest: state.lastRequest,
    isBusy: state.status === "loading",
    generate,
    regenerate,
    reset,
  };
}
