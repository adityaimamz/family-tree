import type { RelationshipMember } from "../relationship/types.js";
import { deterministicRelationship } from "../relationship/deterministic.js";

/**
 * Checks whether a cached relationship explanation is still fresh
 * based on the current state of the relationship graph.
 *
 * @param cached - The cached RelationshipExplanationHistory record
 * @param relationshipMembers - The current list of RelationshipMember objects
 * @returns true if the cache is still valid, false if stale
 */
export const isCacheFresh = (
  cached: { pathMemberIds: string[]; fromMemberId: string; toMemberId: string },
  relationshipMembers: RelationshipMember[],
): boolean => {
  // Build a map of current members by ID
  const memberById = new Map(relationshipMembers.map((m) => [m.id, m]));

  // Verify every id in the cached path exists in the current members
  for (const id of cached.pathMemberIds) {
    if (!memberById.has(id)) {
      return false;
    }
  }

  // Recompute the deterministic relationship and compare path IDs
  const recomputed = deterministicRelationship(
    relationshipMembers,
    cached.fromMemberId,
    cached.toMemberId,
  );

  if (!recomputed) {
    return false;
  }

  const recomputedIds = recomputed.path.map((p) => p.id);

  // Compare lengths first for early exit
  if (recomputedIds.length !== cached.pathMemberIds.length) {
    return false;
  }

  // Compare element by element
  for (let i = 0; i < recomputedIds.length; i++) {
    if (recomputedIds[i] !== cached.pathMemberIds[i]) {
      return false;
    }
  }

  return true;
};
