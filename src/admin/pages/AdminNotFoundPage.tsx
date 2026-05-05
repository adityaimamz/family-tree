import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { EmptyState, pageTransition } from "../../components/ui";

export function AdminNotFoundPage() {
  return (
    <motion.div {...pageTransition}>
      <EmptyState
        title="Halaman admin tidak ditemukan"
        description="Route admin ini belum dibuat. Gunakan menu di sidebar untuk kembali."
      />

      <div className="mt-5">
        <Link
          to="/admin"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border-soft bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-soft transition hover:bg-surface-soft"
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </motion.div>
  );
}