export interface AIDraftSkeletonProps {
  variant?: "on-dark" | "on-surface";
}

export function AIDraftSkeleton({ variant = "on-surface" }: AIDraftSkeletonProps) {
  const isDark = variant === "on-dark";
  const block = isDark ? "bg-white/10" : "bg-surface-soft";
  const container = isDark
    ? "border-white/14 bg-white/6"
    : "border-border-soft bg-surface";
  const chip = isDark ? "bg-white/14" : "bg-sage-green/18";
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`flex animate-pulse flex-col gap-5 rounded-[1.6rem] border p-5 sm:p-6 ${container}`}
    >
      <div className="flex flex-wrap gap-2">
        <span className={`h-6 w-32 rounded-full ${chip}`} />
        <span className={`h-6 w-24 rounded-full ${chip}`} />
      </div>
      <div className="flex flex-col gap-3">
        <span className={`h-4 w-5/6 rounded-full ${block}`} />
        <span className={`h-4 w-11/12 rounded-full ${block}`} />
        <span className={`h-4 w-4/6 rounded-full ${block}`} />
      </div>
      <div>
        <span className={`mb-2 block h-3 w-28 rounded-full ${block}`} />
        <div className="flex flex-wrap gap-2">
          <span className={`h-6 w-20 rounded-full ${chip}`} />
          <span className={`h-6 w-28 rounded-full ${chip}`} />
          <span className={`h-6 w-24 rounded-full ${chip}`} />
        </div>
      </div>
      <div>
        <span className={`mb-2 block h-3 w-32 rounded-full ${block}`} />
        <div className="flex flex-col gap-2">
          <span className={`h-4 w-3/4 rounded-full ${block}`} />
          <span className={`h-4 w-2/3 rounded-full ${block}`} />
          <span className={`h-4 w-3/5 rounded-full ${block}`} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className={`h-10 w-28 rounded-2xl ${block}`} />
        <span className={`h-10 w-32 rounded-2xl ${block}`} />
        <span className={`h-10 w-36 rounded-2xl ${block}`} />
      </div>
      <span className="sr-only">Loading AI draft</span>
    </div>
  );
}
