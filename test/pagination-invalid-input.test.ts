// Feature: api-query-performance-optimization, Property 9: Pagination rejects invalid input
// Validates: Requirements 5.6

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { parsePagination } from "../server/routes/shared.js";

describe("Pagination Rejects Invalid Input (Property 9)", () => {
  // Arbitrary for invalid pagination inputs (not valid positive integers)
  const arbInvalidPaginationInput: fc.Arbitrary<string> = fc.oneof(
    fc.constant(""), // empty string
    fc.constant("0"), // zero
    fc.constant("-1"), // negative
    fc.constant("-100"), // negative large
    fc.constant("1.5"), // decimal
    fc.constant("10.99"), // decimal
    fc.constant("abc"), // letters
    fc.constant("xyz"), // letters
    fc.constant("page1"), // mixed
    fc.constant("  "), // whitespace
    fc.constant("\t"), // tab
    fc.constant("\n"), // newline
    fc.constant("true"), // boolean string
    fc.constant("false"), // boolean string
    fc.constant("null"), // null string
    fc.constant("undefined"), // undefined string
    fc.constant("1a"), // number with letter
    fc.constant("a1"), // letter with number
    fc.constant("1_000"), // underscore
    fc.constant("1,000"), // comma
  );

  // Arbitrary for valid positive integers as strings
  const arbValidPositiveInt: fc.Arbitrary<string> = fc
    .integer({ min: 1, max: 1000 })
    .map((n) => String(n));

  describe("parsePagination function", () => {
    describe("Invalid page parameter", () => {
      it("should return error for empty string page", () => {
        const result = parsePagination({ page: "", pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("should return error for page=0", () => {
        const result = parsePagination({ page: "0", pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("should return error for negative page", () => {
        const result = parsePagination({ page: "-5", pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("should return error for decimal page", () => {
        const result = parsePagination({ page: "1.5", pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("should return error for non-numeric page", () => {
        const result = parsePagination({ page: "abc", pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("Property 9: rejects all invalid page values with PBT", async () => {
        await fc.assert(
          fc.asyncProperty(arbInvalidPaginationInput, async (invalidPage) => {
            const result = parsePagination({ page: invalidPage, pageSize: "20" });
            
            // Should return error for invalid page
            expect(result).toHaveProperty("error");
            expect(typeof result.error).toBe("string");
            expect(result.error.length).toBeGreaterThan(0);
            // Error should mention 'page'
            expect(result.error.toLowerCase()).toContain("page");
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Invalid pageSize parameter", () => {
      it("should return error for pageSize=0", () => {
        const result = parsePagination({ page: "1", pageSize: "0" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("pageSize");
        }
      });

      it("should return error for negative pageSize", () => {
        const result = parsePagination({ page: "1", pageSize: "-10" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("pageSize");
        }
      });

      it("should return error for decimal pageSize", () => {
        const result = parsePagination({ page: "1", pageSize: "5.5" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("pageSize");
        }
      });

      it("should return error for non-numeric pageSize", () => {
        const result = parsePagination({ page: "1", pageSize: "large" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("pageSize");
        }
      });

      it("Property 9: rejects all invalid pageSize values with PBT", async () => {
        await fc.assert(
          fc.asyncProperty(arbInvalidPaginationInput, async (invalidPageSize) => {
            const result = parsePagination({ page: "1", pageSize: invalidPageSize });
            
            // Should return error for invalid pageSize
            expect(result).toHaveProperty("error");
            expect(typeof result.error).toBe("string");
            expect(result.error.length).toBeGreaterThan(0);
            // Error should mention 'pageSize'
            expect(result.error.toLowerCase()).toContain("pagesize");
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Valid pagination parameters", () => {
      it("should return legacy mode when neither page nor pageSize is provided", () => {
        const result = parsePagination({});
        expect(result).toEqual({ mode: "legacy" });
      });

      it("should return paged mode with valid positive integers", () => {
        const result = parsePagination({ page: "1", pageSize: "20" });
        expect(result).toEqual({ mode: "paged", page: 1, pageSize: 20 });
      });

      it("should use defaults when only page is provided", () => {
        const result = parsePagination({ page: "3" });
        expect(result).toEqual({ mode: "paged", page: 3, pageSize: 20 });
      });

      it("should use defaults when only pageSize is provided", () => {
        const result = parsePagination({ pageSize: "50" });
        expect(result).toEqual({ mode: "paged", page: 1, pageSize: 50 });
      });

      it("should clamp pageSize to 100 when exceeding 100", () => {
        const result = parsePagination({ page: "1", pageSize: "500" });
        expect(result).toEqual({ mode: "paged", page: 1, pageSize: 100 });
      });

      it("should clamp pageSize to 1 when less than 1", () => {
        const result = parsePagination({ page: "1", pageSize: "-5" });
        expect(result).toHaveProperty("error");
      });

      it("Property 9: accepts all valid positive integer page values with PBT", async () => {
        await fc.assert(
          fc.asyncProperty(arbValidPositiveInt, async (validPage) => {
            const result = parsePagination({ page: validPage, pageSize: "20" });
            
            // Should NOT return error for valid page
            expect(result).not.toHaveProperty("error");
            if ("mode" in result) {
              expect(result.mode).toBe("paged");
              expect(result.page).toBe(Number(validPage));
            }
          }),
          { numRuns: 100 }
        );
      });

      it("Property 9: accepts all valid positive integer pageSize values with PBT", async () => {
        await fc.assert(
          fc.asyncProperty(arbValidPositiveInt, async (validPageSize) => {
            // Clamp to max 100 for pageSize (any higher gets clamped)
            const clampedPageSize = Math.min(100, Number(validPageSize));
            const result = parsePagination({ page: "1", pageSize: validPageSize });
            
            // Should NOT return error for valid pageSize (may be clamped)
            expect(result).not.toHaveProperty("error");
            if ("mode" in result) {
              expect(result.mode).toBe("paged");
              expect(result.pageSize).toBe(clampedPageSize);
            }
          }),
          { numRuns: 100 }
        );
      });
    });

    describe("Both page and pageSize invalid", () => {
      it("should return error mentioning the first invalid parameter", () => {
        const result = parsePagination({ page: "abc", pageSize: "xyz" });
        expect(result).toHaveProperty("error");
        // The error should mention at least one invalid parameter
        if ("error" in result) {
          expect(
            result.error.toLowerCase().includes("page") ||
            result.error.toLowerCase().includes("pagesize")
          ).toBe(true);
        }
      });

      it("should prioritize page validation over pageSize", () => {
        const result = parsePagination({ page: "abc", pageSize: "10" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });
    });

    describe("page parameter as non-string type", () => {
      it("should return error when page is a number", () => {
        const result = parsePagination({ page: 1 as any, pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("should return error when page is an array", () => {
        const result = parsePagination({ page: ["1", "2"] as any, pageSize: "20" });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("page");
        }
      });

      it("should return error when pageSize is a number", () => {
        const result = parsePagination({ page: "1", pageSize: 20 as any });
        expect(result).toHaveProperty("error");
        if ("error" in result) {
          expect(result.error).toContain("pageSize");
        }
      });
    });
  });

  describe("Validation edge cases", () => {
    it("should reject pageSize of 0 via repeated query keys (arrays)", () => {
      // This tests arrays via repeated query keys
      // In Express, repeated query keys become arrays
      const result = parsePagination({ page: "1", pageSize: ["0", "10"] as any });
      expect(result).toHaveProperty("error");
    });

    it("should handle whitespace-padded numbers as valid (JavaScript trims)", () => {
      // Note: Number() in JavaScript actually trims whitespace, so " 1" becomes 1
      // This is acceptable behavior - whitespace is trimmed
      const result = parsePagination({ page: " 1", pageSize: "20" });
      expect(result).not.toHaveProperty("error");
      if ("mode" in result) {
        expect(result.page).toBe(1);
      }
    });
  });
});