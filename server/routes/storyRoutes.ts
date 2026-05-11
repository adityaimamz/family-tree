import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asRouteParam, mapStory, parsePagination, storyDataFromBody, storyListInclude } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const storyRoutes = Router();

storyRoutes.get("/api/spaces/:spaceSlug/stories", ...requireSpaceRead, async (req, res) => {
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
      // Legacy mode: return bare array
      const stories = await prisma.story.findMany({
        where,
        include: storyListInclude,
        orderBy: { updatedAt: "desc" },
      });
      res.json(stories.map(mapStory));
    } else {
      // Paged mode: return paginated response
      const { page, pageSize } = pagination;
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const [items, total] = await prisma.$transaction([
        prisma.story.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take,
          include: storyListInclude,
        }),
        prisma.story.count({ where }),
      ]);

      res.json({
        items: items.map(mapStory),
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
      });
    }
  } catch (error) {
    handleError(res, error, "Failed to fetch stories");
  }
});

storyRoutes.post("/api/spaces/:spaceSlug/stories", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = storyDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Story id is required." });
      return;
    }

    const story = await prisma.$transaction(async (tx) => {
      const created = await tx.story.create({
        data: {
          familySpaceId: req.familySpace!.id,
          slugId: data.slugId,
          title: data.title,
          content: data.content,
          status: data.status,
        },
      });

      if (data.relatedMemberIds.length) {
        const relatedMembers = await tx.familyMember.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.relatedMemberIds },
          },
          select: { id: true },
        });
        if (relatedMembers.length) {
          await tx.storyMember.createMany({
            data: relatedMembers.map((member) => ({
              storyId: created.id,
              memberId: member.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.sourceNoteIds.length) {
        const sourceNotes = await tx.sourceNote.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.sourceNoteIds },
          },
          select: { id: true },
        });
        if (sourceNotes.length) {
          await tx.storySourceNote.createMany({
            data: sourceNotes.map((note) => ({
              storyId: created.id,
              sourceNoteId: note.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.story.findUniqueOrThrow({
        where: { id: created.id },
        include: storyListInclude,
      });
    });

    res.status(201).json(mapStory(story));
  } catch (error) {
    handleError(res, error, "Failed to create story");
  }
});

storyRoutes.put("/api/spaces/:spaceSlug/stories/:storySlug", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const storySlug = asRouteParam(req.params.storySlug);
    const existing = await prisma.story.findFirst({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: storySlug,
      },
      select: { id: true },
    });

    if (!existing) {
      res.status(404).json({ error: "Story not found." });
      return;
    }

    const data = storyDataFromBody(req.body, storySlug);
    const hasRelatedMemberIds = Array.isArray(req.body?.relatedMemberIds);
    const hasSourceNoteIds = Array.isArray(req.body?.sourceNoteIds);

    const story = await prisma.$transaction(async (tx) => {
      await tx.story.update({
        where: { id: existing.id },
        data: {
          ...(typeof req.body?.title === "string" ? { title: data.title } : {}),
          ...(typeof req.body?.content === "string" ? { content: data.content } : {}),
          ...(typeof req.body?.status === "string" ? { status: data.status } : {}),
        },
      });

      if (hasRelatedMemberIds) {
        await tx.storyMember.deleteMany({ where: { storyId: existing.id } });

        if (data.relatedMemberIds.length) {
          const relatedMembers = await tx.familyMember.findMany({
            where: {
              familySpaceId: req.familySpace!.id,
              slugId: { in: data.relatedMemberIds },
            },
            select: { id: true },
          });

          if (relatedMembers.length) {
            await tx.storyMember.createMany({
              data: relatedMembers.map((member) => ({
                storyId: existing.id,
                memberId: member.id,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      if (hasSourceNoteIds) {
        await tx.storySourceNote.deleteMany({ where: { storyId: existing.id } });

        if (data.sourceNoteIds.length) {
          const sourceNotes = await tx.sourceNote.findMany({
            where: {
              familySpaceId: req.familySpace!.id,
              slugId: { in: data.sourceNoteIds },
            },
            select: { id: true },
          });

          if (sourceNotes.length) {
            await tx.storySourceNote.createMany({
              data: sourceNotes.map((note) => ({
                storyId: existing.id,
                sourceNoteId: note.id,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      return tx.story.findUniqueOrThrow({
        where: { id: existing.id },
        include: storyListInclude,
      });
    });

    res.json(mapStory(story));
  } catch (error) {
    handleError(res, error, "Failed to update story");
  }
});

storyRoutes.delete("/api/spaces/:spaceSlug/stories/:storySlug", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const story = await prisma.story.findFirst({
      where: {
        familySpaceId: req.familySpace.id,
        slugId: asRouteParam(req.params.storySlug),
      },
      select: { id: true },
    });

    if (!story) {
      res.status(404).json({ error: "Story not found." });
      return;
    }

    await prisma.story.delete({ where: { id: story.id } });
    res.json({ deleted: true });
  } catch (error) {
    handleError(res, error, "Failed to delete story");
  }
});
