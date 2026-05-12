import { Router } from "express";
import { Prisma } from "@prisma/client";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import {
  asNonEmptyString,
  asNullableString,
  computeSpaceSummary,
  mapBranch,
  mapCurrentMembership,
  mapFamilySpace,
  mapMembership,
  mapNuclearFamily,
  mapTreeMember,
  slugify,
  treeMemberSelect,
} from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];

export const spaceRoutes = Router();

spaceRoutes.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "silsilah-keluarga-api" });
});

spaceRoutes.get("/api/auth/me", requireAuth, loadAppUser, async (req, res) => {
  res.json({ user: req.appUser });
});

spaceRoutes.get("/api/spaces", requireAuth, loadAppUser, async (req, res) => {
  try {
    if (!req.appUser) {
      res.status(500).json({ error: "User context not loaded." });
      return;
    }

    const memberships = await prisma.familyMembership.findMany({
      where: { userId: req.appUser.id },
      include: {
        familySpace: {
          include: {
            _count: {
              select: {
                members: true,
                timelineEvents: true,
                galleryItems: true,
                stories: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    res.json(memberships.map(mapMembership));
  } catch (error) {
    handleError(res, error, "Failed to fetch spaces");
  }
});

spaceRoutes.post("/api/spaces", requireAuth, loadAppUser, async (req, res) => {
  try {
    if (!req.appUser) {
      res.status(500).json({ error: "User context not loaded." });
      return;
    }

    const name = asNonEmptyString(req.body?.name);
    if (!name) {
      res.status(400).json({ error: "Space name is required." });
      return;
    }

    const description = asNullableString(req.body?.description);
    const baseSlug = slugify(name) || `space-${Date.now()}`;

    let slug = baseSlug;
    for (let suffix = 2; suffix < 100; suffix += 1) {
      const existing = await prisma.familySpace.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
    }

    const created = await prisma.$transaction(async (tx) => {
      const space = await tx.familySpace.create({
        data: {
          slug,
          name,
          description,
        },
      });

      const membership = await tx.familyMembership.create({
        data: {
          userId: req.appUser!.id,
          familySpaceId: space.id,
          role: "owner",
        },
        include: { familySpace: true },
      });

      return membership;
    });

    res.status(201).json(mapMembership(created));
  } catch (error) {
    handleError(res, error, "Failed to create space");
  }
});

spaceRoutes.get("/api/spaces/:spaceSlug", requireAuth, loadAppUser, requireSpaceMembership, async (req, res) => {
  res.json({
    space: req.familySpace ? mapFamilySpace(req.familySpace) : null,
    membership:
      req.membership && req.familySpace
        ? mapCurrentMembership(req.membership, req.familySpace)
        : null,
  });
});

spaceRoutes.get("/api/spaces/:spaceSlug/summary", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const summary = await computeSpaceSummary(req.familySpace.id);
    res.json(summary);
  } catch (error) {
    handleError(res, error, "Failed to fetch space summary");
  }
});

spaceRoutes.patch(
  "/api/spaces/:spaceSlug",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  requireSpaceRole(["owner", "admin"]),
  async (req, res) => {
    try {
      if (!req.familySpace) {
        res.status(500).json({ error: "FamilySpace context not loaded." });
        return;
      }

      const name = asNonEmptyString(req.body?.name);
      const description = req.body && Object.prototype.hasOwnProperty.call(req.body, "description")
        ? asNullableString(req.body.description)
        : undefined;

      const space = await prisma.familySpace.update({
        where: { id: req.familySpace.id },
        data: {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
        },
      });

      res.json({ space: mapFamilySpace(space) });
    } catch (error) {
      handleError(res, error, "Failed to update space");
    }
  },
);

spaceRoutes.get(
  "/api/spaces/:spaceSlug/membership",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  async (req, res) => {
    res.json(
      req.membership && req.familySpace
        ? mapCurrentMembership(req.membership, req.familySpace)
        : {
            role: req.membership?.role,
            displayName: null,
            avatarUrl: null,
            space: req.familySpace ? mapFamilySpace(req.familySpace) : null,
          },
    );
  },
);

spaceRoutes.patch(
  "/api/spaces/:spaceSlug/membership/profile",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  async (req, res) => {
    try {
      if (!req.membership || !req.familySpace) {
        res.status(500).json({ error: "Membership context not loaded." });
        return;
      }

      const displayName = req.body && Object.prototype.hasOwnProperty.call(req.body, "displayName")
        ? asNullableString(req.body.displayName)
        : undefined;
      const avatarUrl = req.body && Object.prototype.hasOwnProperty.call(req.body, "avatarUrl")
        ? asNullableString(req.body.avatarUrl)
        : undefined;

      const updates: Prisma.Sql[] = [];
      if (displayName !== undefined) updates.push(Prisma.sql`"displayName" = ${displayName}`);
      if (avatarUrl !== undefined) updates.push(Prisma.sql`"avatarUrl" = ${avatarUrl}`);
      updates.push(Prisma.sql`"updatedAt" = NOW()`);

      const [membership] = await prisma.$queryRaw<any[]>(
        Prisma.sql`
          UPDATE "FamilyMembership"
          SET ${Prisma.join(updates)}
          WHERE "id" = ${req.membership.id}
          RETURNING *
        `,
      );

      res.json({
        membership: mapCurrentMembership(membership, req.familySpace),
      });
    } catch (error) {
      handleError(res, error, "Failed to update membership profile");
    }
  },
);

spaceRoutes.get("/api/spaces/:spaceSlug/bootstrap", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const include = req.query.include;
    const includeCoreData = include === "coreData";

    const summary = await computeSpaceSummary(req.familySpace.id);

    const response: Record<string, unknown> = {
      space: mapFamilySpace(req.familySpace),
      membership: mapCurrentMembership(req.membership!, req.familySpace),
      summary,
    };

    if (includeCoreData) {
      const [members, branches, nuclearFamilies] = await Promise.all([
        prisma.familyMember.findMany({
          where: { familySpaceId: req.familySpace.id },
          select: treeMemberSelect,
          orderBy: [{ generation: "asc" }, { fullName: "asc" }],
        }),
        prisma.familyBranch.findMany({
          where: { familySpaceId: req.familySpace.id },
        }),
        prisma.nuclearFamily.findMany({
          where: { familySpaceId: req.familySpace.id },
        }),
      ]);

      response.members = members.map(mapTreeMember);
      response.branches = branches.map(mapBranch);
      response.nuclearFamilies = nuclearFamilies.map(mapNuclearFamily);
    }

    res.json(response);
  } catch (error) {
    handleError(res, error, "Failed to load bootstrap data.");
  }
});


