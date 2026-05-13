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
import { normalizeBiographyTone, normalizeTimelineStoryTone } from "../ai/aiHelpers.js";
import {
  computeBiographyFactsUsed,
  computeBiographyMissingContext,
  computeBiographyGeneratedFrom,
  computeBiographyConfidenceLabel,
  computeTimelineEventsUsed,
  computeTimelineMissingContext,
  computeTimelineGeneratedFrom,
  mapConfidenceToLabel,
  DEFAULT_REVIEW_CHECKLIST,
} from "../ai/aiHelpers.js";
import { deterministicBiography, maybeAiBiography } from "../ai/biographyService.js";
import {
  buildTimelineStoryEvents,
  deterministicTimelineStory,
  maybeAiTimelineStory,
} from "../ai/timelineService.js";
import { isCacheFresh } from "../ai/relationshipCache.js";

const requireSpaceRead = [requireAuth, loadAppUser, requireSpaceMembership];

const aiLog = (
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" = "info",
) => {
  console[level](`[ai] ${event}`, data);
};

export const aiRoutes = Router();

aiRoutes.post("/api/spaces/:spaceSlug/ai/generate-biography", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const memberId = asNonEmptyString(req.body?.memberId);
    const notes = asNonEmptyString(req.body?.notes);
    const tone = normalizeBiographyTone(req.body?.tone);

    if (!notes) {
      res.status(400).json({ error: "notes are required." });
      return;
    }

    if (notes.length > 6000) {
      res.status(400).json({ error: "notes must be 6000 characters or fewer." });
      return;
    }

    const member = memberId
      ? await prisma.familyMember.findUnique({
          where: {
            familySpaceId_slugId: {
              familySpaceId: req.familySpace.id,
              slugId: memberId,
            },
          },
          select: {
            slugId: true,
            fullName: true,
            displayName: true,
            gender: true,
            generation: true,
            familyBranchId: true,
            birthDate: true,
            deathDate: true,
            isDeceased: true,
            deceasedLabel: true,
            birthPlace: true,
            biography: true,
            notes: true,
            statusLabel: true,
            relationshipToRoot: true,
          },
        })
      : null;

    if (memberId && !member) {
      res.status(404).json({ error: "Member was not found in this FamilySpace." });
      return;
    }

    aiLog("biography_request", {
      feature: "biography",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      appUserId: req.appUser?.id ?? null,
      tone,
      hasMember: Boolean(member),
      notesLength: notes.length,
    });
    const fallback = deterministicBiography(member, notes, tone);
    const result = await maybeAiBiography(fallback, member, notes, tone);

    const factsUsed = computeBiographyFactsUsed(member);
    const missingContextSuggestions = computeBiographyMissingContext(member);
    const generatedFrom = computeBiographyGeneratedFrom(tone, factsUsed);
    const confidenceLabel = computeBiographyConfidenceLabel(factsUsed);

    aiLog("biography_response", {
      feature: "biography",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      source: result.source,
      draftLength: result.biographyDraft.length,
    });
    res.json({
      biographyDraft: result.biographyDraft,
      privacyReminder: result.privacyReminder,
      fallbackNote: result.fallbackNote,
      source: result.source,
      tone,
      factsUsed,
      missingContextSuggestions,
      reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
      generatedFrom,
      confidenceLabel,
      warnings: [] as string[],
    });
  } catch (error) {
    handleError(res, error, "Failed to generate biography");
  }
});

