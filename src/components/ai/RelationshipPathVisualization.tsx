import { ArrowDown } from "lucide-react";
import { iconStroke } from "../ui";

export interface RelationshipPathStep {
  id: string;
  name: string;
  role?: string;
}

export interface RelationshipPathVisualizationProps {
  path: Array<{ id: string; name: string }>;
  roles?: string[];
  variant?: "on-dark" | "on-surface";
}

const containerStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark":
    "border-white/14 bg-white/10 text-white",
  "on-surface":
    "border-border-soft bg-surface text-text-primary",
};

const stepStyles: Record<"on-dark" | "on-surface", string> = {
  "on-dark":
    "border-white/12 bg-white/10",
  "on-surface":
    "border-border-soft bg-background",
};

const endpointBadge: Record<"on-dark" | "on-surface", string> = {
  "on-dark": "bg-soft-gold text-text-primary",
  "on-surface": "bg-soft-gold/85 text-text-primary",
};

const middleBadge: Record<"on-dark" | "on-surface", string> = {
  "on-dark": "bg-white/16 text-white",
  "on-surface": "bg-sage-green/16 text-dark-green",
};

const labelColor: Record<"on-dark" | "on-surface", string> = {
  "on-dark": "text-white/72",
  "on-surface": "text-text-muted",
};

export function RelationshipPathVisualization({
  path,
  roles = [],
  variant = "on-dark",
}: RelationshipPathVisualizationProps) {
  if (!path || path.length === 0) return null;

  const isEndpoint = (index: number) => index === 0 || index === path.length - 1;
  const metadata = `${path.length} ${path.length === 1 ? "person" : "people"} | ${Math.max(0, path.length - 1)} links`;

  return (
    <div
      className={`rounded-[1.15rem] border px-3 py-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] sm:px-4 ${containerStyles[variant]}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-xs font-extrabold uppercase tracking-[0.14em] ${labelColor[variant]}`}
        >
          Relationship route
        </p>
        <span
          className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-bold ${
            variant === "on-dark"
              ? "border-white/14 bg-white/10 text-white/78"
              : "border-border-soft bg-surface-soft text-text-muted"
          }`}
        >
          {metadata}
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {path.map((step, index) => (
          <div key={`${step.id}-${index}`}>
            <div
              className={`grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3 rounded-[0.9rem] border p-2.5 ${stepStyles[variant]}`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${
                  isEndpoint(index) ? endpointBadge[variant] : middleBadge[variant]
                }`}
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-extrabold ${
                    variant === "on-dark" ? "text-white" : "text-text-primary"
                  }`}
                >
                  {step.name}
                </p>
                {roles[index] && (
                  <p
                    className={`mt-1 text-xs font-semibold leading-5 ${labelColor[variant]}`}
                  >
                    {roles[index]}
                  </p>
                )}
              </div>
            </div>
            {index < path.length - 1 && (
              <div
                className={`grid h-5 place-items-center ${
                  variant === "on-dark" ? "text-soft-gold" : "text-warm-brown"
                }`}
              >
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={iconStroke} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
