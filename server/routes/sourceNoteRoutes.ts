import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { mapSourceNote, parsePagination, sourceNoteDataFromBody, sourceNoteListInclude } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const sourceNoteRoutes = Router();

sourceNoteRoutes.get("/api/spaces/:spaceSlug/source-notes", ...requireSpaceRead, async (req, res) => {
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
      const notes = await prisma.sourceNote.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        include: sourceNoteListInclude,
      });
      res.json(notes.map(mapSourceNote));
    } else {
      // Paged mode: return paginated response with metadata
      const { page, pageSize } = pagination;
      const skip = (page - 1) * pageSize;

      const [items, total] = await prisma.$transaction([
        prisma.sourceNote.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: pageSize,
          include: sourceNoteListInclude,
        }),
        prisma.sourceNote.count({ where }),
      ]);

      res.json({
        items: items.map(mapSourceNote),
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
      });
    }
  } catch (error) {
    handleError(res, error, "Failed to fetch source notes");
  }
});

sourceNoteRoutes.post("/api/spaces/:spaceSlug/source-notes", ...requireSpaceWrite, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const data = sourceNoteDataFromBody(req.body);
    if (!data.slugId) {
      res.status(400).json({ error: "Source note id is required." });
      return;
    }

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.sourceNote.create({
        data: {
          familySpaceId: req.familySpace!.id,
          slugId: data.slugId,
          title: data.title,
          content: data.content,
          type: data.type,
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
          await tx.sourceNoteMember.createMany({
            data: relatedMembers.map((member) => ({
              sourceNoteId: created.id,
              memberId: member.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (data.storyIds.length) {
        const stories = await tx.story.findMany({
          where: {
            familySpaceId: req.familySpace!.id,
            slugId: { in: data.storyIds },
          },
          select: { id: true },
        });
        if (stories.length) {
          await tx.storySourceNote.createMany({
            data: stories.map((story) => ({
              storyId: story.id,
              sourceNoteId: created.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.sourceNote.findUniqueOrThrow({
        where: { id: created.id },
        include: sourceNoteListInclude,
      });
    });

    res.status(201).json(mapSourceNote(note));
  } catch (error) {
    handleError(res, error, "Failed to create source note");
  }
});
