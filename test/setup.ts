import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import { prisma } from "../server/db.js";
import app from "../server/app.js";

/**
 * Returns a test-ready Express app that can be used with supertest.
 * The app is built from server/app.ts but does not listen on any port.
 * This is used by supertest to inject itself and make requests.
 */
export function createApp(): Express {
  // Return the main Express app - supertest will handle not listening
  return app;
}

/**
 * Seeds a basic FamilySpace with minimal required data for testing.
 * Returns the created familySpace and a test user with membership.
 */
export async function seedTestFixture() {
  const timestamp = Date.now();

  // Create a unique test user
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

  // Create a unique FamilySpace
  const spaceSlug = `test-space-${timestamp}`;
  const familySpace = await prisma.familySpace.create({
    data: {
      slug: spaceSlug,
      name: "Test Family Space",
      description: "A test family space",
    },
  });

  // Create family membership
  const membership = await prisma.familyMembership.create({
    data: {
      userId: testUser.id,
      familySpaceId: familySpace.id,
      role: "owner",
    },
  });

  return {
    user: testUser,
    space: familySpace,
    membership,
  };
}

/**
 * Creates a seeded fixture with multiple family members for tree testing.
 * Returns the familySpace along with created branches and members.
 */
export async function seedTreeFixture() {
  const timestamp = Date.now();

  // Create test user
  const testUser = await prisma.appUser.upsert({
    where: { authUserId: `test-user-${timestamp}` },
    update: {},
    create: {
      authUserId: `test-user-${timestamp}`,
      email: `test-tree-${timestamp}@example.com`,
      name: "Test User",
      platformRole: "user",
    },
  });

  // Create a unique FamilySpace
  const spaceSlug = `test-tree-space-${timestamp}`;
  const familySpace = await prisma.familySpace.create({
    data: {
      slug: spaceSlug,
      name: "Test Tree Space",
      description: "A test family space for tree testing",
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
      slugId: "main-branch",
      name: "Main Branch",
      description: "Primary family branch",
      memberIds: [],
    },
  });

  // Create family members (grandparent, parent, child)
  const grandparent = await prisma.familyMember.create({
    data: {
      familySpaceId: familySpace.id,
      slugId: "grandparent-1",
      fullName: "Grand Parent",
      displayName: "Grandpa",
      gender: "male",
      generation: 1,
      familyBranchId: branch.slugId,
      spouseIds: [],
      childrenIds: [],
      siblingIds: [],
      biography: "",
      notes: "",
      statusLabel: "Active",
      relationshipToRoot: "1",
    },
  });

  const parent = await prisma.familyMember.create({
    data: {
      familySpaceId: familySpace.id,
      slugId: "parent-1",
      fullName: "Parent One",
      displayName: "Dad",
      gender: "male",
      generation: 2,
      familyBranchId: branch.slugId,
      fatherId: grandparent.id,
      spouseIds: [],
      childrenIds: [],
      siblingIds: [],
      biography: "",
      notes: "",
      statusLabel: "Active",
      relationshipToRoot: "1.1",
    },
  });

  // Update grandparent's childrenIds
  await prisma.familyMember.update({
    where: { id: grandparent.id },
    data: { childrenIds: [parent.id] },
  });

  const child = await prisma.familyMember.create({
    data: {
      familySpaceId: familySpace.id,
      slugId: "child-1",
      fullName: "Child One",
      displayName: "Kid",
      gender: "male",
      generation: 3,
      familyBranchId: branch.slugId,
      fatherId: parent.id,
      spouseIds: [],
      childrenIds: [],
      siblingIds: [],
      biography: "",
      notes: "",
      statusLabel: "Active",
      relationshipToRoot: "1.1.1",
    },
  });

  // Update parent's childrenIds
  await prisma.familyMember.update({
    where: { id: parent.id },
    data: { childrenIds: [child.id] },
  });

  return {
    space: familySpace,
    user: testUser,
    branch,
    members: {
      grandparent,
      parent,
      child,
    },
  };
}

/**
 * Cleans up all data associated with a specific familySpaceId.
 * This ensures test isolation by removing all related records.
 * Tables are deleted in reverse order of dependencies.
 */
export async function cleanupDatabase(familySpaceId: string): Promise<void> {
  // First delete all link table entries for this space
  await prisma.$transaction([
    prisma.storySourceNote.deleteMany({
      where: {
        story: { familySpaceId },
      },
    }),
    prisma.storyMember.deleteMany({
      where: {
        story: { familySpaceId },
      },
    }),
    prisma.sourceNoteMember.deleteMany({
      where: {
        sourceNote: { familySpaceId },
      },
    }),
  ]);

  // Then delete main tables in dependency order
  await prisma.$transaction([
    prisma.relationshipExplanationHistory.deleteMany({
      where: { familySpaceId },
    }),
    prisma.story.deleteMany({
      where: { familySpaceId },
    }),
    prisma.sourceNote.deleteMany({
      where: { familySpaceId },
    }),
    prisma.galleryItem.deleteMany({
      where: { familySpaceId },
    }),
    prisma.timelineEvent.deleteMany({
      where: { familySpaceId },
    }),
    prisma.nuclearFamily.deleteMany({
      where: { familySpaceId },
    }),
    prisma.familyMember.deleteMany({
      where: { familySpaceId },
    }),
    prisma.familyBranch.deleteMany({
      where: { familySpaceId },
    }),
    prisma.familyMembership.deleteMany({
      where: { familySpaceId },
    }),
    prisma.familySpace.deleteMany({
      where: { id: familySpaceId },
    }),
  ]);
}

/**
 * Cleans up all test data by deleting test spaces and their contents.
 * This should be called in an afterEach or afterAll hook.
 */
export async function cleanupAllTestData(): Promise<void> {
  // Delete all test family spaces (those with slug starting with "test-space-" or "test-tree-")
  const testSpaces = await prisma.familySpace.findMany({
    where: {
      OR: [
        { slug: { startsWith: "test-space-" } },
        { slug: { startsWith: "test-tree-" } },
      ],
    },
    select: { id: true },
  });

  for (const space of testSpaces) {
    await cleanupDatabase(space.id);
  }

  // Clean up test users by authUserId pattern
  await prisma.appUser.deleteMany({
    where: {
      authUserId: { startsWith: "test-user-" },
    },
  });
}