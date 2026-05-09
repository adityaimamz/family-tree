import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asNullableString, asRouteParam, galleryDataFromBody, mapGalleryItem } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const galleryRoutes = Router();

galleryRoutes.get("/api/spaces/:spaceSlug/gallery", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const items = await prisma.galleryItem.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { year: "asc" },
    });
    res.json(items.map(mapGalleryItem));
  } catch (error) {
    handleError(res, error, "Failed to fetch gallery items");
  }
});

galleryRoutes.post("/api/spaces/:spaceSlug/gallery", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace || !req.appUser) {
      res.status(500).json({ error: "Context not loaded." });
      return;
    }

    const data = galleryDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Gallery item id is required." });
      return;
    }

    const item = await prisma.galleryItem.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
        memberId: asNullableString(req.body?.memberId),
        timelineEventId: asNullableString(req.body?.timelineEventId),
        uploadedById: req.appUser.id,
      },
    });
    res.status(201).json(mapGalleryItem(item));
  } catch (error) {
    handleError(res, error, "Failed to create gallery item");
  }
});

galleryRoutes.put("/api/spaces/:spaceSlug/gallery/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace || !req.appUser) {
      res.status(500).json({ error: "Context not loaded." });
      return;
    }

    const itemId = asRouteParam(req.params.id);
    const data = galleryDataFromBody(req.body, itemId);
    if (!data.slugId) {
      res.status(400).json({ error: "Gallery item id is required." });
      return;
    }

    const item = await prisma.galleryItem.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: itemId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
        memberId: asNullableString(req.body?.memberId),
        timelineEventId: asNullableString(req.body?.timelineEventId),
        uploadedById: req.appUser.id,
      },
    });
    res.json(mapGalleryItem(item));
  } catch (error) {
    handleError(res, error, "Failed to update gallery item");
  }
});

galleryRoutes.delete("/api/spaces/:spaceSlug/gallery/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    await prisma.galleryItem.deleteMany({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: asRouteParam(req.params.id),
      },
    });
    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete gallery item");
  }
});
