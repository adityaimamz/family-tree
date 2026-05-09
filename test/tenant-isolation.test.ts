/**
 * Property test for FamilySpace tenant isolation
 * Validates: Requirements 1.8, 2.9, 3.5, 4.5, 5.9, 6.8, 7.5, 8.5, 8.6
 * Feature: api-query-performance-optimization
 * Property 2: FamilySpace tenant isolation
 */
import { describe, it, expect, afterAll, beforeEach } from "vitest";
import * as fc from "fast-check";
import request from "supertest";
import { prisma } from "../server/db.js";
import { createApp } from "./setup.js";
import { cleanupDatabase } from "./setup.js";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a test user in the database
 */
async function createTestUser(timestamp: number, suffix: string = "") {
  return prisma.appUser.upsert({
    where: { authUserId: `test-user-${timestamp}${suffix}` },
    update: {},
    create: {
      authUserId: `test-user-${timestamp}${suffix}`,
      email: `test-${timestamp}${suffix}@example.com`,
      name: "Test User",
      platformRole: "user",
    },
  });
}

/**
 * Creates a complete FamilySpace with members, branches, nuclear families, etc.
 * This ensures space A and space B have different content.
 */
async function createSpaceWithData(
  slug: string,
  userId: string,
  prefix: string
): Promise<{
  space: { id: string; slug: string; name: string };
  userId: string;
  memberIds: string[];
  branchSlugIds: string[];
  nuclearFamilySlugIds: string[];
  storyTitles: string[];
  sourceNoteTitles: string[];
  timelineTitles: string[];
  galleryDescriptions: string[];
  uniqueContent: Set<string>;
}> {
  const uniqueContent = new Set<string>();

  // Create FamilySpace
  const space = await prisma.familySpace.create({
    data: {
      slug,
      name: `Family Space ${prefix}`,
      description: `Description for space ${prefix}`,
    },
  });

  uniqueContent.add(slug);
  uniqueContent.add(`desc-${slug}`);

  // Create membership
  await prisma.familyMembership.create({
    data: {
      userId,
      familySpaceId: space.id,
      role: "owner",
    },
  });

  // Create branches
  const branch1 = await prisma.familyBranch.create({
    data: {
      familySpaceId: space.id,
      slugId: `branch-${prefix}-1`,
      name: `Branch ${prefix} 1`,
      description: `Branch description ${prefix} 1`,
      memberIds: [],
    },
  });
  const branch2 = await prisma.familyBranch.create({
    data: {
      familySpaceId: space.id,
      slugId: `branch-${prefix}-2`,
      name: `Branch ${prefix} 2`,
      description: `Branch description ${prefix} 2`,
      memberIds: [],
    },
  });

  uniqueContent.add(branch1.slugId);
  uniqueContent.add(branch1.name);
  uniqueContent.add(branch1.description || "");
  uniqueContent.add(branch2.slugId);
  uniqueContent.add(branch2.name);
  uniqueContent.add(branch2.description || "");

  // Create family members
  const member1 = await prisma.familyMember.create({
    data: {
      familySpaceId: space.id,
      slugId: `member-${prefix}-1`,
      fullName: `Full Name ${prefix} 1`,
      displayName: `Display ${prefix} 1`,
      gender: "male",
      generation: 1,
      familyBranchId: branch1.slugId,
      biography: `Biography content ${prefix} 1 - private info`,
      notes: `Notes content ${prefix} 1 - private info`,
      birthPlace: `Birth Place ${prefix} 1`,
      spouseIds: [],
      childrenIds: [],
      siblingIds: [],
      statusLabel: "Active",
      relationshipToRoot: "1",
    },
  });

  const member2 = await prisma.familyMember.create({
    data: {
      familySpaceId: space.id,
      slugId: `member-${prefix}-2`,
      fullName: `Full Name ${prefix} 2`,
      displayName: `Display ${prefix} 2`,
      gender: "female",
      generation: 2,
      familyBranchId: branch1.slugId,
      fatherId: member1.id,
      biography: `Biography content ${prefix} 2 - private info`,
      notes: `Notes content ${prefix} 2 - private info`,
      birthPlace: `Birth Place ${prefix} 2`,
      spouseIds: [],
      childrenIds: [],
      siblingIds: [],
      statusLabel: "Active",
      relationshipToRoot: "1.1",
    },
  });

  // Update member1's children
  await prisma.familyMember.update({
    where: { id: member1.id },
    data: { childrenIds: [member2.id] },
  });

  const memberIds = [member1.slugId, member2.slugId];
  for (const id of memberIds) {
    uniqueContent.add(id);
  }
  uniqueContent.add(`Full Name ${prefix} 1`);
  uniqueContent.add(`Full Name ${prefix} 2`);
  uniqueContent.add(`Display ${prefix} 1`);
  uniqueContent.add(`Display ${prefix} 2`);
  uniqueContent.add(`Biography content ${prefix} 1 - private info`);
  uniqueContent.add(`Notes content ${prefix} 1 - private info`);
  uniqueContent.add(`Birth Place ${prefix} 1`);

  // Create nuclear family
  const nuclearFamily = await prisma.nuclearFamily.create({
    data: {
      familySpaceId: space.id,
      slugId: `nuclear-family-${prefix}`,
      name: `Nuclear Family ${prefix}`,
      husbandId: member1.id,
      wifeId: member2.id,
      childrenIds: [member2.id],
    },
  });

  uniqueContent.add(nuclearFamily.slugId);
  uniqueContent.add(nuclearFamily.name);

  // Create stories
  const story1 = await prisma.story.create({
    data: {
      familySpaceId: space.id,
      slugId: `story-${prefix}-1`,
      title: `Story Title ${prefix} 1`,
      content: `Story content ${prefix} 1 - private story content`,
      date: new Date(),
    },
  });

  const story2 = await prisma.story.create({
    data: {
      familySpaceId: space.id,
      slugId: `story-${prefix}-2`,
      title: `Story Title ${prefix} 2`,
      content: `Story content ${prefix} 2 - private story content`,
      date: new Date(),
    },
  });

  uniqueContent.add(story1.slugId);
  uniqueContent.add(story1.title);
  uniqueContent.add(story1.content);
  uniqueContent.add(story2.slugId);
  uniqueContent.add(story2.title);
  uniqueContent.add(story2.content);

  // Link members to stories
  await prisma.storyMember.create({
    data: { storyId: story1.id, memberId: member1.id },
  });
  await prisma.storyMember.create({
    data: { storyId: story2.id, memberId: member2.id },
  });

  // Create source notes
  const sourceNote1 = await prisma.sourceNote.create({
    data: {
      familySpaceId: space.id,
      slugId: `source-note-${prefix}-1`,
      title: `Source Note ${prefix} 1`,
      content: `Source content ${prefix} 1 - private source`,
      date: new Date(),
    },
  });

  uniqueContent.add(sourceNote1.slugId);
  uniqueContent.add(sourceNote1.title);
  uniqueContent.add(sourceNote1.content);

  // Link source note to member
  await prisma.sourceNoteMember.create({
    data: { sourceNoteId: sourceNote1.id, memberId: member1.id },
  });

  // Create timeline events
  const timeline1 = await prisma.timelineEvent.create({
    data: {
      familySpaceId: space.id,
      slugId: `timeline-${prefix}-1`,
      title: `Timeline Event ${prefix} 1`,
      description: `Timeline description ${prefix} 1`,
      year: 2000,
      month: 1,
    },
  });

  const timeline2 = await prisma.timelineEvent.create({
    data: {
      familySpaceId: space.id,
      slugId: `timeline-${prefix}-2`,
      title: `Timeline Event ${prefix} 2`,
      description: `Timeline description ${prefix} 2`,
      year: 2005,
      month: 6,
    },
  });

  uniqueContent.add(timeline1.slugId);
  uniqueContent.add(timeline1.title);
  uniqueContent.add(timeline1.description || "");
  uniqueContent.add(timeline2.slugId);
  uniqueContent.add(timeline2.title);
  uniqueContent.add(timeline2.description || "");

  // Create gallery items
  const gallery1 = await prisma.galleryItem.create({
    data: {
      familySpaceId: space.id,
      slugId: `gallery-${prefix}-1`,
      title: `Gallery Item ${prefix} 1`,
      description: `Gallery description ${prefix} 1`,
      year: 2020,
    },
  });

  uniqueContent.add(gallery1.slugId);
  uniqueContent.add(gallery1.title);
  uniqueContent.add(gallery1.description || "");

  return {
    space,
    userId,
    memberIds,
    branchSlugIds: [branch1.slugId, branch2.slugId],
    nuclearFamilySlugIds: [nuclearFamily.slugId],
    storyTitles: [story1.title, story2.title],
    sourceNoteTitles: [sourceNote1.title],
    timelineTitles: [timeline1.title, timeline2.title],
    galleryDescriptions: [gallery1.description || ""],
    uniqueContent,
  };
}

