import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { iconStroke, pageTransition } from "../components/ui";
import { apiErrorMessage, authFetch } from "../lib/api";

const PREMIUM_EASE = [0.32, 0.72, 0, 1] as const;

type InvitePreview = {
  isValid: boolean;
  invalidReason: "revoked" | "expired" | "full" | "not_found" | null;
  spaceName: string | null;
  spaceDescription: string | null;
  spaceSlug?: string;
  inviteRole: "owner" | "admin" | "member" | null;
  alreadyMember?: boolean;
  existingRole?: "owner" | "admin" | "member" | null;
};

type JoinResult = {
  alreadyMember: boolean;
  space: { slug: string; name: string };
  membership: { role: "owner" | "admin" | "member" };
};

const invalidReasonCopy = (reason: InvitePreview["invalidReason"]) => {
  switch (reason) {
    case "revoked":
      return {
        title: "Invite revoked",
        body: "The steward of this archive has taken this invite out of circulation. Ask them for a new one.",
      };
    case "expired":
      return {
        title: "Invite expired",
        body: "This link is past its window. Reach out to the person who sent it to request a fresh invite.",
      };
    case "full":
      return {
        title: "Invite full",
        body: "This invite has reached the maximum number of people who can use it. A new one is needed.",
      };
    case "not_found":
    default:
      return {
        title: "Invite not found",
        body: "Double-check the code, or ask the person who invited you to resend it. Codes are case-insensitive.",
      };
  }
};

/** Formats raw input into the human-friendly `XXXX-XXXX` shape. */
const formatInviteCode = (raw: string) => {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8);
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
};

const roleCopy = (role: InvitePreview["inviteRole"]) => {
  if (role === "owner") return "Owner access";
  if (role === "admin") return "Admin access";
  return "Member access";
};

