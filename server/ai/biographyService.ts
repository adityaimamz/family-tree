import type { BiographyMember, BiographyTone, BiographyGenerationResult, GenerateContentResponse } from "./types.js";
import { mapBranchName, mapRelationshipToRoot, compactLines, hasText } from "./aiHelpers.js";
import { parseAiBiographyJson } from "./aiJsonParsing.js";

const biographyPrivacyReminder =
  "AI drafts stay inside this family space until reviewed.";

const aiLog = (
  event: string,
  data: Record<string, unknown>,
  level: "info" | "warn" = "info",
) => {
  console[level](`[ai] ${event}`, data);
};

export const deterministicBiography = (
  member: BiographyMember | null,
  notes: string,
  tone: BiographyTone,
): BiographyGenerationResult => {
  const name = member?.displayName?.trim() || member?.fullName?.trim() || "This family member";
  const branchName = mapBranchName(member?.familyBranchId ?? null);
  const relToRoot = mapRelationshipToRoot(member?.relationshipToRoot ?? null);

  let statusText = null;
  if (member?.isDeceased) {
    statusText = `${name} is marked in the archive as ${member.deceasedLabel || member.statusLabel || "deceased"}.`;
  } else if (member?.statusLabel) {
    statusText = `${name}'s profile status: ${member.statusLabel}.`;
  }

  const identityFacts = member
    ? compactLines([
        relToRoot ? `${name} is recorded as ${relToRoot}.` : null,
        branchName === "Not recorded" ? null : `This profile belongs to the ${branchName} branch.`,
        Number.isFinite(member.generation)
          ? `The archive places this record in generation ${member.generation}.`
          : null,
        member.birthDate || member.birthPlace
          ? `${name}'s birth context: ${compactLines([member.birthDate, member.birthPlace]).join(", ")}.`
          : null,
        statusText,
      ])
    : [];
  const profileContext = member ? compactLines([member.biography, member.notes]) : [];
  const noteSentence = `Family notes: ${notes.trim()}`;
  const sourceContext = profileContext.length
    ? ` Existing profile context: ${profileContext.join(" ")}`
    : "";

  let biographyDraft: string;
  if (tone === "concise") {
    biographyDraft = compactLines([
      identityFacts[0],
      noteSentence,
      "This draft keeps only details already present in the family archive and the notes provided for review.",
    ]).join(" ");
  } else if (tone === "legacy") {
    biographyDraft = compactLines([
      `${name}'s story is preserved as part of the family's living archive.`,
      ...identityFacts,
      `${noteSentence}${sourceContext}`,
      "The draft is ready for family review, correction, and source confirmation before it becomes the final biography.",
    ]).join(" ");
  } else {
    biographyDraft = compactLines([
      `${name} is remembered through the relationships, milestones, and small details preserved by the family.`,
      ...identityFacts,
      `${noteSentence}${sourceContext}`,
      "Together, these details form a warm first draft that can be refined by relatives who know the story best.",
    ]).join(" ");
  }

  return {
    biographyDraft,
    privacyReminder: biographyPrivacyReminder,
    fallbackNote: "Generated with deterministic fallback from FamilySpace data and submitted notes.",
    source: "deterministic",
  };
};

export const maybeAiBiography = async (
  fallback: BiographyGenerationResult,
  member: BiographyMember | null,
  notes: string,
  tone: BiographyTone,
): Promise<BiographyGenerationResult> => {
  const apiKey = process.env.VERTEX_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    aiLog(
      "biography_fallback_no_api_key",
      {
        feature: "biography",
        tone,
        hasMember: Boolean(member),
        notesLength: notes.length,
      },
      "warn",
    );
    return fallback;
  }

  const model = process.env.VERTEX_MODEL || "gemini-2.5-flash";
  const endpoint =
    process.env.VERTEX_AI_GENERATE_URL ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = [
    "You draft private family biographies for WarisanAI.",
    "Use only the member profile fields and short notes supplied below.",
    "Do not invent dates, places, achievements, occupations, names, or events.",
    "Every fact in the biography must be traceable to the member profile or the notes.",
    "Write in English, with a respectful family-archive voice.",
    `Tone: ${tone}.`,
    `Privacy reminder must be exactly: ${biographyPrivacyReminder}`,
    "Return compact JSON with keys: biographyDraft, privacyReminder, fallbackNote.",
    `Member profile: ${JSON.stringify(member)}`,
    `Short notes: ${notes}`,
  ].join("\n");

  const startedAt = Date.now();
  aiLog("biography_llm_request_start", {
    feature: "biography",
    model,
    endpointMode: process.env.VERTEX_AI_GENERATE_URL ? "custom" : "default",
    tone,
    hasMember: Boolean(member),
    notesLength: notes.length,
  });

  try {
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      aiLog(
        "biography_llm_response_not_ok",
        {
          feature: "biography",
          model,
          status: response.status,
          durationMs: Date.now() - startedAt,
          errorPreview: errorText.slice(0, 500),
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
    const parsed = parseAiBiographyJson(text);
    if (!parsed?.biographyDraft || typeof parsed.biographyDraft !== "string") {
      aiLog(
        "biography_llm_invalid_json",
        {
          feature: "biography",
          model,
          durationMs: Date.now() - startedAt,
          responseTextLength: text.length,
          rawResponsePreview: text.slice(0, 500),
          fallback: true,
        },
        "warn",
      );
      return fallback;
    }

    aiLog("biography_llm_success", {
      feature: "biography",
      model,
      durationMs: Date.now() - startedAt,
      draftLength: parsed.biographyDraft.length,
      source: "ai",
    });
    return {
      biographyDraft: parsed.biographyDraft.trim(),
      privacyReminder: biographyPrivacyReminder,
      fallbackNote:
        typeof parsed.fallbackNote === "string" && parsed.fallbackNote.trim()
          ? parsed.fallbackNote.trim()
          : "Generated by AI from FamilySpace data and submitted notes.",
      source: "ai",
    };
  } catch (error) {
    aiLog(
      "biography_llm_error",
      {
        feature: "biography",
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

// Re-export hasText for use in route handlers if needed
export { hasText };