aiRoutes.post("/api/spaces/:spaceSlug/ai/generate-timeline-story", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const tone = normalizeTimelineStoryTone(req.body?.tone);
    const [members, timelineEvents] = await prisma.$transaction([
      prisma.familyMember.findMany({
        where: { familySpaceId: req.familySpace.id },
        select: {
          slugId: true,
          fullName: true,
          displayName: true,
          birthDate: true,
          marriageDate: true,
          deathDate: true,
          spouseIds: true,
        },
        orderBy: [{ generation: "asc" }, { fullName: "asc" }],
      }),
      prisma.timelineEvent.findMany({
        where: { familySpaceId: req.familySpace.id },
        select: {
          slugId: true,
          year: true,
          type: true,
          title: true,
          description: true,
          relatedMemberIds: true,
          memberIds: true,
        },
        orderBy: [{ year: "asc" }, { title: "asc" }],
      }),
    ]);

    const events = buildTimelineStoryEvents(members, timelineEvents);
    aiLog("timeline_story_request", {
      feature: "timeline_story",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      appUserId: req.appUser?.id ?? null,
      tone,
      storedTimelineEventCount: timelineEvents.length,
      derivedEventCount: events.length,
      memberCount: members.length,
    });
    const fallback = deterministicTimelineStory(req.familySpace.name, events, tone);
    const result = await maybeAiTimelineStory(fallback, req.familySpace.name, events, tone);

    const eventsUsed = computeTimelineEventsUsed(events);
    const missingContextSuggestions = computeTimelineMissingContext(events);
    const generatedFrom = computeTimelineGeneratedFrom(tone, events.length, members.length);

    aiLog("timeline_story_response", {
      feature: "timeline_story",
      spaceSlug: req.params.spaceSlug,
      familySpaceId: req.familySpace.id,
      source: result.source,
      eventCount: result.eventCount,
      draftLength: result.timelineStoryDraft.length,
    });
    res.json({
      timelineStoryDraft: result.timelineStoryDraft,
      privacyReminder: result.privacyReminder,
      fallbackNote: result.fallbackNote,
      source: result.source,
      eventCount: result.eventCount,
      memberIds: result.memberIds,
      tone,
      eventsUsed,
      missingContextSuggestions,
      reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
      generatedFrom,
      warnings: [] as string[],
    });
  } catch (error) {
    handleError(res, error, "Failed to generate timeline story");
  }
});

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

    const memberMap = new Map(relationshipMembers.map((m) => [m.id, m]));
    const from = memberMap.get(fromMemberId);
    const to = memberMap.get(toMemberId);

    if (!from || !to) {
      res.status(404).json({ error: "One or both members were not found in this FamilySpace." });
      return;
    }

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
        const cacheIsValid = isCacheFresh(existing, relationshipMembers);
        const cachedSource = asStoredSource(existing.source);

        // Only serve from cache if the stored result was AI-assisted.
        // Deterministic results should always attempt a fresh LLM call.
        if (cacheIsValid && cachedSource === "ai") {
          const updated = await prisma.relationshipExplanationHistory.update({
            where: { id: existing.id },
            data: {
              viewCount: { increment: 1 },
              lastViewedAt: new Date(),
            },
          });
          const path = pathFromStoredIds(updated.pathMemberIds, relationshipMembers);
          const cachedConfidence = asStoredConfidence(updated.confidence);
          aiLog("relationship_cached_response", {
            feature: "relationship",
            source: cachedSource,
            cached: true,
            historyId: updated.id,
          });
          res.json({
            relationshipLabel: updated.relationshipLabel,
            explanation: updated.explanation,
            path,
            pathMemberIds: updated.pathMemberIds,
            confidence: cachedConfidence,
            fallbackNote: updated.fallbackNote,
            source: cachedSource,
            cached: true,
            historyId: updated.id,
            confidenceLabel: mapConfidenceToLabel(cachedConfidence),
            reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
            warnings: [] as string[],
          });
          return;
        }
      }
    }

    const fallback = deterministicRelationship(relationshipMembers, fromMemberId, toMemberId);
    if (!fallback) {
      res.status(404).json({ error: "One or both members were not found in this FamilySpace." });
      return;
    }

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
      confidenceLabel: mapConfidenceToLabel(result.confidence),
      reviewChecklist: [...DEFAULT_REVIEW_CHECKLIST],
      warnings: [] as string[],
    });
  } catch (error) {
    handleError(res, error, "Failed to explain relationship");
  }
});

aiRoutes.delete("/api/spaces/:spaceSlug/ai/relationship-history/:historyId", ...requireSpaceRead, async (req, res) => {
  try {
    if (!req.familySpace) {
      res.status(500).json({ error: "FamilySpace context not loaded." });
      return;
    }

    const historyId = Array.isArray(req.params.historyId)
      ? req.params.historyId[0]
      : req.params.historyId;

    if (!historyId) {
      res.status(400).json({ error: "historyId is required." });
      return;
    }

    const existing = await prisma.relationshipExplanationHistory.findUnique({
      where: { id: historyId },
      select: { id: true, familySpaceId: true },
    });

    if (!existing || existing.familySpaceId !== req.familySpace.id) {
      res.status(404).json({ error: "History record not found." });
      return;
    }

    await prisma.relationshipExplanationHistory.delete({
      where: { id: historyId },
    });

    aiLog("relationship_history_deleted", {
      feature: "relationship",
      historyId,
      familySpaceId: req.familySpace.id,
      appUserId: req.appUser?.id ?? null,
    });

    res.status(204).end();
  } catch (error) {
    handleError(res, error, "Failed to delete relationship history");
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
