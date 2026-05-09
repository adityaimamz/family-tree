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

export type PlatformRole = "user" | "platform_admin";

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  platformRole: PlatformRole;
}

export interface FamilySpace {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  recordCounts?: SpaceRecordCounts;
}

export interface FamilyMembership {
  role: "owner" | "admin" | "member";
  space: FamilySpace;
}

export interface SpaceRecordCounts {
  members: number;
  timeline: number;
  photos: number;
  stories: number;
}

export interface SpaceSummary {
  membersCount: number;
  generationsCount: number;
  branchesCount: number;
  nuclearFamiliesCount: number;
  timelineCount: number;
  galleryCount: number;
  storiesCount: number;
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

export type StoryStatus = "draft" | "in_review" | "approved";

export interface Story {
  id: string;
  title: string;
  content: string;
  status: StoryStatus;
  relatedMemberIds: string[];
  sourceNoteIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type SourceNoteType = "note" | "photo_context" | "interview" | "document" | "chat";

export interface SourceNote {
  id: string;
  title: string;
  content: string;
  type: SourceNoteType;
  relatedMemberIds: string[];
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalSpaces: number;
  totalMembers: number;
  totalGalleryItems: number;
  totalTimelineEvents: number;
  totalStories: number;
  totalSourceNotes: number;
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  platformRole: string;
  spacesCount: number;
  createdAt: string;
}

export interface PlatformSpace {
  id: string;
  slug: string;
  name: string;
  ownerCount: number;
  memberCount: number;
  recordCounts: {
    members: number;
    timeline: number;
    gallery: number;
  };
  createdAt: string;
}

export interface PlatformSystemInfo {
  apiHealth: boolean;
  databaseConnected: boolean;
  uploadThingConfigured: boolean;
  neonAuthConfigured: boolean;
  environment: string;
  nodeVersion: string;
  uptime: number;
}

export interface RelationshipExplanation {
  relationshipLabel: string;
  explanation: string;
  path: { id: string; name: string }[];
  pathMemberIds: string[];
  confidence: "high" | "medium" | "low";
  fallbackNote: string;
  source: "ai" | "deterministic";
  cached?: boolean;
  historyId?: string;
}

export interface RelationshipExplanationHistory {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipLabel: string;
  explanation: string;
  pathMemberIds: string[];
  confidence: string;
  source: string;
  fallbackNote: string;
  updatedAt: string;
  viewCount: number;
}
