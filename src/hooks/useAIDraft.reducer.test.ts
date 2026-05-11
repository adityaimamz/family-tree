// Feature: ai-studio-experience, Property 17: Loading-State Machine
// Validates: Requirements 3.7, 3.10, 4.15, 5.12, 5.13, 7.4, 15.1-15.5

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { aiDraftReducer, type AIDraftState, type AIDraftAction } from "./useAIDraft";
import type { AIDraftEnvelope } from "../components/ai/AIDraftEnvelope";

const makeEnvelope = (body: string): AIDraftEnvelope => ({
  kind: "biography",
  body,
  source: "ai",
  privacyReminder: "p",
  fallbackNote: "f",
  tone: "warm",
  factsUsed: [],
  eventsUsed: [],
  generatedFrom: [],
  missingContext: [],
  reviewChecklist: ["Check names", "Check dates", "Check sensitive details", "Ask a family reviewer before saving as final"],
  warnings: [],
});

const initialState: AIDraftState<string> = {
  status: "idle",
  envelope: null,
  error: "",
  lastRequest: null,
};

describe("aiDraftReducer — Property 17: Loading-State Machine", () => {
  it("start transitions to loading and stores the request", () => {
    const next = aiDraftReducer(initialState, { type: "start", request: "req1" });
    expect(next.status).toBe("loading");
    expect(next.lastRequest).toBe("req1");
    expect(next.error).toBe("");
  });

  it("success transitions to ready and stores the envelope", () => {
    const loading: AIDraftState<string> = {
      ...initialState,
      status: "loading",
      lastRequest: "req1",
    };
    const env = makeEnvelope("draft text");
    const next = aiDraftReducer(loading, { type: "success", envelope: env });
    expect(next.status).toBe("ready");
    expect(next.envelope).toBe(env);
    expect(next.error).toBe("");
  });

  it("error transitions to error and preserves the previous envelope", () => {
    const prevEnvelope = makeEnvelope("previous draft");
    const ready: AIDraftState<string> = {
      status: "ready",
      envelope: prevEnvelope,
      error: "",
      lastRequest: "req1",
    };
    const loading = aiDraftReducer(ready, { type: "start", request: "req2" });
    const errored = aiDraftReducer(loading, { type: "error", message: "Network failure" });
    expect(errored.status).toBe("error");
    expect(errored.error).toBe("Network failure");
    // Previous envelope is preserved (not cleared)
    expect(errored.envelope).toBe(prevEnvelope);
  });

  it("reset returns to idle with null envelope and request", () => {
    const ready: AIDraftState<string> = {
      status: "ready",
      envelope: makeEnvelope("body"),
      error: "",
      lastRequest: "req1",
    };
    const next = aiDraftReducer(ready, { type: "reset" });
    expect(next.status).toBe("idle");
    expect(next.envelope).toBeNull();
    expect(next.lastRequest).toBeNull();
    expect(next.error).toBe("");
  });

  it("arbitrary action sequences maintain valid status values", () => {
    const arbAction: fc.Arbitrary<AIDraftAction<string>> = fc.oneof(
      fc.record({ type: fc.constant("start" as const), request: fc.string({ maxLength: 20 }) }),
      fc.record({ type: fc.constant("success" as const), envelope: fc.constant(makeEnvelope("body")) }),
      fc.record({ type: fc.constant("error" as const), message: fc.string({ maxLength: 40 }) }),
      fc.record({ type: fc.constant("reset" as const) }),
    );

    fc.assert(
      fc.property(
        fc.array(arbAction, { minLength: 1, maxLength: 20 }),
        (actions) => {
          let state: AIDraftState<string> = initialState;
          for (const action of actions) {
            state = aiDraftReducer(state, action);
          }
          expect(["idle", "loading", "ready", "error"]).toContain(state.status);
          // isBusy derivation
          const isBusy = state.status === "loading";
          expect(typeof isBusy).toBe("boolean");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("error after loading preserves the envelope from a prior success", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 40 }),
        fc.string({ minLength: 1, maxLength: 40 }),
        (draftBody, errorMsg) => {
          const env = makeEnvelope(draftBody);
          let state: AIDraftState<string> = initialState;
          state = aiDraftReducer(state, { type: "start", request: "r1" });
          state = aiDraftReducer(state, { type: "success", envelope: env });
          state = aiDraftReducer(state, { type: "start", request: "r2" });
          state = aiDraftReducer(state, { type: "error", message: errorMsg });
          expect(state.status).toBe("error");
          expect(state.envelope).toBe(env);
          expect(state.error).toBe(errorMsg);
        },
      ),
      { numRuns: 100 },
    );
  });
});
