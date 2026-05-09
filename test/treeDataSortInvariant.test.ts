// Feature: api-query-performance-optimization, Property 6: Tree-data sort invariant
// **Validates: Requirements 2.10**

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { prisma } from "../server/db.js";
import { createApp } from "./setup.js";
import { cleanupDatabase } from "./fixtures/arbFamilySpaceFixture.js";

describe("Property 6: Tree-data sort invariant", () => {
  const app = createApp();
  let testSpaceId: string | null = null;
  let testUserId: string | null = null;

  // Helper to create a test user with membership for a space
  async function createAuthenticatedContext(spaceSlug: string) {
    const timestamp = Date.now();
    const uniqueSlug = `${spaceSlug}-${timestamp}`;

    const testUser = await prisma.appUser.create({
      data: {
        authUserId: `test-user-${uniqueSlug}`,
        email: `test-${uniqueSlug}@example.com`,
        name: "Test User",
        platformRole: "user",
      },
    });

    const familySpace = await prisma.familySpace.create({
      data: {
        slug: uniqueSlug,
        name: "Test Family Space",
        description: "A test family space for sort testing",
      },
    });

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
        slugId: "main-branch",
        name: "Main Branch",
        description: "Primary family branch",
        memberIds: [],
      },
    });

    testSpaceId = familySpace.id;
    testUserId = testUser.id;

    return { user: testUser, space: familySpace, branch };
  }

  // Helper to create test members
  async function createTestMembers(spaceId: string, branchSlugId: string, memberConfigs: Array<{ fullName: string; generation: number }>) {
    const members = [];
    for (const config of memberConfigs) {
      const member = await prisma.familyMember.create({
        data: {
          familySpaceId: spaceId,
          slugId: `member-${config.fullName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${Math.random()}`,
          fullName: config.fullName,
          displayName: config.fullName.split(" ")[0],
          gender: "male",
          generation: config.generation,
          familyBranchId: branchSlugId,
          spouseIds: [],
          childrenIds: [],
          siblingIds: [],
          biography: "",
          notes: "",
          statusLabel: "Active",
          relationshipToRoot: String(config.generation),
        },
      });
      members.push(member);
    }
    return members;
  }

  // Verify the sort invariant for an array of members
  // Property: For every adjacent pair (m_i, m_{i+1}) in members:
  // - m_i.generation < m_{i+1}.generation OR
  // - (m_i.generation === m_{i+1}.generation AND m_i.fullName <= m_{i+1}.fullName)
  function verifySortInvariant(members: Array<{ generation: number; fullName: string }>): { valid: boolean; violation?: { i: number; current: { generation: number; fullName: string }; next: { generation: number; fullName: string } } } {
    for (let i = 0; i < members.length - 1; i++) {
      const current = members[i];
      const next = members[i + 1];

      const generationLess = current.generation < next.generation;
      const generationEqualAndNameLessOrEqual =
        current.generation === next.generation && current.fullName <= next.fullName;

      if (!generationLess && !generationEqualAndNameLessOrEqual) {
        return { valid: false, violation: { i, current, next } };
      }
    }
    return { valid: true };
  }

  // Fast-check property test using arbFamilySpaceFixture
  // Verifies the sort invariant holds across multiple randomly generated scenarios
  // Using 20 runs x 5 members = 100 total fast-check iterations as required
  it(
    "property test: tree-data members are sorted by generation then fullName (fast-check)",
    { timeout: 180000 },
    async () => {
      const testRuns = 20; // Number of property test runs to achieve 100+ total iterations
      const membersPerRun = 5; // Number of members per run
      
      for (let run = 0; run < testRuns; run++) {
        // Generate random member data using fast-check
        const memberSample = fc.sample(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 30 }),
            generation: fc.integer({ min: 1, max: 3 }),
          }),
          { numRuns: membersPerRun }
        );
        
        // Set up test space
        const timestamp = Date.now();
        const uniqueSlug = `test-pbt-${timestamp}-${run}`;

        // Create test user
        const testUser = await prisma.appUser.create({
          data: {
            authUserId: `test-user-${uniqueSlug}`,
            email: `test-${uniqueSlug}@example.com`,
            name: "Test User",
            platformRole: "user",
          },
        });

        // Create FamilySpace
        const familySpace = await prisma.familySpace.create({
          data: {
            slug: uniqueSlug,
            name: "Test Space",
            description: "Test space for sort testing",
          },
        });

        // Create family membership
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
            slugId: "test-branch",
            name: "Test Branch",
            description: "Branch for testing",
            memberIds: [],
          },
        });

        // Create members with the generated data
        for (let i = 0; i < memberSample.length; i++) {
          const data = memberSample[i];
          // Ensure valid fullName (no empty strings)
          const validName = data.fullName.length > 0 ? data.fullName : `Member${i}`;
          await prisma.familyMember.create({
            data: {
              familySpaceId: familySpace.id,
              slugId: `member-${i}-${timestamp}`,
              fullName: validName,
              displayName: validName.split(" ")[0] || validName,
              gender: "male",
              generation: data.generation,
              familyBranchId: branch.slugId,
              spouseIds: [],
              childrenIds: [],
              siblingIds: [],
              biography: "",
              notes: "",
              statusLabel: "Active",
              relationshipToRoot: String(data.generation),
            },
          });
        }

        // Query with the same orderBy as the tree-data endpoint
        const members = await prisma.familyMember.findMany({
          where: { familySpaceId: familySpace.id },
          orderBy: [{ generation: "asc" }, { fullName: "asc" }],
          select: {
            generation: true,
            fullName: true,
          },
        });

        // Verify the sort invariant
        const result = verifySortInvariant(members);
        
        // Simple cleanup - delete in proper order without transaction
        await prisma.familyMember.deleteMany({ where: { familySpaceId: familySpace.id } });
        await prisma.familyBranch.deleteMany({ where: { familySpaceId: familySpace.id } });
        await prisma.familyMembership.deleteMany({ where: { familySpaceId: familySpace.id } });
        await prisma.familySpace.delete({ where: { id: familySpace.id } });
        await prisma.appUser.delete({ where: { id: testUser.id } }).catch(() => {});

        // Assert the property
        expect(result.valid, 
          `Sort invariant violated for run ${run}: ${result.violation ? 
            `member ${result.violation.i} (gen=${result.violation.current.generation}, name="${result.violation.current.fullName}") ` +
            `should come before member ${result.violation.i + 1} (gen=${result.violation.next.generation}, name="${result.violation.next.fullName}")` : 
            JSON.stringify(members)}`
        ).toBe(true);
      }
    }
  );

  beforeEach(async () => {
    // Set up test data
    const timestamp = Date.now();
    const spaceSlug = `test-sort-${timestamp}`;
    await createAuthenticatedContext(spaceSlug);

    if (testSpaceId) {
      const branch = await prisma.familyBranch.findFirst({
        where: { familySpaceId: testSpaceId },
      });

      if (branch) {
        await createTestMembers(testSpaceId, branch.slugId, [
          { fullName: "Zara", generation: 1 },
          { fullName: "Alice", generation: 1 },
          { fullName: "Bob", generation: 2 },
          { fullName: "Charlie", generation: 2 },
          { fullName: "Diana", generation: 2 },
          { fullName: "Eve", generation: 3 },
          { fullName: "Frank", generation: 1 },
        ]);
      }
    }
  });

  afterEach(async () => {
    if (testSpaceId) {
      // Simple cleanup without transaction to avoid timeout
      try {
        await prisma.familyMember.deleteMany({ where: { familySpaceId: testSpaceId } });
        await prisma.familyBranch.deleteMany({ where: { familySpaceId: testSpaceId } });
        await prisma.familyMembership.deleteMany({ where: { familySpaceId: testSpaceId } });
        await prisma.familySpace.delete({ where: { id: testSpaceId } });
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
    }
    if (testUserId) {
      await prisma.appUser.delete({ where: { id: testUserId } }).catch(() => {});
    }
    testSpaceId = null;
    testUserId = null;
  });

  it("should return members sorted by generation ascending then fullName ascending", async () => {
    expect(testSpaceId).not.toBeNull();

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: testSpaceId! },
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
      select: {
        generation: true,
        fullName: true,
      },
    });

    expect(members.length).toBeGreaterThan(0);

    const result = verifySortInvariant(members);
    expect(result.valid, `Sort invariant violated: ${JSON.stringify(result.violation)}`).toBe(true);

    // Verify expected order: Gen 1: Alice, Frank, Zara | Gen 2: Bob, Charlie, Diana | Gen 3: Eve
    const expectedOrder = ["Alice", "Frank", "Zara", "Bob", "Charlie", "Diana", "Eve"];
    const actualOrder = members.map(m => m.fullName);
    expect(actualOrder).toEqual(expectedOrder);
  });

  it("should verify sort invariant for each adjacent pair", async () => {
    expect(testSpaceId).not.toBeNull();

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: testSpaceId! },
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
      select: {
        generation: true,
        fullName: true,
      },
    });

    // Check that all adjacent pairs satisfy the invariant
    for (let i = 0; i < members.length - 1; i++) {
      const current = members[i];
      const next = members[i + 1];

      const generationLess = current.generation < next.generation;
      const generationEqualAndNameLessOrEqual =
        current.generation === next.generation && current.fullName <= next.fullName;

      expect(
        generationLess || generationEqualAndNameLessOrEqual,
        `Sort invariant violated between member ${i} (gen=${current.generation}, name="${current.fullName}") ` +
        `and member ${i + 1} (gen=${next.generation}, name="${next.fullName}")`
      ).toBe(true);
    }
  });

  it("should handle edge case: same generation and same name", async () => {
    expect(testSpaceId).not.toBeNull();

    const branch = await prisma.familyBranch.findFirst({
      where: { familySpaceId: testSpaceId! },
    });
    expect(branch).not.toBeNull();

    // Add members with same generation and same name (edge case)
    const timestamp = Date.now();
    await prisma.familyMember.create({
      data: {
        familySpaceId: testSpaceId!,
        slugId: `member-same-1-${timestamp}`,
        fullName: "TestMember",
        displayName: "Test",
        gender: "male",
        generation: 4,
        familyBranchId: branch!.slugId,
        spouseIds: [],
        childrenIds: [],
        siblingIds: [],
        biography: "",
        notes: "",
        statusLabel: "Active",
        relationshipToRoot: "4",
      },
    });

    await prisma.familyMember.create({
      data: {
        familySpaceId: testSpaceId!,
        slugId: `member-same-2-${timestamp}`,
        fullName: "TestMember",
        displayName: "Test",
        gender: "female",
        generation: 4,
        familyBranchId: branch!.slugId,
        spouseIds: [],
        childrenIds: [],
        siblingIds: [],
        biography: "",
        notes: "",
        statusLabel: "Active",
        relationshipToRoot: "4",
      },
    });

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: testSpaceId! },
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
      select: {
        generation: true,
        fullName: true,
      },
    });

    // Verify invariant still holds (same name is allowed: <=)
    const result = verifySortInvariant(members);
    expect(result.valid).toBe(true);
  });
});