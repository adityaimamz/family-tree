import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { iconStroke } from "../ui";
import { AIDraftMeta } from "./AIDraftMeta";
import { AIGeneratedFromChips } from "./AIGeneratedFromChips";
import { AIReviewChecklist } from "./AIReviewChecklist";
import type { AIDraftEnvelope } from "./AIDraftEnvelope";

export type AIDraftResultMode = "reading" | "editing";

export interface AIDraftResultCardProps {
  envelope: AIDraftEnvelope;
  mode?: AIDraftResultMode;
  /**
   * The body slot. In reading mode pass a text renderer; in editing mode pass
   * an editable textarea. Supplied by the parent so `AIDraftResultCard` can
   * stay presentational.
   */
  body?: ReactNode;
  /** Action row (Copy / Regenerate / Edit / Save). */
  actions?: ReactNode;
  /**
   * Extra content rendered after the body (for example, a relationship path
   * visualization).
   */
  afterBody?: ReactNode;
  variant?: "on-dark" | "on-surface";
}

const readableBodyStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark": "text-sm leading-7 text-white/92",
  "on-surface": "text-sm leading-7 text-text-primary",
};

const containerStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark":
    "border border-white/14 bg-gradient-to-br from-dark-green/95 via-dark-green/85 to-warm-brown/70 text-white shadow-warm",
  "on-surface":
    "border border-border-soft bg-surface text-text-primary shadow-warm",
};

/** Default read-mode body renderer, used when the parent does not supply one. */
export function ReadableBody({
  text,
  variant = "on-surface",
}: {
  text: string;
  variant?: "on-dark" | "on-surface";
}) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);
  if (paragraphs.length === 0) {
    return <p className={readableBodyStyles[variant]}>{text}</p>;
  }
  return (
    <div className={`flex flex-col gap-3 ${readableBodyStyles[variant]}`}>
      {paragraphs.map((paragraph, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <p key={index} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function AIDraftResultCard({
  envelope,
  mode = "reading",
  body,
  actions,
  afterBody,
  variant = "on-surface",
}: AIDraftResultCardProps) {
  const resolvedBody =
    body ?? <ReadableBody text={envelope.body} variant={variant} />;

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.99 }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      className={`flex flex-col gap-5 rounded-[1.6rem] px-4 py-5 sm:px-6 sm:py-6 ${containerStyles[variant]}`}
      data-testid="ai-draft-result-card"
      data-ai-mode={mode}
    >
      <AIDraftMeta envelope={envelope} variant={variant} />

      <div className="flex flex-col gap-4">
        {resolvedBody}
        {afterBody}
      </div>

      <AIGeneratedFromChips envelope={envelope} variant={variant} />

      {envelope.missingContext.length > 0 && (
        <div>
          <p
            className={`mb-2 text-xs font-bold uppercase tracking-[0.14em] ${
              variant === "on-dark" ? "text-white/82" : "text-text-muted"
            }`}
          >
            Could be even better with
          </p>
          <ul className="flex flex-col gap-2">
            {envelope.missingContext.map((hint) => (
              <li
                key={hint}
                className={`flex items-start gap-2 text-sm font-semibold leading-6 ${
                  variant === "on-dark" ? "text-white/88" : "text-text-primary"
                }`}
              >
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    variant === "on-dark" ? "text-soft-gold" : "text-warm-brown"
                  }`}
                  strokeWidth={iconStroke}
                />
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AIReviewChecklist envelope={envelope} variant={variant} />

      {actions && (
        <div className="flex flex-wrap gap-2 pt-1 sm:pt-0">{actions}</div>
      )}
    </motion.section>
  );
}
