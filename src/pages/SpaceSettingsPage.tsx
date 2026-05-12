import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  Ban,
  Camera,
  Check,
  Copy,
  Link as LinkIcon,
  Loader2,
  Lock,
  MessageCircle,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Badge, ConfirmDialog, PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { apiErrorMessage, authFetch, spaceFetch } from "../lib/api";
import { getInitials } from "../utils/family";

const PREMIUM_EASE = [0.32, 0.72, 0, 1] as const;

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 disabled:cursor-not-allowed disabled:opacity-70";

const acceptedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarBytes = 4 * 1024 * 1024;

type SettingsTab = "account" | "space" | "invites";

type InviteSummary = {
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

export const SpaceSettingsPage = () => {
  const { currentSpace, membership, currentUser, canEdit, updateSpace, updateMembershipProfile, addToast } = useSpaceStore();
  const avatarInputId = useId();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [form, setForm] = useState({ name: "", description: "" });
  const [accountForm, setAccountForm] = useState({ displayName: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      name: currentSpace?.name ?? "",
      description: currentSpace?.description ?? "",
    });
  }, [currentSpace]);

  useEffect(() => {
    setAccountForm({
      displayName: membership?.displayName ?? "",
      avatarUrl: membership?.avatarUrl ?? "",
    });
  }, [membership]);

  const previewName = useMemo(
    () => accountForm.displayName.trim() || currentUser?.name || currentUser?.email || "Family user",
    [accountForm.displayName, currentUser],
  );
  const previewInitials = useMemo(() => getInitials(previewName).toUpperCase(), [previewName]);

  if (!currentSpace || !membership) return null;

  // Auto-fallback: members can only see the account tab
  const effectiveTab = canEdit() ? activeTab : "account";

  const saveSettings = async () => {
    if (!canEdit() || !form.name.trim()) return;
    setSaving(true);
    await updateSpace({
      name: form.name.trim(),
      description: form.description.trim() || null,
    });
    setSaving(false);
  };

  const uploadAvatar = async (file: File) => {
    setAccountError(null);

    if (!acceptedAvatarTypes.includes(file.type)) {
      setAccountError("Avatar format must be JPG, PNG, or WebP.");
      return;
    }

    if (file.size > maxAvatarBytes) {
      setAccountError("Avatar size must be 4 MB or less.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const params = new URLSearchParams({ filename: file.name });
      const response = await authFetch(`/api/uploads/avatar?${params.toString()}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const responseText = await response.text();
      const responseType = response.headers.get("content-type") ?? "";
      const result = responseType.includes("application/json")
        ? (JSON.parse(responseText) as { url?: string; error?: string })
        : { error: responseText || "Avatar upload failed." };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Avatar upload failed.");
      }

      setAccountForm((current) => ({ ...current, avatarUrl: result.url ?? "" }));
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveAccountProfile = async () => {
    setSavingAccount(true);
    setAccountError(null);
    try {
      await updateMembershipProfile({
        displayName: accountForm.displayName.trim() || null,
        avatarUrl: accountForm.avatarUrl.trim() || null,
      });
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Failed to save account profile.");
    } finally {
      setSavingAccount(false);
    }
  };

  const tabClass = (tab: SettingsTab) =>
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-[1px] ${
      effectiveTab === tab
        ? "bg-dark-green text-white shadow-warm"
        : "border border-border-soft bg-background text-text-muted shadow-soft hover:-translate-y-0.5 hover:bg-surface-soft hover:text-text-primary"
    }`;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Control"
          title="Settings"
          description="Manage your personal identity in this FamilySpace and the visible identity of the private archive."
        />

        <div className="mb-5 flex flex-wrap gap-2 rounded-[1.45rem] border border-border-soft bg-surface/78 p-2 shadow-soft ring-1 ring-white/70">
          <button type="button" className={tabClass("account")} onClick={() => setActiveTab("account")}>
            <UserRound className="h-4 w-4" strokeWidth={iconStroke} />
            Account
          </button>
          {canEdit() && (
            <button type="button" className={tabClass("space")} onClick={() => setActiveTab("space")}>
              <Settings className="h-4 w-4" strokeWidth={iconStroke} />
              FamilySpace
            </button>
          )}
          {canEdit() && (
            <button type="button" className={tabClass("invites")} onClick={() => setActiveTab("invites")}>
              <UserPlus className="h-4 w-4" strokeWidth={iconStroke} />
              Invites
            </button>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {effectiveTab === "account" && (
            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-text-primary">Your account in this space</h2>
                  <p className="mt-1 text-sm font-semibold text-text-muted">This display name and avatar only apply inside {currentSpace.name}.</p>
                </div>
                <Badge tone="sage">Per-space profile</Badge>
              </div>

              <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="rounded-[1.45rem] border border-border-soft bg-background p-4 shadow-soft">
                  <div className="mx-auto grid h-36 w-36 place-items-center overflow-hidden rounded-[2rem] bg-dark-green text-3xl font-extrabold text-white shadow-warm ring-1 ring-white/70">
                    {accountForm.avatarUrl ? (
                      <img className="h-full w-full object-cover" src={accountForm.avatarUrl} alt={`${previewName} avatar`} />
                    ) : (
                      previewInitials
                    )}
                  </div>
                  <p className="mt-4 truncate text-center text-sm font-extrabold text-text-primary">{previewName}</p>
                  <p className="mt-1 text-center text-xs font-bold uppercase tracking-[0.14em] text-sage-green">{roleLabel(membership.role)}</p>

                  <div className="mt-4 grid gap-2">
                    <input
                      id={avatarInputId}
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingAvatar}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void uploadAvatar(file);
                      }}
                    />
                    <label
                      htmlFor={avatarInputId}
                      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-4 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px] ${
                        uploadingAvatar ? "pointer-events-none opacity-65" : ""
                      }`}
                    >
                      <Camera className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                      {uploadingAvatar ? "Uploading..." : "Upload avatar"}
                    </label>
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-warning/20 bg-surface px-4 py-3 text-sm font-bold text-warning shadow-soft transition hover:-translate-y-0.5 hover:bg-warning/10 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!accountForm.avatarUrl}
                      onClick={() => setAccountForm((current) => ({ ...current, avatarUrl: "" }))}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={iconStroke} />
                      Remove avatar
                    </button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text-primary">Display name in this FamilySpace</span>
                    <input
                      className={inputClass}
                      value={accountForm.displayName}
                      placeholder={currentUser?.name || currentUser?.email || "Family user"}
                      onChange={(event) => setAccountForm((current) => ({ ...current, displayName: event.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text-primary">Email</span>
                    <input className={inputClass} value={currentUser?.email ?? "Not available"} disabled readOnly />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-text-primary">Role in this FamilySpace</span>
                    <input className={inputClass} value={roleLabel(membership.role)} disabled readOnly />
                  </label>

                  {accountError && (
                    <p className="rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
                      {accountError}
                    </p>
                  )}

                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-65 sm:w-max"
                    disabled={savingAccount || uploadingAvatar}
                    onClick={() => void saveAccountProfile()}
                  >
                    <Save className="h-4 w-4" strokeWidth={iconStroke} />
                    {savingAccount ? "Saving..." : "Save account"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {effectiveTab === "space" && (
            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-text-primary">FamilySpace profile</h2>
                  <p className="mt-1 text-sm font-semibold text-text-muted">Name and description appear in the app shell and space list.</p>
                </div>
                <Badge tone="sage">Private Family Archive</Badge>
              </div>

              <div className="grid gap-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text-primary">Space name</span>
                  <input
                    className={inputClass}
                    value={form.name}
                    disabled={!canEdit()}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-text-primary">Description</span>
                  <textarea
                    className={`${inputClass} min-h-32 resize-y`}
                    value={form.description}
                    disabled={!canEdit()}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>

                {canEdit() ? (
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px] sm:w-max"
                    onClick={() => void saveSettings()}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4" strokeWidth={iconStroke} />
                    {saving ? "Saving..." : "Save settings"}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-sage-green/20 bg-sage-green/10 p-4 text-sm font-semibold leading-6 text-text-muted">
                    Your member role can view settings but cannot edit this FamilySpace.
                  </div>
                )}
              </div>
            </section>
          )}

          {effectiveTab === "invites" && canEdit() && (
            <InvitesPanel spaceSlug={currentSpace.slug} spaceName={currentSpace.name} onToast={addToast} />
          )}

          <aside className="grid gap-5">
            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <ShieldCheck className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Current access</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                You are signed in as <span className="text-text-primary">{roleLabel(membership.role)}</span> for {currentSpace.name}.
              </p>
              <div className="mt-4 rounded-2xl border border-border-soft bg-background p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  <p className="text-sm font-bold text-text-primary">Private Family Archive</p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">
                  Platform admins cannot automatically access private FamilySpace records.
                </p>
              </div>
            </section>

            {canEdit() ? (
              <InvitesQuickStats spaceSlug={currentSpace.slug} onOpen={() => setActiveTab("invites")} />
            ) : (
              <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                <Users className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                <h2 className="mt-4 text-xl font-extrabold text-text-primary">Invite management</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Only owners and admins can create or revoke invites. Ask a steward of this archive
                  to share a code with you.
                </p>
              </section>
            )}

            {membership.role === "owner" && (
              <DangerZoneSection spaceSlug={currentSpace.slug} onToast={addToast} />
            )}
          </aside>
        </div>
      </PageShell>
    </motion.div>
  );
};

// -------------------------------------------------------------------
// InvitesPanel — main interactive invite management block
// -------------------------------------------------------------------

const InvitesPanel = ({
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
          disabled={isCreating}
          className="group inline-flex min-h-12 items-center justify-between gap-2 rounded-full bg-dark-green pl-5 pr-2 py-2 text-sm font-extrabold text-white shadow-warm transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65 sm:w-max"
        >
          <span className="pr-1">{isCreating ? "Creating…" : "Create invite"}</span>
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

// -------------------------------------------------------------------
// Invite cards
// -------------------------------------------------------------------

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
// Sidebar quick stats card
// -------------------------------------------------------------------

const InvitesQuickStats = ({
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

// -------------------------------------------------------------------
// Danger Zone — Transfer Ownership (owner only)
// -------------------------------------------------------------------

type SpaceMember = {
  id: string;
  userId: string;
  role: string;
  displayName: string | null;
  email: string;
  name: string | null;
  createdAt: string;
};

const DangerZoneSection = ({
  spaceSlug,
  onToast,
}: {
  spaceSlug: string;
  onToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}) => {
  const navigate = useNavigate();
  const [transferOpen, setTransferOpen] = useState(false);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const openTransfer = async () => {
    setTransferOpen(true);
    setLoadingMembers(true);
    setSelectedUserId(null);
    setConfirmText("");
    try {
      const response = await spaceFetch(spaceSlug, "/memberships");
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to load members"));
      }
      const data = (await response.json()) as { memberships: SpaceMember[] };
      // Exclude the current owner from the list (they can't transfer to themselves)
      setMembers((data.memberships ?? []).filter((m) => m.role !== "owner"));
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to load members", "error");
      setTransferOpen(false);
    } finally {
      setLoadingMembers(false);
    }
  };

  const executeTransfer = async () => {
    if (!selectedUserId || confirmText !== "TRANSFER") return;
    setTransferring(true);
    try {
      const response = await spaceFetch(spaceSlug, "/transfer-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selectedUserId }),
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to transfer ownership"));
      }
      onToast("Ownership transferred. You are now an admin.", "warning");
      setTransferOpen(false);
      // Reload the page to reflect new role
      window.setTimeout(() => {
        navigate(0 as any); // force reload
      }, 800);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to transfer ownership", "error");
    } finally {
      setTransferring(false);
    }
  };

  const selectedMember = members.find((m) => m.userId === selectedUserId);
  const canConfirm = selectedUserId && confirmText === "TRANSFER" && !transferring;

  return (
    <>
      <section className="rounded-[1.6rem] border border-warning/20 bg-warning/10 p-5 shadow-soft ring-1 ring-border-soft/60">
        <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={iconStroke} />
        <h2 className="mt-4 text-xl font-extrabold text-text-primary">Danger zone</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
          Transfer ownership to another member. You will be demoted to admin and cannot undo this without the new owner's help.
        </p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => void openTransfer()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-warning/25 bg-surface px-4 py-3 text-sm font-bold text-warning shadow-soft transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warning/10 active:translate-y-[1px]"
          >
            <ArrowRightLeft className="h-4 w-4" strokeWidth={iconStroke} />
            Transfer ownership
          </button>
          <button type="button" disabled className="min-h-11 rounded-2xl border border-warning/20 bg-surface px-4 py-3 text-sm font-bold text-warning opacity-60">
            Delete space (coming soon)
          </button>
        </div>
      </section>

      {/* Transfer Ownership Modal — portaled to body to escape overflow:auto */}
      {createPortal(
        <AnimatePresence>
          {transferOpen && (
            <motion.div
              className="fixed inset-0 z-50 grid place-items-center bg-text-primary/30 px-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="transfer-title"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-lg rounded-[2rem] border border-border-soft bg-surface p-6 shadow-warm sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning/12 text-warning">
                  <ArrowRightLeft className="h-6 w-6" strokeWidth={iconStroke} />
                </div>
                <div>
                  <h2 id="transfer-title" className="text-xl font-extrabold text-text-primary">
                    Transfer ownership
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    The new owner will have full control of this FamilySpace. You will be demoted to admin. This action cannot be undone by you.
                  </p>
                </div>
              </div>

              {loadingMembers ? (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border-soft bg-background p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-sage-green" strokeWidth={iconStroke} />
                  <p className="text-sm font-semibold text-text-muted">Loading members…</p>
                </div>
              ) : members.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-border-soft bg-background p-5 text-center">
                  <p className="text-sm font-semibold text-text-muted">
                    No other members in this space. Invite someone first before transferring ownership.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-text-primary">Select new owner</p>
                    <div className="dropdown-scroll max-h-48 overflow-y-auto rounded-2xl border border-border-soft bg-background p-2 shadow-soft">
                      {members.map((member) => {
                        const isSelected = selectedUserId === member.userId;
                        const label = member.displayName || member.name || member.email;
                        return (
                          <button
                            key={member.userId}
                            type="button"
                            onClick={() => setSelectedUserId(member.userId)}
                            className={`mb-1 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition active:translate-y-[1px] ${
                              isSelected
                                ? "bg-dark-green font-bold text-white shadow-soft"
                                : "font-semibold text-text-primary hover:bg-surface-soft"
                            }`}
                          >
                            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-sage-green/12 text-dark-green"}`}>
                              {getInitials(label).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{label}</span>
                              <span className={`block truncate text-xs ${isSelected ? "text-white/70" : "text-text-muted"}`}>
                                {member.email} · {roleLabel(member.role)}
                              </span>
                            </span>
                            {isSelected && <Check className="h-4 w-4 shrink-0" strokeWidth={2} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedMember && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-text-primary">
                        Type <span className="font-extrabold text-warning">TRANSFER</span> to confirm
                      </p>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-warning focus:ring-4 focus:ring-warning/12"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="TRANSFER"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setTransferOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-soft transition hover:-translate-y-0.5 active:translate-y-[1px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void executeTransfer()}
                  disabled={!canConfirm}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-warning/25 bg-warning/10 px-5 py-3 text-sm font-bold text-warning shadow-soft transition hover:-translate-y-0.5 hover:bg-warning/15 active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {transferring ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                      Transferring…
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4" strokeWidth={iconStroke} />
                      Transfer ownership
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
        document.body,
      )}
    </>
  );
};
