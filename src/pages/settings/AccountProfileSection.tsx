import { Camera, Save, Trash2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Badge, iconStroke } from "../../components/ui";
import { authFetch } from "../../lib/api";
import { getInitials } from "../../utils/family";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 disabled:cursor-not-allowed disabled:opacity-70";

const acceptedAvatarTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAvatarBytes = 4 * 1024 * 1024;

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export type AccountProfileSectionProps = {
  currentSpace: { name: string };
  membership: { role: string; displayName?: string | null; avatarUrl?: string | null };
  currentUser: { name?: string | null; email?: string | null } | null;
  updateMembershipProfile: (data: { displayName?: string | null; avatarUrl?: string | null }) => Promise<unknown>;
  addToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
};

export const AccountProfileSection = ({
  currentSpace,
  membership,
  currentUser,
  updateMembershipProfile,
  addToast: _addToast,
}: AccountProfileSectionProps) => {
  const avatarInputId = useId();
  const [accountForm, setAccountForm] = useState({
    displayName: membership?.displayName ?? "",
    avatarUrl: membership?.avatarUrl ?? "",
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const previewName = useMemo(
    () => accountForm.displayName.trim() || currentUser?.name || currentUser?.email || "Family user",
    [accountForm.displayName, currentUser],
  );
  const previewInitials = useMemo(() => getInitials(previewName).toUpperCase(), [previewName]);

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

  return (
    <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-text-primary">Your account in this space</h2>
          <p className="mt-1 text-sm font-semibold text-text-muted">
            This display name and avatar only apply inside {currentSpace.name}.
          </p>
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
  );
};
