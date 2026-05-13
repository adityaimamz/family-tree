import type { TimelineEvent } from "../../types/family";

const extractYear = (value: unknown): number => {
  if (typeof value !== "string") return 0;
  const match = value.match(/\d{4}/);
  return match ? Number.parseInt(match[0], 10) : 0;
};

export function deriveEventsUsed(timeline: TimelineEvent[]): string[] {
  if (!Array.isArray(timeline) || timeline.length === 0) return [];
  // Copy to avoid mutating the store slice.
  const sorted = [...timeline].sort((a, b) => {
    const yearDelta = extractYear(a?.year) - extractYear(b?.year);
    if (yearDelta !== 0) return yearDelta;
    const titleA = typeof a?.title === "string" ? a.title : "";
    const titleB = typeof b?.title === "string" ? b.title : "";
    return titleA.localeCompare(titleB);
  });
  return sorted.map((event) => {
    const yearText =
      typeof event?.year === "string" && event.year.trim().length > 0
        ? event.year
        : "Unknown year";
    const title =
      typeof event?.title === "string" && event.title.trim().length > 0
        ? event.title
        : "Untitled event";
    return `${yearText}: ${title}`;
  });
}
