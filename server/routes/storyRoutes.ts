import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { mapStory, storyDataFromBody } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const storyRoutes = Router();

storyRoutes.get("/api/spaces/:spaceSlug/stories", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const stories = await prisma.story.findMany({
      where: { familySpaceId: req.familySpace.id },
      include: {
        members: { include: { member: true } },
        sourceNotes: { include: { sourceNote: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(stories.map(mapStory));
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
        include: {
          members: { include: { member: true } },
          sourceNotes: { include: { sourceNote: true } },
        },
      });
    });

    res.status(201).json(mapStory(story));
  } catch (error) {
    handleError(res, error, "Failed to create story");
  }
});
