import { Router } from "express";
import { loadAppUser, requirePlatformAdmin } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";

export const platformRoutes = Router();

platformRoutes.get("/api/platform/health", requireAuth, loadAppUser, requirePlatformAdmin, (_req, res) => {
  res.json({ ok: true, service: "warisanai-platform", timestamp: new Date().toISOString() });
});

platformRoutes.get("/api/platform/stats", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  try {
    const [
      totalUsers,
      totalSpaces,
      totalMembers,
      totalGalleryItems,
      totalTimelineEvents,
      totalStories,
      totalSourceNotes,
    ] = await Promise.all([
      prisma.appUser.count(),
      prisma.familySpace.count(),
      prisma.familyMember.count(),
      prisma.galleryItem.count(),
      prisma.timelineEvent.count(),
      prisma.story.count(),
      prisma.sourceNote.count(),
    ]);

    res.json({
      totalUsers,
      totalSpaces,
      totalMembers,
      totalGalleryItems,
      totalTimelineEvents,
      totalStories,
      totalSourceNotes,
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch platform stats");
  }
});

platformRoutes.get("/api/platform/spaces", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  try {
    const spaces = await prisma.familySpace.findMany({
      include: {
        _count: {
          select: {
            members: true,
            timelineEvents: true,
            galleryItems: true,
          },
        },
        memberships: {
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      spaces.map((space) => ({
        id: space.id,
        slug: space.slug,
        name: space.name,
        ownerCount: space.memberships.filter((membership) => membership.role === "owner").length,
        memberCount: space.memberships.length,
        recordCounts: {
          members: space._count.members,
          timeline: space._count.timelineEvents,
          gallery: space._count.galleryItems,
        },
        createdAt: space.createdAt,
      })),
    );
  } catch (error) {
    handleError(res, error, "Failed to fetch platform spaces");
  }
});

platformRoutes.get("/api/platform/users", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  try {
    const users = await prisma.appUser.findMany({
      include: {
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        platformRole: user.platformRole,
        spacesCount: user._count.memberships,
        createdAt: user.createdAt,
      })),
    );
  } catch (error) {
    handleError(res, error, "Failed to fetch platform users");
  }
});

platformRoutes.get("/api/platform/system", requireAuth, loadAppUser, requirePlatformAdmin, async (_req, res) => {
  let databaseConnected = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseConnected = false;
  }

  res.json({
    apiHealth: true,
    databaseConnected,
    uploadThingConfigured: Boolean(process.env.UPLOADTHING_TOKEN),
    neonAuthConfigured: Boolean(process.env.VITE_NEON_AUTH_URL),
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    uptime: Math.round(process.uptime()),
  });
});
