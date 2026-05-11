// Feature: ai-studio-experience, Property 5: Role Gating
// Validates: Requirements 4.5, 7.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveRolePermissions, type Role } from "./useRoleGate";

describe("deriveRolePermissions — Property 5: Role Gating", () => {
  const allRoles: Array<Role | null | undefined> = [
    "owner",
    "admin",
    "member",
    null,
    undefined,
  ];

  it("every flag is true iff role is owner or admin", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allRoles),
        (role) => {
          const perms = deriveRolePermissions(role);
          const expected = role === "owner" || role === "admin";
          expect(perms.canGenerate).toBe(expected);
          expect(perms.canRegenerate).toBe(expected);
          expect(perms.canEdit).toBe(expected);
          expect(perms.canSave).toBe(expected);
          expect(perms.canRefresh).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("member role disables every mutation flag", () => {
    const perms = deriveRolePermissions("member");
    expect(perms.canGenerate).toBe(false);
    expect(perms.canRegenerate).toBe(false);
    expect(perms.canEdit).toBe(false);
    expect(perms.canSave).toBe(false);
    expect(perms.canRefresh).toBe(false);
  });

  it("null role disables every mutation flag", () => {
    const perms = deriveRolePermissions(null);
    expect(perms.canGenerate).toBe(false);
    expect(perms.canRegenerate).toBe(false);
    expect(perms.canEdit).toBe(false);
    expect(perms.canSave).toBe(false);
    expect(perms.canRefresh).toBe(false);
  });

  it("owner and admin enable every mutation flag", () => {
    for (const role of ["owner", "admin"] as const) {
      const perms = deriveRolePermissions(role);
      expect(perms.canGenerate).toBe(true);
      expect(perms.canRegenerate).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canSave).toBe(true);
      expect(perms.canRefresh).toBe(true);
    }
  });
});
