import { motion } from "framer-motion";
import { Check, LockKeyhole, ShieldCheck, SlidersHorizontal, UserRoundPlus, Users } from "lucide-react";
import { features } from "../lib/data/sections";

const featureIcons = [LockKeyhole, SlidersHorizontal, UserRoundPlus, ShieldCheck];

const members = [
  { initials: "AR", name: "Aditya Rahman", email: "aditya@rahman.family", role: "Owner", tone: "bg-primary text-surface" },
  { initials: "SR", name: "Siti Rahman", email: "siti@rahman.family", role: "Admin", tone: "bg-sage text-surface" },
  { initials: "LN", name: "Laila Noor", email: "laila@rahman.family", role: "Member", tone: "bg-bg-alt text-primary" },
];

const activity = [
  "Invite approved for Laila Noor",
  "Biography draft moved to family review",
  "Photo album permissions updated",
];

export default function FamilySpaceSection() {
  return (
    <section id="family-space" className="relative overflow-hidden bg-bg py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--surface-soft)),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(500px,1fr)] lg:items-start lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="lg:sticky lg:top-28"
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            One protected workspace for the people who actually carry the family memory forward.
          </p>
          <h2 className="mt-5 max-w-[680px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Invite relatives, set roles, keep the archive private.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            Every family space starts closed. Owners decide who can view, contribute, review AI drafts, or organize the
            records that should stay inside the family.
          </p>

          <div className="mt-10 grid gap-4">
            {features.map((feature, index) => {
              const Icon = featureIcons[index] ?? Check;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -18 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.08, duration: 0.48 }}
                  className="group grid grid-cols-[44px_minmax(0,1fr)] gap-4 rounded-[1.35rem] border border-transparent p-3 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-stroke hover:bg-surface/70"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-muted text-primary transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-primary group-hover:text-surface">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-ink">{feature.title}</span>
                    <span className="mt-1 block max-w-[52ch] text-sm leading-6 text-ink-secondary">{feature.desc}</span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="mx-auto grid w-full max-w-[680px] gap-4 lg:mx-0">
          <motion.div
            initial={{ opacity: 0, y: 38, rotate: -1.2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
            className="rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50"
          >
            <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
              <div className="flex flex-col gap-4 border-b border-stroke bg-bg-alt/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xl font-semibold text-ink">Rahman Family</p>
                  <p className="mt-1 text-sm font-medium text-ink-muted">Private workspace with 12 invited relatives</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-xs font-semibold text-surface">
                  <LockKeyhole className="h-4 w-4" strokeWidth={1.8} />
                  Invite only
                </span>
              </div>

              <div className="p-5">
                <div className="grid gap-3">
                  {members.map((member, index) => (
                    <motion.div
                      key={member.email}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.42 }}
                      className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.25rem] border border-stroke bg-bg-alt/54 p-3"
                    >
                      <span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold ${member.tone}`}>
                        {member.initials}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{member.name}</span>
                        <span className="block truncate text-xs font-medium text-ink-muted">{member.email}</span>
                      </span>
                      <span className="rounded-xl border border-stroke bg-surface px-3 py-1.5 text-xs font-semibold text-primary">
                        {member.role}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.45rem] border border-stroke bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Invite a relative</p>
                      <p className="mt-1 text-xs font-medium text-ink-muted">Access expires until the owner approves it.</p>
                    </div>
                    <UserRoundPlus className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
                    <div className="flex min-h-11 items-center rounded-full border border-stroke bg-bg-alt px-4 text-sm font-medium text-ink-muted">
                      relative@family.email
                    </div>
                    <button
                      type="button"
                      className="min-h-11 rounded-full bg-primary px-4 text-sm font-semibold text-surface transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-warm-brown active:scale-[0.98]"
                    >
                      Send invite
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 rounded-[1.45rem] bg-primary p-4 text-surface sm:flex-row sm:items-center">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface/12">
                    <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-semibold">Privacy check passed</p>
                    <p className="mt-1 text-sm text-surface/74">No public links. No external indexing. Roles are active.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 105, damping: 20, delay: 0.14 }}
            className="rounded-[2rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_24px_62px_-48px_rgba(80,54,30,0.88)] ring-1 ring-stroke/50"
          >
            <div className="rounded-[calc(2rem-0.375rem)] border border-white/80 bg-surface/92 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.72)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">Recent workspace activity</p>
                <Users className="h-5 w-5 text-primary" strokeWidth={1.8} />
              </div>
              <div className="grid gap-2.5">
                {activity.map((item, index) => (
                  <motion.div
                    key={item}
                    animate={{ opacity: [0.72, 1, 0.72] }}
                    transition={{ duration: 3.4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center gap-3 rounded-2xl bg-bg-alt px-3 py-2.5 text-sm font-medium text-ink-secondary"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-sage" />
                    {item}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}