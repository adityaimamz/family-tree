import { motion } from "framer-motion";
import { Loader2, ShieldCheck, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog, iconStroke } from "../../components/ui";
import { apiErrorMessage, spaceFetch } from "../../lib/api";
import { getInitials } from "../../utils/family";

const PREMIUM_EASE = [0.32, 0.72, 0, 1] as const;

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export type MembershipEntry = {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
  displayName: string | null;
  email: string;
  name: string | null;
  createdAt: string;
};

export const MembersAccessPanel = ({
  spaceSlug,
  currentRole,
  onToast,
}: {
  spaceSlug: string;
  currentRole: "owner" | "admin" | "member";
  onToast: (message: string, tone?: "success" | "warning" | "info" | "error") => void;
}) => {
  const [members, setMembers] = useState<MembershipEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const response = await spaceFetch(spaceSlug, "/memberships");
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to load members"));
      }
      const data = (await response.json()) as { memberships: MembershipEntry[] };
      setMembers(data.memberships ?? []);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load members");
    } finally {
      setIsLoading(false);
    }
  }, [spaceSlug]);

  useEffect(() => {
    setIsLoading(true);
    void loadMembers();
  }, [loadMembers]);

  const changeRole = async (membershipId: string, newRole: "admin" | "member") => {
    setChangingRoleId(membershipId);
    try {
      const response = await spaceFetch(spaceSlug, `/memberships/${membershipId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to update role"));
      }
      const data = (await response.json()) as { membership: MembershipEntry };
      setMembers((current) =>
        current.map((m) => (m.id === membershipId ? data.membership : m)),
      );
      onToast(`Role updated to ${roleLabel(newRole)}`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to update role", "error");
    } finally {
      setChangingRoleId(null);
    }
  };

  const removeMember = async (membershipId: string) => {
    setRemovingId(membershipId);
    try {
      const response = await spaceFetch(spaceSlug, `/memberships/${membershipId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Failed to remove member"));
      }
      setMembers((current) => current.filter((m) => m.id !== membershipId));
      onToast("Member removed from this space", "warning");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Failed to remove member", "error");
    } finally {
      setRemovingId(null);
      setConfirmRemoveId(null);
    }
  };

  const canChangeRole = (target: MembershipEntry) =>
    currentRole === "owner" && target.role !== "owner";

  const canRemove = (target: MembershipEntry) => {
    if (target.role === "owner") return false;
    if (currentRole === "owner") return true;
    if (currentRole === "admin" && target.role === "member") return true;
    return false;
  };

  const isOwner = currentRole === "owner";

  return (
    <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sage-green/25 bg-sage-green/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-dark-green">
          <ShieldCheck className="h-3 w-3" strokeWidth={iconStroke} />
          Access control
        </span>
        <h2 className="font-display text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
          Family members in this space.
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          {isOwner
            ? "Manage roles and remove members. Owners can promote or demote anyone except themselves."
            : "View who has access to this archive. You can remove members with the Member role."}
        </p>
      </div>

      {/* Body */}
      {loadError && (
        <div className="mb-4 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3">
          {["s1", "s2", "s3"].map((key) => (
            <div key={key} className="animate-pulse rounded-[1.3rem] border border-border-soft bg-background p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-surface-soft" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded-full bg-surface-soft" />
                  <div className="mt-2 h-3 w-48 rounded-full bg-surface-soft" />
                </div>
              </div>
            </div>
          ))}
          <span className="sr-only">Loading members…</span>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-soft bg-background/70 p-6 text-center">
          <Users className="mx-auto h-8 w-8 text-sage-green" strokeWidth={iconStroke} />
          <p className="mt-3 text-sm font-semibold text-text-muted">No members found.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {members.map((member) => {
            const label = member.displayName || member.name || member.email;
            const initials = getInitials(label).toUpperCase();
            const isChanging = changingRoleId === member.id;
            const isRemoving = removingId === member.id;

            return (
              <motion.div
                key={member.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: PREMIUM_EASE }}
                className="flex flex-wrap items-center gap-3 rounded-[1.3rem] border border-border-soft bg-background/82 p-4 shadow-soft sm:flex-nowrap"
              >
                {/* Avatar */}
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-dark-green text-sm font-extrabold text-white shadow-soft">
                  {initials}
                </span>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-text-primary">{label}</p>
                  <p className="truncate text-xs font-semibold text-text-muted">{member.email}</p>
                </div>

                {/* Role badge / selector */}
                <div className="flex items-center gap-2">
                  {canChangeRole(member) ? (
                    <select
                      value={member.role}
                      disabled={isChanging}
                      onChange={(e) => {
                        const newRole = e.target.value as "admin" | "member";
                        if (newRole !== member.role) void changeRole(member.id, newRole);
                      }}
                      className="min-h-9 cursor-pointer rounded-full border border-sage-green/25 bg-sage-green/10 px-3 py-1 text-xs font-extrabold text-dark-green shadow-soft outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-dark-green focus:ring-2 focus:ring-sage-green/20 disabled:cursor-wait disabled:opacity-60"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold ${
                        member.role === "owner"
                          ? "border-soft-gold/30 bg-soft-gold/14 text-warm-brown"
                          : member.role === "admin"
                            ? "border-sage-green/25 bg-sage-green/10 text-dark-green"
                            : "border-border-soft bg-surface-soft text-text-muted"
                      }`}
                    >
                      {roleLabel(member.role)}
                    </span>
                  )}

                  {/* Remove button */}
                  {canRemove(member) && (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(member.id)}
                      disabled={isRemoving}
                      className="grid h-9 w-9 place-items-center rounded-full border border-warning/20 bg-warning/8 text-warning shadow-soft transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warning/15 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-50"
                      title="Remove from space"
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={iconStroke} />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={iconStroke} />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        title="Remove this member?"
        description="They will lose access to this FamilySpace immediately. They can rejoin later if they have a valid invite code."
        onCancel={() => setConfirmRemoveId(null)}
        onConfirm={() => {
          if (confirmRemoveId) void removeMember(confirmRemoveId);
        }}
      />
    </section>
  );
};