export const JoinSpacePage = () => {
  const { code: codeParam } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const incomingCode = useMemo(() => {
    const raw = codeParam ?? searchParams.get("code") ?? "";
    return raw ? formatInviteCode(raw) : "";
  }, [codeParam, searchParams]);

  const [codeInput, setCodeInput] = useState(incomingCode);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<
    { status: "idle" }
    | { status: "joining" }
    | { status: "success"; result: JoinResult }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const autoLookupRef = useRef<string | null>(null);

  const runPreview = useCallback(async (rawCode: string) => {
    const formatted = formatInviteCode(rawCode);
    const stripped = formatted.replace("-", "");
    if (stripped.length !== 8) {
      setPreviewError("Invite codes look like XXXX-XXXX — eight characters with a dash.");
      setPreview(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setJoinState({ status: "idle" });

    try {
      const response = await authFetch(`/api/invites/${encodeURIComponent(formatted)}/preview`);
      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Could not look up this invite."));
      }
      const data = (await response.json()) as InvitePreview;
      setPreview(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not look up this invite.";
      setPreviewError(message);
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Deep-link auto-lookup when a code is present in the URL
  useEffect(() => {
    if (!incomingCode) return;
    if (autoLookupRef.current === incomingCode) return;
    autoLookupRef.current = incomingCode;
    setCodeInput(incomingCode);
    void runPreview(incomingCode);
  }, [incomingCode, runPreview]);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInviteCode(event.target.value);
    setCodeInput(formatted);
    if (preview || previewError) {
      setPreview(null);
      setPreviewError(null);
    }
    if (joinState.status !== "idle") setJoinState({ status: "idle" });
  };

  const onLookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runPreview(codeInput);
  };

  const onJoin = async () => {
    if (!preview?.isValid) return;
    setJoinState({ status: "joining" });
    try {
      const response = await authFetch("/api/invites/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      });

      if (!response.ok) {
        throw new Error(await apiErrorMessage(response, "Could not join this FamilySpace."));
      }

      const data = (await response.json()) as JoinResult;
      setJoinState({ status: "success", result: data });

      // Auto-redirect into the space after a short confirmation beat
      window.setTimeout(() => {
        navigate(`/app/${data.space.slug}`);
      }, 1100);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not join this FamilySpace.";
      setJoinState({ status: "error", message });
    }
  };

  const hasPreview = Boolean(preview);
  const isJoining = joinState.status === "joining";
  const joinedSpace = joinState.status === "success" ? joinState.result : null;

  return (
    <motion.div {...pageTransition} className="relative min-h-[100dvh] overflow-hidden bg-background">
      {/* Fixed noise texture (per skill: grain only on fixed, pointer-events-none layer) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--warm-brown)) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Ambient editorial glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-32 h-[420px] w-[420px] rounded-full bg-sage-green/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-0 h-[380px] w-[380px] rounded-full bg-soft-gold/25 blur-[120px]"
      />

      <div className="relative z-[2] mx-auto w-full max-w-[1300px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-10 lg:pt-20">
        {/* Top bar: back to archive list */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: PREMIUM_EASE }}
          className="mb-14 flex items-center justify-between gap-4 sm:mb-20"
        >
          <Link
            to="/app"
            className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-border-soft/70 bg-surface/70 px-4 py-1.5 text-sm font-bold text-text-primary shadow-soft backdrop-blur transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-surface active:translate-y-[1px]"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-sage-green/12 text-dark-green transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-dark-green group-hover:text-white">
              <ArrowUpRight className="h-3.5 w-3.5 -rotate-[135deg]" strokeWidth={iconStroke} />
            </span>
            My FamilySpaces
          </Link>
          <span className="hidden items-center gap-2 rounded-full border border-border-soft/60 bg-surface/70 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-text-muted shadow-soft backdrop-blur sm:inline-flex">
            <Lock className="h-3 w-3 text-sage-green" strokeWidth={iconStroke} />
            Encrypted private archive
          </span>
        </motion.div>

        {/* Editorial Split: massive typography left, interactive card right */}
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-12 lg:gap-16 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* LEFT — Editorial block */}
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: PREMIUM_EASE }}
            className="flex flex-col justify-center"
          >
            <span className="mb-5 inline-flex w-max items-center gap-2 rounded-full border border-sage-green/30 bg-sage-green/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-dark-green">
              <Sparkles className="h-3 w-3" strokeWidth={iconStroke} />
              Step into a private archive
            </span>
            <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.94] tracking-tight text-text-primary">
              Join the
              <br />
              <span className="italic text-warm-brown">family</span> you were
              <br />
              invited to.
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-[1.7] text-text-muted sm:text-lg">
              Every FamilySpace holds a private archive — the tree, timeline, photos, and memories
              of a single family. Paste the invite code you were given, or open the link that was
              shared with you.
            </p>

            {/* Trust strip */}
            <ul className="mt-9 grid gap-3 text-sm font-semibold text-text-muted sm:max-w-md">
              {[
                {
                  icon: ShieldCheck,
                  title: "Private by default",
                  body: "Only the people who hold an invite can see the archive.",
                },
                {
                  icon: Users,
                  title: "Member access",
                  body: "You can browse the tree, stories, and help complete context.",
                },
                {
                  icon: KeyRound,
                  title: "Reversible",
                  body: "Stewards of the archive can revoke your invite at any time.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-2xl border border-border-soft/70 bg-surface/70 p-4 shadow-soft backdrop-blur"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-green/12 text-dark-green">
                    <Icon className="h-4 w-4" strokeWidth={iconStroke} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-text-primary">{title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* RIGHT — Interactive double-bezel card */}
          <motion.aside
            initial={{ opacity: 0, y: 32, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.15, ease: PREMIUM_EASE }}
            className="md:sticky md:top-10"
          >
            {/* Outer shell of the double-bezel */}
            <div className="relative rounded-[2rem] border border-white/75 bg-[hsl(var(--warm-brown)/0.06)] p-2 shadow-[0_50px_120px_-60px_rgba(80,54,30,0.5)] ring-1 ring-border-soft/50">
              <div
                className="relative overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[linear-gradient(155deg,hsl(var(--surface))_0%,hsl(var(--surface))_55%,hsl(var(--surface-soft)/0.75)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-8"
              >
                {/* Hairline top accent (editorial ribbon) */}
                <div className="pointer-events-none absolute inset-x-8 top-0 h-[2px] rounded-full bg-[linear-gradient(90deg,transparent,hsl(var(--soft-gold)),hsl(var(--sage-green)),transparent)] opacity-80" />

                {joinedSpace ? (
                  <JoinSuccessCard result={joinedSpace} />
                ) : (
                  <>
                    {/* Form: manual code input */}
                    <form onSubmit={onLookup} noValidate>
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-green">
                        Invite code
                      </p>
                      <label htmlFor="invite-code" className="sr-only">
                        Invite code
                      </label>
                      <div className="group relative">
                        <input
                          id="invite-code"
                          autoComplete="off"
                          spellCheck={false}
                          placeholder="XXXX-XXXX"
                          value={codeInput}
                          onChange={onInputChange}
                          disabled={isJoining}
                          className="w-full rounded-[1.25rem] border border-border-soft bg-background px-5 py-4 text-center font-display text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-[0.28em] text-text-primary shadow-[inset_0_2px_6px_-4px_rgba(80,54,30,0.25)] outline-none transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-text-muted/40 placeholder:tracking-[0.2em] focus:border-dark-green focus:ring-4 focus:ring-sage-green/15 disabled:opacity-60"
                        />
                        <div className="pointer-events-none absolute inset-x-6 bottom-2 h-px bg-gradient-to-r from-transparent via-sage-green/40 to-transparent opacity-0 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-focus-within:opacity-100" />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <p className="text-xs font-semibold leading-5 text-text-muted">
                          Paste the code or open the invite link you received. Codes ignore case,
                          dashes optional.
                        </p>
                        <button
                          type="submit"
                          disabled={previewLoading || isJoining || codeInput.length === 0}
                          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-dark-green pl-6 pr-2 py-2 text-sm font-extrabold text-white shadow-warm transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span>{previewLoading ? "Checking…" : "Look up"}</span>
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-[1.05] group-hover:bg-white/25">
                            {previewLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={iconStroke} />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" strokeWidth={iconStroke} />
                            )}
                          </span>
                        </button>
                      </div>
                    </form>

                    {previewError && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: PREMIUM_EASE }}
                        className="mt-5 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning"
                      >
                        {previewError}
                      </motion.div>
                    )}

                    {hasPreview && preview && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.6, ease: PREMIUM_EASE }}
                        className="mt-6"
                      >
                        {preview.alreadyMember && preview.spaceSlug ? (
                          <AlreadyMemberCard
                            spaceName={preview.spaceName ?? "your FamilySpace"}
                            spaceSlug={preview.spaceSlug}
                            existingRole={preview.existingRole ?? null}
                          />
                        ) : preview.isValid ? (
                          <InvitePreviewCard
                            preview={preview}
                            onJoin={onJoin}
                            isJoining={isJoining}
                            joinError={joinState.status === "error" ? joinState.message : null}
                          />
                        ) : (
                          <InviteInvalidCard reason={preview.invalidReason} />
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="mt-5 text-center text-xs font-semibold text-text-muted">
              Need an invite? Ask a relative to open <span className="text-text-primary">Settings → Invites</span> inside their archive.
            </p>
          </motion.aside>
        </div>
      </div>
    </motion.div>
  );
};

// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------

const roleLabelShort = (role: "owner" | "admin" | "member" | null) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  if (role === "member") return "Member";
  return null;
};

