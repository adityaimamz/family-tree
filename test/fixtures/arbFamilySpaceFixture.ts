import { Prisma, FamilySpace, FamilyMember, FamilyBranch, NuclearFamily } from "@prisma/client";
import { prisma } from "../../server/db.js";
import * as fc from "fast-check";
import { seedTestFixture, seedTreeFixture, cleanupDatabase } from "../setup.js";

// =============================================================================
// Arbitrary Fixtures for Property-Based Testing
// =============================================================================
// These fixtures provide fast-check arbitraries for generating test data
// scoped by familySpaceId for multi-tenant isolation.

// -----------------------------------------------------------------------------
// FamilySpace Arbitraries
// -----------------------------------------------------------------------------

/**
 * Arbitrary for generating a valid FamilySpace create input.
 * Generates random but valid FamilySpace data.
 */
export const arbFamilySpaceFixture: fc.Arbitrary<{
  space: Prisma.FamilySpaceCreateInput;
  user: Prisma.AppUserCreateInput;
  membership: Prisma.FamilyMembershipCreateInput;
}> = fc
  .record({
    // Generate a unique slug that won't conflict with existing data
    slug: fc.uuid().map((uuid) => `test-space-${uuid}`),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 }), { nil: true }),
  })
  .map((data) => ({
    space: {
      slug: data.slug,
      name: data.name,
      description: data.description ?? undefined,
    },
    user: {
      authUserId: `test-user-${data.slug}`,
      email: `test-${data.slug}@example.com`,
      name: "Test User",
      platformRole: "user" as const,
    },
    membership: {
      role: "owner" as const,
    },
  }));

/**
 * Creates a FamilySpace with related data in the database.
 * Returns the created space, user, and membership.
 */
export async function createFamilySpaceWithData(
  input: Prisma.FamilySpaceCreateInput
): Promise<{
  space: FamilySpace;
  user: { id: string; authUserId: string; email: string; name: string | null };
  membership: { id: string; userId: string; familySpaceId: string; role: string };
}> {
  const timestamp = Date.now();
  const uniqueSlug = input.slug ?? `test-space-${timestamp}`;

  // Create user first
  const user = await prisma.appUser.create({
    data: {
      authUserId: input.slug ? `test-user-${input.slug}` : `test-user-${timestamp}`,
      email: input.slug ? `test-${input.slug}@example.com` : `test-${timestamp}@example.com`,
      name: "Test User",
      platformRole: "user",
    },
  });

  // Create FamilySpace
  const space = await prisma.familySpace.create({
    data: {
      slug: uniqueSlug,
      name: input.name,
      description: input.description,
    },
  });

  // Create membership
  const membership = await prisma.familyMembership.create({
    data: {
      userId: user.id,
      familySpaceId: space.id,
      role: "owner",
    },
  });

  return { space, user, membership };
}

// -----------------------------------------------------------------------------
// Two Disjoint Spaces Arbitraries
// -----------------------------------------------------------------------------

/**
 * Arbitrary for generating two completely disjoint FamilySpaces.
 * This is useful for testing tenant isolation (Property 2).
 */
export const arbTwoDisjointSpaces: fc.Arbitrary<{
  spaceA: { space: FamilySpace; user: { id: string }; membership: { id: string } };
  spaceB: { space: FamilySpace; user: { id: string }; membership: { id: string } };
}> = fc
  .tuple(arbFamilySpaceFixture, arbFamilySpaceFixture)
  .map(([fixtureA, fixtureB]) => {
    // Ensure different slugs by appending unique suffixes
    const slugA = `${fixtureA.space.slug}-a`;
    const slugB = `${fixtureB.space.slug}-b`;
    return {
      spaceInputA: { ...fixtureA.space, slug: slugA },
      spaceInputB: { ...fixtureB.space, slug: slugB },
    };
  })
  .map(async ({ spaceInputA, spaceInputB }) => {
    // Create both spaces with data
    const spaceA = await createFamilySpaceWithData(spaceInputA);
    const spaceB = await createFamilySpaceWithData(spaceInputB);
    return { spaceA, spaceB };
  });

/**
 * Creates two disjoint FamilySpaces for testing.
 * Returns both spaces with their users and memberships.
 */
export async function createTwoDisjointSpaces(): Promise<{
  spaceA: { space: FamilySpace; user: { id: string }; membership: { id: string } };
  spaceB: { space: FamilySpace; user: { id: string }; membership: { id: string } };
}> {
  const timestamp = Date.now();
  
  // Create first space
  const spaceA = await createFamilySpaceWithData({
    slug: `test-space-a-${timestamp}`,
    name: "Test Space A",
    description: "First test space for isolation testing",
  });

  // Create second space with different timestamp to ensure uniqueness
  const spaceB = await createFamilySpaceWithData({
    slug: `test-space-b-${timestamp + 1}`,
    name: "Test Space B",
    description: "Second test space for isolation testing",
  });

  return { spaceA, spaceB };
}

// -----------------------------------------------------------------------------
// Pagination Parameters Arbitraries
// -----------------------------------------------------------------------------

/**
 * Arbitrary for pagination parameters.
 * Generates valid page/pageSize combinations for testing.
 */
export const arbPaginationParams: fc.Arbitrary<{
  page: number;
  pageSize: number;
}> = fc
  .record({
    page: fc.integer({ min: 1, max: 100 }),
    pageSize: fc.integer({ min: 1, max: 100 }),
  });

/**
 * Arbitrary for legacy (non-paginated) requests.
 * Generates undefined page and pageSize.
 */
