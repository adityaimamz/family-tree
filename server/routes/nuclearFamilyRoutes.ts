import { Router } from "express";
import { loadAppUser, requireSpaceMembership } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { mapNuclearFamily } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];

export const nuclearFamilyRoutes = Router();

nuclearFamilyRoutes.get("/api/spaces/:spaceSlug/nuclear-families", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const families = await prisma.nuclearFamily.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { name: "asc" },
    });

    res.json(families.map(mapNuclearFamily));
  } catch (error) {
    handleError(res, error, "Failed to fetch nuclear families");
  }
});
