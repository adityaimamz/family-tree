import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  Check,
  Copy,
  Link as LinkIcon,
  Loader2,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog, iconStroke } from "../../components/ui";
import { apiErrorMessage, spaceFetch } from "../../lib/api";

const PREMIUM_EASE = [0.32, 0.72, 0, 1] as const;

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return dateFormatter.format(date);
};

export type InviteSummary = {
  id: string;
  code: string;
  role: "owner" | "admin" | "member";
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// -------------------------------------------------------------------
// Internal sub-components
// -------------------------------------------------------------------

const ActionButton = ({
  onClick,
  icon,
  label,
  tone,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "solid" | "soft" | "warning";
  disabled?: boolean;
}) => {
  let className =
    "group inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-extrabold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ";
  if (tone === "solid") {
    className += "bg-dark-green text-white shadow-soft hover:-translate-y-0.5 hover:bg-warm-brown";
  } else if (tone === "warning") {
    className += "border border-warning/25 bg-warning/10 text-warning shadow-soft hover:-translate-y-0.5 hover:bg-warning/15";
  } else {
    className += "border border-border-soft bg-surface text-text-primary shadow-soft hover:-translate-y-0.5 hover:bg-surface-soft";
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {icon}
      <span>{label}</span>
    </button>
  );
};

const InviteCard = ({
  invite,
  copied,
  isRevoking,
  onCopy,
  onShareWhatsApp,
  onRevoke,
}: {
  invite: InviteSummary;
  copied: boolean;
  isRevoking: boolean;
  onCopy: () => void;
  onShareWhatsApp: () => void;
  onRevoke: () => void;
}) => {
  const createdDate = formatDate(invite.createdAt);
  const usesLabel = invite.maxUses ? `${invite.usedCount} / ${invite.maxUses}` : `${invite.usedCount}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.55, ease: PREMIUM_EASE }}
      className="relative overflow-hidden rounded-[1.6rem] border border-white/75 bg-[hsl(var(--warm-brown)/0.05)] p-2 shadow-[0_30px_60px_-40px_rgba(80,54,30,0.35)] ring-1 ring-border-soft/50"
    >
      {/* Inner core of the double-bezel */}
      <div className="relative overflow-hidden rounded-[calc(1.6rem-0.5rem)] bg-[linear-gradient(160deg,hsl(var(--surface))_0%,hsl(var(--surface))_62%,hsl(var(--sage-green)/0.08)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-sage-green/50 to-transparent" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage-green">
              Invite code
            </p>
            <p className="mt-1 break-all font-display text-2xl font-bold tracking-[0.14em] text-text-primary sm:text-[1.75rem]">
              {invite.code}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-green/20 bg-sage-green/10 px-3 py-1 text-[11px] font-bold text-dark-green">
                <ShieldCheck className="h-3 w-3" strokeWidth={iconStroke} />
                {roleLabel(invite.role)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-background px-3 py-1 text-[11px] font-bold text-text-muted">
                Used · <span className="text-text-primary">{usesLabel}</span>
              </span>
              {createdDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-background px-3 py-1 text-[11px] font-bold text-text-muted">
                  Created · <span className="text-text-primary">{createdDate}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:justify-end">
            <ActionButton
              onClick={onCopy}
              icon={copied ? <Check className="h-4 w-4" strokeWidth={iconStroke} /> : <Copy className="h-4 w-4" strokeWidth={iconStroke} />}
              label={copied ? "Copied" : "Copy link"}
              tone="solid"
            />
            <ActionButton
              onClick={onShareWhatsApp}
              icon={<MessageCircle className="h-4 w-4" strokeWidth={iconStroke} />}
              label="WhatsApp"
              tone="soft"
            />
            <ActionButton
              onClick={onRevoke}
              icon={isRevoking ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} /> : <Ban className="h-4 w-4" strokeWidth={iconStroke} />}
              label={isRevoking ? "Revoking…" : "Revoke"}
              tone="warning"
              disabled={isRevoking}
            />
          </div>
        </div>

        {/* Link preview */}
        <div className="mt-5 flex flex-col gap-1 rounded-2xl border border-border-soft bg-background px-4 py-3 shadow-[inset_0_1px_2px_-1px_rgba(80,54,30,0.15)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-sage-green" strokeWidth={iconStroke} />
            <code className="block truncate text-xs font-semibold text-text-muted">
              /join/{invite.code}
            </code>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted/80">
            Permanent · revocable
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const RevokedInviteCard = ({ invite }: { invite: InviteSummary }) => {
  const revokedDate = formatDate(invite.revokedAt);
  const usesLabel = invite.maxUses ? `${invite.usedCount} / ${invite.maxUses}` : `${invite.usedCount}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: PREMIUM_EASE }}
      className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-dashed border-border-soft bg-background/70 px-5 py-4 shadow-soft"
    >
      <div className="min-w-0">
        <p className="font-display text-lg font-bold tracking-[0.14em] text-text-muted/80 line-through">
          {invite.code}
        </p>
        <p className="mt-1 text-xs font-semibold text-text-muted">
          Used · <span className="text-text-primary">{usesLabel}</span>
          {revokedDate ? ` · Revoked ${revokedDate}` : ""}
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-[11px] font-bold text-warning">
        <Ban className="h-3 w-3" strokeWidth={iconStroke} />
        Revoked
      </span>
    </motion.div>
  );
};

