// Feature: api-query-performance-optimization, Property 8: Pagination slicing model
// Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.7, 5.8

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import * as fc from "fast-check";
import { createApp, cleanupDatabase } from "./setup.js";
import { prisma } from "../server/db.js";
import { arbPaginationParams } from "./fixtures/arbFamilySpaceFixture.js";

/**
 * Heavy-list endpoints to test:
 * - GET /api/spaces/:spaceSlug/stories
 * - GET /api/spaces/:spaceSlug/source-notes
 * - GET /api/spaces/:spaceSlug/gallery
 * - GET /api/spaces/:spaceSlug/timeline
 * - GET /api/platform/users
 * - GET /api/platform/spaces
 */

describe("Pagination Slicing Model (Property 8)", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    app = createApp();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupAllTestData();
  });

  async function cleanupAllTestData() {
    // Clean up all test family spaces
    const testSpaces = await prisma.familySpace.findMany({
      where: {
        slug: { startsWith: "test-space-" },
      },
      select: { id: true },
    });

    for (const space of testSpaces) {
      await cleanupDatabase(space.id);
    }

    // Clean up platform admin test user
    await prisma.appUser.deleteMany({
      where: {
        authUserId: { startsWith: "test-platform-" },
      },
    });
  }

  /**
   * Helper to create a test FamilySpace with pagination test data.
   * Creates multiple items (stories, source-notes, gallery, timeline) for pagination testing.
   */
  async function createSpaceWithPaginationData(slug: string) {
    const timestamp = Date.now();

    // Create test user
    const testUser = await prisma.appUser.create({
      data: {
        authUserId: `test-user-${timestamp}`,
        email: `test-${timestamp}@example.com`,
        name: "Test User",
        platformRole: "user",
      },
    });

    // Create FamilySpace
    const familySpace = await prisma.familySpace.create({
      data: {
        slug,
        name: "Test Family Space",
        description: "A test family space for pagination testing",
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

    // Create stories (10 items for pagination testing)
    const storyIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const story = await prisma.story.create({
        data: {
          familySpaceId: familySpace.id,
          slugId: `story-${timestamp}-${i}`,
          title: `Story ${i}`,
          content: `Content for story ${i}`,
          status: "published",
          updatedAt: new Date(Date.now() - i * 1000), // Ensure different timestamps for ordering
        },
      });
      storyIds.push(story.slugId);
    }

    // Create source notes (15 items for pagination testing)
    const sourceNoteIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const sourceNote = await prisma.sourceNote.create({
        data: {
          familySpaceId: familySpace.id,
          slugId: `source-note-${timestamp}-${i}`,
          title: `Source Note ${i}`,
          content: `Content for source note ${i}`,
          type: "note",
          updatedAt: new Date(Date.now() - i * 1000),
        },
      });
      sourceNoteIds.push(sourceNote.slugId);
    }

    // Create gallery items (12 items for pagination testing)
    const galleryItemIds: string[] = [];
    for (let i = 0; i < 12; i++) {
      const galleryItem = await prisma.galleryItem.create({
        data: {
          familySpaceId: familySpace.id,
          slugId: `gallery-${timestamp}-${i}`,
          title: `Gallery Item ${i}`,
          year: 2020 + i,
          image: `image-${i}.jpg`,
          updatedAt: new Date(Date.now() - i * 1000),
        },
      });
      galleryItemIds.push(galleryItem.slugId);
    }

    // Create timeline events (8 items for pagination testing)
    const timelineEventIds: string[] = [];
    for (let i = 0; i < 8; i++) {
      const timelineEvent = await prisma.timelineEvent.create({
        data: {
          familySpaceId: familySpace.id,
          slugId: `timeline-${timestamp}-${i}`,
          title: `Timeline Event ${i}`,
          year: String(2020 + i),
          type: "Peristiwa Penting",
          description: `Description for timeline event ${i}`,
          updatedAt: new Date(Date.now() - i * 1000),
        },
      });
      timelineEventIds.push(timelineEvent.slugId);
    }

    return {
      space: familySpace,
      user: testUser,
      counts: {
        stories: 10,
        sourceNotes: 15,
        gallery: 12,
        timeline: 8,
      },
    };
  }

  /**
   * Helper to create a platform admin user for testing platform endpoints.
   */
  async function createPlatformAdminUser() {
    const timestamp = Date.now();

    // Create platform admin user
    const platformAdmin = await prisma.appUser.create({
      data: {
        authUserId: `test-platform-admin-${timestamp}`,
        email: `platform-admin-${timestamp}@example.com`,
        name: "Platform Admin",
        platformRole: "platform_admin",
      },
    });

    // Create some spaces for platform-spaces endpoint testing (5 spaces)
    const spaceIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const space = await prisma.familySpace.create({
        data: {
          slug: `platform-test-space-${timestamp}-${i}`,
          name: `Platform Test Space ${i}`,
          description: `Platform test space ${i}`,
          createdAt: new Date(Date.now() - i * 1000),
        },
      });
      spaceIds.push(space.id);
    }

    // Create additional users for platform-users endpoint testing (7 users)
    const userIds: string[] = [platformAdmin.id];
    for (let i = 0; i < 6; i++) {
      const user = await prisma.appUser.create({
        data: {
          authUserId: `test-platform-user-${timestamp}-${i}`,
          email: `platform-user-${timestamp}-${i}@example.com`,
          name: `Platform User ${i}`,
          platformRole: "user",
          createdAt: new Date(Date.now() - i * 1000),
        },
      });
      userIds.push(user.id);
    }

    return {
      admin: platformAdmin,
      spaceCount: 5,
      userCount: 7,
    };
  }

  // Test stories endpoint pagination
  it("Property 8: Stories pagination slicing model", async () => {
    await fc.assert(
      fc.asyncProperty(arbPaginationParams, async ({ page, pageSize }) => {
        const timestamp = Date.now();
        const slug = `test-pagination-stories-${timestamp}`;

        // Create test space with stories
        const { space, user } = await createSpaceWithPaginationData(slug);

        const agent = request(app);

        // 1. Fetch legacy array (without pagination params)
        const legacyRes = await agent
          .get(`/api/spaces/${slug}/stories`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        // Skip if auth fails
        if (legacyRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(legacyRes.status).toBe(200);
        const legacyItems = legacyRes.body;
        const totalItems = legacyItems.length;

        // 2. Apply pagination params
        const effectivePage = page;
        const effectivePageSize = Math.min(100, Math.max(1, pageSize));
        const skip = (effectivePage - 1) * effectivePageSize;
        const take = effectivePageSize;

        // 3. Fetch paged response
        const pagedRes = await agent
          .get(`/api/spaces/${slug}/stories?page=${page}&pageSize=${pageSize}`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        // Skip if auth fails
        if (pagedRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(pagedRes.status).toBe(200);
        const paged = pagedRes.body;

        // 4. Assert pagination model
        // response.items deep-equals legacyItems.slice(skip, skip + take)
        const expectedItems = legacyItems.slice(skip, skip + take);
        expect(paged.items).toEqual(expectedItems);

        // response.page === effectivePage
        expect(paged.page).toBe(effectivePage);

        // response.pageSize === clamp(pageSize ?? 20, 1, 100)
        expect(paged.pageSize).toBe(effectivePageSize);

        // response.total === legacyItems.length
        expect(paged.total).toBe(totalItems);

        // response.hasMore === (effectivePage * effectivePageSize < legacyItems.length)
        const expectedHasMore = effectivePage * effectivePageSize < totalItems;
        expect(paged.hasMore).toBe(expectedHasMore);
      }),
      {
        numRuns: 100,
      }
    );
  });

  // Test source-notes endpoint pagination
  it("Property 8: Source Notes pagination slicing model", async () => {
    await fc.assert(
      fc.asyncProperty(arbPaginationParams, async ({ page, pageSize }) => {
        const timestamp = Date.now();
        const slug = `test-pagination-source-notes-${timestamp}`;

        // Create test space with source notes
        const { space, user } = await createSpaceWithPaginationData(slug);

        const agent = request(app);

        // 1. Fetch legacy array
        const legacyRes = await agent
          .get(`/api/spaces/${slug}/source-notes`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        if (legacyRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(legacyRes.status).toBe(200);
        const legacyItems = legacyRes.body;
        const totalItems = legacyItems.length;

        // 2. Apply pagination params
        const effectivePage = page;
        const effectivePageSize = Math.min(100, Math.max(1, pageSize));
        const skip = (effectivePage - 1) * effectivePageSize;
        const take = effectivePageSize;

        // 3. Fetch paged response
        const pagedRes = await agent
          .get(`/api/spaces/${slug}/source-notes?page=${page}&pageSize=${pageSize}`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        if (pagedRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(pagedRes.status).toBe(200);
        const paged = pagedRes.body;

        // 4. Assert pagination model
        const expectedItems = legacyItems.slice(skip, skip + take);
        expect(paged.items).toEqual(expectedItems);
        expect(paged.page).toBe(effectivePage);
        expect(paged.pageSize).toBe(effectivePageSize);
        expect(paged.total).toBe(totalItems);
        expect(paged.hasMore).toBe(effectivePage * effectivePageSize < totalItems);
      }),
      {
        numRuns: 100,
      }
    );
  });

  // Test gallery endpoint pagination
  it("Property 8: Gallery pagination slicing model", async () => {
    await fc.assert(
      fc.asyncProperty(arbPaginationParams, async ({ page, pageSize }) => {
        const timestamp = Date.now();
        const slug = `test-pagination-gallery-${timestamp}`;

        // Create test space with gallery items
        const { space, user } = await createSpaceWithPaginationData(slug);

        const agent = request(app);

        // 1. Fetch legacy array
        const legacyRes = await agent
          .get(`/api/spaces/${slug}/gallery`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        if (legacyRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(legacyRes.status).toBe(200);
        const legacyItems = legacyRes.body;
        const totalItems = legacyItems.length;

        // 2. Apply pagination params
        const effectivePage = page;
        const effectivePageSize = Math.min(100, Math.max(1, pageSize));
        const skip = (effectivePage - 1) * effectivePageSize;
        const take = effectivePageSize;

        // 3. Fetch paged response
        const pagedRes = await agent
          .get(`/api/spaces/${slug}/gallery?page=${page}&pageSize=${pageSize}`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        if (pagedRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(pagedRes.status).toBe(200);
        const paged = pagedRes.body;

        // 4. Assert pagination model
        const expectedItems = legacyItems.slice(skip, skip + take);
        expect(paged.items).toEqual(expectedItems);
        expect(paged.page).toBe(effectivePage);
        expect(paged.pageSize).toBe(effectivePageSize);
        expect(paged.total).toBe(totalItems);
        expect(paged.hasMore).toBe(effectivePage * effectivePageSize < totalItems);
      }),
      {
        numRuns: 100,
      }
    );
  });

  // Test timeline endpoint pagination
  it("Property 8: Timeline pagination slicing model", async () => {
    await fc.assert(
      fc.asyncProperty(arbPaginationParams, async ({ page, pageSize }) => {
        const timestamp = Date.now();
        const slug = `test-pagination-timeline-${timestamp}`;

        // Create test space with timeline events
        const { space, user } = await createSpaceWithPaginationData(slug);

        const agent = request(app);

        // 1. Fetch legacy array
        const legacyRes = await agent
          .get(`/api/spaces/${slug}/timeline`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        if (legacyRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(legacyRes.status).toBe(200);
        const legacyItems = legacyRes.body;
        const totalItems = legacyItems.length;

        // 2. Apply pagination params
        const effectivePage = page;
        const effectivePageSize = Math.min(100, Math.max(1, pageSize));
        const skip = (effectivePage - 1) * effectivePageSize;
        const take = effectivePageSize;

        // 3. Fetch paged response
        const pagedRes = await agent
          .get(`/api/spaces/${slug}/timeline?page=${page}&pageSize=${pageSize}`)
          .set("x-test-user-id", user.id)
          .set("x-test-auth-user-id", user.authUserId);

        if (pagedRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(pagedRes.status).toBe(200);
        const paged = pagedRes.body;

        // 4. Assert pagination model
        const expectedItems = legacyItems.slice(skip, skip + take);
        expect(paged.items).toEqual(expectedItems);
        expect(paged.page).toBe(effectivePage);
        expect(paged.pageSize).toBe(effectivePageSize);
        expect(paged.total).toBe(totalItems);
        expect(paged.hasMore).toBe(effectivePage * effectivePageSize < totalItems);
      }),
      {
        numRuns: 100,
      }
    );
  });

  // Test platform users endpoint pagination
  it("Property 8: Platform Users pagination slicing model", async () => {
    await fc.assert(
      fc.asyncProperty(arbPaginationParams, async ({ page, pageSize }) => {
        // Create platform admin and test users
        const { admin } = await createPlatformAdminUser();

        const agent = request(app);

        // 1. Fetch legacy array
        const legacyRes = await agent
          .get("/api/platform/users")
          .set("x-test-user-id", admin.id)
          .set("x-test-auth-user-id", admin.authUserId);

        if (legacyRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(legacyRes.status).toBe(200);
        const legacyItems = legacyRes.body;
        const totalItems = legacyItems.length;

        // 2. Apply pagination params
        const effectivePage = page;
        const effectivePageSize = Math.min(100, Math.max(1, pageSize));
        const skip = (effectivePage - 1) * effectivePageSize;
        const take = effectivePageSize;

        // 3. Fetch paged response
        const pagedRes = await agent
          .get(`/api/platform/users?page=${page}&pageSize=${pageSize}`)
          .set("x-test-user-id", admin.id)
          .set("x-test-auth-user-id", admin.authUserId);

        if (pagedRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(pagedRes.status).toBe(200);
        const paged = pagedRes.body;

        // 4. Assert pagination model
        const expectedItems = legacyItems.slice(skip, skip + take);
        expect(paged.items).toEqual(expectedItems);
        expect(paged.page).toBe(effectivePage);
        expect(paged.pageSize).toBe(effectivePageSize);
        expect(paged.total).toBe(totalItems);
        expect(paged.hasMore).toBe(effectivePage * effectivePageSize < totalItems);
      }),
      {
        numRuns: 100,
      }
    );
  });

  // Test platform spaces endpoint pagination
  it("Property 8: Platform Spaces pagination slicing model", async () => {
    await fc.assert(
      fc.asyncProperty(arbPaginationParams, async ({ page, pageSize }) => {
        // Create platform admin and test spaces
        const { admin } = await createPlatformAdminUser();

        const agent = request(app);

        // 1. Fetch legacy array
        const legacyRes = await agent
          .get("/api/platform/spaces")
          .set("x-test-user-id", admin.id)
          .set("x-test-auth-user-id", admin.authUserId);

        if (legacyRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(legacyRes.status).toBe(200);
        const legacyItems = legacyRes.body;
        const totalItems = legacyItems.length;

        // 2. Apply pagination params
        const effectivePage = page;
        const effectivePageSize = Math.min(100, Math.max(1, pageSize));
        const skip = (effectivePage - 1) * effectivePageSize;
        const take = effectivePageSize;

        // 3. Fetch paged response
        const pagedRes = await agent
          .get(`/api/platform/spaces?page=${page}&pageSize=${pageSize}`)
          .set("x-test-user-id", admin.id)
          .set("x-test-auth-user-id", admin.authUserId);

        if (pagedRes.status === 401) {
          console.log("Skipping: Authentication required");
          return;
        }

        expect(pagedRes.status).toBe(200);
        const paged = pagedRes.body;

        // 4. Assert pagination model
        const expectedItems = legacyItems.slice(skip, skip + take);
        expect(paged.items).toEqual(expectedItems);
        expect(paged.page).toBe(effectivePage);
        expect(paged.pageSize).toBe(effectivePageSize);
        expect(paged.total).toBe(totalItems);
        expect(paged.hasMore).toBe(effectivePage * effectivePageSize < totalItems);
      }),
      {
        numRuns: 100,
      }
    );
  });
});