import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asNonEmptyString, asRouteParam, generateInviteCode, mapFamilySpace, mapInvite } from "./shared.js";

const requireSpaceAdmin = [
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  requireSpaceRole(["owner", "admin"]),
];

const normalizeInviteCode = (value: string) => value.trim().toUpperCase();
const isInviteCode = (value: string) => /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(value);
const DEFAULT_INVITE_MAX_USES = 10;
const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const getInviteStatus = (invite: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
}) => {
  if (invite.revokedAt) return { isValid: false, reason: "revoked" as const };
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return { isValid: false, reason: "expired" as const };
  }
  if (typeof invite.maxUses === "number" && invite.usedCount >= invite.maxUses) {
    return { isValid: false, reason: "full" as const };
  }
  return { isValid: true, reason: null } as const;
};

export const inviteRoutes = Router();

// List invites for a space (owner/admin only)
inviteRoutes.get("/api/spaces/:spaceSlug/invites", ...requireSpaceAdmin, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const invites = await prisma.familyInvite.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: [{ createdAt: "desc" }],
    });

    res.json({ invites: invites.map(mapInvite) });
  } catch (error) {
    handleError(res, error, "Failed to fetch invites");
  }
});

// Create a new invite (default role: member, 10 uses, expires after 7 days)
inviteRoutes.post("/api/spaces/:spaceSlug/invites", ...requireSpaceAdmin, async (req, res) => {
  try {
    if (!req.familySpace || !req.appUser) {
      res.status(500).json({ error: "Space context not loaded." });
      return;
    }

    // Guard: only one active (non-revoked) invite allowed per space at a time
    const existingActiveInvite = await prisma.familyInvite.findFirst({
      where: {
        familySpaceId: req.familySpace.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (existingActiveInvite && getInviteStatus(existingActiveInvite).isValid) {
      res.status(409).json({
        error: "An active invite already exists for this space. Revoke it before creating a new one.",
      });
      return;
    }

    // Optional maxUses, default 10.
    let maxUses: number | null = DEFAULT_INVITE_MAX_USES;
    if (req.body && req.body.maxUses !== undefined && req.body.maxUses !== null) {
      const parsed = Number(req.body.maxUses);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
        res.status(400).json({ error: "maxUses must be a positive integer up to 1000." });
        return;
      }
      maxUses = parsed;
    }

    // Generate unique code (retry up to 5 times on collision)
    let code: string | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateInviteCode();
      const existing = await prisma.familyInvite.findUnique({ where: { code: candidate } });
      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      res.status(503).json({ error: "Could not generate an invite code. Please try again." });
      return;
    }

    const invite = await prisma.familyInvite.create({
      data: {
        familySpaceId: req.familySpace.id,
        code,
        role: "member", // hardcoded, cannot be changed via request
        createdById: req.appUser.id,
        maxUses,
        expiresAt: new Date(Date.now() + DEFAULT_INVITE_TTL_MS),
      },
    });

    res.status(201).json({ invite: mapInvite(invite) });
  } catch (error) {
    handleError(res, error, "Failed to create invite");
  }
});

// Revoke an invite (soft delete via revokedAt)
inviteRoutes.patch(
  "/api/spaces/:spaceSlug/invites/:inviteId/revoke",
  ...requireSpaceAdmin,
  async (req, res) => {
    try {
      if (!req.familySpace) {
        res.status(500).json({ error: "FamilySpace context not loaded." });
        return;
      }

      const inviteId = asRouteParam(req.params.inviteId);
      const invite = await prisma.familyInvite.findFirst({
        where: {
          id: inviteId,
          familySpaceId: req.familySpace.id,
        },
      });

      if (!invite) {
        res.status(404).json({ error: "Invite not found." });
        return;
      }

      if (invite.revokedAt) {
        res.json({ invite: mapInvite(invite) });
        return;
      }

      const updated = await prisma.familyInvite.update({
        where: { id: invite.id },
        data: { revokedAt: new Date() },
      });

      res.json({ invite: mapInvite(updated) });
    } catch (error) {
      handleError(res, error, "Failed to revoke invite");
    }
  },
);

// Preview an invite by code (authenticated user only).
// Does NOT grant access to space data; just shows space name + validity.
inviteRoutes.get("/api/invites/:code/preview", requireAuth, loadAppUser, async (req, res) => {
  try {
    if (!req.appUser) {
      res.status(500).json({ error: "User context not loaded." });
      return;
    }

    const raw = asNonEmptyString(asRouteParam(req.params.code));
    if (!raw) {
      res.status(400).json({ error: "Invite code is required." });
      return;
    }

    const code = normalizeInviteCode(raw);
    if (!isInviteCode(code)) {
      res.status(400).json({ error: "Invite code must use the XXXX-XXXX format." });
      return;
    }

    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: { familySpace: true },
    });

    if (!invite) {
      res.json({
        isValid: false,
        invalidReason: "not_found",
        spaceName: null,
        spaceDescription: null,
        inviteRole: null,
        alreadyMember: false,
      });
      return;
    }

    const status = getInviteStatus(invite);

    const existingMembership = await prisma.familyMembership.findUnique({
      where: {
        userId_familySpaceId: {
          userId: req.appUser.id,
          familySpaceId: invite.familySpaceId,
        },
      },
      select: { role: true },
    });

    res.json({
      isValid: status.isValid,
      invalidReason: status.reason,
      spaceName: invite.familySpace.name,
      spaceDescription: invite.familySpace.description ?? null,
      spaceSlug: invite.familySpace.slug,
      inviteRole: invite.role,
      alreadyMember: Boolean(existingMembership),
      existingRole: existingMembership?.role ?? null,
    });
  } catch (error) {
    handleError(res, error, "Failed to preview invite");
  }
});

