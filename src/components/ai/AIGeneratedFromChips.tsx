import type { AIDraftEnvelope } from "./AIDraftEnvelope";

export interface AIGeneratedFromChipsProps {
  envelope: AIDraftEnvelope;
  max?: number;
  variant?: "on-dark" | "on-surface";
}

const chipStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark":
    "border-white/24 bg-white/10 text-white/88",
  "on-surface":
    "border-sage-green/22 bg-sage-green/10 text-dark-green",
};

const isToneChip = (chip: string): boolean => chip.toLowerCase().startsWith("tone:");

export function AIGeneratedFromChips({
  envelope,
  max = 8,
  variant = "on-surface",
}: AIGeneratedFromChipsProps) {
  const list = Array.isArray(envelope.generatedFrom) ? envelope.generatedFrom : [];
  if (list.length === 0) return null;

  const toneChip = list.find(isToneChip);
  const rest = list.filter((chip) => chip !== toneChip);
  const ordered = toneChip ? [toneChip, ...rest] : rest;
  const visible = ordered.slice(0, max);

  return (
    <div>
      <p
        className={`mb-2 text-xs font-bold uppercase tracking-[0.14em] ${
          variant === "on-dark" ? "text-white/82" : "text-text-muted"
        }`}
      >
        Generated from
      </p>
      <ul className="flex flex-wrap gap-2">
        {visible.map((chip) => (
          <li
            key={chip}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${chipStyles[variant]}`}
          >
            {chip}
          </li>
        ))}
      </ul>
    </div>
  );
}
