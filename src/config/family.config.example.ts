import type { FamilySiteConfig } from "../types/config";

const exampleConfig: FamilySiteConfig = {
  site: {
    name: "Silsilah Keluarga",
    familyName: "Keluarga Contoh",
    subtitle: "Arsip keluarga digital",
    homeEyebrow: "Arsip keluarga digital",
    homeTitle: "Silsilah Keluarga Contoh",
    homeDescription:
      "Simpan cerita, hubungan, dan warisan keluarga dalam arsip yang rapi dan mudah ditelusuri lintas generasi.",
    homeIntro:
      "Dimulai dari keluarga inti, arsip ini membantu setiap cabang keluarga tetap terbaca dengan jelas.",
    treeTitle: "Pohon Keluarga Contoh",
    treeDescription:
      "Jelajahi hubungan keluarga dari anggota utama, lalu telusuri cabang, leluhur, dan keturunan.",
    galleryTitle: "Galeri Keluarga Contoh",
    galleryDescription:
      "Ruang album digital untuk foto keluarga, reuni, dokumentasi cabang, dan arsip visual.",
    timelineTitle: "Linimasa Keluarga",
    timelineDescription:
      "Peristiwa penting keluarga disusun sebagai perjalanan antar generasi.",
    homeMemberId: "root-member-id",
    defaultBranchId: "garis-utama",
    primaryVisual: {
      image: "https://picsum.photos/seed/family-template-archive/900/1100",
      alt: "Arsip meja keluarga",
      caption: "Ruang cerita keluarga",
    },
    heroVisuals: [
      ["Pendiri", "keluarga utama", "https://picsum.photos/seed/family-template-founder/420/420"],
      ["Pasangan", "keluarga utama", "https://picsum.photos/seed/family-template-spouse/420/420"],
      ["Cabang keluarga", "terhubung rapi", "https://picsum.photos/seed/family-template-branches/420/420"],
      ["Catatan lama", "tetap terbaca", "https://picsum.photos/seed/family-template-notes/420/420"],
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
    title: "Silsilah Keluarga",
    description: "Template arsip digital untuk silsilah keluarga.",
  },
  labels: {
    statusOptions: ["Garis Utama", "Keluarga Besar", "Menantu", "Anak", "Cucu", "Cicit", "Kerabat"],
  },
};

export default exampleConfig;
