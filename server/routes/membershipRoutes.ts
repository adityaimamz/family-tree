import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asNonEmptyString, asRouteParam } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];

export const membershipRoutes = Router();

// List all memberships in a space (owner/admin) — used for access management UI
membershipRoutes.get(
  "/api/spaces/:spaceSlug/memberships",
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

      const memberships = await prisma.familyMembership.findMany({
        where: { familySpaceId: req.familySpace.id },
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      });

      res.json({
        memberships: memberships.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          displayName: (m as any).displayName ?? null,
          email: m.user.email,
          name: m.user.name,
          createdAt: m.createdAt,
        })),
      });
    } catch (error) {
      handleError(res, error, "Failed to fetch memberships");
    }
  },
);

// Transfer ownership to another member (owner only)
membershipRoutes.post(
  "/api/spaces/:spaceSlug/transfer-ownership",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  requireSpaceRole(["owner"]),
  async (req, res) => {
    try {
      if (!req.familySpace || !req.appUser || !req.membership) {
        res.status(500).json({ error: "Context not loaded." });
        return;
      }

      const targetUserId = asNonEmptyString(req.body?.targetUserId);
      if (!targetUserId) {
        res.status(400).json({ error: "targetUserId is required." });
        return;
      }

      if (targetUserId === req.appUser.id) {
        res.status(400).json({ error: "You are already the owner." });
        return;
      }

      const targetMembership = await prisma.familyMembership.findUnique({
        where: {
          userId_familySpaceId: {
            userId: targetUserId,
            familySpaceId: req.familySpace.id,
          },
        },
      });

      if (!targetMembership) {
        res.status(404).json({ error: "Target user is not a member of this space." });
        return;
      }

      // Transaction: promote target to owner, demote current owner to admin
      await prisma.$transaction([
        prisma.familyMembership.update({
          where: { id: targetMembership.id },
          data: { role: "owner" },
        }),
        prisma.familyMembership.update({
          where: { id: req.membership.id },
          data: { role: "admin" },
        }),
      ]);

      res.json({
        transferred: true,
        newOwnerUserId: targetUserId,
        yourNewRole: "admin",
      });
    } catch (error) {
      handleError(res, error, "Failed to transfer ownership");
    }
  },
);

// Remove a member from the space (owner can remove admin/member, admin can remove member only)
membershipRoutes.delete(
  "/api/spaces/:spaceSlug/memberships/:membershipId",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  requireSpaceRole(["owner", "admin"]),
  async (req, res) => {
    try {
      if (!req.familySpace || !req.appUser || !req.membership) {
        res.status(500).json({ error: "Context not loaded." });
        return;
      }

      const membershipId = asRouteParam(req.params.membershipId);
      if (!membershipId) {
        res.status(400).json({ error: "membershipId is required." });
        return;
      }

      const target = await prisma.familyMembership.findFirst({
        where: { id: membershipId, familySpaceId: req.familySpace.id },
      });

      if (!target) {
        res.status(404).json({ error: "Membership not found." });
        return;
      }

      // Cannot remove yourself
      if (target.userId === req.appUser.id) {
        res.status(400).json({ error: "You cannot remove yourself." });
        return;
      }

      // Cannot remove an owner
      if (target.role === "owner") {
        res.status(403).json({ error: "Cannot remove the owner. Use Transfer Ownership instead." });
        return;
      }

      // Admin can only remove members, not other admins
      if (req.membership.role === "admin" && target.role === "admin") {
        res.status(403).json({ error: "Admins cannot remove other admins." });
        return;
      }

      await prisma.familyMembership.delete({ where: { id: target.id } });
      res.json({ success: true });
    } catch (error) {
      handleError(res, error, "Failed to remove member");
    }
  },
);

// Change a member's role (owner only)
membershipRoutes.patch(
  "/api/spaces/:spaceSlug/memberships/:membershipId/role",
  requireAuth,
  loadAppUser,
  requireSpaceMembership,
  requireSpaceRole(["owner"]),
  async (req, res) => {
    try {
      if (!req.familySpace || !req.appUser || !req.membership) {
        res.status(500).json({ error: "Context not loaded." });
        return;
      }

      const membershipId = asRouteParam(req.params.membershipId);
      if (!membershipId) {
        res.status(400).json({ error: "membershipId is required." });
        return;
      }

      const newRole = req.body?.role;
      if (newRole !== "admin" && newRole !== "member") {
        res.status(400).json({ error: "role must be 'admin' or 'member'." });
        return;
      }

      const target = await prisma.familyMembership.findFirst({
        where: { id: membershipId, familySpaceId: req.familySpace.id },
      });

      if (!target) {
        res.status(404).json({ error: "Membership not found." });
        return;
      }

      // Cannot change own role
      if (target.userId === req.appUser.id) {
        res.status(400).json({ error: "You cannot change your own role." });
        return;
      }

      // Cannot change role of another owner (must use transfer)
      if (target.role === "owner") {
        res.status(403).json({ error: "Cannot change the owner's role. Use Transfer Ownership." });
        return;
      }

      const updated = await prisma.familyMembership.update({
        where: { id: target.id },
        data: { role: newRole },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      res.json({
        membership: {
          id: updated.id,
          userId: updated.userId,
          role: updated.role,
          displayName: (updated as any).displayName ?? null,
          email: updated.user.email,
          name: updated.user.name,
          createdAt: updated.createdAt,
        },
      });
    } catch (error) {
      handleError(res, error, "Failed to update role");
    }
  },
);
