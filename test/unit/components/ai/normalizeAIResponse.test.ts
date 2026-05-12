// Feature: ai-studio-experience
// Property tests for the canonical AI Trust Layer normalizer.
//
// Covered properties:
//   Property 1: Source Integrity                (Requirements 1.5, 1.6, 10.1-10.4)
//   Property 2: Privacy and Family-Review        (Requirements 1.3, 4.4, 8.4, 11.1-11.4)
//   Property 3: Tone Persistence                 (Requirements 4.10, 13.1-13.6)
//   Property 4: Backward Compatibility           (Requirements 2.3, 2.5, 2.9, 18.1, 18.2)

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { normalizeAIResponse } from "../../../../src/components/ai/normalizeAIResponse";
import {
  AIDraftTone,
  DEFAULT_REVIEW_CHECKLIST,
  FAMILY_REVIEW_REMINDER,
  NormalizeFallbacks,
} from "../../../../src/components/ai/AIDraftEnvelope";

const arbTone = fc.constantFrom<AIDraftTone>("warm", "concise", "legacy");
const arbKind = fc.constantFrom("biography", "timeline-story", "relationship" as const);

const arbStringArray = fc.array(fc.string({ minLength: 0, maxLength: 30 }), {
  maxLength: 6,
});

const arbFallbacks = fc.record<NormalizeFallbacks>({
  privacy: fc.string({ minLength: 1, maxLength: 40 }),
  fallbackNote: fc.string({ minLength: 1, maxLength: 40 }),
});

const makeRaw = (overrides: Record<string, unknown>) => ({ ...overrides });

