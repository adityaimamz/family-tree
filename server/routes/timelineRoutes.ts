import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asRouteParam, mapTimelineEvent, parsePagination, timelineDataFromBody } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const timelineRoutes = Router();

timelineRoutes.get("/api/spaces/:spaceSlug/timeline", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const pagination = parsePagination(req.query);
    if ("error" in pagination) {
      res.status(400).json({ error: pagination.error });
      return;
    }

    const where = { familySpaceId: req.familySpace.id };

    if (pagination.mode === "legacy") {
      // Legacy mode: return bare array (no pagination)
      const events = await prisma.timelineEvent.findMany({
        where,
        orderBy: { year: "asc" },
      });
      res.json(events.map(mapTimelineEvent));
    } else {
      // Paged mode: return paginated response with metadata
      const { page, pageSize } = pagination;
      const skip = (page - 1) * pageSize;

      const [items, total] = await prisma.$transaction([
        prisma.timelineEvent.findMany({
          where,
          orderBy: { year: "asc" },
          skip,
          take: pageSize,
        }),
        prisma.timelineEvent.count({ where }),
      ]);

      res.json({
        items: items.map(mapTimelineEvent),
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
      });
    }
  } catch (error) {
    handleError(res, error, "Failed to fetch timeline events");
  }
});

timelineRoutes.post("/api/spaces/:spaceSlug/timeline", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = timelineDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Timeline event id is required." });
      return;
    }

    const event = await prisma.timelineEvent.create({
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.status(201).json(mapTimelineEvent(event));
  } catch (error) {
    handleError(res, error, "Failed to create timeline event");
  }
});

timelineRoutes.put("/api/spaces/:spaceSlug/timeline/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const eventId = asRouteParam(req.params.id);
    const data = timelineDataFromBody(req.body, eventId);
    if (!data.slugId) {
      res.status(400).json({ error: "Timeline event id is required." });
      return;
    }

    const event = await prisma.timelineEvent.update({
      where: {
        familySpaceId_slugId: {
          familySpaceId: req.familySpace.id,
          slugId: eventId,
        },
      },
      data: {
        familySpaceId: req.familySpace.id,
        ...data,
      },
    });

    res.json(mapTimelineEvent(event));
  } catch (error) {
    handleError(res, error, "Failed to update timeline event");
  }
});

timelineRoutes.delete("/api/spaces/:spaceSlug/timeline/:id", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    await prisma.timelineEvent.deleteMany({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: asRouteParam(req.params.id),
      },
    });

    res.json({ success: true });
  } catch (error) {
    handleError(res, error, "Failed to delete timeline event");
  }
});
