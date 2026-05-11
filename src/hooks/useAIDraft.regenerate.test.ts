// Feature: ai-studio-experience, Property 6: Idempotent Regenerate
// Validates: Requirements 3.8, 4.14, 5.11, 7.3, 14.1, 14.2, 14.3, 14.4

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildRegenerateBody } from "./useAIDraft";

describe("buildRegenerateBody — Property 6: Idempotent Regenerate", () => {
  it("returns the exact same biography request body", () => {
    fc.assert(
      fc.property(
        fc.record({
          memberId: fc.uuid(),
          notes: fc.string({ maxLength: 200 }),
          tone: fc.constantFrom("warm", "concise", "legacy"),
        }),
        (request) => {
          const result = buildRegenerateBody(request);
          expect(result).toEqual(request);
          expect(result).toBe(request); // referential identity
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns the exact same timeline-story request body", () => {
    fc.assert(
      fc.property(
        fc.record({
          tone: fc.constantFrom("warm", "concise", "legacy"),
        }),
        (request) => {
          const result = buildRegenerateBody(request);
          expect(result).toEqual(request);
          expect(result).toBe(request);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns the exact same relationship request body (without refresh)", () => {
    fc.assert(
      fc.property(
        fc.record({
          fromMemberId: fc.uuid(),
          toMemberId: fc.uuid(),
        }),
        (request) => {
          const result = buildRegenerateBody(request);
          expect(result).toEqual(request);
          expect(result).toBe(request);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("relationship refresh case: body plus refresh flag", () => {
    fc.assert(
      fc.property(
        fc.record({
          fromMemberId: fc.uuid(),
          toMemberId: fc.uuid(),
          refresh: fc.constant(true as const),
        }),
        (request) => {
          const result = buildRegenerateBody(request);
          expect(result).toEqual(request);
          expect(result.refresh).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
