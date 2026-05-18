import type {
  TimelineStoryTone,
  TimelineStoryEvent,
  TimelineStoryResult,
  GenerateContentResponse,
} from "./types.js";
import { memberDisplayName, timelineSortValue } from "./aiHelpers.js";
import { parseAiTimelineStoryJson } from "./aiJsonParsing.js";

const timelinePrivacyReminder =
  "AI timeline stories stay inside this family space until reviewed.";

const aiLog = (
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" = "info",
) => {
  console[level](`[ai] ${event}`, data);
};

export const buildTimelineStoryEvents = (
  members: Array<{
    slugId: string;
    fullName: string;
    displayName: string;
    birthDate: string | null;
    marriageDate: string | null;
    deathDate: string | null;
    spouseIds: string[];
  }>,
  timelineEvents: Array<{
    slugId: string;
    year: string;
    type: string;
    title: string;
    description: string;
    relatedMemberIds: string[];
    memberIds: string[];
  }>,
): TimelineStoryEvent[] => {
  const memberById = new Map(members.map((member) => [member.slugId, member]));
  const events: TimelineStoryEvent[] = timelineEvents.map((event) => {
    const relatedIds = Array.from(
      new Set([...(event.relatedMemberIds ?? []), ...(event.memberIds ?? [])]),
    );
    return {
      id: event.slugId,
      year: event.year,
      type: event.type,
      title: event.title,
      description: event.description,
      memberIds: relatedIds,
      memberNames: relatedIds
        .map((id) => memberById.get(id))
        .filter((m): m is Exclude<typeof m, undefined> => Boolean(m))
        .map((member) => memberDisplayName(member)),
      source: "timeline",
    };
  });

  const marriageKeys = new Set<string>();
  for (const member of members) {
    const name = memberDisplayName(member);
    if (member.birthDate) {
      events.push({
        id: `member-birth-${member.slugId}`,
        year: member.birthDate,
        type: "Birth",
        title: `${name} was born`,
        description: `${name}'s birth is recorded in the family archive.`,
        memberIds: [member.slugId],
        memberNames: [name],
        source: "member",
      });
    }

    if (member.marriageDate) {
      const spouseIds = member.spouseIds?.length ? member.spouseIds : [];
      const spouseNames = spouseIds
        .map((id) => memberById.get(id))
        .filter((m): m is Exclude<typeof m, undefined> => Boolean(m))
        .map((spouse) => memberDisplayName(spouse));
      const key = [member.slugId, ...spouseIds]
        .sort((a, b) => a.localeCompare(b))
        .join("-");
      if (!marriageKeys.has(key)) {
        marriageKeys.add(key);
        events.push({
          id: `member-marriage-${key}`,
          year: member.marriageDate,
          type: "Marriage",
          title: spouseNames.length
            ? `${name} married ${spouseNames.join(" and ")}`
            : `${name}'s marriage was recorded`,
          description: spouseNames.length
            ? `${name} and ${spouseNames.join(" and ")} are connected by a marriage record.`
            : `${name}'s marriage date is recorded in the family archive.`,
          memberIds: Array.from(new Set([member.slugId, ...spouseIds])),
          memberNames: [name, ...spouseNames],
          source: "member",
        });
      }
    }

    if (member.deathDate) {
      events.push({
        id: `member-death-${member.slugId}`,
        year: member.deathDate,
        type: "Deceased",
        title: `${name} passed away`,
        description: `${name}'s passing is recorded in the family archive.`,
        memberIds: [member.slugId],
        memberNames: [name],
        source: "member",
      });
    }
  }

  return events.sort(
    (a, b) =>
      timelineSortValue(a.year) - timelineSortValue(b.year) || a.title.localeCompare(b.title),
  );
};

export const deterministicTimelineStory = (
  familySpaceName: string,
  events: TimelineStoryEvent[],
  tone: TimelineStoryTone,
): TimelineStoryResult => {
  const memberIds = Array.from(new Set(events.flatMap((event) => event.memberIds)));
  if (!events.length) {
    return {
      timelineStoryDraft: `${familySpaceName} does not have timeline events recorded yet. Add births, marriages, moves, reunions, photos, and family milestones to turn this archive into a readable family journey.`,
      privacyReminder: timelinePrivacyReminder,
      fallbackNote:
        "Generated with deterministic fallback because no timeline events were available.",
      source: "deterministic",
      eventCount: 0,
      memberIds,
    };
  }

  const firstEvent = events[0];
  const lastEvent = events.at(-1);

  if (!firstEvent || !lastEvent) {
    throw new Error("Unexpected empty events array after length check");
  }
  const typeSummary = Array.from(new Set(events.map((event) => event.type))).join(", ");
  const eventLines = events.slice(0, 9).map((event) => {
    const people = event.memberNames.length ? ` involving ${event.memberNames.join(", ")}` : "";
    return `${event.year}: ${event.title}${people}. ${event.description}`;
  });

  let timelineStoryDraft: string;
  if (tone === "concise") {
    timelineStoryDraft = [
      `${familySpaceName}'s timeline currently spans from ${firstEvent.year} to ${lastEvent.year}.`,
      `The archive connects ${events.length} recorded milestones across ${typeSummary}.`,
      eventLines.join(" "),
      "This draft uses only timeline and member records already stored inside the FamilySpace.",
    ].join(" ");
  } else if (tone === "legacy") {
    timelineStoryDraft = [
      `${familySpaceName} is preserved through a sequence of family milestones, beginning with ${firstEvent.title} and continuing through ${lastEvent.title}.`,
      `Across ${events.length} moments, the archive traces ${typeSummary.toLowerCase()} as part of a shared family inheritance.`,
      eventLines.join(" "),
      "Together, these records create a first family journey draft for relatives to review, correct, and enrich with photos or source notes.",
    ].join(" ");
  } else {
    timelineStoryDraft = [
      `${familySpaceName}'s story unfolds through the milestones its family has chosen to preserve.`,
      `From ${firstEvent.year} to ${lastEvent.year}, the archive connects ${events.length} moments of birth, relationship, memory, and change.`,
      eventLines.join(" "),
      "Read together, these records become more than dates: they form a warm first draft of the family's journey across generations.",
    ].join(" ");
  }

  return {
    timelineStoryDraft,
    privacyReminder: timelinePrivacyReminder,
    fallbackNote:
      "Generated with deterministic fallback from FamilySpace timeline and member data.",
    source: "deterministic",
    eventCount: events.length,
    memberIds,
  };
};

