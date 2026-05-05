import type { LucideIcon } from "lucide-react";
import { iconStroke } from "../../components/ui";

export type StatsCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  const trendTone = trend?.isPositive ? "text-dark-green" : "text-warning";
  const classes = [
    "surface-grain relative overflow-hidden rounded-[1.6rem] border border-white/75 bg-surface/96 p-5 shadow-soft ring-1 ring-border-soft/60 transition hover:-translate-y-1",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-muted">{title}</p>
          <p className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-text-primary">{value}</p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-green/12 text-dark-green">
          <Icon className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
      </div>

      {description && <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>}

      {trend && (
        <p className={"mt-3 text-xs font-semibold " + trendTone}>
          {trend.isPositive ? "+" : "-"}
          {Math.abs(trend.value)}% dari periode lalu
        </p>
      )}
    </section>
  );
}