// Join a FamilySpace via invite code
inviteRoutes.post("/api/invites/join", requireAuth, loadAppUser, async (req, res) => {
  try {
    if (!req.appUser) {
      res.status(500).json({ error: "User context not loaded." });
      return;
    }

    const raw = asNonEmptyString(req.body?.code);
    if (!raw) {
      res.status(400).json({ error: "Invite code is required." });
      return;
    }

    const code = normalizeInviteCode(raw);
    if (!isInviteCode(code)) {
      res.status(400).json({ error: "Invite code must use the XXXX-XXXX format." });
      return;
    }

    const invite = await prisma.familyInvite.findUnique({
      where: { code },
      include: { familySpace: true },
    });

    if (!invite) {
      res.status(404).json({ error: "Invite code not found." });
      return;
    }

    const status = getInviteStatus(invite);
    if (!status.isValid) {
      let message = "Invite is no longer valid.";
      if (status.reason === "revoked") message = "This invite has been revoked.";
      if (status.reason === "expired") message = "This invite has expired.";
      if (status.reason === "full") message = "This invite has reached its maximum uses.";
      res.status(410).json({ error: message, invalidReason: status.reason });
      return;
    }

    const existingMembership = await prisma.familyMembership.findUnique({
      where: {
        userId_familySpaceId: {
          userId: req.appUser.id,
          familySpaceId: invite.familySpaceId,
        },
      },
    });

    if (existingMembership) {
      res.json({
        alreadyMember: true,
        space: mapFamilySpace(invite.familySpace),
        membership: { role: existingMembership.role },
      });
      return;
    }

    const membership = await prisma.$transaction(async (tx) => {
      const claimed = await tx.familyInvite.updateMany({
        where: {
          id: invite.id,
          revokedAt: null,
          OR: [
            { maxUses: null },
            { usedCount: { lt: invite.maxUses ?? undefined } },
          ],
          ...(invite.expiresAt
            ? { expiresAt: { gt: new Date() } }
            : {}),
        },
        data: { usedCount: { increment: 1 } },
      });

      if (claimed.count === 0) {
        throw new Error("INVITE_SLOT_EXHAUSTED");
      }

      const created = await tx.familyMembership.create({
        data: {
          userId: req.appUser!.id,
          familySpaceId: invite.familySpaceId,
          role: invite.role,
        },
      });

      return created;
    });

    res.status(201).json({
      alreadyMember: false,
      space: mapFamilySpace(invite.familySpace),
      membership: { role: membership.role },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_SLOT_EXHAUSTED") {
      res.status(410).json({
        error: "This invite is no longer valid (slot claimed by another user).",
        invalidReason: "full",
      });
      return;
    }
    handleError(res, error, "Failed to join FamilySpace");
  }
});
