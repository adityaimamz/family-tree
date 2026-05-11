import type { AIDraftEnvelope } from "./AIDraftEnvelope";

export function buildClipboardPayload(
  envelope: AIDraftEnvelope,
  relationshipLabel?: string,
): string {
  if (envelope.kind !== "relationship") {
    return envelope.body;
  }
  const label =
    (relationshipLabel ?? envelope.relationshipLabel ?? "").trim();
  return `${label}\n\n${envelope.body}`;
}
