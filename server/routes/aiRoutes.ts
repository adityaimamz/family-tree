import { Router } from "express";
import { loadAppUser, requireSpaceMembership } from "../authorization.js";
import { requireAuth } from "../neonAuth.js";
import { prisma } from "../db.js";
import { handleError } from "../http/error.js";
import { asNonEmptyString } from "./shared.js";
import { maybeAiRelationship } from "../relationship/aiExplain.js";
import { deterministicRelationship } from "../relationship/deterministic.js";
import {
  RelationshipMember,
  asStoredConfidence,
  asStoredSource,
  memberName,
  pathFromStoredIds,
} from "../relationship/types.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];

export const aiRoutes = Router();

aiRoutes.post("/api/spaces/:spaceSlug/ai/explain-relationship", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const refresh = req.body?.refresh === true;
    const fromMemberId = asNonEmptyString(req.body?.fromMemberId);
    const toMemberId = asNonEmptyString(req.body?.toMemberId);
    if (!fromMemberId || !toMemberId) {
      res.status(400).json({ error: "fromMemberId and toMemberId are required." });
      return;
    }

    const members = await prisma.familyMember.findMany({
      where: { familySpaceId: req.familySpace.id },
      select: {
        slugId: true,
        fullName: true,
        displayName: true,
        gender: true,
        fatherId: true,
        motherId: true,
        spouseIds: true,
        formerSpouseIds: true,
        childrenIds: true,
        siblingIds: true,
      },
    });

    const relationshipMembers: RelationshipMember[] = members.map((member) => ({
      id: member.slugId,
      fullName: member.fullName,
      displayName: member.displayName,
      gender: member.gender,
      fatherId: member.fatherId,
      motherId: member.motherId,
      spouseIds: member.spouseIds ?? [],
      formerSpouseIds: member.formerSpouseIds ?? [],
      childrenIds: member.childrenIds ?? [],
      siblingIds: member.siblingIds ?? [],
    }));

    const memberIdSet = new Set(relationshipMembers.map((m) => m.id));
    if (!memberIdSet.has(fromMemberId) || !memberIdSet.has(toMemberId)) {
      res.status(404).json({ error: "One or both members were not found in this FamilySpace." });
      return;
    }

    const fallback = deterministicRelationship(relationshipMembers, fromMemberId, toMemberId);
    if (!fallback) {
      res.status(404).json({ error: "One or both members were not found in this FamilySpace." });
      return;
    }
    const fallbackPathMemberIds = fallback.path.map((item) => item.id);

    if (!refresh) {
      const existing = await prisma.relationshipExplanationHistory.findUnique({
        where: {
          familySpaceId_fromMemberId_toMemberId: {
            familySpaceId: req.familySpace.id,
            fromMemberId,
            toMemberId,
          },
        },
      });
      if (existing) {
        const staleDeterministicResult =
          existing.relationshipLabel !== fallback.relationshipLabel ||
          existing.pathMemberIds.length !== fallbackPathMemberIds.length ||
          existing.pathMemberIds.some((id, index) => id !== fallbackPathMemberIds[index]);
        const updated = await prisma.relationshipExplanationHistory.update({
          where: { id: existing.id },
          data: {
            ...(staleDeterministicResult
              ? {
                  relationshipLabel: fallback.relationshipLabel,
                  explanation: fallback.explanation,
                  fallbackNote: fallback.fallbackNote,
                  pathMemberIds: fallbackPathMemberIds,
                  confidence: fallback.confidence,
                  source: fallback.source,
                }
              : {}),
            viewCount: { increment: 1 },
            lastViewedAt: new Date(),
          },
        });
        const path = pathFromStoredIds(updated.pathMemberIds, relationshipMembers);
        res.json({
          relationshipLabel: updated.relationshipLabel,
          explanation: updated.explanation,
          path,
          pathMemberIds: updated.pathMemberIds,
          confidence: asStoredConfidence(updated.confidence),
          fallbackNote: updated.fallbackNote,
          source: asStoredSource(updated.source),
          cached: true,
          historyId: updated.id,
        });
        return;
      }
    }

    const from = relationshipMembers.find((member) => member.id === fromMemberId)!;
    const to = relationshipMembers.find((member) => member.id === toMemberId)!;
    const result = await maybeAiRelationship(fallback, memberName(from), memberName(to));
    const pathMemberIds = result.path.map((item) => item.id);

    const history = await prisma.relationshipExplanationHistory.upsert({
      where: {
        familySpaceId_fromMemberId_toMemberId: {
          familySpaceId: req.familySpace.id,
          fromMemberId,
          toMemberId,
        },
      },
      create: {
        familySpaceId: req.familySpace.id,
        fromMemberId,
        toMemberId,
        relationshipLabel: result.relationshipLabel,
        explanation: result.explanation,
        fallbackNote: result.fallbackNote,
        pathMemberIds,
        confidence: result.confidence,
        source: result.source,
        createdById: req.appUser?.id ?? null,
      },
      update: {
        relationshipLabel: result.relationshipLabel,
        explanation: result.explanation,
        fallbackNote: result.fallbackNote,
        pathMemberIds,
        confidence: result.confidence,
        source: result.source,
      },
    });

    res.json({
      ...result,
      pathMemberIds,
      cached: false,
      historyId: history.id,
    });
  } catch (error) {
    handleError(res, error, "Failed to explain relationship");
  }
});

aiRoutes.get("/api/spaces/:spaceSlug/ai/relationship-history", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const rows = await prisma.relationshipExplanationHistory.findMany({
      where: { familySpaceId: req.familySpace.id },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: {
        id: true,
        fromMemberId: true,
        toMemberId: true,
        relationshipLabel: true,
        explanation: true,
        pathMemberIds: true,
        confidence: true,
        source: true,
        fallbackNote: true,
        updatedAt: true,
        viewCount: true,
      },
    });

    res.json(rows);
  } catch (error) {
    handleError(res, error, "Failed to fetch relationship history");
  }
});
