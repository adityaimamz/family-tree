// Feature: ai-studio-experience
// Property tests for the pure derivation and body-builder helpers.
//
// Covered properties:
//   Property 10: Missing-Context Derivation       (Requirements 4.9, 5.9, 8.5)
//   Property 11: Events-Used Ordering              (Requirement 5.7)
//   Property 12: Generated-From Derivation         (Requirement 4.7)
//   Property 13: Notes Threshold Warning           (Requirement 8.1)
//   Property 14: Clipboard Payload Format          (Requirement 3.9)
//   Property 16: Save Routing                      (Requirements 4.12, 4.13, 5.10, 7.1, 7.2)

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  deriveMissingContextForBiography,
  deriveMissingContextForTimeline,
} from "./deriveMissingContext";
import { deriveEventsUsed } from "./deriveEventsUsed";
import { deriveGeneratedFrom } from "./deriveGeneratedFrom";
import {
  validateBiographyNotes,
  NOTES_WARNING_MESSAGE,
} from "./validateBiographyNotes";
import { buildClipboardPayload } from "./buildClipboardPayload";
import {
  buildSaveBiographyBody,
  buildSaveStoryBody,
} from "./buildRequestBodies";
import type { FamilyMember, TimelineEvent } from "../../types/family";
import type { AIDraftEnvelope } from "./AIDraftEnvelope";

const baseMember: FamilyMember = {
  id: "m1",
  fullName: "Eliana Bastawi",
  displayName: "Eliana",
  gender: "female",
  generation: 1,
  familyBranch: "main",
  fatherId: null,
  motherId: null,
  spouseIds: [],
  formerSpouseIds: [],
  childrenIds: [],
  siblingIds: [],
  parentFamilyId: null,
  nuclearFamilyIds: [],
  birthDate: null,
  marriageDate: null,
  deathDate: null,
  isDeceased: false,
  deceasedLabel: null,
  birthPlace: null,
  biography: "",
  notes: "",
  photo: null,
  statusLabel: "Active",
  relationshipToRoot: "Family Founder",
};