const InvitesEmpty = () => (
  <div className="relative overflow-hidden rounded-[1.6rem] border border-dashed border-border-soft bg-background/70 p-8 text-center shadow-soft">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage-green/12 text-dark-green shadow-soft">
      <UserPlus className="h-6 w-6" strokeWidth={iconStroke} />
    </div>
    <h3 className="mt-5 font-display text-xl font-bold text-text-primary">No invites yet.</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
      Create your first invite to bring relatives into the archive. You can copy the link or send it
      on WhatsApp in one tap.
    </p>
  </div>
);

// -------------------------------------------------------------------
// InvitesPanel — main interactive invite management block
// -------------------------------------------------------------------

export const InvitesPanel = ({
  spaceSlug,
  spaceName,
  onToast,
}: {
  spaceSlug: string;
  spaceName: string;
  onToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}) => {
  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    try {
      const response = await spaceFetch(spaceSlug, "/invites");
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to load invites"));
      }
      const data = (await response.json()) as { invites: InviteSummary[] };
      setInvites(data.invites ?? []);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load invites");
    } finally {
      setIsLoading(false);
    }
  }, [spaceSlug]);

  useEffect(() => {
    setIsLoading(true);
    void loadInvites();
  }, [loadInvites]);

  const createInvite = async () => {
    setIsCreating(true);
    try {
      const response = await spaceFetch(spaceSlug, "/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to create invite"));
      }
      const data = (await response.json()) as { invite: InviteSummary };
      setInvites((current) => [data.invite, ...current]);
      onToast("Invite created");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to create invite", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      const response = await spaceFetch(spaceSlug, `/invites/${inviteId}/revoke`, {
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to revoke invite"));
      }
      const data = (await response.json()) as { invite: InviteSummary };
      setInvites((current) =>
        current.map((invite) => (invite.id === inviteId ? data.invite : invite)),
      );
      onToast("Invite revoked", "warning");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to revoke invite", "error");
    } finally {
      setRevokingId(null);
      setConfirmRevokeId(null);
    }
  };

  const buildJoinUrl = (code: string) =>
    `${window.location.origin}/join/${encodeURIComponent(code)}`;

  const copyLink = async (invite: InviteSummary) => {
    const url = buildJoinUrl(invite.code);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(invite.id);
      window.setTimeout(() => setCopiedId((current) => (current === invite.id ? null : current)), 1600);
      onToast("Invite link copied");
    } catch (error) {
      console.error(error);
      onToast("Could not copy link automatically", "error");
    }
  };

  const shareWhatsApp = (invite: InviteSummary) => {
    const url = buildJoinUrl(invite.code);
    const message =
      `Assalamu'alaikum, ini undangan untuk bergabung ke FamilySpace keluarga di WarisanAI.\n\n` +
      `Link: ${url}\n` +
      `Kode: ${invite.code}\n\n` +
      `Setelah masuk, kamu bisa melihat silsilah, cerita keluarga, foto, dan membantu melengkapi arsip keluarga.`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const activeInvites = invites.filter((invite) => !invite.revokedAt);
  const revokedInvites = invites.filter((invite) => invite.revokedAt);

  return (
    <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sage-green/25 bg-sage-green/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-dark-green">
            <Sparkles className="h-3 w-3" strokeWidth={iconStroke} />
            Grow this archive
          </span>
          <h2 className="font-display text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
            Invite family into {spaceName}.
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Generate a shareable code so relatives can join the tree, browse stories, and help
            complete the family archive. New members receive member access by default.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void createInvite()}
          disabled={isCreating || activeInvites.length > 0}
          title={activeInvites.length > 0 ? "Revoke the existing invite first before creating a new one" : undefined}
          className="group inline-flex min-h-12 items-center justify-between gap-2 rounded-full bg-dark-green pl-5 pr-2 py-2 text-sm font-extrabold text-white shadow-warm transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-max"
        >
          <span className="pr-1">
            {isCreating ? "Creating…" : activeInvites.length > 0 ? "Invite active" : "Create invite"}
          </span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-[1.05] group-hover:bg-white/25">
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={iconStroke} />
            )}
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="mt-6">
        {loadError && (
          <div className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-3">
            {["s1", "s2"].map((key) => (
              <div
                key={key}
                className="animate-pulse rounded-[1.45rem] border border-border-soft bg-background p-5 shadow-soft"
              >
                <div className="h-5 w-40 rounded-full bg-surface-soft" />
                <div className="mt-3 h-4 w-64 rounded-full bg-surface-soft" />
                <div className="mt-4 h-10 w-full rounded-full bg-surface-soft" />
              </div>
            ))}
            <span className="sr-only">Loading invites…</span>
          </div>
        ) : invites.length === 0 ? (
          <InvitesEmpty />
        ) : (
          <div className="grid gap-3">
            <AnimatePresence initial={false}>
              {activeInvites.map((invite) => (
                <InviteCard
                  key={invite.id}
                  invite={invite}
                  copied={copiedId === invite.id}
                  isRevoking={revokingId === invite.id}
                  onCopy={() => void copyLink(invite)}
                  onShareWhatsApp={() => shareWhatsApp(invite)}
                  onRevoke={() => setConfirmRevokeId(invite.id)}
                />
              ))}
            </AnimatePresence>

            {revokedInvites.length > 0 && (
              <div className="mt-4">
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-text-muted">
                  Revoked
                </p>
                <div className="grid gap-3">
                  {revokedInvites.map((invite) => (
                    <RevokedInviteCard key={invite.id} invite={invite} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmRevokeId)}
        title="Revoke this invite?"
        description="Anyone who has this code will no longer be able to join through it. People who already joined keep their membership."
        onCancel={() => setConfirmRevokeId(null)}
        onConfirm={() => {
          if (confirmRevokeId) void revokeInvite(confirmRevokeId);
        }}
      />
    </section>
  );
};