const AlreadyMemberCard = ({
  spaceName,
  spaceSlug,
  existingRole,
}: {
  spaceName: string;
  spaceSlug: string;
  existingRole: "owner" | "admin" | "member" | null;
}) => {
  const navigate = useNavigate();
  const spaceInitial = spaceName.slice(0, 1).toUpperCase();
  const role = roleLabelShort(existingRole);

  return (
    <div className="rounded-[1.5rem] border border-sage-green/20 bg-[linear-gradient(160deg,hsl(var(--sage-green)/0.12)_0%,hsl(var(--surface))_55%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/70 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-dark-green font-display text-xl font-bold text-white shadow-warm ring-1 ring-white/80">
          {spaceInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage-green">
            You are already inside
          </p>
          <h2 className="mt-1 break-words font-display text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
            {spaceName}
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {existingRole === "owner"
              ? "This is your own FamilySpace — you cannot join using an invite from this archive. You already have full access."
              : "You already have access to this archive, so no need to use the invite again. Open it to pick up where you left off."}
          </p>
        </div>
      </div>

      {role && (
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-green/25 bg-sage-green/10 px-3 py-1 text-xs font-bold text-dark-green">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={iconStroke} />
            {role} access
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-background px-3 py-1 text-xs font-bold text-text-muted">
            <Check className="h-3.5 w-3.5 text-sage-green" strokeWidth={iconStroke} />
            Membership active
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate(`/app/${spaceSlug}`)}
        className="group mt-6 inline-flex min-h-14 w-full items-center justify-between gap-3 rounded-full bg-dark-green pl-6 pr-2 py-2 text-base font-extrabold text-white shadow-warm transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98]"
      >
        <span>Open {spaceName}</span>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-[1.05] group-hover:bg-white/25">
          <ArrowUpRight className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
      </button>
    </div>
  );
};

const InvitePreviewCard = ({
  preview,
  onJoin,
  isJoining,
  joinError,
}: {
  preview: InvitePreview;
  onJoin: () => void;
  isJoining: boolean;
  joinError: string | null;
}) => {
  const spaceInitial = (preview.spaceName ?? "F").slice(0, 1).toUpperCase();

  return (
    <div className="rounded-[1.5rem] border border-sage-green/20 bg-[linear-gradient(160deg,hsl(var(--sage-green)/0.12)_0%,hsl(var(--surface))_55%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-white/70 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-dark-green font-display text-xl font-bold text-white shadow-warm ring-1 ring-white/80">
          {spaceInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sage-green">
            You have been invited to
          </p>
          <h2 className="mt-1 break-words font-display text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
            {preview.spaceName}
          </h2>
          {preview.spaceDescription && (
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-text-muted">
              {preview.spaceDescription}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-green/25 bg-sage-green/10 px-3 py-1 text-xs font-bold text-dark-green">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={iconStroke} />
          {roleCopy(preview.inviteRole)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-soft-gold/30 bg-soft-gold/12 px-3 py-1 text-xs font-bold text-warm-brown">
          <Lock className="h-3.5 w-3.5" strokeWidth={iconStroke} />
          Private archive
        </span>
      </div>

      <button
        type="button"
        onClick={onJoin}
        disabled={isJoining}
        className="group mt-6 inline-flex min-h-14 w-full items-center justify-between gap-3 rounded-full bg-dark-green pl-6 pr-2 py-2 text-base font-extrabold text-white shadow-warm transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-65"
      >
        <span>{isJoining ? "Joining archive…" : `Join ${preview.spaceName ?? "FamilySpace"}`}</span>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-[1.05] group-hover:bg-white/25">
          {isJoining ? (
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={iconStroke} />
          ) : (
            <ArrowUpRight className="h-5 w-5" strokeWidth={iconStroke} />
          )}
        </span>
      </button>

      {joinError && (
        <p className="mt-4 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
          {joinError}
        </p>
      )}
    </div>
  );
};

const InviteInvalidCard = ({ reason }: { reason: InvitePreview["invalidReason"] }) => {
  const copy = invalidReasonCopy(reason);
  return (
    <div className="rounded-[1.5rem] border border-warning/25 bg-warning/10 p-6 ring-1 ring-white/70">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning/15 text-warning ring-1 ring-white/70">
          <X className="h-5 w-5" strokeWidth={iconStroke} />
        </span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-warning">
            Invite unavailable
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-text-primary">
            {copy.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-text-muted">{copy.body}</p>
        </div>
      </div>
    </div>
  );
};

const JoinSuccessCard = ({ result }: { result: JoinResult }) => (
  <div className="py-4 text-center">
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 18 }}
      className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-dark-green text-white shadow-warm ring-1 ring-white/70"
    >
      <Check className="h-7 w-7" strokeWidth={2} />
    </motion.div>
    <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-sage-green">
      {result.alreadyMember ? "Welcome back" : "Welcome in"}
    </p>
    <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-text-primary">
      {result.space.name}
    </h2>
    <p className="mt-3 text-sm leading-6 text-text-muted">
      {result.alreadyMember
        ? "You were already a member of this archive. Taking you there now."
        : "Your membership has been activated. Taking you to the archive now."}
    </p>
    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border-soft/70 bg-surface/70 px-4 py-2 text-xs font-bold text-text-muted shadow-soft">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-sage-green" strokeWidth={iconStroke} />
      Preparing the archive for you
    </div>
  </div>
);

export default JoinSpacePage;
