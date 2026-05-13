import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRightLeft, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { iconStroke } from "../../components/ui";
import { apiErrorMessage, spaceFetch } from "../../lib/api";
import { getInitials } from "../../utils/family";

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export type SpaceMember = {
  id: string;
  userId: string;
  role: string;
  displayName: string | null;
  email: string;
  name: string | null;
  createdAt: string;
};

export const DangerZoneSection = ({
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
        navigate(0 as Parameters<typeof navigate>[0]); // force reload
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
