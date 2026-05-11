// Feature: ai-studio-experience, Property 9: Deep Link Whitelist
// Validates: Requirement 6.9

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parseAIDeepLink } from "./useAIStudioDeepLink";

const VALID_TARGETS = ["relationship", "biography", "timeline-story"] as const;

describe("parseAIDeepLink — Property 9: Deep Link Whitelist", () => {
  it("returns the target when the ai param matches one of the three whitelisted values", () => {
    for (const target of VALID_TARGETS) {
      expect(parseAIDeepLink(`?ai=${target}`)).toBe(target);
    }
  });

  it("returns null for unknown values", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 40 }).filter(
          (s) => !(VALID_TARGETS as readonly string[]).includes(s),
        ),
        (value) => {
          const result = parseAIDeepLink(`?ai=${encodeURIComponent(value)}`);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("returns null when the ai param is absent", () => {
    expect(parseAIDeepLink("")).toBeNull();
    expect(parseAIDeepLink("?foo=bar")).toBeNull();
    expect(parseAIDeepLink("?")).toBeNull();
  });

  it("returns the target iff the parsed value matches exactly", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...VALID_TARGETS),
          fc.string({ minLength: 0, maxLength: 30 }),
        ),
        (value) => {
          const search = `?ai=${encodeURIComponent(value)}`;
          const result = parseAIDeepLink(search);
          const isValid = (VALID_TARGETS as readonly string[]).includes(value);
          if (isValid) {
            expect(result).toBe(value);
          } else {
            expect(result).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
