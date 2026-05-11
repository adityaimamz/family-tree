import type { AIDraftTone } from "./AIDraftEnvelope";
import type { FamilyMember } from "../../types/family";

export function buildSaveBiographyBody(
  member: FamilyMember,
  draft: string,
): FamilyMember {
  return { ...member, biography: draft };
}

export interface SaveStoryMeta {
  title: string;
  relatedMemberIds?: string[];
}

export interface SaveStoryBody {
  title: string;
  content: string;
  relatedMemberIds?: string[];
}

export function buildSaveStoryBody(
  draft: string,
  meta: SaveStoryMeta,
): SaveStoryBody {
  const body: SaveStoryBody = {
    title: meta.title,
    content: draft,
  };
  if (meta.relatedMemberIds && meta.relatedMemberIds.length > 0) {
    body.relatedMemberIds = [...meta.relatedMemberIds];
  }
  return body;
}

export interface BiographyGenerateRequest {
  memberId: string;
  notes: string;
  tone: AIDraftTone;
}

export function buildBiographyGenerateBody(
  request: BiographyGenerateRequest,
): BiographyGenerateRequest {
  return {
    memberId: request.memberId,
    notes: request.notes,
    tone: request.tone,
  };
}

export interface TimelineStoryGenerateRequest {
  tone: AIDraftTone;
}

export function buildTimelineStoryGenerateBody(
  request: TimelineStoryGenerateRequest,
): TimelineStoryGenerateRequest {
  return { tone: request.tone };
}

export interface RelationshipExplainRequest {
  fromMemberId: string;
  toMemberId: string;
  refresh?: boolean;
}

export function buildRelationshipExplainBody(
  request: RelationshipExplainRequest,
): RelationshipExplainRequest {
  const body: RelationshipExplainRequest = {
    fromMemberId: request.fromMemberId,
    toMemberId: request.toMemberId,
  };
  if (request.refresh === true) body.refresh = true;
  return body;
}
