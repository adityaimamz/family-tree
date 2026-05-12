import { useMemo, useState } from "react";
import type { FamilyMember } from "../../types/family";

const inputClass =
  "min-h-11 w-full rounded-xl border border-border-soft bg-background px-3 py-2.5 text-sm font-medium text-text-primary shadow-soft outline-none transition placeholder:text-text-muted/65 focus:border-dark-green focus:ring-4 focus:ring-sage-green/12 sm:min-h-12 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-base";

export const RelationshipSelector = ({
  label,
  value,
  members,
  onChange,
  multiple = false,
}: {
  label: string;
  value: string | string[] | null;
  members: FamilyMember[];
  onChange: (value: string | string[] | null) => void;
  multiple?: boolean;
}) => {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const [query, setQuery] = useState("");
  const options = useMemo(() => members.filter((member) => member.fullName.toLowerCase().includes(query.toLowerCase())), [members, query]);
  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-text-primary">{label}</span>
      <input className={inputClass} placeholder={`Search ${label.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="mt-2 max-h-52 overflow-y-auto rounded-2xl border border-border-soft bg-surface/80 p-2 shadow-soft">
        <button type="button" className="mb-1 min-h-10 w-full rounded-xl px-3 text-left text-sm font-semibold text-text-muted transition hover:bg-surface-soft active:translate-y-[1px]" onClick={() => onChange(multiple ? [] : null)}>
          Not selected
        </button>
        {options.map((member) => {
          const active = selected.includes(member.id);
          return (
            <button key={member.id} type="button" className={`mb-1 min-h-10 w-full rounded-xl px-3 text-left text-sm font-semibold transition active:translate-y-[1px] ${active ? "bg-dark-green text-white shadow-soft" : "text-text-primary hover:bg-surface-soft"}`} onClick={() => (multiple ? onChange(active ? selected.filter((id) => id !== member.id) : [...selected, member.id]) : onChange(member.id))}>
              {member.fullName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
