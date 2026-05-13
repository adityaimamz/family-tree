import { Check } from "lucide-react";
import { iconStroke } from "../ui";
import type { AIDraftEnvelope } from "./AIDraftEnvelope";

export interface AIReviewChecklistProps {
  envelope: AIDraftEnvelope;
  variant?: "on-dark" | "on-surface";
}

export function AIReviewChecklist({
  envelope,
  variant = "on-surface",
}: AIReviewChecklistProps) {
  const isDark = variant === "on-dark";
  const labelColor = isDark ? "text-white/82" : "text-text-muted";
  const itemColor = isDark ? "text-white/88" : "text-text-primary";
  const bulletBg = isDark
    ? "bg-white/14 text-white"
    : "bg-sage-green/14 text-dark-green";
  return (
    <div>
      <p className={`mb-2 text-xs font-bold uppercase tracking-[0.14em] ${labelColor}`}>
        Review checklist
      </p>
      <ul className="flex flex-col gap-2">
        {envelope.reviewChecklist.map((item) => (
          <li
            key={item}
            className={`flex items-start gap-2 text-sm font-semibold leading-6 ${itemColor}`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${bulletBg}`}
            >
              <Check className="h-3 w-3" strokeWidth={iconStroke} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
