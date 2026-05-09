import { AuthView } from "@neondatabase/neon-js/auth/react/ui";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Sprout, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { iconStroke, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
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

export function AuthPage() {
  const location = useLocation();
  const authPath = authPathFrom(location.pathname);
  const [authToast, setAuthToast] = useState<AuthToastPayload | null>(() => readLastAuthError());

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
      className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10"
    >
      <section className="surface-grain w-full max-w-md rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-warm ring-1 ring-border-soft/70 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
            <Sprout className="h-5 w-5" strokeWidth={iconStroke} />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-text-primary">Archive access</p>
            <p className="text-sm font-semibold text-text-muted">{familyConfig.site.familyName}</p>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Use Neon Auth to access FamilySpaces and platform operations.
        </p>

        <div className="mt-7">
          <AuthView path={authPath} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 text-sm font-semibold text-text-muted">
          <Link className="text-dark-green hover:text-warm-brown" to="/auth/sign-in">
            Sign in
          </Link>
          <span>/</span>
          <Link className="text-dark-green hover:text-warm-brown" to="/auth/sign-up">
            Sign up
          </Link>
        </div>
        <div className="mt-5 text-sm font-semibold flex items-center justify-center gap-3 text-text-muted"><Link className="text-dark-green hover:text-warm-brown" to="/">Back to homepage</Link></div>
      </section>

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
