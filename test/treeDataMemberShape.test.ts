/**
 * Property test for tree-data endpoint member shape invariant
 * Validates: Requirements 2.4, 2.5, 2.6
 * Feature: api-query-performance-optimization
 * Property 5: Tree-data member shape invariant
 */
import { describe, it, expect, afterAll } from "vitest";
import * as fc from "fast-check";
import { prisma } from "../server/db.js";
import { treeMemberSelect, mapTreeMember } from "../server/routes/shared.js";

// The 22-key whitelist from design §Tree member shape
const EXPECTED_KEYS = [
  "childrenIds",
  "deathDate",
  "deceasedLabel",
  "displayName",
  "familyBranch",
  "fatherId",
  "fullName",
  "gender",
  "generation",
  "id",
  "isDeceased",
  "marriageDate",
  "motherId",
  "nuclearFamilyIds",
  "parentFamilyId",
  "photo",
  "relationshipToRoot",
  "siblingIds",
  "spouseIds",
  "formerSpouseIds",
  "statusLabel",
  "birthDate",
].sort();

// Fields that should NOT appear on any member
const FORBIDDEN_KEYS = ["biography", "notes", "birthPlace"];

// Track all created space IDs for cleanup
const createdSpaces: string[] = [];

afterAll(async () => {
  // Clean up all test spaces in a simpler way - delete by slug pattern
  try {
    const testSpaces = await prisma.familySpace.findMany({
      where: {
        slug: { startsWith: "test-space-" },
      },
      select: { id: true },
    });

    for (const space of testSpaces) {
      try {
        await prisma.familyMember.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familyBranch.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.nuclearFamily.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familyMembership.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familySpace.deleteMany({ where: { id: space.id } });
      } catch (e) {
        // Ignore individual cleanup errors
      }
    }

    // Clean up test users
    await prisma.appUser.deleteMany({
      where: { authUserId: { startsWith: "test-user-" } },
    });
  } catch (e) {
    // Ignore final cleanup errors
  }
}, 60000);

