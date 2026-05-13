import { AuthView } from "@neondatabase/neon-js/auth/react/ui";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  GitBranch,
  LockKeyhole,
  Sparkles,
  Sprout,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { iconStroke, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { getNeonAuthToken } from "../lib/auth";
import {
  AUTH_ERROR_EVENT,
  clearLastAuthError,
  readLastAuthError,
  type AuthToastPayload,
} from "../lib/authErrorBus";

const authPathFrom = (pathname: string) => {
  if (pathname.includes("sign-up")) return "sign-up";
  if (pathname.includes("forgot-password")) return "forgot-password";
  if (pathname.includes("reset-password")) return "reset-password";
  return "sign-in";
};

const authMeta = {
  "sign-in": {
    eyebrow: "private archive access",
    title: "Welcome back to your FamilySpace.",
    description: "Continue preserving family stories, photos, timelines, and relationships.",
    formTitle: "Welcome back",
    formDescription: "Sign in to continue managing your private family archive.",
  },
  "sign-up": {
    eyebrow: "new family workspace",
    title: "Create a private space for your family memories.",
    description:
      "Start a FamilySpace for relatives, stories, photos, timelines, and memories that should not be lost between generations.",
    formTitle: "Create your account",
    formDescription: "Set up private access before inviting relatives into your FamilySpace.",
  },
  "forgot-password": {
    eyebrow: "account recovery",
    title: "Recover your archive access.",
    description: "We'll send instructions to help you return to your private FamilySpace.",
    formTitle: "Reset your password",
    formDescription: "Enter the email connected to your archive account.",
  },
  "reset-password": {
    eyebrow: "new password",
    title: "Set a new password.",
    description: "Choose a new password to protect access to your FamilySpace.",
    formTitle: "Set new password",
    formDescription: "Create a password before returning to your family archive.",
  },
} as const;

const authFeatures = [
  { label: "Family tree records", value: "148 profiles", icon: GitBranch },
  { label: "Family stories in review", value: "37 drafts", icon: BookOpen },
  { label: "Tagged photo memories", value: "624 memories", icon: Camera },
];

const trustNotes = ["Invite-only access", "Role-based editing", "Family-reviewed AI drafts"];

const authViewClassNames = {
  base: "!w-full !max-w-none !gap-0 !rounded-none !border-0 !bg-transparent !py-0 !shadow-none",
  header: "!px-0 !pb-6 !pt-0",
  title: "!font-display !text-3xl !font-bold !leading-tight !text-text-primary sm:!text-4xl",
  description: "!mt-2 !max-w-[46ch] !text-sm !font-medium !leading-6 !text-text-muted",
  content: "!grid !gap-4 !px-0",
  continueWith: "!my-1 !gap-3",
  separator: "!bg-border-soft/82",
  footer:
    "!justify-center !gap-2 !px-0 !pt-6 !text-sm !font-semibold !text-text-muted [&_button]:!font-bold [&_button]:!text-dark-green [&_button]:!transition [&_button]:!duration-500 [&_button]:!ease-[cubic-bezier(0.32,0.72,0,1)] [&_button:hover]:!text-warm-brown",
  footerLink: "!text-dark-green !underline-offset-4 hover:!text-warm-brown",
  form: {
    base: "!grid !w-full !gap-4",
    label: "!text-sm !font-bold !text-text-primary",
    input:
      "!h-11 !rounded-[1rem] !border-border-soft !bg-background/82 !px-4 !text-base !font-semibold !text-text-primary !shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_16px_32px_-30px_rgba(80,54,30,0.7)] !outline-none !transition !duration-500 !ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:!font-medium placeholder:!text-text-muted/58 focus-visible:!border-dark-green focus-visible:!ring-4 focus-visible:!ring-sage-green/14",
    button:
      "!min-h-11 !rounded-[1rem] !text-sm !font-extrabold !shadow-none !transition !duration-500 !ease-[cubic-bezier(0.32,0.72,0,1)] active:!scale-[0.98]",
    primaryButton:
      "!bg-dark-green !text-white !shadow-[0_22px_42px_-30px_rgba(44,80,22,0.95)] hover:!-translate-y-0.5 hover:!bg-warm-brown",
    secondaryButton:
      "!border !border-border-soft !bg-surface !text-text-primary hover:!-translate-y-0.5 hover:!border-sage-green/36 hover:!bg-surface-soft",
    outlineButton:
      "!border !border-border-soft !bg-surface !text-text-primary hover:!-translate-y-0.5 hover:!border-sage-green/36 hover:!bg-surface-soft",
    providerButton:
      "!min-h-11 !rounded-[1rem] !border !border-border-soft/90 !bg-white/88 !font-extrabold !text-text-primary !shadow-[0_18px_40px_-34px_rgba(80,54,30,0.72)] hover:!-translate-y-0.5 hover:!border-sage-green/40 hover:!bg-surface",
    forgotPasswordLink:
      "!text-sm !font-bold !text-dark-green !underline-offset-4 !transition !duration-500 !ease-[cubic-bezier(0.32,0.72,0,1)] hover:!text-warm-brown",
    error: "!text-sm !font-semibold !text-warning",
    icon: "!h-4 !w-4",
  },
};

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authPath = authPathFrom(location.pathname);
  const currentMeta = authMeta[authPath];
  const providerFirstAuthPath = authPath === "sign-in" || authPath === "sign-up";
  const currentAuthViewClassNames = providerFirstAuthPath
    ? {
        ...authViewClassNames,
        content: `${authViewClassNames.content} [&>div:first-child]:!order-3 [&>div:nth-child(2)]:!order-2 [&>div:nth-child(3)]:!order-1`,
      }
    : authViewClassNames;
  const [authToast, setAuthToast] = useState<AuthToastPayload | null>(() => readLastAuthError());

  // Redirect to /app if user already has a valid session (e.g. after OAuth callback)
  useEffect(() => {
    let cancelled = false;
    getNeonAuthToken({ retries: 2, delayMs: 300 }).then((token) => {
      if (!cancelled && token) {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
        navigate(from || "/app", { replace: true });
      }
    });
    return () => { cancelled = true; };
  }, [navigate, location.state]);

  useEffect(() => {
    const handleAuthError = (event: Event) => {
      const detail = (event as CustomEvent<AuthToastPayload>).detail;
      if (detail?.message && detail.kind !== "backend") setAuthToast(detail);
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, []);

  useEffect(() => {
    if (!authToast) return;

    const timeoutId = window.setTimeout(() => {
      clearLastAuthError();
      setAuthToast(null);
    }, 5200);

    return () => window.clearTimeout(timeoutId);
  }, [authToast]);

  return (
    <motion.main
      {...pageTransition}
      className="auth-premium relative isolate min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-16"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_12%_15%,hsl(var(--soft-gold)_/_0.22),transparent_30rem),radial-gradient(circle_at_86%_18%,hsl(var(--sage-green)_/_0.18),transparent_28rem),linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--surface-soft))_54%,hsl(var(--background))_100%)]" />
      <div className="archive-grid absolute inset-0 -z-10 opacity-45 [mask-image:linear-gradient(115deg,rgba(0,0,0,0.82),transparent_78%)]" />
      <div className="absolute -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-soft-gold/18 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-sage-green/14 blur-3xl" />

      <section className="mx-auto grid w-full max-w-[1120px] items-start gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(440px,0.9fr)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 92, damping: 21, delay: 0.05 }}
          className="relative hidden overflow-hidden rounded-[2.1rem] border border-white/70 bg-[linear-gradient(145deg,hsl(var(--dark-green))_0%,hsl(var(--warm-brown))_112%)] p-1.5 shadow-[0_30px_78px_-58px_rgba(80,54,30,0.92)] ring-1 ring-border-soft/70 lg:sticky lg:top-8 lg:block lg:max-h-[calc(100vh-4rem)]"
        >
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[calc(2.1rem-0.375rem)] border border-white/12 bg-text-primary/16 p-5 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] xl:p-6">
            <div className="absolute inset-0 bg-archive-texture opacity-18" />
            <div className="absolute -right-28 -top-24 h-72 w-72 rounded-full bg-soft-gold/24 blur-3xl" />
            <div className="absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-sage-green/24 blur-3xl" />

            <div className="relative z-10 flex items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/13 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] ring-1 ring-white/16">
                  <Sprout className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
                <div>
                  <p className="text-lg font-extrabold tracking-tight">{familyConfig.site.familyName}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/58">
                    private family archive
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-2 text-xs font-bold text-white/76">
                <LockKeyhole className="h-3.5 w-3.5" strokeWidth={iconStroke} />
                Invite-only
              </span>
            </div>

            <div className="relative z-10 mt-7 max-w-[540px] xl:mt-9">
              <p className="mb-3 inline-flex rounded-full border border-white/14 bg-white/10 px-3 py-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-soft-gold">
                PRIVATE FAMILY ARCHIVE
              </p>
