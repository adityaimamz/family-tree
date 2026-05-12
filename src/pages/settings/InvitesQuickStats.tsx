import { ArrowUpRight, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { iconStroke } from "../../components/ui";
import { spaceFetch } from "../../lib/api";
import type { InviteSummary } from "./InvitesPanel";

export const InvitesQuickStats = ({
  spaceSlug,
  onOpen,
}: {
  spaceSlug: string;
  onOpen: () => void;
}) => {
  const [summary, setSummary] = useState<{ active: number; totalUses: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    spaceFetch(spaceSlug, "/invites")
      .then((response) => (response.ok ? response.json() : { invites: [] }))
      .then((data: { invites?: InviteSummary[] }) => {
        if (cancelled) return;
        const invites = data.invites ?? [];
        const active = invites.filter((invite) => !invite.revokedAt).length;
        const totalUses = invites.reduce((sum, invite) => sum + invite.usedCount, 0);
        setSummary({ active, totalUses });
      })
      .catch(() => {
        if (!cancelled) setSummary({ active: 0, totalUses: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [spaceSlug]);

  return (
    <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
      <UserPlus className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
      <h2 className="mt-4 text-xl font-extrabold text-text-primary">Invites at a glance</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border-soft bg-background p-3 text-center shadow-soft">
          <p className="font-display text-2xl font-extrabold text-text-primary">
            {summary?.active ?? "—"}
          </p>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
            Active invites
          </p>
        </div>
        <div className="rounded-2xl border border-border-soft bg-background p-3 text-center shadow-soft">
          <p className="font-display text-2xl font-extrabold text-text-primary">
            {summary?.totalUses ?? "—"}
          </p>
          <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">
            Joined via invite
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="group mt-4 inline-flex min-h-11 w-full items-center justify-between gap-2 rounded-full bg-dark-green pl-5 pr-2 py-2 text-sm font-extrabold text-white shadow-warm transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98]"
      >
        <span>Manage invites</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-[1.05] group-hover:bg-white/25">
          <ArrowUpRight className="h-4 w-4" strokeWidth={iconStroke} />
        </span>
      </button>
    </section>
  );
};
