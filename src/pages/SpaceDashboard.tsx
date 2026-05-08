import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Calendar, Camera, GitBranch, Images, Settings, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { StatsCard } from "../components/dashboard/StatsCard";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";

export const SpaceDashboard = () => {
  const { currentSpace, members, gallery, timeline, summary } = useSpaceStore();

  const generations = useMemo(
    () => summary?.generationsCount ?? new Set(members.map((member) => member.generation)).size,
    [members, summary?.generationsCount],
  );
  const membersCount = summary?.membersCount ?? members.length;
  const timelineCount = summary?.timelineCount ?? timeline.length;
  const galleryCount = summary?.galleryCount ?? gallery.length;
  const storiesCount = summary?.storiesCount ?? 0;

  const quickActions = [
    { title: "Overview", to: ".", icon: BookOpen },
    { title: "Family Tree", to: "tree", icon: GitBranch },
    { title: "Members", to: "members", icon: Users },
    { title: "Timeline", to: "timeline", icon: Calendar },
    { title: "Gallery", to: "gallery", icon: Images },
    { title: "Stories", to: "stories", icon: BookOpen },
    { title: "Settings", to: "settings", icon: Settings },
  ];

  if (!currentSpace) return null;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Dashboard"
          title={currentSpace.name}
          description={currentSpace.description || "Kelola silsilah keluarga, anggota, dan dokumentasi Anda."}
        />

        {membersCount ? (
          <>
            <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
              <StatsCard icon={Users} value={membersCount} title="Members" description="Family records" />
              <StatsCard icon={GitBranch} value={generations} title="Generations" description="Distinct levels" />
              <StatsCard icon={Calendar} value={timelineCount} title="Timeline" description="Manual events" />
              <StatsCard icon={Camera} value={galleryCount} title="Gallery" description="Photo entries" />
              <StatsCard icon={BookOpen} value={storiesCount} title="Stories" description="Narrative drafts" />
            </section>

            <section className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Quick actions</p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {quickActions.map(({ title, to, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-bold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon className="h-4 w-4 shrink-0 text-sage-green" strokeWidth={iconStroke} />
                        <span className="truncate">{title}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-text-muted transition group-hover:translate-x-0.5" strokeWidth={iconStroke} />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Recent activity</p>
                <div className="mt-5 grid gap-3">
                  {[
                    `${membersCount} member records available`,
                    `${timelineCount} timeline events tracked`,
                    `${storiesCount} stories drafted`,
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-border-soft bg-background px-4 py-3 text-sm font-semibold text-text-muted">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
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

              {timelineCount > 0 && (
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

              {galleryCount > 0 && (
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
