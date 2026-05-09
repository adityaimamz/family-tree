import { RelationshipResult } from "./types.js";

const parseAiJson = (text: string) => {
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<RelationshipResult>;
  } catch {
    return null;
  }
};

export const maybeAiRelationship = async (fallback: RelationshipResult, fromName: string, toName: string) => {
  const apiKey = process.env.VERTEX_API_KEY || process.env.API_KEY;
  if (!apiKey) return fallback;

  const model = process.env.VERTEX_MODEL || "gemini-2.5-flash";
  const endpoint =
    process.env.VERTEX_AI_GENERATE_URL ||
    `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`;
  const prompt = [
    "You explain family relationships for a private family archive.",
    "Use only the supplied deterministic relationship result.",
    "Explain why the relationship exists using the supplied path. Do not invent people, dates, or family data.",
    "Keep the privacy cue: This explanation only uses data inside this FamilySpace.",
    "Return compact JSON with keys: relationshipLabel, explanation, confidence, fallbackNote.",
    `Person A: ${fromName}`,
    `Person B: ${toName}`,
    `Deterministic result: ${JSON.stringify(fallback)}`,
  ].join("\n");

  try {
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 420,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) return fallback;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).filter(Boolean).join("\n") ?? "";
    const parsed = parseAiJson(text);
    if (!parsed?.explanation || !parsed.relationshipLabel) return fallback;

    return {
      ...fallback,
      relationshipLabel: String(parsed.relationshipLabel),
      explanation: String(parsed.explanation),
      confidence: parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
        ? parsed.confidence
        : fallback.confidence,
      fallbackNote: typeof parsed.fallbackNote === "string" ? parsed.fallbackNote : fallback.fallbackNote,
      source: "ai" as const,
    };
  } catch {
    return fallback;
  }
};