describe("normalizeAIResponse", () => {
  describe("Property 1: Source Integrity", () => {
    // Feature: ai-studio-experience, Property 1: Source Integrity
    it('envelope.source === "ai" iff raw.source === "ai"', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant("ai"),
            fc.constant("deterministic"),
            fc.string(),
            fc.constant(undefined),
            fc.constant(null),
            fc.constant(42),
          ),
          arbKind,
          arbTone,
          arbFallbacks,
          (rawSource, kind, tone, fallbacks) => {
            const envelope = normalizeAIResponse(
              makeRaw({ source: rawSource, biographyDraft: "body" }),
              { kind, tone },
              fallbacks,
            );
            const expectAi = rawSource === "ai";
            expect(envelope.source === "ai").toBe(expectAi);
            expect(["ai", "deterministic"]).toContain(envelope.source);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 2: Privacy and Family-Review Invariant", () => {
    // Feature: ai-studio-experience, Property 2: Privacy and Family-Review Invariant
    it("privacyReminder and fallbackNote are non-empty; review checklist includes the four defaults", () => {
      fc.assert(
        fc.property(
          fc.record({
            source: fc.option(fc.string()),
            privacyReminder: fc.option(fc.string()),
            fallbackNote: fc.option(fc.string()),
            reviewChecklist: fc.option(arbStringArray),
          }),
          arbKind,
          arbTone,
          arbFallbacks,
          (raw, kind, tone, fallbacks) => {
            const envelope = normalizeAIResponse(
              raw as Record<string, unknown>,
              { kind, tone },
              fallbacks,
            );
            expect(envelope.privacyReminder.length).toBeGreaterThan(0);
            expect(envelope.fallbackNote.length).toBeGreaterThan(0);
            expect(FAMILY_REVIEW_REMINDER.length).toBeGreaterThan(0);
            for (const required of DEFAULT_REVIEW_CHECKLIST) {
              expect(envelope.reviewChecklist).toContain(required);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 3: Tone Persistence", () => {
    // Feature: ai-studio-experience, Property 3: Tone Persistence
    it("requested tone wins regardless of backend tone echo", () => {
      fc.assert(
        fc.property(
          arbTone,
          fc.oneof(
            fc.constant(undefined),
            fc.constant("warm"),
            fc.constant("concise"),
            fc.constant("legacy"),
            fc.constant("banter"),
            fc.integer(),
          ),
          fc.constantFrom("biography", "timeline-story" as const),
          arbFallbacks,
          (requested, backendTone, kind, fallbacks) => {
            const envelope = normalizeAIResponse(
              makeRaw({ source: "ai", tone: backendTone, biographyDraft: "body", timelineStoryDraft: "body" }),
              { kind, tone: requested },
              fallbacks,
            );
            expect(envelope.tone).toBe(requested);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("relationship envelopes carry tone === null", () => {
      const envelope = normalizeAIResponse(
        makeRaw({ source: "ai", explanation: "Cousins" }),
        { kind: "relationship" },
        { privacy: "p", fallbackNote: "f" },
      );
      expect(envelope.tone).toBeNull();
    });
  });

  describe("Property 4: Backward Compatibility", () => {
    // Feature: ai-studio-experience, Property 4: Backward Compatibility
    it("minimal legacy responses produce a fully populated envelope", () => {
      fc.assert(
        fc.property(
          fc.record({
            biographyDraft: fc.string({ minLength: 1, maxLength: 80 }),
            timelineStoryDraft: fc.string({ minLength: 1, maxLength: 80 }),
            explanation: fc.string({ minLength: 1, maxLength: 80 }),
            source: fc.constantFrom("ai", "deterministic"),
          }),
          arbKind,
          arbTone,
          arbFallbacks,
          (raw, kind, tone, fallbacks) => {
            const envelope = normalizeAIResponse(
              raw,
              { kind, tone },
              fallbacks,
            );
            expect(Array.isArray(envelope.factsUsed)).toBe(true);
            expect(Array.isArray(envelope.eventsUsed)).toBe(true);
            expect(Array.isArray(envelope.generatedFrom)).toBe(true);
            expect(Array.isArray(envelope.missingContext)).toBe(true);
            expect(Array.isArray(envelope.reviewChecklist)).toBe(true);
            expect(Array.isArray(envelope.warnings)).toBe(true);
            expect(typeof envelope.privacyReminder).toBe("string");
            expect(typeof envelope.fallbackNote).toBe("string");
            expect(typeof envelope.body).toBe("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("enhanced responses populate every enhanced field", () => {
      const envelope = normalizeAIResponse(
        {
          biographyDraft: "Eliana was born...",
          privacyReminder: "Stays inside this space",
          fallbackNote: "Generated by AI",
          source: "ai",
          tone: "warm",
          factsUsed: ["Display name: Eliana"],
          missingContextSuggestions: ["Add a death date"],
          reviewChecklist: ["Check family names"],
          generatedFrom: ["Tone: warm", "4 member profile fields"],
          confidenceLabel: "high-detail",
          warnings: [],
        },
        { kind: "biography", tone: "warm" },
        { privacy: "fallback", fallbackNote: "fallback" },
      );
      expect(envelope.factsUsed).toEqual(["Display name: Eliana"]);
      expect(envelope.missingContext).toEqual(["Add a death date"]);
      expect(envelope.generatedFrom).toEqual([
        "Tone: warm",
        "4 member profile fields",
      ]);
      // backend checklist merged with defaults; order preserves backend-first
      expect(envelope.reviewChecklist[0]).toBe("Check family names");
      for (const required of DEFAULT_REVIEW_CHECKLIST) {
        expect(envelope.reviewChecklist).toContain(required);
      }
    });

    it("filters non-string entries from array fields", () => {
      const envelope = normalizeAIResponse(
        {
          source: "deterministic",
          biographyDraft: "body",
          factsUsed: ["ok", 5, null, "also ok"],
          warnings: [true, "valid warning"],
        },
        { kind: "biography", tone: "warm" },
        { privacy: "p", fallbackNote: "f" },
      );
      expect(envelope.factsUsed).toEqual(["ok", "also ok"]);
      expect(envelope.warnings).toEqual(["valid warning"]);
    });
  });

  describe("coercion edge cases", () => {
    it("coerces unknown source values to deterministic", () => {
      const envelope = normalizeAIResponse(
        { source: "hacker-mode", biographyDraft: "body" },
        { kind: "biography", tone: "warm" },
        { privacy: "p", fallbackNote: "f" },
      );
      expect(envelope.source).toBe("deterministic");
    });

    it("falls back to per-kind privacy when backend and request fallbacks are empty", () => {
      const envelope = normalizeAIResponse(
        { source: "ai", biographyDraft: "body" },
        { kind: "biography", tone: "warm" },
        { privacy: "", fallbackNote: "" },
      );
      expect(envelope.privacyReminder.length).toBeGreaterThan(0);
    });
  });
});