<h1 className="max-w-[13ch] font-display text-[clamp(2.25rem,3.5vw,3.5rem)] font-bold leading-[0.95] tracking-tight">
                Preserve the stories behind every name.
              </h1>
              <p className="mt-4 max-w-[56ch] text-sm font-semibold leading-6 text-white/72">
                Build a private FamilySpace for family members, photos, timelines, and memories that should not be lost between generations.
              </p>
            </div>

            <div className="relative z-10 mt-5 rounded-[1.35rem] border border-white/12 bg-white/[0.08] p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] xl:mt-6 xl:p-4">
              <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.18em] text-white/54">
                Example workspace preview
              </p>
              <div className="mt-3 grid gap-1.5 xl:gap-2">
                {authFeatures.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      animate={{ x: [0, index === 1 ? 3 : 2, 0] }}
                      transition={{
                        duration: 5.2 + index * 0.45,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.08] px-3 py-2"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/12 text-soft-gold">
                        <Icon className="h-4 w-4" strokeWidth={iconStroke} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold">{item.value}</p>
                        <p className="truncate text-xs font-semibold text-white/58">{item.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Panel Kanan — form login/register */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 95, damping: 20, delay: 0.1 }}
          // PERBAIKAN: Hapus max-h-[calc(100vh-1.5rem)] overflow-hidden dari sini
          // agar form tidak terpotong. Biarkan konten mengalir secara alami.
          className="mx-auto w-full max-w-[520px]"
        >
          {/* Mobile header — hanya tampil di bawah lg */}
          <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
            <Link className="flex min-w-0 items-center gap-3" to="/">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
                <Sprout className="h-5 w-5" strokeWidth={iconStroke} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-lg font-extrabold text-text-primary">
                  {familyConfig.site.familyName}
                </span>
                <span className="block truncate text-xs font-bold uppercase tracking-[0.16em] text-sage-green">
                  private family archive
                </span>
              </span>
            </Link>
          </div>

          <div className="rounded-[2.25rem] border border-white/80 bg-white/42 p-1.5 shadow-[0_30px_80px_-56px_rgba(80,54,30,0.88)] ring-1 ring-border-soft/70">
            {/* PERBAIKAN: Hapus overflow-hidden dari section agar konten di dalam
                tidak terpotong, khususnya form yang panjang. */}
            <section className="surface-grain relative rounded-[calc(2.25rem-0.375rem)] border border-white/82 bg-surface/94 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.88)] sm:p-5 xl:p-6">
              {/* Tab switcher Sign in / Sign up */}
              <div
                className="relative z-10 mb-5 flex rounded-full border border-border-soft/72 bg-background/78 p-1 text-sm font-extrabold text-text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                role="tablist"
                aria-label="Authentication options"
              >
                {[
                  { label: "Sign in", to: "/auth/sign-in", active: authPath === "sign-in" },
                  { label: "Sign up", to: "/auth/sign-up", active: authPath === "sign-up" },
                ].map((tab) => (
                  <Link
                    key={tab.to}
                    role="tab"
                    aria-selected={tab.active}
                    className={`flex min-h-10 flex-1 items-center justify-center rounded-full px-4 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                      tab.active
                        ? "bg-dark-green text-white shadow-[0_16px_32px_-24px_rgba(44,80,22,0.92)]"
                        : "text-text-muted hover:bg-surface hover:text-dark-green"
                    }`}
                    to={tab.to}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>

              <div className="relative z-10">
                {/* Google OAuth provider must be enabled in Neon Auth for the provider button to appear. */}
                <AuthView
                  path={authPath}
                  socialLayout="vertical"
                  classNames={currentAuthViewClassNames}
                  cardHeader={
                    <div>
                      {/* <p className="mb-3 inline-flex rounded-full border border-sage-green/20 bg-sage-green/10 px-3 py-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.18em] text-dark-green">
                        {currentMeta.eyebrow}
                      </p> */}
                      <h2 className="font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
                        {currentMeta.formTitle}
                      </h2>
                      <p className="mt-2 max-w-[46ch] text-sm font-medium leading-6 text-text-muted">
                        {currentMeta.formDescription}
                      </p>
                    </div>
                  }
                />
              </div>

              <div className="relative z-10 mt-5 flex flex-col gap-3 border-t border-border-soft/72 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full px-4 text-sm font-extrabold text-dark-green transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sage-green/10 hover:text-warm-brown active:scale-[0.98]"
                  to="/"
                >
                  Back to homepage
                  <ArrowRight className="h-4 w-4 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1" strokeWidth={iconStroke} />
                </Link>
                <p className="text-center text-xs font-bold leading-5 text-text-muted sm:text-right">
                  Protected sign-in for invited FamilySpace members.
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </section>

      {/* Toast notifikasi error auth */}
      <AnimatePresence>
        {authToast && (
          <motion.div
            role="alert"
            aria-live="assertive"
            className="fixed right-4 top-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-[1.35rem] border border-warning/25 bg-surface px-4 py-3 text-warning shadow-warm ring-1 ring-white/70 sm:right-6 sm:top-6"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warning/10">
                <AlertTriangle className="h-4 w-4" strokeWidth={iconStroke} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-text-primary">Sign-in problem</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-warning">{authToast.message}</p>
              </div>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning transition hover:bg-warning/15 active:translate-y-[1px]"
                aria-label="Close auth alert"
                onClick={() => {
                  clearLastAuthError();
                  setAuthToast(null);
                }}
              >
                <X className="h-4 w-4" strokeWidth={iconStroke} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}