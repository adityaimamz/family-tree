import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError, HttpError } from "../http/error.js";
import { clampString } from "../security.js";
import { asRouteParam, galleryDataFromBody, mapGalleryItem, parsePagination } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const galleryRoutes = Router();

const optionalId = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return null;
  const text = clampString(value, 128);
  if (text === null) throw new HttpError(400, `${field} must be 128 characters or fewer.`);
  return text;
};

galleryRoutes.get("/api/spaces/:spaceSlug/gallery", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const where = { familySpaceId: req.familySpace.id };
    const pagination = parsePagination(req.query);

    if ("error" in pagination) {
      res.status(400).json({ error: pagination.error });
      return;
    }

    if (pagination.mode === "legacy") {
      // Legacy mode: return bare array
      const items = await prisma.galleryItem.findMany({
        where,
        orderBy: { year: "asc" },
      });
      res.json(items.map(mapGalleryItem));
    } else {
      // Paged mode: return paginated response
      const { page, pageSize } = pagination;
      const skip = (page - 1) * pageSize;

      const [items, total] = await prisma.$transaction([
        prisma.galleryItem.findMany({
          where,
          orderBy: { year: "asc" },
          skip,
          take: pageSize,
        }),
        prisma.galleryItem.count({ where }),
      ]);

      res.json({
        items: items.map(mapGalleryItem),
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
      });
    }
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
        memberId: optionalId(req.body?.memberId, "memberId"),
        timelineEventId: optionalId(req.body?.timelineEventId, "timelineEventId"),
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
        memberId: optionalId(req.body?.memberId, "memberId"),
        timelineEventId: optionalId(req.body?.timelineEventId, "timelineEventId"),
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
