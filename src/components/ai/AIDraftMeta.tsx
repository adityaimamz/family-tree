import { ShieldCheck, Users } from "lucide-react";
import { iconStroke } from "../ui";
import {
  AIDraftEnvelope,
  FAMILY_REVIEW_REMINDER,
  SOURCE_BADGE_TEXT,
} from "./AIDraftEnvelope";

export interface AIDraftMetaProps {
  envelope: AIDraftEnvelope;
  variant?: "on-dark" | "on-surface";
}

/** Strong tonal contrast tokens per variant. No purple, no neon, archive
 * palette only. Design-taste frontend compliance (Requirement 17). */
const badgeStyles: Record<AIDraftEnvelope["source"], Record<"on-dark" | "on-surface", string>> = {
  ai: {
    "on-dark":
      "border-soft-gold/40 bg-soft-gold/18 text-white",
    "on-surface":
      "border-sage-green/30 bg-sage-green/14 text-dark-green",
  },
  deterministic: {
    "on-dark":
      "border-white/32 bg-white/10 text-white/82",
    "on-surface":
      "border-warm-brown/25 bg-warm-brown/10 text-warm-brown",
  },
};

export function AIDraftMeta({ envelope, variant = "on-surface" }: AIDraftMetaProps) {
  const isDark = variant === "on-dark";
  const reminderColor = isDark ? "text-white/82" : "text-text-muted";
  const iconAccent = isDark ? "text-soft-gold" : "text-dark-green";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${badgeStyles[envelope.source][variant]}`}
        >
          {SOURCE_BADGE_TEXT[envelope.source]}
        </span>
        {envelope.confidence && (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
              isDark
                ? "border-white/24 bg-white/10 text-white/78"
                : "border-sage-green/25 bg-sage-green/10 text-dark-green"
            }`}
          >
            Confidence: {envelope.confidence}
          </span>
        )}
      </div>
      <p
        className={`flex items-start gap-2 text-xs font-semibold leading-5 ${reminderColor}`}
      >
        <ShieldCheck className={`mt-0.5 h-4 w-4 shrink-0 ${iconAccent}`} strokeWidth={iconStroke} />
        <span>{envelope.privacyReminder}</span>
      </p>
      <p
        className={`flex items-start gap-2 text-xs font-semibold leading-5 ${reminderColor}`}
      >
        <Users className={`mt-0.5 h-4 w-4 shrink-0 ${iconAccent}`} strokeWidth={iconStroke} />
        <span>{FAMILY_REVIEW_REMINDER}</span>
      </p>
    </div>
  );
}