describe("deriveMissingContextForBiography — Property 10", () => {
  // Feature: ai-studio-experience, Property 10: Missing-Context Derivation
  it("emits one hint per empty field and zero hints for filled fields", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (hasBirth, hasPlace, hasBio, hasNotes) => {
          const member: FamilyMember = {
            ...baseMember,
            birthDate: hasBirth ? "1912" : null,
            birthPlace: hasPlace ? "Surabaya" : null,
            biography: hasBio ? "A life well lived." : "",
            notes: hasNotes ? "Noted." : "",
          };
          const hints = deriveMissingContextForBiography(member);
          const expected =
            (hasBirth ? 0 : 1) +
            (hasPlace ? 0 : 1) +
            (hasBio ? 0 : 1) +
            (hasNotes ? 0 : 1);
          expect(hints.length).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("deriveMissingContextForTimeline — Property 10", () => {
  it("returns the fixed set for empty timelines and [] otherwise", () => {
    expect(deriveMissingContextForTimeline([])).toEqual([
      "Add a birth event",
      "Add a marriage event",
      "Add a move event",
      "Add a reunion event",
      "Record a deceased event",
    ]);
    const nonEmpty: TimelineEvent[] = [
      { id: "e1", year: "1912", type: "Birth", title: "Born", description: "" },
    ];
    expect(deriveMissingContextForTimeline(nonEmpty)).toEqual([]);
  });
});

describe("deriveEventsUsed — Property 11", () => {
  // Feature: ai-studio-experience, Property 11: Events-Used Ordering
  const arbEvent: fc.Arbitrary<TimelineEvent> = fc.record({
    id: fc.uuid(),
    year: fc.integer({ min: 1700, max: 2100 }).map(String),
    type: fc.constant("Other" as const),
    title: fc.string({ minLength: 1, maxLength: 24 }),
    description: fc.constant(""),
  });

  it("returns a length-preserving ascending permutation", () => {
    fc.assert(
      fc.property(fc.array(arbEvent, { maxLength: 12 }), (events) => {
        const out = deriveEventsUsed(events);
        expect(out.length).toBe(events.length);
        const years = out.map((line) => Number.parseInt(line.slice(0, 4), 10));
        for (let i = 1; i < years.length; i++) {
          expect(years[i]).toBeGreaterThanOrEqual(years[i - 1]);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("deriveGeneratedFrom — Property 12", () => {
  // Feature: ai-studio-experience, Property 12: Generated-From Derivation
  it("tone chip always renders first, no chip for empty fields", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        fc.constantFrom("warm", "concise", "legacy" as const),
        (hasBirth, hasPlace, hasNotes, tone) => {
          const member: FamilyMember = {
            ...baseMember,
            birthDate: hasBirth ? "1912" : null,
            birthPlace: hasPlace ? "Surabaya" : null,
            notes: hasNotes ? "A story" : "",
            biography: "",
          };
          const chips = deriveGeneratedFrom(member, tone);
          expect(chips[0]).toBe(`Tone: ${tone}`);
          if (!hasBirth) {
            expect(chips.some((c) => c === "Birth date on file")).toBe(false);
          }
          if (!hasPlace) {
            expect(chips.some((c) => c === "Birth place on file")).toBe(false);
          }
          if (!hasNotes) {
            expect(chips.some((c) => c === "Notes on file")).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("validateBiographyNotes — Property 13", () => {
  // Feature: ai-studio-experience, Property 13: Notes Threshold Warning
  it("warn is true iff non-whitespace character count is less than 40", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (notes) => {
        const r = validateBiographyNotes(notes);
        const nonWhitespaceLength = notes.replace(/\s+/g, "").length;
        expect(r.warn).toBe(nonWhitespaceLength < 40);
        expect(r.allowOverride).toBe(true);
        expect(r.message).toBe(NOTES_WARNING_MESSAGE);
      }),
      { numRuns: 100 },
    );
  });
});

describe("buildClipboardPayload — Property 14", () => {
  // Feature: ai-studio-experience, Property 14: Clipboard Payload Format
  const relEnvelope = (body: string, label?: string): AIDraftEnvelope => ({
    kind: "relationship",
    body,
    source: "ai",
    privacyReminder: "p",
    fallbackNote: "f",
    tone: null,
    factsUsed: [],
    eventsUsed: [],
    generatedFrom: [],
    missingContext: [],
    reviewChecklist: [],
    warnings: [],
    relationshipLabel: label,
  });

  it("relationship payload is exactly `${label}\\n\\n${body}`", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 40 }),
        fc.string({ minLength: 1, maxLength: 120 }),
        (label, body) => {
          const env = relEnvelope(body, label);
          const payload = buildClipboardPayload(env);
          expect(payload).toBe(`${label.trim()}\n\n${body}`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("non-relationship envelopes return body verbatim", () => {
    const env: AIDraftEnvelope = {
      kind: "biography",
      body: "My draft",
      source: "ai",
      privacyReminder: "p",
      fallbackNote: "f",
      tone: "warm",
      factsUsed: [],
      eventsUsed: [],
      generatedFrom: [],
      missingContext: [],
      reviewChecklist: [],
      warnings: [],
    };
    expect(buildClipboardPayload(env)).toBe("My draft");
  });
});

describe("save-routing helpers — Property 16", () => {
  // Feature: ai-studio-experience, Property 16: Save Routing
  it("buildSaveBiographyBody only changes the biography field", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 400 }), (draft) => {
        const body = buildSaveBiographyBody(baseMember, draft);
        expect(body.biography).toBe(draft);
        const { biography: _, ...rest } = body;
        const { biography: __, ...baseRest } = baseMember;
        expect(rest).toEqual(baseRest);
      }),
      { numRuns: 100 },
    );
  });

  it("buildSaveStoryBody copies draft into content verbatim", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 400 }),
        fc.string({ minLength: 1, maxLength: 60 }),
        fc.array(fc.uuid(), { maxLength: 4 }),
        (draft, title, memberIds) => {
          const body = buildSaveStoryBody(draft, { title, relatedMemberIds: memberIds });
          expect(body.content).toBe(draft);
          expect(body.title).toBe(title);
          if (memberIds.length === 0) {
            expect(body.relatedMemberIds).toBeUndefined();
          } else {
            expect(body.relatedMemberIds).toEqual(memberIds);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
