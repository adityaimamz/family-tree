import type { AIDraftTone } from "./AIDraftEnvelope";

export interface AIToneSelectorProps {
  value: AIDraftTone;
  onChange: (tone: AIDraftTone) => void;
  variant?: "on-dark" | "on-surface";
  disabled?: boolean;
}

const TONES: Array<{ value: AIDraftTone; label: string; description: string }> = [
  {
    value: "warm",
    label: "warm",
    description: "Reads like a family letter - personal, heartfelt, and story-driven",
  },
  {
    value: "concise",
    label: "concise",
    description: "Tight and factual - only key facts, no embellishment",
  },
  {
    value: "legacy",
    label: "legacy",
    description: "Archival and formal - suited for heritage documentation",
  },
];

const selectedStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark":
    "bg-white text-dark-green shadow-soft ring-2 ring-white/70",
  "on-surface":
    "bg-dark-green text-white shadow-soft ring-2 ring-dark-green/30",
};

const restingStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark":
    "border border-white/28 bg-white/10 text-white/82 hover:border-white/46 hover:bg-white/16",
  "on-surface":
    "border border-border-soft bg-surface text-text-primary hover:border-sage-green/40 hover:bg-surface-soft",
};

export function AIToneSelector({
  value,
  onChange,
  variant = "on-surface",
  disabled = false,
}: AIToneSelectorProps) {
  const labelColor = variant === "on-dark" ? "text-white/82" : "text-text-muted";
  const helperColor = variant === "on-dark" ? "text-white/68" : "text-text-muted";
  const selectedTone = TONES.find((tone) => tone.value === value) ?? TONES[0];
  const tooltipStyles =
    variant === "on-dark"
      ? "border-white/14 bg-white text-dark-green shadow-[0_18px_42px_-28px_rgba(0,0,0,0.58)]"
      : "border-border-soft bg-dark-green text-white shadow-warm";

  return (
    <div>
      <p
        className={`text-xs font-bold uppercase tracking-[0.14em] ${labelColor}`}
      >
        Tone
      </p>
      <p className={`mt-1 text-xs font-semibold leading-5 ${helperColor}`}>
        {selectedTone.description}
      </p>
      <div role="radiogroup" aria-label="Draft tone" className="flex flex-wrap gap-2">
        {TONES.map((tone, index) => {
          const selected = value === tone.value;
          const styles = selected ? selectedStyles[variant] : restingStyles[variant];
          const tooltipPosition =
            index === 0
              ? "left-0"
              : index === TONES.length - 1
                ? "right-0"
                : "left-1/2 -translate-x-1/2";
          return (
            <span key={tone.value} className="group relative mt-2 inline-flex">
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${tone.label} tone`}
                disabled={disabled}
                onClick={() => onChange(tone.value)}
                className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold capitalize transition active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${styles}`}
              >
                {tone.label}
              </button>
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-[calc(100%+0.55rem)] z-30 w-64 max-w-[calc(100vw-2rem)] translate-y-1 rounded-2xl border px-3 py-2 text-xs font-semibold leading-5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 ${tooltipPosition} ${tooltipStyles}`}
              >
                {tone.description}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
