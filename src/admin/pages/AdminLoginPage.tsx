import { motion } from "framer-motion";
import { AlertTriangle, Sprout, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthView } from "@neondatabase/neon-js/auth/react/ui";
import { iconStroke, pageTransition } from "../../components/ui";
import { familyConfig } from "../../config";
import {
  AUTH_ERROR_EVENT,
  clearLastAuthError,
  readLastAuthError,
  type AuthToastPayload,
} from "../../lib/authErrorBus";

const authPathFrom = (pathname: string) => {
  if (pathname.includes("sign-up")) return "sign-up";
  if (pathname.includes("forgot-password")) return "forgot-password";
  if (pathname.includes("reset-password")) return "reset-password";
  return "sign-in";
};

export function AdminLoginPage() {
  const location = useLocation();
  const authPath = authPathFrom(location.pathname);
  const [authError, setAuthError] = useState<AuthToastPayload | null>(() => readLastAuthError());
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const authBaseUrl = import.meta.env.VITE_NEON_AUTH_URL as string | undefined;
  const isInvalidOrigin = authError?.message.toLowerCase().includes("invalid origin");

  const setupHint = useMemo(() => {
    if (!authError) return null;
    if (isInvalidOrigin) {
      return `Tambahkan ${currentOrigin} ke daftar allowed/trusted origins di Neon Auth, lalu refresh halaman ini.`;
    }
    if (!authBaseUrl) {
      return "VITE_NEON_AUTH_URL belum diisi. Set env tersebut, restart dev server, lalu coba lagi.";
    }
    return "Cek konfigurasi Neon Auth dan coba ulang. Detail error asli ditampilkan di atas.";
  }, [authBaseUrl, authError, currentOrigin, isInvalidOrigin]);

  useEffect(() => {
    const handleAuthError = (event: Event) => {
      const detail = (event as CustomEvent<AuthToastPayload>).detail;
      if (detail?.message) setAuthError(detail);
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, []);
  
  return (
    <motion.main
      {...pageTransition}
      className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10"
    >
      <section
        className="surface-grain w-full max-w-md rounded-[2rem] border border-white/75 bg-surface/95 p-6 shadow-warm ring-1 ring-border-soft/70 sm:p-8"
      >
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-dark-green text-white shadow-soft">
            <Sprout className="h-5 w-5" strokeWidth={iconStroke} />
          </span>
          <div>
            <p className="text-xl font-extrabold tracking-tight text-text-primary">Akses Arsip</p>
            <p className="text-sm font-semibold text-text-muted">Keluarga {familyConfig.site.familyName}</p>
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">Masuk ke Sistem</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Masuk dengan akun Neon Auth untuk mengelola silsilah, galeri, dan linimasa.
        </p>

        {authError && (
          <div className="mt-5 rounded-2xl border border-warning/25 bg-warning/10 p-4 text-sm text-warning shadow-soft">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={iconStroke} />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">Auth error: {authError.message}</p>
                {setupHint && <p className="mt-2 leading-6 text-warning/90">{setupHint}</p>}
                {isInvalidOrigin && (
                  <div className="mt-3 rounded-xl border border-warning/20 bg-surface/80 p-3 text-xs font-semibold leading-5 text-text-primary">
                    <p>Current origin:</p>
                    <code className="mt-1 block break-all rounded-lg bg-background px-2 py-1 text-warning">{currentOrigin}</code>
                    {authBaseUrl && (
                      <>
                        <p className="mt-2">Auth URL:</p>
                        <code className="mt-1 block break-all rounded-lg bg-background px-2 py-1 text-warning">{authBaseUrl}</code>
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning transition hover:bg-warning/15"
                aria-label="Tutup pesan error"
                onClick={() => {
                  clearLastAuthError();
                  setAuthError(null);
                }}
              >
                <X className="h-4 w-4" strokeWidth={iconStroke} />
              </button>
            </div>
          </div>
        )}

        <div className="mt-7">
          <AuthView path={authPath} />
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 text-sm font-semibold text-text-muted">
          <Link className="text-dark-green hover:text-warm-brown" to="/auth/sign-in">
            Masuk
          </Link>
          <span>/</span>
          <Link className="text-dark-green hover:text-warm-brown" to="/auth/sign-up">
            Daftar
          </Link>
        </div>
      </section>
    </motion.main>
  );
}
