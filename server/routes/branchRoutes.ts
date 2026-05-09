import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asRouteParam, branchDataFromBody, mapBranch } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const branchRoutes = Router();

branchRoutes.get("/api/spaces/:spaceSlug/branches", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const branches = await prisma.familyBranch.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { name: "asc" },
    });
    res.json(branches.map(mapBranch));
  } catch (error) {
    handleError(res, error, "Failed to fetch branches");
  }
});

branchRoutes.post("/api/spaces/:spaceSlug/branches", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = branchDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Branch id is required." });
      return;
    }

    const branch = await prisma.familyBranch.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.status(201).json(mapBranch(branch));
  } catch (error) {
    handleError(res, error, "Failed to create branch");
  }
});

branchRoutes.put("/api/spaces/:spaceSlug/branches/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const branchId = asRouteParam(req.params.id);
    const data = branchDataFromBody(req.body, branchId);
    if (!data.slugId) {
      res.status(400).json({ error: "Branch id is required." });
      return;
    }

    const branch = await prisma.familyBranch.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: branchId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.json(mapBranch(branch));
  } catch (error) {
    handleError(res, error, "Failed to update branch");
  }
});

branchRoutes.delete("/api/spaces/:spaceSlug/branches/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const branchId = asRouteParam(req.params.id);
    await prisma.familyBranch.deleteMany({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: branchId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete branch");
  }
});
