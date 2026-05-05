import { motion } from "framer-motion";
import { CalendarDays, Camera, GitBranch, Plus, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, iconStroke, pageTransition } from "../../components/ui";
import { familyConfig } from "../../config";
import { useFamilyStore } from "../../hooks/useFamilyStore";
import { StatsCard } from "../components/StatsCard";

const quickLinks = [
  { id: "members", title: "Kelola Anggota", to: "/admin/members", icon: Users },
  { id: "gallery", title: "Kelola Galeri", to: "/admin/gallery", icon: Camera },
  { id: "timeline", title: "Kelola Linimasa", to: "/admin/timeline", icon: CalendarDays },
].filter((item) => {
  if (item.id === "gallery") return familyConfig.features.gallery;
  if (item.id === "timeline") return familyConfig.features.timeline;
  return true;
});

export function AdminDashboardPage() {
  const { members, gallery, timeline } = useFamilyStore();
  const generations = new Set(members.map((member) => member.generation)).size;
  const recentTimeline = timeline.slice(-4).reverse();

  const stats = [
    { id: "members", title: "Total Anggota", value: members.length, description: "Data anggota keluarga tersimpan", icon: Users },
    { id: "gallery", title: "Item Galeri", value: gallery.length, description: "Foto dan arsip visual", icon: Camera },
    { id: "timeline", title: "Event Linimasa", value: timeline.length, description: "Peristiwa manual dari admin", icon: CalendarDays },
    { id: "generations", title: "Generasi", value: generations, description: "Rentang generasi keluarga", icon: GitBranch },
  ].filter((item) => {
    if (item.id === "gallery") return familyConfig.features.gallery;
    if (item.id === "timeline") return familyConfig.features.timeline;
    return true;
  });

  return (
    <motion.div {...pageTransition}>
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-dark-green">Ruang kerja arsip</p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl md:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-[72ch] text-sm leading-7 text-text-muted sm:text-base">
            Ringkasan data keluarga yang tersambung ke backend dan database.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            to="/admin/members"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-dark-green px-5 py-3 text-sm font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-warm-brown active:translate-y-[1px]"
          >
            <Plus className="h-4 w-4" strokeWidth={iconStroke} />
            Tambah Anggota
          </Link>
          {familyConfig.features.timeline && (
            <Link
              to="/admin/timeline"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border-soft bg-surface px-5 py-3 text-sm font-semibold text-text-primary shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft active:translate-y-[1px]"
            >
              <Sparkles className="h-4 w-4" strokeWidth={iconStroke} />
              Kelola Linimasa
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {familyConfig.features.timeline && (
          <section className="surface-grain relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-surface/96 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">Event Terbaru</h2>
              <Badge tone="sage">{recentTimeline.length} event</Badge>
            </div>
            <ul className="mt-4 grid gap-3">
              {recentTimeline.length ? (
                recentTimeline.map((item) => (
                  <li key={item.id} className="rounded-[1.35rem] border border-border-soft bg-background/55 p-4 shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-text-muted">{item.description}</p>
                      </div>
                      <Badge tone="gold">{item.year}</Badge>
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-[1.35rem] border border-dashed border-border-soft bg-background/55 p-4 text-sm font-semibold text-text-muted">
                  Belum ada event linimasa manual.
                </li>
              )}
            </ul>
          </section>
        )}

        <section className="surface-grain relative overflow-hidden rounded-[1.8rem] border border-white/75 bg-surface/96 p-5 shadow-soft ring-1 ring-border-soft/60 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-text-primary">Akses Cepat</h2>
            <Badge tone="brown">CRUD aktif</Badge>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link
                key={link.id}
                to={link.to}
                className="group flex items-center gap-3 rounded-[1.35rem] border border-border-soft bg-background/55 p-4 shadow-soft transition hover:-translate-y-0.5 hover:bg-surface-soft"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-soft-gold/16 text-warm-brown transition group-hover:bg-dark-green group-hover:text-white">
                  <link.icon className="h-5 w-5" strokeWidth={iconStroke} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-text-primary">{link.title}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-text-muted">Buka halaman</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