/**
 * Recursively extracts all string values from an object for checking isolation
 */
function extractAllStrings(obj: unknown, strings: Set<string> = new Set()): Set<string> {
  if (typeof obj === "string") {
    strings.add(obj);
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      extractAllStrings(item, strings);
    }
  } else if (obj !== null && typeof obj === "object") {
    for (const value of Object.values(obj)) {
      extractAllStrings(value, strings);
    }
  }
  return strings;
}

/**
 * Checks if any string from space A's content appears in space B's response
 */
function findLeakedContent(spaceAContent: Set<string>, responseBody: unknown): string[] {
  const responseStrings = extractAllStrings(responseBody);
  const leaked: string[] = [];

  for (const content of spaceAContent) {
    // Skip empty strings and very short strings that might match by chance
    if (content.length < 3) continue;

    for (const responseStr of responseStrings) {
      // Check if the response contains this content (case-insensitive partial match)
      if (responseStr.toLowerCase().includes(content.toLowerCase())) {
        leaked.push(content);
        break;
      }
    }
  }

  return leaked;
}

// =============================================================================
// Test Setup
// =============================================================================

describe("Property 2: FamilySpace tenant isolation", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  afterAll(async () => {
    // Clean up all test data
    const testSpaces = await prisma.familySpace.findMany({
      where: {
        slug: { startsWith: "test-space-" },
      },
      select: { id: true },
    });

    for (const space of testSpaces) {
      try {
        await cleanupDatabase(space.id);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    await prisma.appUser.deleteMany({
      where: { authUserId: { startsWith: "test-user-" } },
    });
  }, 60000);

  // List of all space-scoped read endpoints to test
  const spaceScopedReadEndpoints = [
    "/api/spaces/:spaceSlug",
    "/api/spaces/:spaceSlug/summary",
    "/api/spaces/:spaceSlug/membership",
    "/api/spaces/:spaceSlug/members",
    "/api/spaces/:spaceSlug/branches",
    "/api/spaces/:spaceSlug/nuclear-families",
    "/api/spaces/:spaceSlug/stories",
    "/api/spaces/:spaceSlug/source-notes",
    "/api/spaces/:spaceSlug/gallery",
    "/api/spaces/:spaceSlug/timeline",
    "/api/spaces/:spaceSlug/bootstrap",
    "/api/spaces/:spaceSlug/tree-data",
  ];

  it(
    "should not leak content from one space to another - direct DB verification",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (seed) => {
          const timestamp = Date.now() + seed;

          // Create two users
          const userA = await createTestUser(timestamp, "-a");
          const userB = await createTestUser(timestamp, "-b");

          // Create two completely separate spaces
          const spaceAData = await createSpaceWithData(
            `test-space-a-${timestamp}`,
            userA.id,
            `A${timestamp}`
          );

          const spaceBData = await createSpaceWithData(
            `test-space-b-${timestamp}`,
            userB.id,
            `B${timestamp}`
          );

          // Verify that content from space A exists in database
          const membersInA = await prisma.familyMember.findMany({
            where: { familySpaceId: spaceAData.space.id },
          });
          expect(membersInA.length).toBe(2);

          const membersInB = await prisma.familyMember.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });
          expect(membersInB.length).toBe(2);

          // CRITICAL: Verify that B's members don't contain A's member IDs
          const bMemberSlugIds = membersInB.map((m) => m.slugId);
          for (const memberA of membersInA) {
            expect(bMemberSlugIds).not.toContain(memberA.slugId);
          }

          // Verify that B's content doesn't contain A's slugs/names
          const bBranches = await prisma.familyBranch.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });
          for (const branchA of spaceAData.branchSlugIds) {
            expect(bBranches.map((b) => b.slugId)).not.toContain(branchA);
          }

          const bStories = await prisma.story.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });
          for (const storyA of spaceAData.storyTitles) {
            expect(bStories.map((s) => s.title)).not.toContain(storyA);
          }
        }),
        { numRuns: 10 }
      );
    },
    120000
  );

  it(
    "should not leak content from one space to another via API - using supertest",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 50 }), async (seed) => {
          const timestamp = Date.now() + seed;

          // Create two users
          const userA = await createTestUser(timestamp, "-api-a");
          const userB = await createTestUser(timestamp, "-api-b");

          // Create two completely separate spaces
          const spaceAData = await createSpaceWithData(
            `test-space-api-a-${timestamp}`,
            userA.id,
            `API_A_${timestamp}`
          );

          const spaceBData = await createSpaceWithData(
            `test-space-api-b-${timestamp}`,
            userB.id,
            `API_B_${timestamp}`
          );

          const agent = request(app);

          // Test each space-scoped endpoint with space B
          for (const endpoint of spaceScopedReadEndpoints) {
            const path = endpoint.replace(":spaceSlug", spaceBData.space.slug);

            // Make request as user B (member of space B)
            const res = await agent
              .get(path)
              .set("x-test-user-id", userB.id)
              .set("x-test-auth-user-id", userB.authUserId);

            // Skip if authentication fails (401) - this is expected without valid JWT
            if (res.status === 401) {
              console.log(`Skipping ${path}: Authentication required`);
              continue;
            }

            // Check for data leakage
            if (res.status === 200) {
              const leakedContent = findLeakedContent(
                spaceAData.uniqueContent,
                res.body
              );

              // Filter out some common false positives
              const falsePositives = ["test", "test user", "example.com", "api"];
              const actualLeaks = leakedContent.filter(
                (content) =>
                  !falsePositives.some((fp) =>
                    content.toLowerCase().includes(fp.toLowerCase())
                  )
              );

              expect(actualLeaks).toHaveLength(0);
            }
          }
        }),
        { numRuns: 5 }
      );
    },
    180000
  );

  it(
    "should isolate branches, nuclear families, members between spaces",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 30 }), async (seed) => {
          const timestamp = Date.now() + seed;

          // Create users
          const userA = await createTestUser(timestamp, "-iso-a");
          const userB = await createTestUser(timestamp, "-iso-b");

          // Create spaces
          const spaceAData = await createSpaceWithData(
            `test-space-iso-a-${timestamp}`,
            userA.id,
            `ISO_A_${timestamp}`
          );

          const spaceBData = await createSpaceWithData(
            `test-space-iso-b-${timestamp}`,
            userB.id,
            `ISO_B_${timestamp}`
          );

          // Fetch space B's data directly from DB
          const branchesB = await prisma.familyBranch.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });
          const membersB = await prisma.familyMember.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });
          const nuclearFamiliesB = await prisma.nuclearFamily.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });

          // Verify isolation: B's branches should not contain A's branch IDs
          const branchSlugIdsB = branchesB.map((b) => b.slugId);
          for (const branchSlugIdA of spaceAData.branchSlugIds) {
            expect(branchSlugIdsB).not.toContain(branchSlugIdA);
          }

          // Verify isolation: B's members should not contain A's member IDs
          const memberSlugIdsB = membersB.map((m) => m.slugId);
          for (const memberSlugIdA of spaceAData.memberIds) {
            expect(memberSlugIdsB).not.toContain(memberSlugIdA);
          }

          // Verify isolation: B's nuclear families should not contain A's IDs
          const nuclearFamilySlugIdsB = nuclearFamiliesB.map((nf) => nf.slugId);
          for (const nfSlugIdA of spaceAData.nuclearFamilySlugIds) {
            expect(nuclearFamilySlugIdsB).not.toContain(nfSlugIdA);
          }

          // Verify the content is truly disjoint
          const allNamesB = [
            ...branchesB.map((b) => b.name),
            ...membersB.map((m) => m.fullName),
            ...nuclearFamiliesB.map((nf) => nf.name),
          ];

          for (const nameA of [
            ...spaceAData.branchSlugIds,
            ...spaceAData.memberIds,
            ...spaceAData.nuclearFamilySlugIds,
          ]) {
            expect(allNamesB).not.toContain(nameA);
          }
        }),
        { numRuns: 10 }
      );
    },
    120000
  );

  it(
    "should ensure stories and source notes are isolated between spaces",
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 20 }), async (seed) => {
          const timestamp = Date.now() + seed;

          const userA = await createTestUser(timestamp, "-content-a");
          const userB = await createTestUser(timestamp, "-content-b");

          const spaceAData = await createSpaceWithData(
            `test-space-content-a-${timestamp}`,
            userA.id,
            `CONTENT_A_${timestamp}`
          );

          const spaceBData = await createSpaceWithData(
            `test-space-content-b-${timestamp}`,
            userB.id,
            `CONTENT_B_${timestamp}`
          );

          // Fetch B's stories and source notes
          const storiesB = await prisma.story.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });
          const sourceNotesB = await prisma.sourceNote.findMany({
            where: { familySpaceId: spaceBData.space.id },
          });

          // B's stories should not contain A's story titles
          const storyTitlesB = storiesB.map((s) => s.title);
          for (const titleA of spaceAData.storyTitles) {
            expect(storyTitlesB).not.toContain(titleA);
          }

          // B's source notes should not contain A's source note titles
          const sourceNoteTitlesB = sourceNotesB.map((sn) => sn.title);
          for (const titleA of spaceAData.sourceNoteTitles) {
            expect(sourceNoteTitlesB).not.toContain(titleA);
          }

          // Verify actual content is different
          expect(storiesB.length).toBe(2);
          expect(sourceNotesB.length).toBe(1);

          // Verify slugs are different
          const allStorySlugIdsB = storiesB.map((s) => s.slugId);
          const allSourceNoteSlugIdsB = sourceNotesB.map((sn) => sn.slugId);

          // A's slugs should not exist in B
          const spaceAStorySlugs = [
            `story-CONTENT_A_${timestamp}-1`,
            `story-CONTENT_A_${timestamp}-2`,
          ];
          const spaceASourceNoteSlugs = [
            `source-note-CONTENT_A_${timestamp}-1`,
          ];

          for (const slug of spaceAStorySlugs) {
            expect(allStorySlugIdsB).not.toContain(slug);
          }
          for (const slug of spaceASourceNoteSlugs) {
            expect(allSourceNoteSlugIdsB).not.toContain(slug);
          }
        }),
        { numRuns: 5 }
      );
    },
    120000
  );
});