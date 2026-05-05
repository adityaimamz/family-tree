import { motion } from "framer-motion";
import { LockKeyhole, Sprout } from "lucide-react";
import { useState, type FormEvent } from "react";
import { iconStroke, pageTransition } from "../../components/ui";
import { familyConfig } from "../../config";
import { useAdminAuth } from "../hooks/useAdminAuth";

export function AdminLoginPage({ onAuthenticated }: { onAuthenticated?: () => void }) {
  const { login } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!login(password)) {
      setError("Password admin tidak sesuai.");
      return;
    }

    onAuthenticated?.();
  };

  return (
    <motion.main
      {...pageTransition}
      className="grid min-h-[100dvh] place-items-center bg-background px-4 py-10"
    >
      <form
        onSubmit={handleSubmit}
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
          Silakan masukkan password untuk mengakses silsilah, galeri, dan pengelolaan data.
        </p>

        <label className="mt-7 block">
          <span className="mb-2 block text-sm font-semibold text-text-primary">Password</span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" strokeWidth={iconStroke} />
            <input
              autoFocus
              className="min-h-12 w-full rounded-2xl border border-border-soft bg-background py-3 pl-12 pr-4 text-base font-semibold text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
            />
          </div>
        </label>

        {error && (
          <p className="mt-3 rounded-2xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
            {error}
          </p>
        )}

        <button
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
          type="submit"
        >
          Masuk
        </button>
      </form>
    </motion.main>
  );
}
