import type { Member, TimelineEvent } from "../types/family";

const extractYear = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const match = value.match(/\b(1[5-9]\d{2}|20\d{2}|21\d{2})\b/);
  return match ? Number(match[1]) : null;
};

export const timelineSortValue = (event: TimelineEvent): number => {
  const numericYear = extractYear(event.year);
  if (numericYear !== null) return numericYear;

  const generationMatch = event.year.match(/generasi\s+(\d+)/i);
  if (generationMatch) return 3000 + Number(generationMatch[1]);

  return Number.MAX_SAFE_INTEGER;
};

export const sortTimelineEvents = <T extends TimelineEvent>(events: T[]): T[] =>
  [...events].sort((a, b) => {
    const yearDelta = timelineSortValue(a) - timelineSortValue(b);
    if (yearDelta !== 0) return yearDelta;
    return a.title.localeCompare(b.title);
  });

const displayName = (member: Member) => member.displayName || member.fullName;

const birthYear = (member: Member) => extractYear(member.birthDate);

const deathYear = (member: Member) => extractYear(member.deathDate);

const generationPeriod = (member: Member, spouse?: Member) => {
  const generation = spouse ? Math.min(member.generation, spouse.generation) : member.generation;
  return `Generasi ${generation}`;
};

export const deriveTimelineEvents = (members: Member[]): TimelineEvent[] => {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const events: TimelineEvent[] = [];
  const marriageKeys = new Set<string>();

  members.forEach((member) => {
    const name = displayName(member);
    const memberBirthYear = birthYear(member);

    if (member.birthDate) {
      events.push({
        id: `auto-birth-${member.id}`,
        year: memberBirthYear ? String(memberBirthYear) : member.birthDate,
        type: "Kelahiran",
        title: `Kelahiran ${name}`,
        description: `${name} lahir pada ${member.birthDate}.`,
        relatedMemberIds: [member.id],
        memberIds: [member.id],
        photo: member.photo,
        isAutomatic: true,
      });
    }

    member.spouseIds.forEach((spouseId) => {
      const spouse = membersById.get(spouseId);
      if (!spouse) return;

      const pairKey = [member.id, spouse.id].sort().join("__");
      if (marriageKeys.has(pairKey)) return;
      marriageKeys.add(pairKey);

      events.push({
        id: `auto-marriage-${pairKey}`,
        year: generationPeriod(member, spouse),
        type: "Pernikahan",
        title: `Pernikahan ${name} dan ${displayName(spouse)}`,
        description: `${name} tercatat sebagai pasangan ${displayName(spouse)} dalam arsip keluarga.`,
        relatedMemberIds: [member.id, spouse.id],
        memberIds: [member.id, spouse.id],
        photo: member.photo ?? spouse.photo,
        isAutomatic: true,
      });
    });

    if (member.isDeceased || member.deathDate) {
      const memberDeathYear = deathYear(member);
      events.push({
        id: `auto-death-${member.id}`,
        year: memberDeathYear ? String(memberDeathYear) : generationPeriod(member),
        type: "Wafat",
        title: `Wafat ${name}`,
        description: member.deathDate
          ? `${name} wafat pada ${member.deathDate}.`
          : `${name} tercatat telah wafat, namun tanggal wafat belum tercatat.`,
        relatedMemberIds: [member.id],
        memberIds: [member.id],
        photo: member.photo,
        isAutomatic: true,
      });
    }
  });

  return sortTimelineEvents(events);
};