export const maybeAiTimelineStory = async (
  fallback: TimelineStoryResult,
  familySpaceName: string,
  events: TimelineStoryEvent[],
  tone: TimelineStoryTone,
): Promise<TimelineStoryResult> => {
  const apiKey = process.env.VERTEX_API_KEY || process.env.API_KEY;
  if (process.env.AI_EXTERNAL_ENABLED !== "1" || !apiKey) {
    aiLog(
      process.env.AI_EXTERNAL_ENABLED === "1"
        ? "timeline_story_fallback_no_api_key"
        : "timeline_story_fallback_external_disabled",
      {
        feature: "timeline_story",
        tone,
        eventCount: events.length,
        memberCount: fallback.memberIds.length,
      },
      "warn",
    );
    return fallback;
  }

  const model = process.env.VERTEX_MODEL || "gemini-2.5-flash";
  const endpoint =
    process.env.VERTEX_AI_GENERATE_URL ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const compactEvents = events.map((event) => ({
    year: event.year,
    type: event.type,
    title: event.title,
    description: event.description,
    memberNames: event.memberNames,
    source: event.source,
  }));
  const prompt = [
    "You draft private family timeline stories for WarisanAI.",
    "Use only the supplied deterministic timeline result and evidence list.",
    "Do not invent dates, places, people, occupations, achievements, or extra events.",
    "Every sentence must be traceable to the deterministic draft or evidence list.",
    "Write in English, with a warm private family archive voice.",
    `Tone: ${tone}.`,
    `Privacy reminder must be exactly: ${timelinePrivacyReminder}`,
    "Return compact JSON with keys: timelineStoryDraft, privacyReminder, fallbackNote.",
    `FamilySpace: ${familySpaceName}`,
    `Deterministic timeline result: ${JSON.stringify(fallback)}`,
    `Evidence list: ${JSON.stringify(compactEvents)}`,
  ].join("\n");

  const startedAt = Date.now();
  aiLog("timeline_story_llm_request_start", {
    feature: "timeline_story",
    model,
    endpointMode: process.env.VERTEX_AI_GENERATE_URL ? "custom" : "default",
    tone,
    eventCount: events.length,
    memberCount: fallback.memberIds.length,
  });

  try {
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.28,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      aiLog(
        "timeline_story_llm_response_not_ok",
        {
          feature: "timeline_story",
          model,
          status: response.status,
          durationMs: Date.now() - startedAt,
          errorLength: errorText.length,
          fallback: true,
        },
        "warn",
      );
      return fallback;
    }
    const data = (await response.json()) as GenerateContentResponse;
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";
    const parsed = parseAiTimelineStoryJson(text);
    if (!parsed?.timelineStoryDraft || typeof parsed.timelineStoryDraft !== "string") {
      aiLog(
        "timeline_story_llm_invalid_json",
        {
          feature: "timeline_story",
          model,
          durationMs: Date.now() - startedAt,
          responseTextLength: text.length,
          fallback: true,
        },
        "warn",
      );
      return fallback;
    }

    aiLog("timeline_story_llm_success", {
      feature: "timeline_story",
      model,
      durationMs: Date.now() - startedAt,
      draftLength: parsed.timelineStoryDraft.length,
      source: "ai",
    });
    return {
      timelineStoryDraft: parsed.timelineStoryDraft.trim(),
      privacyReminder: timelinePrivacyReminder,
      fallbackNote:
        typeof parsed.fallbackNote === "string" && parsed.fallbackNote.trim()
          ? parsed.fallbackNote.trim()
          : "Generated by AI from FamilySpace timeline and member data.",
      source: "ai",
      eventCount: fallback.eventCount,
      memberIds: fallback.memberIds,
    };
  } catch (error) {
    aiLog(
      "timeline_story_llm_error",
      {
        feature: "timeline_story",
        model,
        durationMs: Date.now() - startedAt,
        errorName: error instanceof Error ? error.name : "UnknownError",
        fallback: true,
      },
      "warn",
    );
    return fallback;
  }
};
