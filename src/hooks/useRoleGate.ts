import { useMemo } from "react";

export type Role = "owner" | "admin" | "member";

export interface RolePermissions {
  canGenerate: boolean;
  canRegenerate: boolean;
  canEdit: boolean;
  canSave: boolean;
  canRefresh: boolean;
}

/**
 * Pure derivation. Every flag is `true` iff the role is `"owner"` or
 * `"admin"`. `null` or any unknown value is treated as no permissions.
 */
export function deriveRolePermissions(role: Role | null | undefined): RolePermissions {
  const isOwnerAdmin = role === "owner" || role === "admin";
  return {
    canGenerate: isOwnerAdmin,
    canRegenerate: isOwnerAdmin,
    canEdit: isOwnerAdmin,
    canSave: isOwnerAdmin,
    canRefresh: isOwnerAdmin,
  };
}

/**
 * Hook wrapper that memoizes the permissions object so downstream
 * components can use referential equality checks.
 */
export function useRoleGate(role: Role | null | undefined): RolePermissions {
  return useMemo(() => deriveRolePermissions(role), [role]);
}
