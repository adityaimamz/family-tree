export type Gender = "male" | "female" | "unknown";

export type FamilyStatus = string;

export interface FamilyMember {
  id: string;
  fullName: string;
  displayName: string;
  gender: Gender;
  generation: number;
  familyBranch: string;
  fatherId: string | null;
  motherId: string | null;
  spouseIds: string[];
  formerSpouseIds: string[];
  childrenIds: string[];
  siblingIds: string[];
  parentFamilyId: string | null;
  nuclearFamilyIds: string[];
  birthDate: string | null;
  marriageDate: string | null;
  deathDate: string | null;
  isDeceased: boolean;
  deceasedLabel: "Alm." | "Almh." | null;
  birthPlace: string | null;
  biography: string;
  notes: string;
  photo: string | null;
  statusLabel: FamilyStatus;
  relationshipToRoot: string;
}

export type Member = FamilyMember;

export interface FamilyBranch {
  id: string;
  name: string;
  headMemberId?: string;
  headMemberIds?: string[];
  spouseId?: string | null;
  description: string;
  summary?: string;
  memberIds?: string[];
  color?: "warm-brown" | "sage-green" | "soft-blue" | "terracotta" | "soft-gold" | "dark-green";
}

export interface NuclearFamily {
  id: string;
  name: string;
  parentIds: string[];
  childIds?: string[];
  childrenIds?: string[];
  branchId: string;
  summary: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  tone: "success" | "warning" | "info" | "error";
}

export interface AuthUser {
  id: string;
  authUserId: string | null;
  email: string;
  name: string | null;
  role: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  year: string;
  event?: string;
  familyGroup: string;
  description: string;
  image: string;
}

export type TimelineEventType =
  | "Kelahiran"
  | "Pernikahan"
  | "Reuni"
  | "Wafat"
  | "Pindah Tempat"
  | "Pendidikan"
  | "Perjalanan Keluarga"
  | "Peristiwa Penting"
  | "Lainnya";

export interface TimelineEvent {
  id: string;
  year: string;
  type: TimelineEventType;
  title: string;
  description: string;
  relatedMemberIds?: string[];
  memberIds?: string[];
  photo?: string | null;
  isAutomatic?: boolean;
}
