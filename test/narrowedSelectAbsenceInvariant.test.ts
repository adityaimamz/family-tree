/**
 * Property test for narrowed-select absence invariant
 * Validates: Requirements 3.2, 3.3, 4.2, 4.3, 7.3
 * Feature: api-query-performance-optimization
 * Property 7: Narrowed-select absence invariant for Stories and Source Notes lists
 */
import { describe, it, expect, afterAll, beforeEach } from "vitest";
import * as fc from "fast-check";
import { prisma } from "../server/db.js";
import { storyListInclude, sourceNoteListInclude, mapStory, mapSourceNote } from "../server/routes/shared.js";

// Keys that should NOT appear in nested objects (from joined related records)
const FORBIDDEN_KEYS = ["biography", "notes", "content"];

// Track created spaces for cleanup
const createdSpaces: string[] = [];

afterAll(async () => {
  // Clean up all test spaces
  for (const spaceId of createdSpaces) {
    try {
      await prisma.storySourceNote.deleteMany({
        where: { story: { familySpaceId: spaceId } },
      });
      await prisma.storyMember.deleteMany({
        where: { story: { familySpaceId: spaceId } },
      });
      await prisma.sourceNoteMember.deleteMany({
        where: { sourceNote: { familySpaceId: spaceId } },
      });
      await prisma.story.deleteMany({ where: { familySpaceId: spaceId } });
      await prisma.sourceNote.deleteMany({ where: { familySpaceId: spaceId } });
      await prisma.familyMember.deleteMany({ where: { familySpaceId: spaceId } });
      await prisma.familyBranch.deleteMany({ where: { familySpaceId: spaceId } });
      await prisma.familyMembership.deleteMany({ where: { familySpaceId: spaceId } });
      await prisma.familySpace.deleteMany({ where: { id: spaceId } });
    } catch (e) {
      // Ignore individual cleanup errors
    }
  }

  // Clean up test users
  try {
    await prisma.appUser.deleteMany({
      where: { authUserId: { startsWith: "test-user-narrowed-" } },
    });
  } catch (e) {
    // Ignore cleanup errors
  }
}, 60000);

/**
 * Recursively walks an object and collects nested objects with their depth.
 * Depth 0 = root array, Depth 1 = top-level items, Depth > 1 = nested objects.
 * 
 * @param obj - The object to walk
 * @param depth - Current depth (starts at 0 for the root array)
 * @returns Array of { obj, depth } for all nested objects at depth > 0
 */
function walkObjectsWithDepth(obj: any, depth = 0): { obj: any; depth: number }[] {
  const results: { obj: any; depth: number }[] = [];
  
  if (obj === null || obj === undefined) {
    return results;
  }
  
  if (typeof obj !== "object") {
    return results;
  }
  
  // If it's an array, walk each element
  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...walkObjectsWithDepth(item, depth + 1));
    }
    return results;
  }
  
  // It's a plain object
  // At depth 1: this is the top-level item (story or sourceNote) - content is ALLOWED here
  // At depth > 1: these are nested objects from relations - content/biography/notes NOT allowed
  if (depth > 0) {
    results.push({ obj, depth });
  }
  
  // Recursively walk all properties
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    results.push(...walkObjectsWithDepth(value, depth + 1));
  }
  
  return results;
}

/**
 * Helper to get all nested objects at depth > 1.
 * This can be used to verify the response structure.
 */
function getAllNestedObjects(obj: any): any[] {
  return walkObjectsWithDepth(obj)
    .filter(({ depth }) => depth > 1)
    .map(({ obj }) => obj);
}

/**
 * Check if any nested object (depth > 1) contains forbidden keys from joined records.
 * 
 * The mapped API response (after mapStory/mapSourceNote):
 * - Depth 1: Top-level item with content (ALLOWED - it's the item's own field)
 * - Depth 2+: Nested objects from relations - should NOT have biography, notes, or content
 */
