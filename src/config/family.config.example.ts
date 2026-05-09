import type { FamilySiteConfig } from "../types/config";

const exampleConfig: FamilySiteConfig = {
  site: {
    name: "Family Tree",
    familyName: "Example Family",
    subtitle: "Digital family archive",
    homeEyebrow: "Digital family archive",
    homeTitle: "Example Family Tree",
    homeDescription:
      "Preserve stories, relationships, and family legacy in a neat and easily navigable archive across generations.",
    homeIntro:
      "Starting from the core family, this archive helps every family branch stay clearly readable.",
    treeTitle: "Example Family Tree",
    treeDescription:
      "Explore family relationships from key members, then trace branches, ancestors, and descendants.",
    galleryTitle: "Example Family Gallery",
    galleryDescription:
      "Digital album space for family photos, reunions, branch documentation, and visual archives.",
    timelineTitle: "Family Timeline",
    timelineDescription:
      "Important family events organized as a journey between generations.",
    homeMemberId: "root-member-id",
    defaultBranchId: "main-line",
    primaryVisual: {
      image: "https://picsum.photos/seed/family-template-archive/900/1100",
      alt: "Family archive desk",
      caption: "Family story room",
    },
    heroVisuals: [
      ["Founder", "main family", "https://picsum.photos/seed/family-template-founder/420/420"],
      ["Spouse", "main family", "https://picsum.photos/seed/family-template-spouse/420/420"],
      ["Family branch", "neatly connected", "https://picsum.photos/seed/family-template-branches/420/420"],
      ["Old notes", "clearly readable", "https://picsum.photos/seed/family-template-notes/420/420"],
    ].map(([title, subtitle, image]) => ({ title, subtitle, image })),
    galleryHeroImage: "https://picsum.photos/seed/family-template-gallery/900/620",
  },
  features: {
    gallery: true,
    timeline: true,
    minimap: true,
  },
  tree: {
    defaultZoom: 0.82,
    minZoom: 0.4,
    maxZoom: 1.5,
  },
  metadata: {
    title: "Family Tree",
    description: "Digital archive template for family trees.",
  },
  labels: {
    statusOptions: ["Main Line", "Extended Family", "In-law", "Child", "Grandchild", "Great-grandchild", "Relative"],
  },
};

export default exampleConfig;
