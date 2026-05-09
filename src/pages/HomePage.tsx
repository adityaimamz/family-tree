import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Camera, GitBranch, Users } from "lucide-react";
import { EmptyState, PageShell, PrimaryButton, SecondaryButton, StatCard, defaultIcons, pageTransition } from "../components/ui";
import { familyConfig } from "../config";
import { useFamilyStore } from "../hooks/useFamilyStore";

export const HomePage = () => {
  const { gallery, members } = useFamilyStore();
  const generations = new Set(members.map((member) => member.generation)).size;
  const homeMember = members.find((member) => member.id === familyConfig.site.homeMemberId);
  const coreFamilies = homeMember
    ? new Set([
        ...homeMember.childrenIds,
        ...members
          .filter((member) => member.fatherId === homeMember.id || member.motherId === homeMember.id)
          .map((member) => member.id),
      ]).size
    : 0;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <section className="surface-grain relative overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,hsl(var(--surface))_0%,hsl(var(--background))_52%,hsl(var(--surface-soft))_100%)] px-5 py-8 shadow-[0_30px_80px_-50px_rgba(80,54,30,0.85)] ring-1 ring-border-soft/70 sm:px-8 sm:py-10 md:rounded-[2.6rem] lg:px-12 lg:py-14">
          <div className="relative grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="mb-5 text-sm font-extrabold uppercase tracking-[0.18em] text-sage-green">
                {familyConfig.site.homeEyebrow}
              </p>
              <h1 className="max-w-5xl font-display text-5xl font-bold leading-[0.96] text-text-primary sm:text-6xl lg:text-7xl">
                {familyConfig.site.homeTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
                {familyConfig.site.homeDescription}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryButton to="/silsilah">
                  View Family Tree
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </PrimaryButton>
                <SecondaryButton to="/anggota">
                  <Users className="h-4 w-4" strokeWidth={1.8} />
                  View Members
                </SecondaryButton>
              </div>
              <div className="mt-10 max-w-xl border-l border-soft-gold/60 pl-5">
                <p className="text-sm font-semibold leading-7 text-text-muted">
                  {familyConfig.site.homeIntro}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="archive-grid grid grid-flow-dense auto-rows-[7.25rem] grid-cols-4 gap-3 overflow-hidden rounded-[1.8rem] border border-white/80 bg-surface-soft/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_24px_54px_-38px_rgba(80,54,30,0.72)] sm:auto-rows-[8rem] sm:rounded-[2.1rem] sm:p-4">
                <motion.figure
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 90, damping: 20 }}
                  className="group relative col-span-4 row-span-2 overflow-hidden rounded-[1.35rem] border border-white/75 bg-surface shadow-soft sm:col-span-2 sm:row-span-3"
                >
                  <img
                    alt={familyConfig.site.primaryVisual.alt}
                    className="h-full w-full object-cover contrast-105 sepia-[0.18] transition duration-700 group-hover:scale-105"
                    src={familyConfig.site.primaryVisual.image}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(45,36,27,0.58)_100%)]" />
                  <figcaption className="absolute bottom-4 left-4 right-4 text-sm font-bold text-white">
                    {familyConfig.site.primaryVisual.caption}
                  </figcaption>
                </motion.figure>

                {familyConfig.site.heroVisuals.map(({ title, subtitle, image }, index) => (
                  <motion.figure
                    key={title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.06, type: "spring", stiffness: 120, damping: 18 }}
                    className="group relative col-span-2 overflow-hidden rounded-[1.15rem] border border-white/80 bg-surface shadow-soft sm:col-span-1"
                  >
                    <img
                      alt={`Visual ${title}`}
                      className="h-full w-full object-cover contrast-105 sepia-[0.16] transition duration-700 group-hover:scale-105"
                      src={image}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(45,36,27,0.08)_0%,rgba(45,36,27,0.62)_100%)]" />
                    <figcaption className="absolute bottom-3 left-3 right-3">
                      <span className="block truncate text-xs font-extrabold text-white">{title}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-white/80">{subtitle}</span>
                    </figcaption>
                  </motion.figure>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.36, type: "spring", stiffness: 120, damping: 18 }}
                  className="col-span-4 grid place-items-center rounded-[1.15rem] border border-soft-gold/25 bg-surface/92 px-4 text-center shadow-soft sm:col-span-2"
                >
                  <p className="text-sm font-bold leading-6 text-text-primary">
                    Readable archives, ready for family photos.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
        {members.length ? (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Users className="h-5 w-5" strokeWidth={1.8} />} value={String(members.length)} label="Total Members" />
            <StatCard icon={<GitBranch className="h-5 w-5" strokeWidth={1.8} />} value={String(generations)} label="Generations" />
            <StatCard icon={<BookOpen className="h-5 w-5" strokeWidth={1.8} />} value={String(coreFamilies)} label={familyConfig.labels.coreFamily} />
            {familyConfig.features.gallery && <StatCard icon={<Camera className="h-5 w-5" strokeWidth={1.8} />} value={String(gallery.length)} label="Family Photos" />}
          </section>
        ) : (
          <div className="mt-8"><EmptyState title={familyConfig.labels.emptyMembersTitle} description={familyConfig.labels.emptyMembersDescription} /></div>
        )}
        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-[1.5rem] border border-border-soft bg-surface p-5 shadow-soft sm:rounded-[2rem] sm:p-6">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-soft-gold/20 text-warm-brown">{defaultIcons.book}</div>
            <h2 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">A calm archive, not an exhausting list.</h2>
            <p className="mt-3 max-w-3xl text-base leading-8 text-text-muted">{familyConfig.site.treeDescription}</p>
          </div>
          <div className="rounded-[1.5rem] border border-border-soft bg-dark-green p-5 text-white shadow-warm sm:rounded-[2rem] sm:p-6">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-soft-gold">Main focus</p>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">Traceable genealogy per branch.</h2>
            <p className="mt-4 text-sm leading-7 text-white/78">Use branch filters, member search, descendant mode, ancestors, and core family to read large data without feeling overwhelmed.</p>
          </div>
        </section>
      </PageShell>
    </motion.div>
  );
};
