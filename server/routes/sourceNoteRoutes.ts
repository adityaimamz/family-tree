import { Router } from "express";
import { loadAppUser, requireSpaceMembership, requireSpaceRole } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { mapSourceNote, sourceNoteDataFromBody } from "./shared.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];
const requireSpaceWrite = [requireAuth, loadAppUser, requireSpaceMembership, requireSpaceRole(["owner", "admin"])];

export const sourceNoteRoutes = Router();

sourceNoteRoutes.get("/api/spaces/:spaceSlug/source-notes", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const notes = await prisma.sourceNote.findMany({
      where: { familySpaceId: req.familySpace.id },
      include: {
        memberLinks: { include: { member: true } },
        storyLinks: { include: { story: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(notes.map(mapSourceNote));
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
        include: {
          memberLinks: { include: { member: true } },
          storyLinks: { include: { story: true } },
        },
      });
    });

    res.status(201).json(mapSourceNote(note));
  } catch (error) {
    handleError(res, error, "Failed to create source note");
  }
});
