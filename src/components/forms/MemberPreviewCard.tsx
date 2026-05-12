import type { FamilyMember } from "../../types/family";
import { InitialsAvatar } from "../ui";

export const MemberPreviewCard = ({ member }: { member: FamilyMember }) => (
  <div className="rounded-[1.5rem] border border-white/75 bg-surface/95 p-4 shadow-warm ring-1 ring-border-soft/60 sm:p-6 xl:sticky xl:top-24 xl:rounded-[2rem]">
    <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.16em] text-sage-green">Card preview</p>
    <div className="overflow-hidden rounded-[1.25rem] border border-white/75 bg-background shadow-soft sm:rounded-[1.6rem]">
      <div className="archive-grid grid min-h-[13rem] place-items-center bg-[linear-gradient(135deg,hsl(var(--surface-soft)),hsl(var(--soft-gold)_/_0.22))] p-5">
        <InitialsAvatar member={member.fullName ? member : { ...member, fullName: "Nama Anggota", displayName: "Nama Anggota" }} size="lg" />
      </div>
      <div className="p-5">
        <h3 className="break-words text-lg font-bold leading-tight text-text-primary sm:text-xl">{member.fullName || "Member Full Name"}</h3>
        <p className="mt-2 text-sm leading-6 text-text-muted">{member.relationshipToRoot || "Relationship with core family will appear here."}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-text-muted">
          <span className="rounded-full border border-soft-gold/25 bg-soft-gold/16 px-3 py-1.5 text-warm-brown">Generation {member.generation}</span>
          <span className="rounded-full border border-sage-green/20 bg-sage-green/12 px-3 py-1.5 text-dark-green">{member.familyBranch}</span>
          {member.isDeceased && <span className="rounded-full border border-border-soft bg-surface px-3 py-1.5">{member.deceasedLabel}</span>}
        </div>
      </div>
    </div>
  </div>
);
