import { motion } from "framer-motion";
import { AlertTriangle, Camera, Lock, Save, Settings, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Badge, PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { authFetch } from "../lib/api";
import { getInitials } from "../utils/family";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 disabled:cursor-not-allowed disabled:opacity-70";

const acceptedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarBytes = 4 * 1024 * 1024;

type SettingsTab = "account" | "space";

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export const SpaceSettingsPage = () => {
  const { currentSpace, membership, currentUser, canEdit, updateSpace, updateMembershipProfile } = useSpaceStore();
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
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition active:translate-y-[1px] ${
      activeTab === tab
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
          <button type="button" className={tabClass("space")} onClick={() => setActiveTab("space")}>
            <Settings className="h-4 w-4" strokeWidth={iconStroke} />
            FamilySpace
          </button>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {activeTab === "account" ? (
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
          ) : (
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

            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <Users className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Invite & role management</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                Invite links, role changes, and member removal are coming in a later sprint.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 min-h-11 rounded-2xl border border-border-soft bg-surface-soft px-4 py-3 text-sm font-bold text-text-muted opacity-70"
              >
                Coming soon
              </button>
            </section>

            <section className="rounded-[1.6rem] border border-warning/20 bg-warning/10 p-5 shadow-soft ring-1 ring-border-soft/60">
              <AlertTriangle className="h-5 w-5 text-warning" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Danger zone</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                Ownership transfer and archive deletion are intentionally disabled for this sprint.
              </p>
              <div className="mt-4 grid gap-2">
                <button type="button" disabled className="min-h-11 rounded-2xl border border-warning/20 bg-surface px-4 py-3 text-sm font-bold text-text-muted opacity-70">
                  Transfer ownership
                </button>
                <button type="button" disabled className="min-h-11 rounded-2xl border border-warning/20 bg-surface px-4 py-3 text-sm font-bold text-warning opacity-60">
                  Delete space
                </button>
              </div>
            </section>
          </aside>
        </div>
      </PageShell>
    </motion.div>
  );
};