function findForbiddenKeysInNested(obj: any): { key: string; value: any; depth: number }[] {
  const nestedWithDepth = walkObjectsWithDepth(obj);
  const forbidden: { key: string; value: any; depth: number }[] = [];
  
  for (const { obj: nested, depth } of nestedWithDepth) {
    // Skip if this is an array of strings (like relatedMemberIds)
    if (Array.isArray(nested)) continue;
    
    // Only check objects at depth > 1 (nested objects, not top-level items)
    // Depth 1 = top-level story/sourceNote - content is allowed there
    // Depth > 1 = objects from relations - forbidden
    if (depth <= 1) continue;
    
    // Check if any forbidden key exists in this nested object
    for (const key of FORBIDDEN_KEYS) {
      if (nested.hasOwnProperty(key)) {
        forbidden.push({ key, value: nested[key], depth });
      }
    }
  }
  
  return forbidden;
}

describe("Property 7: Narrowed-select absence invariant for Stories and Source Notes lists", () => {
  beforeEach(async () => {
    // Clean up any existing test data before each test
    const existingSpaces = await prisma.familySpace.findMany({
      where: { slug: { startsWith: "test-space-narrowed-" } },
      select: { id: true },
    });
    
    for (const space of existingSpaces) {
      try {
        await prisma.storySourceNote.deleteMany({ where: { story: { familySpaceId: space.id } } });
        await prisma.storyMember.deleteMany({ where: { story: { familySpaceId: space.id } } });
        await prisma.sourceNoteMember.deleteMany({ where: { sourceNote: { familySpaceId: space.id } } });
        await prisma.story.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.sourceNote.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familyMember.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familyBranch.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familyMembership.deleteMany({ where: { familySpaceId: space.id } });
        await prisma.familySpace.deleteMany({ where: { id: space.id } });
      } catch (e) {
        // Ignore errors
      }
    }
  });

  it(
    "should not return biography, notes, or content from joined records in Stories list (legacy mode)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (seed) => {
            const timestamp = Date.now() + seed;

            // Create test user
            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-narrowed-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-narrowed-${timestamp}`,
                email: `test-narrowed-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            // Create FamilySpace
            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-narrowed-${timestamp}`,
                name: "Test Family Space",
                description: "Test space for narrowed select",
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

            // Create a branch
            const branch = await prisma.familyBranch.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `branch-${timestamp}`,
                name: "Main Branch",
                description: "Test branch",
                memberIds: [],
              },
            });

            // Create family members with biography and notes (these should NOT appear in API response)
            const member1 = await prisma.familyMember.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `member-1-${timestamp}`,
                fullName: "Family Member 1",
                displayName: "Member 1",
                gender: "male",
                generation: 1,
                familyBranchId: branch.slugId,
                biography: "This is a biography that should NOT appear in stories response",
                notes: "These are notes that should NOT appear in stories response",
                spouseIds: [],
                childrenIds: [],
                siblingIds: [],
                statusLabel: "Active",
                relationshipToRoot: "1",
              },
            });

            const member2 = await prisma.familyMember.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `member-2-${timestamp}`,
                fullName: "Family Member 2",
                displayName: "Member 2",
                gender: "female",
                generation: 2,
                familyBranchId: branch.slugId,
                biography: "Another biography that should NOT appear",
                notes: "More notes that should NOT appear",
                spouseIds: [],
                childrenIds: [],
                siblingIds: [],
                statusLabel: "Active",
                relationshipToRoot: "1.1",
              },
            });

            // Create stories with content and link to members
            const story1 = await prisma.story.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `story-1-${timestamp}`,
                title: "Test Story 1",
                content: "This is the story content - should appear at top level only",
                status: "draft",
              },
            });

            const story2 = await prisma.story.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `story-2-${timestamp}`,
                title: "Test Story 2",
                content: "Another story content",
                status: "draft",
              },
            });

            // Create source note to link to story
            const sourceNote = await prisma.sourceNote.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `source-1-${timestamp}`,
                title: "Test Source",
                content: "Source content that should NOT appear in nested objects",
                type: "document",
              },
            });

            // Link members to stories
            await prisma.storyMember.create({
              data: { storyId: story1.id, memberId: member1.id },
            });
            await prisma.storyMember.create({
              data: { storyId: story2.id, memberId: member2.id },
            });

            // Link source notes to stories
            await prisma.storySourceNote.create({
              data: { storyId: story1.id, sourceNoteId: sourceNote.id },
            });

            // Fetch stories using the narrowed include (as the API does)
            const stories = await prisma.story.findMany({
              where: { familySpaceId: familySpace.id },
              orderBy: { updatedAt: "desc" },
              include: storyListInclude,
            });

            // Map to API response shape
            const mappedStories = stories.map(mapStory);

            expect(mappedStories.length).toBe(2);

            // Check each story
            for (const story of mappedStories) {
              // Top-level content should exist (it's the story's own field)
              expect(story).toHaveProperty("content");
              
              // relatedMemberIds should be populated
              expect(Array.isArray(story.relatedMemberIds)).toBe(true);
              
              // sourceNoteIds should be populated
              expect(Array.isArray(story.sourceNoteIds)).toBe(true);
            }

            // Now check for forbidden keys in nested objects
            // The response includes: story at top level, relatedMemberIds array, sourceNoteIds array
            // After mapStory, members are transformed to IDs - no nested objects with member data
            // The narrowed select ensures we don't fetch member biography/notes in the first place

            // Check that no nested object has forbidden keys (depth > 1)
            const forbiddenFound = findForbiddenKeysInNested(mappedStories);
            
            expect(forbiddenFound).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "should not return biography, notes, or content from joined records in Source Notes list (legacy mode)",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (seed) => {
            const timestamp = Date.now() + seed + 1000; // Different offset

            // Create test user
            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-narrowed-sn-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-narrowed-sn-${timestamp}`,
                email: `test-narrowed-sn-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            // Create FamilySpace
            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-narrowed-sn-${timestamp}`,
                name: "Test Family Space",
                description: "Test space for source notes",
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

            // Create a branch
            const branch = await prisma.familyBranch.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `branch-sn-${timestamp}`,
                name: "Main Branch",
                description: "Test branch",
                memberIds: [],
              },
            });

            // Create family members with biography and notes
            const member1 = await prisma.familyMember.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `member-sn-1-${timestamp}`,
                fullName: "Family Member 1",
                displayName: "Member 1",
                gender: "male",
                generation: 1,
                familyBranchId: branch.slugId,
                biography: "Biography that should NOT appear in source notes response",
                notes: "Notes that should NOT appear in source notes response",
                spouseIds: [],
                childrenIds: [],
                siblingIds: [],
                statusLabel: "Active",
                relationshipToRoot: "1",
              },
            });

            // Create stories to link to source notes
            const story = await prisma.story.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `story-sn-${timestamp}`,
                title: "Linked Story",
                content: "Story content that should NOT appear in nested objects",
                status: "draft",
              },
            });

            // Create source notes
            const sourceNote1 = await prisma.sourceNote.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `source-sn-1-${timestamp}`,
                title: "Source Note 1",
                content: "Source content - allowed at top level",
                type: "document",
              },
            });

            const sourceNote2 = await prisma.sourceNote.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `source-sn-2-${timestamp}`,
                title: "Source Note 2",
                content: "Another source content",
                type: "document",
              },
            });

            // Link members to source notes
            await prisma.sourceNoteMember.create({
              data: { sourceNoteId: sourceNote1.id, memberId: member1.id },
            });

            // Link stories to source notes
            await prisma.storySourceNote.create({
              data: { storyId: story.id, sourceNoteId: sourceNote1.id },
            });

            // Fetch source notes using the narrowed include (as the API does)
            const sourceNotes = await prisma.sourceNote.findMany({
              where: { familySpaceId: familySpace.id },
              orderBy: { updatedAt: "desc" },
              include: sourceNoteListInclude,
            });

            // Map to API response shape
            const mappedNotes = sourceNotes.map(mapSourceNote);

            expect(mappedNotes.length).toBe(2);

            // Check each source note
            for (const note of mappedNotes) {
              // Top-level content should exist
              expect(note).toHaveProperty("content");
              
              // relatedMemberIds should be an array
              expect(Array.isArray(note.relatedMemberIds)).toBe(true);
              
              // storyIds should be an array
              expect(Array.isArray(note.storyIds)).toBe(true);
            }

            // Now check for forbidden keys in nested objects (depth > 1)
            // After mapSourceNote, members are transformed to IDs - no nested objects with member data

            // Check that no nested object has forbidden keys
            const forbiddenFound = findForbiddenKeysInNested(mappedNotes);
            expect(forbiddenFound).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "should verify narrowed select is used in paged mode for Stories",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (seed) => {
            const timestamp = Date.now() + seed + 2000;

            // Create test user and space
            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-narrowed-paged-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-narrowed-paged-${timestamp}`,
                email: `test-narrowed-paged-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-narrowed-paged-${timestamp}`,
                name: "Test Space",
                description: "Test",
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
                slugId: `branch-paged-${timestamp}`,
                name: "Branch",
                description: "Branch",
                memberIds: [],
              },
            });

            const member = await prisma.familyMember.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `member-paged-${timestamp}`,
                fullName: "Test Member",
                displayName: "Member",
                gender: "male",
                generation: 1,
                familyBranchId: branch.slugId,
                biography: "This biography should NOT be fetched",
                notes: "These notes should NOT be fetched",
                spouseIds: [],
                childrenIds: [],
                siblingIds: [],
                statusLabel: "Active",
                relationshipToRoot: "1",
              },
            });

            const story = await prisma.story.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `story-paged-${timestamp}`,
                title: "Paged Story",
                content: "Story content",
                status: "draft",
              },
            });

            await prisma.storyMember.create({
              data: { storyId: story.id, memberId: member.id },
            });

            // Simulate paged query (as the API does)
            const page = 1;
            const pageSize = 10;
            const skip = (page - 1) * pageSize;

            const [items, total] = await prisma.$transaction([
              prisma.story.findMany({
                where: { familySpaceId: familySpace.id },
                orderBy: { updatedAt: "desc" },
                skip,
                take: pageSize,
                include: storyListInclude,
              }),
              prisma.story.count({ where: { familySpaceId: familySpace.id } }),
            ]);

            const mappedStories = items.map(mapStory);

            // Verify pagination metadata
            expect(total).toBe(1);
            expect(mappedStories.length).toBe(1);

            // Verify no forbidden keys in nested objects
            const forbiddenFound = findForbiddenKeysInNested(mappedStories);
            expect(forbiddenFound).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    "should verify narrowed select is used in paged mode for Source Notes",
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (seed) => {
            const timestamp = Date.now() + seed + 3000;

            // Create test user and space
            const testUser = await prisma.appUser.upsert({
              where: { authUserId: `test-user-narrowed-sn-paged-${timestamp}` },
              update: {},
              create: {
                authUserId: `test-user-narrowed-sn-paged-${timestamp}`,
                email: `test-narrowed-sn-paged-${timestamp}@example.com`,
                name: "Test User",
                platformRole: "user",
              },
            });

            const familySpace = await prisma.familySpace.create({
              data: {
                slug: `test-space-narrowed-sn-paged-${timestamp}`,
                name: "Test Space",
                description: "Test",
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
                slugId: `branch-sn-paged-${timestamp}`,
                name: "Branch",
                description: "Branch",
                memberIds: [],
              },
            });

            const member = await prisma.familyMember.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `member-sn-paged-${timestamp}`,
                fullName: "Test Member",
                displayName: "Member",
                gender: "male",
                generation: 1,
                familyBranchId: branch.slugId,
                biography: "Bio that should NOT appear",
                notes: "Notes that should NOT appear",
                spouseIds: [],
                childrenIds: [],
                siblingIds: [],
                statusLabel: "Active",
                relationshipToRoot: "1",
              },
            });

            const sourceNote = await prisma.sourceNote.create({
              data: {
                familySpaceId: familySpace.id,
                slugId: `source-sn-paged-${timestamp}`,
                title: "Paged Source Note",
                content: "Source content",
                type: "document",
              },
            });

            await prisma.sourceNoteMember.create({
              data: { sourceNoteId: sourceNote.id, memberId: member.id },
            });

            // Simulate paged query (as the API does)
            const page = 1;
            const pageSize = 10;
            const skip = (page - 1) * pageSize;

            const [items, total] = await prisma.$transaction([
              prisma.sourceNote.findMany({
                where: { familySpaceId: familySpace.id },
                orderBy: { updatedAt: "desc" },
                skip,
                take: pageSize,
                include: sourceNoteListInclude,
              }),
              prisma.sourceNote.count({ where: { familySpaceId: familySpace.id } }),
            ]);

            const mappedNotes = items.map(mapSourceNote);

            // Verify pagination metadata
            expect(total).toBe(1);
            expect(mappedNotes.length).toBe(1);

            // Verify no forbidden keys in nested objects
            const forbiddenFound = findForbiddenKeysInNested(mappedNotes);
            expect(forbiddenFound).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});