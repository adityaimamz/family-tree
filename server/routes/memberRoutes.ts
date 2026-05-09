import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asRouteParam, mapMember, memberDataFromBody } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const memberRoutes = Router();

memberRoutes.get("/api/spaces/:spaceSlug/members", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: [{ generation: "asc" }, { fullName: "asc" }],
    });

    res.json(members.map(mapMember));
  } catch (error) {
    handleError(res, error, "Failed to fetch members");
  }
});

memberRoutes.post("/api/spaces/:spaceSlug/members", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = memberDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Member id is required." });
      return;
    }

    const member = await prisma.familyMember.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.status(201).json(mapMember(member));
  } catch (error) {
    handleError(res, error, "Failed to create member");
  }
});

memberRoutes.put("/api/spaces/:spaceSlug/members/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const memberId = asRouteParam(req.params.id);
    const data = memberDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Member id is required." });
      return;
    }

    const member = await prisma.familyMember.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: memberId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.json(mapMember(member));
  } catch (error) {
    handleError(res, error, "Failed to update member");
  }
});

memberRoutes.delete("/api/spaces/:spaceSlug/members/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const memberId = asRouteParam(req.params.id);
    const familySpaceId = req.familySpace.id;

    await prisma.$transaction(async (tx) => {
      const affectedMembers = await tx.familyMember.findMany({
        where: {
          familySpaceId,
          OR: [
            { fatherId: memberId },
            { motherId: memberId },
            { spouseIds: { has: memberId } },
            { formerSpouseIds: { has: memberId } },
            { childrenIds: { has: memberId } },
            { siblingIds: { has: memberId } },
          ],
        },
      });

      await Promise.all(
        affectedMembers.map((member) =>
          tx.familyMember.update({
            where: {
              familySpaceId_slugId: {
                familySpaceId,
                slugId: member.slugId,
              },
            },
            data: {
              fatherId: member.fatherId === memberId ? null : member.fatherId,
              motherId: member.motherId === memberId ? null : member.motherId,
              spouseIds: member.spouseIds.filter((item) => item !== memberId),
              formerSpouseIds: member.formerSpouseIds.filter((item) => item !== memberId),
              childrenIds: member.childrenIds.filter((item) => item !== memberId),
              siblingIds: member.siblingIds.filter((item) => item !== memberId),
            },
          }),
        ),
      );

      await tx.familyMember.deleteMany({
        where: {
          familySpaceId,
          slugId: memberId,
        },
      });
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete member");
  }
});
