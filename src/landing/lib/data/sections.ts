export const problems = [
  {
    icon: "messages",
    title: "Scattered chats",
    desc: "The story is split across WhatsApp threads, voice notes, and family group chats no one knows how to search.",
  },
  {
    icon: "image",
    title: "Unnamed photos",
    desc: "Old albums keep the faces, but lose the names, places, dates, and reasons the moment mattered.",
  },
  {
    icon: "file",
    title: "Lost notes",
    desc: "Recipes, letters, and reunion lists stay buried in drawers, folders, and phone galleries.",
  },
  {
    icon: "clock",
    title: "Living memory fades",
    desc: "The relatives who remember nicknames, moves, and family turning points will not always be able to retell them.",
  },
];

export const features = [
  { title: "Branches", desc: "Keep family lines readable without separating the archive into disconnected folders." },
  { title: "Stories", desc: "Capture short memories, notes, names, and source details while relatives can still explain them." },
  { title: "Photos", desc: "Attach names, dates, places, and related people to the images the family keeps." },
  { title: "Timelines", desc: "Connect milestones to biographies, photos, and the relatives who verified them." },
  { title: "Biographies", desc: "Draft life stories from fragments, then keep the family in control of the final voice." },
  { title: "Relationships", desc: "Trace how two relatives connect with source context still attached." },
];

export const events = [
  { year: "1952", title: "Born in Yogyakarta", desc: "Birth record linked to Lina Rahman's profile" },
  { year: "1975", title: "Married Hasan Rahman", desc: "Wedding photo and family notes attached" },
  { year: "1990", title: "Moved to Jakarta", desc: "Move confirmed by Aunt Rina and the blue notebook" },
  { year: "2010", title: "Celebrated 35th anniversary", desc: "Album, guest list, and biography context connected" },
];

export const values = [
  {
    icon: "lock",
    title: "Private access",
    desc: "Only invited members can view your family archive.",
  },
  {
    icon: "pen",
    title: "AI-assisted stories",
    desc: "Turn short notes into meaningful biographies.",
  },
  {
    icon: "branch",
    title: "Built for generations",
    desc: "Preserve family history in one organized place.",
  },
];

export const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Private archive", href: "#family-space" },
      { label: "Family tree", href: "#demo" },
      { label: "Timeline", href: "#timeline" },
      { label: "Biography studio", href: "#biography" },
      { label: "Relationship explainer", href: "#relationships" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Security", href: "#privacy" },
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#privacy" },
      { label: "Contact", href: "mailto:hello@warisan.ai" },
    ],
  },
  {
    title: "Start",
    links: [
      { label: "Create archive", href: "/" },
      { label: "Sample archive", href: "#demo" },
      { label: "Memory problem", href: "#features" },
    ],
  },
];

export const familyTreeChips = [
  "Branch names",
  "Confirmed relatives",
  "Linked photos",
  "Review status",
  "Source context",
];

export const relationshipPath = ["Rina Noor", "Arman Rahman", "Taufik & Mariam Rahman", "Siti Rahman", "Aditya Rahman"];

export const relationshipNodes = [
  { x: 100, y: 20, fill: "hsl(var(--sage-green) / 0.4)", label: "GR" },
  { x: 50, y: 70, fill: "hsl(var(--sage-green) / 0.4)", ring: true, label: "Ar" },
  { x: 150, y: 70, fill: "hsl(var(--sage-green) / 0.4)", ring: true, label: "Si" },
  { x: 20, y: 120, fill: "hsl(var(--sage-green) / 0.4)", ring: true, label: "RN" },
  { x: 180, y: 120, fill: "hsl(var(--sage-green) / 0.4)", ring: true, label: "Ad" },
];
