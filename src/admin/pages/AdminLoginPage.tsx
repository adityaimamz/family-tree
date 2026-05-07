import { motion } from "framer-motion";
import { Sprout } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { AuthView } from "@neondatabase/neon-js/auth/react/ui";
import { iconStroke, pageTransition } from "../../components/ui";
import { familyConfig } from "../../config";

const authPathFrom = (pathname: string) => {
  if (pathname.includes("sign-up")) return "sign-up";
  if (pathname.includes("forgot-password")) return "forgot-password";
  if (pathname.includes("reset-password")) return "reset-password";
  return "sign-in";
};

export function AdminLoginPage() {
  const location = useLocation();
  const authPath = authPathFrom(location.pathname);
  
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
