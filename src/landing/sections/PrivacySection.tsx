import { motion } from "framer-motion";
import { CheckCircle2, Clock3, FileCheck2, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";

const roles = [
  {
    role: "Owner",
    person: "Aditya Rahman",
    permissions: ["Invite relatives", "Approve admins", "Set archive visibility"],
  },
  {
    role: "Admin",
    person: "Siti Rahman",
    permissions: ["Review AI drafts", "Organize branches", "Add source notes"],
  },
  {
    role: "Member",
    person: "Laila Noor",
    permissions: ["View archive", "Suggest memories", "Comment on drafts"],
  },
];

const ledgerRows = [
  { icon: LockKeyhole, label: "Invite-only access", value: "No public archive link" },
  { icon: FileCheck2, label: "Family-reviewed AI drafts", value: "Drafts stay pending until relatives approve the voice" },
  { icon: ShieldCheck, label: "Private by default", value: "New stories and photos begin inside the family archive" },
  { icon: Clock3, label: "Source history attached", value: "Notes, reviewers, and photo context stay connected" },
];

export default function PrivacySection() {
  return (
    <section id="privacy" className="relative overflow-hidden bg-bg py-24 lg:py-32">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--sage-green)_/_0.13),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-[1320px] gap-14 px-4 sm:px-6 lg:grid-cols-[minmax(560px,1.08fr)_minmax(0,0.82fr)] lg:items-start lg:gap-16 xl:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
          className="order-1 lg:sticky lg:top-28 lg:order-2"
        >
          <p className="max-w-[42ch] text-sm font-semibold leading-6 text-primary">
            Privacy is part of the archive, not a small setting at the end.
          </p>
          <h2 className="mt-5 max-w-[700px] font-body text-4xl font-semibold leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
            Keep family history in the hands of the family.
          </h2>
          <p className="mt-6 max-w-[58ch] text-base leading-8 text-ink-secondary">
            Only invited FamilySpace members can view the archive. Owners and admins manage invite codes, member roles, and access changes.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="order-2 rounded-[2.25rem] border border-white/80 bg-white/35 p-1.5 shadow-[0_32px_86px_-56px_rgba(80,54,30,0.92)] ring-1 ring-stroke/50 lg:order-1"
        >
          <div className="overflow-hidden rounded-[calc(2.25rem-0.375rem)] border border-white/80 bg-surface/92 shadow-[inset_0_1px_1px_rgba(255,255,255,0.78)]">
            <div className="flex flex-col gap-3 border-b border-stroke bg-bg-alt/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold text-ink">Permission ledger</p>
                <p className="mt-1 text-sm font-medium text-ink-muted">Rahman Archive access and review rules</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-surface">
                <UsersRound className="h-4 w-4" strokeWidth={1.8} />
                12 invited relatives
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[0.82fr_1fr]">
              <div className="border-b border-stroke bg-bg-alt/54 p-5 lg:border-b-0 lg:border-r">
                <p className="mb-4 text-sm font-semibold text-ink">Roles</p>
                <div className="grid gap-3">
                  {roles.map((role, index) => (
                    <motion.article
                      key={role.role}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.08, duration: 0.42 }}
                      className="rounded-[1.35rem] border border-stroke bg-surface p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink">{role.role}</p>
                          <p className="mt-1 text-xs font-medium text-ink-muted">{role.person}</p>
                        </div>
                        <span className="rounded-full bg-primary-muted px-3 py-1.5 text-xs font-semibold text-primary">
                          Active
                        </span>
                      </div>
                      <div className="mt-4 grid gap-2">
                        {role.permissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-2 text-xs font-semibold text-ink-secondary">
                            <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.8} />
                            {permission}
                          </div>
                        ))}
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <p className="mb-4 text-sm font-semibold text-ink">Archive rules</p>
                <div className="grid gap-3">
                  {ledgerRows.map((row, index) => {
                    const Icon = row.icon;
                    return (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: 14 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.12 + index * 0.08, duration: 0.42 }}
                        className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-[1.35rem] border border-stroke bg-bg-alt/54 p-4"
                      >
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-muted text-primary">
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-ink">{row.label}</span>
                          <span className="mt-1 block text-sm leading-6 text-ink-secondary">{row.value}</span>
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-[1.45rem] bg-primary p-4 text-surface">
                  <p className="font-semibold">Family review stays visible</p>
                  <p className="mt-1 text-sm leading-6 text-surface/72">
                    Biography drafts, photo notes, and timeline changes show who contributed context before they become
                    part of the archive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
