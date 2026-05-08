import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Camera, GitBranch, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageShell, SectionHeader, StatCard, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";

export const SpaceDashboard = () => {
  const { currentSpace, members, gallery, timeline } = useSpaceStore();

  const generations = useMemo(() => new Set(members.map((member) => member.generation)).size, [members]);

  if (!currentSpace) return null;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Dashboard"
          title={currentSpace.name}
          description={currentSpace.description || "Kelola silsilah keluarga, anggota, dan dokumentasi Anda."}
        />

        {members.length ? (
          <>
            <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={<Users className="h-5 w-5" strokeWidth={1.8} />} value={String(members.length)} label="Total Anggota" />
              <StatCard icon={<GitBranch className="h-5 w-5" strokeWidth={1.8} />} value={String(generations)} label="Jumlah Generasi" />
              <StatCard icon={<BookOpen className="h-5 w-5" strokeWidth={1.8} />} value={String(timeline.length)} label="Peristiwa Linimasa" />
              <StatCard icon={<Camera className="h-5 w-5" strokeWidth={1.8} />} value={String(gallery.length)} label="Foto Keluarga" />
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border-soft bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-6">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-green/12 text-dark-green">
                  <GitBranch className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Silsilah Keluarga</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Lihat struktur keluarga, relasi antar anggota, dan silsilah dari berbagai perspektif cabang keluarga.</p>
                <Link
                  to="tree"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                >
                  Lihat Silsilah
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>

              <div className="rounded-[1.5rem] border border-border-soft bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-6">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-green/12 text-dark-green">
                  <Users className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Direktori Anggota</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Cari dan lihat profil lengkap setiap anggota keluarga, termasuk status, tempat lahir, dan hubungan keluarga.</p>
                <Link
                  to="members"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                >
                  Lihat Anggota
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>

              {timeline.length > 0 && (
                <div className="rounded-[1.5rem] border border-border-soft bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-6">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-gold/12 text-warm-brown">
                    <BookOpen className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Linimasa Keluarga</h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Jelajahi peristiwa penting dalam sejarah keluarga, dari kelahiran hingga reuni dan momen spesial lainnya.</p>
                  <Link
                    to="timeline"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                  >
                    Lihat Linimasa
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </div>
              )}

              {gallery.length > 0 && (
                <div className="rounded-[1.5rem] border border-border-soft bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-6">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-blue/12 text-text-primary">
                    <Camera className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">Galeri Keluarga</h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-text-muted">Koleksi foto keluarga dari waktu ke waktu, dokumentasi reuni, dan momen berharga yang diabadikan.</p>
                  <Link
                    to="gallery"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
                  >
                    Lihat Galeri
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </Link>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border-soft bg-surface/70 p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-sage-green" strokeWidth={iconStroke} />
            <h3 className="mt-4 text-xl font-bold text-text-primary">Belum ada anggota</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
              Mulai dengan menambahkan anggota keluarga untuk membangun silsilah Anda.
            </p>
          </div>
        )}
      </PageShell>
    </motion.div>
  );
};