describe("Property 5: Tree-data member shape invariant", () => {
  it(
    "should return members with exactly the expected 22-key shape and no forbidden keys",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (seed) => {
            const timestamp = Date.now() + seed;

            // Create test user
            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-${timestamp}`,
                email: `test-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            // Create FamilySpace
            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-${timestamp}`,
                name: "Test Family Space",
                description: "A test family space",
              },
            });
            createdSpaces.push(familySpace.id);

            // Create membership
            await prisma.familyMembership.create({
              data: {
                userId: testUser.id,
                familySpaceId: familySpace.id,
                role: "owner",
              },
            });

            // Create a family branch
            const branch = await prisma.familyBranch.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `branch-${timestamp}`,
                name: "Main Branch",
                description: "Primary family branch",
                memberIds: [],
              },
            });

            // Create multiple family members
            const memberCount = 3;
            for (let i = 0; i < memberCount; i++) {
              await prisma.familyMember.create({
                data: {
                  familySpaceId: familySpace.id,
                  slugId: `member-${timestamp}-${i}`,
                  fullName: `Family Member ${i}`,
                  displayName: `Member ${i}`,
                  gender: i % 2 === 0 ? "male" : "female",
                  generation: Math.floor(i / 2) + 1,
                  familyBranchId: branch.slugId,
                  spouseIds: [],
                  childrenIds: [],
                  siblingIds: [],
                  biography: `Biography ${i}`,
                  notes: `Notes ${i}`,
                  birthPlace: `Birth Place ${i}`,
                  statusLabel: "Active",
                  relationshipToRoot: `${Math.floor(i / 2) + 1}`,
                },
              });
            }

            // Fetch members using tree-data endpoint's select shape
            const members = await prisma.familyMember.findMany({
              where: { familySpaceId: familySpace.id },
              orderBy: [{ generation: "asc" }, { fullName: "asc" }],
              select: treeMemberSelect,
            });

            const mappedMembers = members.map(mapTreeMember);

            expect(mappedMembers.length).toBe(memberCount);

            // Verify each member has exactly the expected keys
            for (const member of mappedMembers) {
              const memberKeys = Object.keys(member).sort();
              expect(memberKeys).toEqual(EXPECTED_KEYS);

              for (const forbidden of FORBIDDEN_KEYS) {
                expect(member).not.toHaveProperty(forbidden);
              }
            }
          }
        ),
        { numRuns: 3 }
      );
    }
  );

  it(
    "should verify the tree member shape has exactly 22 keys",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (numMembers) => {
            const timestamp = Date.now();

            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-shape-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-shape-${timestamp}`,
                email: `test-shape-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-shape-${timestamp}`,
                name: "Test Family Space",
                description: "A test family space",
              },
            });
            createdSpaces.push(familySpace.id);

            await prisma.familyMembership.create({
              data: {
                userId: testUser.id,
                familySpaceId: familySpace.id,
                role: "owner",
              },
            });

            const branch = await prisma.familyBranch.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `branch-shape-${timestamp}`,
                name: "Test Branch",
                description: "Test branch",
                memberIds: [],
              },
            });

            for (let i = 0; i < numMembers; i++) {
              await prisma.familyMember.create({
                data: {
                  familySpaceId: familySpace.id,
                  slugId: `member-shape-${timestamp}-${i}`,
                  fullName: `Test Member ${i}`,
                  displayName: `Member ${i}`,
                  gender: i % 2 === 0 ? "male" : "female",
                  generation: Math.floor(i / 3) + 1,
                  familyBranchId: branch.slugId,
                  spouseIds: [],
                  childrenIds: [],
                  siblingIds: [],
                  biography: `Test biography ${i}`,
                  notes: `Test notes ${i}`,
                  birthPlace: `Test place ${i}`,
                  statusLabel: "Active",
                  relationshipToRoot: `${i + 1}`,
                },
              });
            }

            const members = await prisma.familyMember.findMany({
              where: { familySpaceId: familySpace.id },
              orderBy: [{ generation: "asc" }, { fullName: "asc" }],
              select: treeMemberSelect,
            });

            const mappedMembers = members.map(mapTreeMember);

            expect(mappedMembers.length).toBe(numMembers);

            for (const member of mappedMembers) {
              const memberKeys = Object.keys(member).sort();
              expect(memberKeys).toEqual(EXPECTED_KEYS);

              expect(member).not.toHaveProperty("biography");
              expect(member).not.toHaveProperty("notes");
              expect(member).not.toHaveProperty("birthPlace");
            }
          }
        ),
        { numRuns: 5 }
      );
    }
  );

  it(
    "should verify that biography, notes, and birthPlace from DB do not appear in API response",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (seed) => {
            const timestamp = Date.now() + seed * 1000;

            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-forbid-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-forbid-${timestamp}`,
                email: `test-forbid-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-forbid-${timestamp}`,
                name: "Test Family Space",
                description: "A test family space",
              },
            });
            createdSpaces.push(familySpace.id);

            await prisma.familyMembership.create({
              data: {
                userId: testUser.id,
                familySpaceId: familySpace.id,
                role: "owner",
              },
            });

            const branch = await prisma.familyBranch.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `branch-forbid-${timestamp}`,
                name: "Main Branch",
                description: "Primary branch",
                memberIds: [],
              },
            });

            await prisma.familyMember.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `member-forbid-${timestamp}`,
                fullName: "Test Member With Bio",
                displayName: "Test",
                gender: "male",
                generation: 1,
                familyBranchId: branch.slugId,
                biography: "This is a biography that should NOT appear in tree-data",
                notes: "These are notes that should NOT appear in tree-data",
                birthPlace: "Birth place that should NOT appear in tree-data",
                spouseIds: [],
                childrenIds: [],
                siblingIds: [],
                statusLabel: "Active",
                relationshipToRoot: "1",
              },
            });

            const members = await prisma.familyMember.findMany({
              where: { familySpaceId: familySpace.id },
              orderBy: [{ generation: "asc" }, { fullName: "asc" }],
              select: treeMemberSelect,
            });

            const mappedMembers = members.map(mapTreeMember);

            expect(mappedMembers.length).toBe(1);
            const member = mappedMembers[0];

            expect(Object.keys(member).sort()).toEqual(EXPECTED_KEYS);

            expect("biography" in member).toBe(false);
            expect("notes" in member).toBe(false);
            expect("birthPlace" in member).toBe(false);
          }
        ),
        { numRuns: 3 }
      );
    }
  );
});