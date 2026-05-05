export type ThemeToken =
  | "background"
  | "surface"
  | "surfaceSoft"
  | "text"
  | "muted"
  | "border"
  | "warmBrown"
  | "sageGreen"
  | "softBlue"
  | "terracotta"
  | "softGold"
  | "darkGreen"
  | "warning";

export type FamilySiteLabels = {
  navHome: string;
  navTree: string;
  navMembers: string;
  navGallery: string;
  navTimeline: string;
  navAdmin: string;
  allMembers: string;
  allGenerations: string;
  allBranches: string;
  deceased: string;
  coreFamily: string;
  membersFound: string;
  branchSummaryFallback: string;
  memberBiographyFallback: string;
  relationshipPlaceholder: string;
  importMembersHelp: string;
  emptyMembersTitle: string;
  emptyMembersDescription: string;
  emptyGalleryTitle: string;
  emptyGalleryDescription: string;
  emptyTimelineTitle: string;
  emptyTimelineDescription: string;
  statusOptions: string[];
};

export type HeroVisual = {
  title: string;
  subtitle: string;
  image: string;
};

export type FamilySiteConfig = {
  site: {
    name: string;
    familyName: string;
    subtitle: string;
    homeEyebrow: string;
    homeTitle: string;
    homeDescription: string;
    homeIntro: string;
    treeTitle: string;
    treeDescription: string;
    galleryTitle: string;
    galleryDescription: string;
    timelineTitle: string;
    timelineDescription: string;
    homeMemberId: string;
    defaultBranchId?: string;
    primaryVisual: {
      image: string;
      alt: string;
      caption: string;
    };
    heroVisuals: HeroVisual[];
    galleryHeroImage: string;
  };
  features: {
    gallery: boolean;
    timeline: boolean;
    minimap: boolean;
  };
  tree: {
    defaultZoom: number;
    minZoom: number;
    maxZoom: number;
  };
  metadata: {
    title: string;
    description: string;
    ogImage?: string;
    favicon?: string;
  };
  theme?: Partial<Record<ThemeToken, string>>;
  labels?: Partial<FamilySiteLabels>;
};

export type ResolvedFamilySiteConfig = Omit<FamilySiteConfig, "labels"> & {
  labels: FamilySiteLabels;
};