export const arbLegacyParams: fc.Arbitrary<{ page?: undefined; pageSize?: undefined }> = fc
  .record({
    page: fc.constant(undefined),
    pageSize: fc.constant(undefined),
  });

/**
 * Arbitrary for mixed pagination scenarios.
 * Can generate either legacy or paginated requests.
 */
export const arbMixedPaginationParams: fc.Arbitrary<
  | { mode: "legacy" }
  | { mode: "paged"; page: number; pageSize: number }
> = fc.oneof(
  arbLegacyParams.map((p) => ({ mode: "legacy" as const, ...p })),
  arbPaginationParams.map((p) => ({ mode: "paged" as const, ...p }))
);

// -----------------------------------------------------------------------------
// Graph Edit Arbitraries
// -----------------------------------------------------------------------------

/**
 * Represents a family graph edit operation.
 */
export type GraphEdit =
  | { type: "add-member"; member: Prisma.FamilyMemberCreateInput }
  | { type: "update-member"; id: string; data: Prisma.FamilyMemberUpdateInput }
  | { type: "delete-member"; id: string }
  | { type: "add-branch"; branch: Prisma.FamilyBranchCreateInput }
  | { type: "update-branch"; slugId: string; data: Prisma.FamilyBranchUpdateInput }
  | { type: "delete-branch"; slugId: string };

/**
 * Arbitrary for family graph edit operations.
 * Used to test relationship cache invalidation.
 */
export const arbGraphEdit: fc.Arbitrary<GraphEdit> = fc.oneof(
  // Add member
  fc.record({
    type: fc.constant("add-member"),
    member: fc.record({
      familySpaceId: fc.uuid(),
      slugId: fc.uuid().map((u) => `member-${u}`),
      fullName: fc.string({ minLength: 1, maxLength: 100 }),
      displayName: fc.string({ minLength: 1, maxLength: 50 }),
      gender: fc.oneof(fc.constant("male"), fc.constant("female")),
      generation: fc.integer({ min: 1, max: 10 }),
      familyBranchId: fc.uuid().map((u) => `branch-${u}`),
      biography: fc.string({ maxLength: 2000 }),
      notes: fc.string({ maxLength: 2000 }),
      statusLabel: fc.string({ maxLength: 50 }),
      relationshipToRoot: fc.string({ maxLength: 20 }),
    }),
  }),
  // Update member
  fc.record({
    type: fc.constant("update-member"),
    id: fc.uuid(),
    data: fc.record({
      fullName: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
      fatherId: fc.option(fc.uuid()),
      motherId: fc.option(fc.uuid()),
      spouseIds: fc.option(fc.array(fc.uuid())),
      childrenIds: fc.option(fc.array(fc.uuid())),
      siblingIds: fc.option(fc.array(fc.uuid())),
    }),
  }),
  // Delete member
  fc.record({
    type: fc.constant("delete-member"),
    id: fc.uuid(),
  }),
  // Add branch
  fc.record({
    type: fc.constant("add-branch"),
    branch: fc.record({
      familySpaceId: fc.uuid(),
      slugId: fc.uuid().map((u) => `branch-${u}`),
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ maxLength: 500 }),
    }),
  }),
  // Update branch
  fc.record({
    type: fc.constant("update-branch"),
    slugId: fc.uuid(),
    data: fc.record({
      name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
      description: fc.option(fc.string({ maxLength: 500 })),
    }),
  }),
  // Delete branch
  fc.record({
    type: fc.constant("delete-branch"),
    slugId: fc.uuid(),
  })
);

// -----------------------------------------------------------------------------
// Family Member Arbitraries
// -----------------------------------------------------------------------------

/**
 * Arbitrary for generating valid FamilyMember create input.
 */
export const arbFamilyMemberInput: fc.Arbitrary<Prisma.FamilyMemberCreateInput> = fc
  .record({
    familySpaceId: fc.uuid(),
    slugId: fc.uuid().map((u) => `member-${u}`),
    fullName: fc.string({ minLength: 1, maxLength: 100 }),
    displayName: fc.string({ minLength: 1, maxLength: 50 }),
    gender: fc.oneof(fc.constant("male"), fc.constant("female")),
    generation: fc.integer({ min: 1, max: 10 }),
    familyBranchId: fc.uuid().map((u) => `branch-${u}`),
    fatherId: fc.option(fc.uuid()),
    motherId: fc.option(fc.uuid()),
    spouseIds: fc.option(fc.array(fc.uuid())),
    childrenIds: fc.option(fc.array(fc.uuid())),
    siblingIds: fc.option(fc.array(fc.uuid())),
    birthDate: fc.option(fc.string()),
    marriageDate: fc.option(fc.string()),
    deathDate: fc.option(fc.string()),
    isDeceased: fc.boolean(),
    deceasedLabel: fc.option(fc.string()),
    birthPlace: fc.option(fc.string()),
    biography: fc.string({ maxLength: 2000 }),
    notes: fc.string({ maxLength: 2000 }),
    photo: fc.option(fc.string()),
    statusLabel: fc.string({ maxLength: 50 }),
    relationshipToRoot: fc.string({ maxLength: 20 }),
  });

/**
 * Creates a family member in the database.
 */
export async function createFamilyMember(
  input: Prisma.FamilyMemberCreateInput
): Promise<FamilyMember> {
  return prisma.familyMember.create({ data: input });
}

// -----------------------------------------------------------------------------
// Export all arbitraries for easy access
// -----------------------------------------------------------------------------

export {
  seedTestFixture,
  seedTreeFixture,
  cleanupDatabase,
};