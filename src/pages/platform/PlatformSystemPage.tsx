import { motion } from "framer-motion";
import { CheckCircle2, Server, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, LoadingState, PageShell, SectionHeader, iconStroke, pageTransition } from "../../components/ui";
import { apiErrorMessage, platformFetch } from "../../lib/api";
import type { PlatformSystemInfo } from "../../types/family";

export const PlatformSystemPage = () => {
  const [system, setSystem] = useState<PlatformSystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    platformFetch("/system")
      .then(async (response) => {
        if (!response.ok) throw new Error(await apiErrorMessage(response, "Failed to load system info."));
        return response.json();
      })
      .then((data) => {
        if (mounted) setSystem(data);
      })
      .catch((loadError) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Failed to load system info.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const healthRows = system
    ? [
        { label: "API", ok: system.apiHealth },
        { label: "Database", ok: system.databaseConnected },
        { label: "UploadThing", ok: system.uploadThingConfigured },
        { label: "Neon Auth", ok: system.neonAuthConfigured },
      ]
    : [];

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Operations"
          title="System"
          description="Non-secret service health and runtime metadata for demos and operator checks."
        />

        {error && <EmptyState title="System info unavailable" description={error} />}
        {isLoading ? (
          <LoadingState />
        ) : system ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="grid gap-4 sm:grid-cols-2">
              {healthRows.map((row) => {
                const Icon = row.ok ? CheckCircle2 : XCircle;
                return (
                  <div key={row.label} className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                    <Icon className={row.ok ? "h-6 w-6 text-dark-green" : "h-6 w-6 text-warning"} strokeWidth={iconStroke} />
                    <p className="mt-5 text-xl font-extrabold text-text-primary">{row.label}</p>
                    <p className="mt-2 text-sm font-semibold text-text-muted">{row.ok ? "Configured and responding" : "Needs configuration"}</p>
                  </div>
                );
              })}
            </section>

            <aside className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <Server className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Runtime</h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-background px-4 py-3">
                  <dt className="font-semibold text-text-muted">Environment</dt>
                  <dd className="font-bold text-text-primary">{system.environment}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-background px-4 py-3">
                  <dt className="font-semibold text-text-muted">Node</dt>
                  <dd className="font-bold text-text-primary">{system.nodeVersion}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-soft bg-background px-4 py-3">
                  <dt className="font-semibold text-text-muted">Uptime</dt>
                  <dd className="font-bold tabular-nums text-text-primary">{system.uptime}s</dd>
                </div>
              </dl>
            </aside>
          </div>
        ) : (
          <EmptyState title="No system response" />
        )}
      </PageShell>
    </motion.div>
  );
};
