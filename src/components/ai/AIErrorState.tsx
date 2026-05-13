import { AlertTriangle, RotateCcw } from "lucide-react";
import { iconStroke } from "../ui";

export interface AIErrorStateProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
  variant?: "on-dark" | "on-surface";
  disabled?: boolean;
}

export function AIErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
  variant = "on-surface",
  disabled = false,
}: AIErrorStateProps) {
  const isDark = variant === "on-dark";
  const container = isDark
    ? "border-warning/45 bg-warning/16 text-white"
    : "border-warning/30 bg-warning/10 text-warm-brown";
  const iconColor = isDark ? "text-soft-gold" : "text-warning";
  const button = isDark
    ? "border-white/35 bg-white/12 text-white hover:bg-white/20"
    : "border-warning/35 bg-surface text-warm-brown hover:bg-surface-soft";
  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-[1.4rem] border p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 ${container}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} strokeWidth={iconStroke} />
        <p className="text-sm font-semibold leading-6">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-bold shadow-soft transition active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 ${button}`}
      >
        <RotateCcw className="h-4 w-4" strokeWidth={iconStroke} />
        {retryLabel}
      </button>
    </div>
  );
}
