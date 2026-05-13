import { motion } from "framer-motion";
import { Lock, Settings, ShieldCheck, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { PageShell, SectionHeader, iconStroke, pageTransition } from "../components/ui";
import { useSpaceStore } from "../hooks/useSpaceStore";
import { AccountProfileSection } from "./settings/AccountProfileSection";
import { DangerZoneSection } from "./settings/DangerZoneSection";
import { InvitesPanel } from "./settings/InvitesPanel";
import { InvitesQuickStats } from "./settings/InvitesQuickStats";
import { MembersAccessPanel } from "./settings/MembersAccessPanel";
import { SpaceProfileSection } from "./settings/SpaceProfileSection";

type SettingsTab = "account" | "space" | "access";

const roleLabel = (role: string) => {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
};

export const SpaceSettingsPage = () => {
  const { currentSpace, membership, currentUser, canEdit, updateSpace, updateMembershipProfile, addToast } = useSpaceStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  if (!currentSpace || !membership) return null;

  // Auto-fallback: members can only see the account tab
  const effectiveTab = canEdit() ? activeTab : "account";

  const tabClass = (tab: SettingsTab) =>
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-extrabold transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-[1px] ${
      effectiveTab === tab
        ? "bg-dark-green text-white shadow-warm"
        : "border border-border-soft bg-background text-text-muted shadow-soft hover:-translate-y-0.5 hover:bg-surface-soft hover:text-text-primary"
    }`;

  return (
    <motion.div {...pageTransition}>
      <PageShell>
        <SectionHeader
          eyebrow="Control"
          title="Settings"
          description="Manage your personal identity in this FamilySpace and the visible identity of the private archive."
        />

        <div className="mb-5 flex flex-wrap gap-2 rounded-[1.45rem] border border-border-soft bg-surface/78 p-2 shadow-soft ring-1 ring-white/70">
          <button type="button" className={tabClass("account")} onClick={() => setActiveTab("account")}>
            <UserRound className="h-4 w-4" strokeWidth={iconStroke} />
            Account
          </button>
          {canEdit() && (
            <button type="button" className={tabClass("space")} onClick={() => setActiveTab("space")}>
              <Settings className="h-4 w-4" strokeWidth={iconStroke} />
              FamilySpace
            </button>
          )}
          {canEdit() && (
            <button type="button" className={tabClass("access")} onClick={() => setActiveTab("access")}>
              <Users className="h-4 w-4" strokeWidth={iconStroke} />
              Access &amp; Invites
            </button>
          )}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {effectiveTab === "account" && (
            <AccountProfileSection
              currentSpace={currentSpace}
              membership={membership}
              currentUser={currentUser}
              updateMembershipProfile={updateMembershipProfile}
              addToast={addToast}
            />
          )}

          {effectiveTab === "space" && (
            <SpaceProfileSection
              currentSpace={currentSpace}
              canEdit={canEdit}
              updateSpace={updateSpace}
              addToast={addToast}
            />
          )}

          {effectiveTab === "access" && canEdit() && (
            <div className="grid gap-6">
              <MembersAccessPanel
                spaceSlug={currentSpace.slug}
                currentRole={membership.role}
                onToast={addToast}
              />
              <InvitesPanel spaceSlug={currentSpace.slug} spaceName={currentSpace.name} onToast={addToast} />
            </div>
          )}

          <aside className="grid gap-5">
            <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
              <ShieldCheck className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
              <h2 className="mt-4 text-xl font-extrabold text-text-primary">Current access</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                You are signed in as <span className="text-text-primary">{roleLabel(membership.role)}</span> for {currentSpace.name}.
              </p>
              <div className="mt-4 rounded-2xl border border-border-soft bg-background p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-sage-green" strokeWidth={iconStroke} />
                  <p className="text-sm font-bold text-text-primary">Private Family Archive</p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-text-muted">
                  Platform admins cannot automatically access private FamilySpace records.
                </p>
              </div>
            </section>

            {canEdit() ? (
              <InvitesQuickStats spaceSlug={currentSpace.slug} onOpen={() => setActiveTab("access")} />
            ) : (
              <section className="rounded-[1.6rem] border border-white/75 bg-surface/94 p-5 shadow-soft ring-1 ring-border-soft/60">
                <Users className="h-5 w-5 text-sage-green" strokeWidth={iconStroke} />
                <h2 className="mt-4 text-xl font-extrabold text-text-primary">Invite management</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">
                  Only owners and admins can create or revoke invites. Ask a steward of this archive
                  to share a code with you.
                </p>
              </section>
            )}

            {membership.role === "owner" && (
              <DangerZoneSection spaceSlug={currentSpace.slug} onToast={addToast} />
            )}
          </aside>
        </div>
      </PageShell>
    </motion.div>
  );
};
