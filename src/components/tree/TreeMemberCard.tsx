import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { TREE_NODE_HEIGHT, TREE_NODE_WIDTH } from "../../constants/treeLayout";
import type { FamilyMember } from "../../types/family";
import { getInitials } from "../../utils/family";
import { iconStroke } from "../ui";

export const TreeMemberCard = ({
  member,
  muted,
  pulse,
  onClick,
}: {
  member: FamilyMember;
  muted?: boolean;
  pulse?: boolean;
  onClick: (member: FamilyMember) => void;
}) => {
  const initials = getInitials(member.displayName || member.fullName).toUpperCase();

  return (
    <motion.button
      data-no-canvas-pan="true"
      type="button"
      whileHover={muted ? undefined : { y: -3 }}
      transition={{ type: "spring", stiffness: 190, damping: 19 }}
      className={`group relative overflow-hidden rounded-[1rem] border bg-surface p-2 text-left shadow-[0_18px_34px_-28px_rgba(80,54,30,0.8)] ring-1 transition active:translate-y-[1px] ${
        muted
          ? "border-border-soft/80 opacity-40 saturate-0 ring-border-soft/60"
          : "border-white/85 ring-border-soft/70 hover:border-soft-gold/55 hover:shadow-[0_24px_42px_-30px_rgba(80,54,30,0.9)]"
      }`}
      style={{ minHeight: TREE_NODE_HEIGHT, width: TREE_NODE_WIDTH }}
      onClick={() => onClick(member)}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,hsl(var(--soft-gold)),hsl(var(--sage-green)),hsl(var(--warm-brown)))]" />
      {pulse && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[1rem]"
          initial={{ opacity: 0, boxShadow: "inset 0 0 0 0 rgba(183,138,53,0), 0 0 0 0 rgba(183,138,53,0)" }}
          animate={{
            opacity: [0, 1, 0.8, 1, 0],
            boxShadow: [
              "inset 0 0 0 0 rgba(183,138,53,0), 0 0 0 0 rgba(183,138,53,0)",
              "inset 0 0 0 3px rgba(183,138,53,0.95), 0 0 0 6px rgba(183,138,53,0.2)",
              "inset 0 0 0 2px rgba(183,138,53,0.72), 0 0 0 3px rgba(183,138,53,0.12)",
              "inset 0 0 0 3px rgba(183,138,53,0.95), 0 0 0 6px rgba(183,138,53,0.2)",
              "inset 0 0 0 0 rgba(183,138,53,0), 0 0 0 0 rgba(183,138,53,0)",
            ],
          }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      )}

      <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border border-white/80 bg-surface-soft shadow-soft">
        {member.photo ? (
          <img
            alt={`Foto ${member.fullName}`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            src={member.photo}
          />
        ) : (
          <div className="archive-grid grid h-full w-full place-items-center bg-[linear-gradient(135deg,hsl(var(--surface-soft)),hsl(var(--soft-gold)_/_0.2))]">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface/92 font-display text-sm font-bold text-warm-brown shadow-soft ring-1 ring-white/95">
              {initials}
            </span>
          </div>
        )}
        <span className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-surface/92 px-2 py-0.5 text-[9px] font-extrabold uppercase text-dark-green shadow-soft">
          G{member.generation}
        </span>
        {!member.photo && (
          <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-surface/92 text-sage-green shadow-soft">
            <Camera className="h-3 w-3" strokeWidth={iconStroke} />
          </span>
        )}
      </div>

      <h3 className="mt-2 line-clamp-2 text-center text-[12px] font-extrabold leading-tight text-text-primary">
        {member.displayName || member.fullName}
      </h3>
      <p className="mt-1 line-clamp-1 text-center text-[9px] font-bold text-warm-brown">
        {member.isDeceased ? member.deceasedLabel : member.statusLabel}
      </p>
      <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-soft-gold/70" />
    </motion.button>
  );
};
