import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured. Add it to the environment before running db:seed.");
}

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const now = () => new Date();

async function main() {
  const demoAuthUserId = process.env.DEMO_AUTH_USER_ID || "demo-auth-user-id";
  const demoEmail = "demo@warisan.ai";
  const demoName = "Demo Platform Admin";

  const appUser = await prisma.appUser.upsert({
    where: { email: demoEmail },
    update: {
      authUserId: demoAuthUserId,
      name: demoName,
      platformRole: "platform_admin",
    },
    create: {
      authUserId: demoAuthUserId,
      email: demoEmail,
      name: demoName,
      platformRole: "platform_admin",
    },
  });

  const familySpace = await prisma.familySpace.upsert({
    where: { slug: "rahman-archive" },
    update: {
      name: "Rahman Archive",
      description: "Demo private family archive (Sprint 3).",
    },
    create: {
      slug: "rahman-archive",
      name: "Rahman Archive",
      description: "Demo private family archive (Sprint 3).",
    },
  });

  await prisma.familyMembership.upsert({
    where: {
      userId_familySpaceId: {
        userId: appUser.id,
        familySpaceId: familySpace.id,
      },
    },
    update: { role: "owner" },
    create: {
      userId: appUser.id,
      familySpaceId: familySpace.id,
      role: "owner",
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.storySourceNote.deleteMany({ where: { story: { familySpaceId: familySpace.id } } });
    await tx.storyMember.deleteMany({ where: { story: { familySpaceId: familySpace.id } } });
    await tx.sourceNoteMember.deleteMany({ where: { sourceNote: { familySpaceId: familySpace.id } } });

    await tx.story.deleteMany({ where: { familySpaceId: familySpace.id } });
    await tx.sourceNote.deleteMany({ where: { familySpaceId: familySpace.id } });
    await tx.galleryItem.deleteMany({ where: { familySpaceId: familySpace.id } });
    await tx.timelineEvent.deleteMany({ where: { familySpaceId: familySpace.id } });
    await tx.familyMember.deleteMany({ where: { familySpaceId: familySpace.id } });
    await tx.nuclearFamily.deleteMany({ where: { familySpaceId: familySpace.id } });
    await tx.familyBranch.deleteMany({ where: { familySpaceId: familySpace.id } });

    await tx.familyBranch.createMany({
      data: [
        {
          familySpaceId: familySpace.id,
          slugId: "garis-utama",
          name: "Garis Utama",
          headMemberIds: ["root-member-id"],
          spouseId: "rahman-spouse",
          description: "Cabang utama keluarga.",
          summary: "Bermula dari keluarga inti.",
          memberIds: [
            "root-member-id",
            "rahman-spouse",
            "rahman-son",
            "son-spouse",
            "grandson-1",
            "granddaughter-1",
          ],
          color: "warm-brown",
        },
        {
          familySpaceId: familySpace.id,
          slugId: "cabang-kedua",
          name: "Cabang Kedua",
          headMemberIds: ["rahman-daughter"],
          spouseId: "daughter-spouse",
          description: "Cabang keluarga kedua.",
          summary: "Perjalanan cabang keluarga di generasi berikutnya.",
          memberIds: ["rahman-daughter", "daughter-spouse", "grandchild-2", "grandchild-3"],
          color: "sage-green",
        },
      ],
    });

    const membersToCreate = [
      {
        slugId: "root-member-id",
        fullName: "H. Abdul Rahman",
        displayName: "Abdul Rahman",
        gender: "male",
        generation: 1,
        familyBranchId: "garis-utama",
        fatherId: null,
        motherId: null,
        spouseIds: ["rahman-spouse"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: ["keluarga-abdul-rahman"],
        birthDate: "1930",
        marriageDate: "1950",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Padang",
        biography: "Pendiri keluarga inti dalam demo ini.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/rahman-founder/640/640",
        statusLabel: "Garis Utama",
        relationshipToRoot: "root",
        childrenIds: ["rahman-son", "rahman-daughter"],
      },
      {
        slugId: "rahman-spouse",
        fullName: "Hj. Siti Rahmah",
        displayName: "Siti Rahmah",
        gender: "female",
        generation: 1,
        familyBranchId: "garis-utama",
        fatherId: null,
        motherId: null,
        spouseIds: ["root-member-id"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: ["keluarga-abdul-rahman"],
        birthDate: "1932",
        marriageDate: "1950",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Bukittinggi",
        biography: "Pasangan pendiri keluarga inti dalam demo ini.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/rahman-spouse/640/640",
        statusLabel: "Garis Utama",
        relationshipToRoot: "spouse",
        childrenIds: ["rahman-son", "rahman-daughter"],
      },
      {
        slugId: "rahman-son",
        fullName: "Fahri Rahman",
        displayName: "Fahri",
        gender: "male",
        generation: 2,
        familyBranchId: "garis-utama",
        fatherId: "root-member-id",
        motherId: "rahman-spouse",
        spouseIds: ["son-spouse"],
        formerSpouseIds: [],
        siblingIds: ["rahman-daughter"],
        parentFamilyId: "keluarga-abdul-rahman",
        nuclearFamilyIds: ["keluarga-fahri"],
        birthDate: "1955",
        marriageDate: "1978",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Padang",
        biography: "Anak pertama dalam demo ini.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/rahman-son/640/640",
        statusLabel: "Garis Utama",
        relationshipToRoot: "child",
        childrenIds: ["grandson-1", "granddaughter-1"],
      },
      {
        slugId: "son-spouse",
        fullName: "Nadia Rahman",
        displayName: "Nadia",
        gender: "female",
        generation: 2,
        familyBranchId: "garis-utama",
        fatherId: null,
        motherId: null,
        spouseIds: ["rahman-son"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: ["keluarga-fahri"],
        birthDate: "1958",
        marriageDate: "1978",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Jakarta",
        biography: "Pasangan anak pertama dalam demo ini.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/son-spouse/640/640",
        statusLabel: "Garis Utama",
        relationshipToRoot: "in-law",
        childrenIds: ["grandson-1", "granddaughter-1"],
      },
      {
        slugId: "rahman-daughter",
        fullName: "Alya Rahman",
        displayName: "Alya",
        gender: "female",
        generation: 2,
        familyBranchId: "cabang-kedua",
        fatherId: "root-member-id",
        motherId: "rahman-spouse",
        spouseIds: ["daughter-spouse"],
        formerSpouseIds: [],
        siblingIds: ["rahman-son"],
        parentFamilyId: "keluarga-abdul-rahman",
        nuclearFamilyIds: [],
        birthDate: "1960",
        marriageDate: "1982",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Padang",
        biography: "Anak kedua dalam demo ini.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/rahman-daughter/640/640",
        statusLabel: "Keluarga Besar",
        relationshipToRoot: "child",
        childrenIds: ["grandchild-2", "grandchild-3"],
      },
      {
        slugId: "daughter-spouse",
        fullName: "Rizky Pratama",
        displayName: "Rizky",
        gender: "male",
        generation: 2,
        familyBranchId: "cabang-kedua",
        fatherId: null,
        motherId: null,
        spouseIds: ["rahman-daughter"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: [],
        birthDate: "1959",
        marriageDate: "1982",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Bandung",
        biography: "Pasangan anak kedua dalam demo ini.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/daughter-spouse/640/640",
        statusLabel: "Keluarga Besar",
        relationshipToRoot: "in-law",
        childrenIds: ["grandchild-2", "grandchild-3"],
      },
      {
        slugId: "grandson-1",
        fullName: "Arga Rahman",
        displayName: "Arga",
        gender: "male",
        generation: 3,
        familyBranchId: "garis-utama",
        fatherId: "rahman-son",
        motherId: "son-spouse",
        spouseIds: [],
        formerSpouseIds: [],
        siblingIds: ["granddaughter-1"],
        parentFamilyId: "keluarga-fahri",
        nuclearFamilyIds: [],
        birthDate: "1985",
        marriageDate: null,
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Jakarta",
        biography: "Cucu generasi ketiga.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/grandson-1/640/640",
        statusLabel: "Anak",
        relationshipToRoot: "grandchild",
        childrenIds: [],
      },
      {
        slugId: "granddaughter-1",
        fullName: "Nara Rahman",
        displayName: "Nara",
        gender: "female",
        generation: 3,
        familyBranchId: "garis-utama",
        fatherId: "rahman-son",
        motherId: "son-spouse",
        spouseIds: [],
        formerSpouseIds: [],
        siblingIds: ["grandson-1"],
        parentFamilyId: "keluarga-fahri",
        nuclearFamilyIds: [],
        birthDate: "1988",
        marriageDate: null,
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Jakarta",
        biography: "Cucu generasi ketiga.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/granddaughter-1/640/640",
        statusLabel: "Anak",
        relationshipToRoot: "grandchild",
        childrenIds: [],
      },
      {
        slugId: "grandchild-2",
        fullName: "Tania Pratama",
        displayName: "Tania",
        gender: "female",
        generation: 3,
        familyBranchId: "cabang-kedua",
        fatherId: "daughter-spouse",
        motherId: "rahman-daughter",
        spouseIds: [],
        formerSpouseIds: [],
        siblingIds: ["grandchild-3"],
        parentFamilyId: null,
        nuclearFamilyIds: [],
        birthDate: "1986",
        marriageDate: null,
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Bandung",
        biography: "Cucu dari cabang kedua.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/grandchild-2/640/640",
        statusLabel: "Anak",
        relationshipToRoot: "grandchild",
        childrenIds: [],
      },
      {
        slugId: "grandchild-3",
        fullName: "Dimas Pratama",
        displayName: "Dimas",
        gender: "male",
        generation: 3,
        familyBranchId: "cabang-kedua",
        fatherId: "daughter-spouse",
        motherId: "rahman-daughter",
        spouseIds: [],
        formerSpouseIds: [],
        siblingIds: ["grandchild-2"],
        parentFamilyId: null,
        nuclearFamilyIds: [],
        birthDate: "1990",
        marriageDate: null,
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Bandung",
        biography: "Cucu dari cabang kedua.",
        notes: "Seed Sprint 3.",
        photo: "https://picsum.photos/seed/grandchild-3/640/640",
        statusLabel: "Anak",
        relationshipToRoot: "grandchild",
        childrenIds: [],
      },
    ] as const;

    const createdMembers = [];
    for (const member of membersToCreate) {
      createdMembers.push(
        await tx.familyMember.create({
          data: {
            familySpaceId: familySpace.id,
            ...member,
          },
        }),
      );
    }

    const memberIdBySlug = new Map(createdMembers.map((member) => [member.slugId, member.id] as const));

    await tx.nuclearFamily.createMany({
      data: [
        {
          familySpaceId: familySpace.id,
          slugId: "keluarga-abdul-rahman",
          name: "Keluarga Abdul Rahman",
          parentIds: ["root-member-id", "rahman-spouse"],
          childIds: ["rahman-son", "rahman-daughter"],
          childrenIds: ["rahman-son", "rahman-daughter"],
          branchId: "garis-utama",
          summary: "Keluarga inti generasi pertama.",
        },
        {
          familySpaceId: familySpace.id,
          slugId: "keluarga-fahri",
          name: "Keluarga Fahri Rahman",
          parentIds: ["rahman-son", "son-spouse"],
          childIds: ["grandson-1", "granddaughter-1"],
          childrenIds: ["grandson-1", "granddaughter-1"],
          branchId: "garis-utama",
          summary: "Keluarga inti generasi kedua.",
        },
        {
          familySpaceId: familySpace.id,
          slugId: "keluarga-alya",
          name: "Keluarga Alya Rahman",
          parentIds: ["rahman-daughter", "daughter-spouse"],
          childIds: ["grandchild-2", "grandchild-3"],
          childrenIds: ["grandchild-2", "grandchild-3"],
          branchId: "cabang-kedua",
          summary: "Keluarga inti cabang kedua.",
        },
      ],
    });

    await tx.timelineEvent.createMany({
      data: [
        {
          familySpaceId: familySpace.id,
          slugId: "rahman-1950-marriage",
          year: "1950",
          type: "Pernikahan",
          title: "Pernikahan Abdul Rahman & Siti Rahmah",
          description: "Awal mula keluarga inti.",
          relatedMemberIds: ["root-member-id", "rahman-spouse"],
          memberIds: ["root-member-id", "rahman-spouse"],
          photo: null,
          isAutomatic: false,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          familySpaceId: familySpace.id,
          slugId: "rahman-1955-birth",
          year: "1955",
          type: "Kelahiran",
          title: "Kelahiran Fahri Rahman",
          description: "Generasi kedua dimulai.",
          relatedMemberIds: ["rahman-son"],
          memberIds: ["rahman-son"],
          photo: null,
          isAutomatic: false,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          familySpaceId: familySpace.id,
          slugId: "rahman-1978-marriage",
          year: "1978",
          type: "Pernikahan",
          title: "Pernikahan Fahri & Nadia",
          description: "Keluarga inti generasi kedua.",
          relatedMemberIds: ["rahman-son", "son-spouse"],
          memberIds: ["rahman-son", "son-spouse"],
          photo: null,
          isAutomatic: false,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          familySpaceId: familySpace.id,
          slugId: "rahman-2005-reunion",
          year: "2005",
          type: "Reuni",
          title: "Reuni Keluarga Rahman",
          description: "Pertemuan besar lintas cabang keluarga.",
          relatedMemberIds: [
            "root-member-id",
            "rahman-spouse",
            "rahman-son",
            "son-spouse",
            "rahman-daughter",
            "daughter-spouse",
          ],
          memberIds: [
            "root-member-id",
            "rahman-spouse",
            "rahman-son",
            "son-spouse",
            "rahman-daughter",
            "daughter-spouse",
          ],
          photo: "https://picsum.photos/seed/rahman-reunion/1200/700",
          isAutomatic: false,
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    });

    await tx.galleryItem.createMany({
      data: [
        {
          familySpaceId: familySpace.id,
          slugId: "gallery-reunion-2005",
          title: "Foto Reuni 2005",
          date: "2005-07-10",
          year: "2005",
          event: "Reuni",
          familyGroup: "Keluarga Besar",
          description: "Dokumentasi reuni keluarga.",
          image: "https://picsum.photos/seed/rahman-gallery-1/1200/800",
          memberId: "root-member-id",
          timelineEventId: "rahman-2005-reunion",
          uploadedById: appUser.id,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          familySpaceId: familySpace.id,
          slugId: "gallery-founder",
          title: "Arsip Pendiri",
          date: "1960-01-01",
          year: "1960",
          event: null,
          familyGroup: "Garis Utama",
          description: "Dokumentasi keluarga inti generasi pertama.",
          image: "https://picsum.photos/seed/rahman-gallery-2/1200/800",
          memberId: "root-member-id",
          timelineEventId: null,
          uploadedById: appUser.id,
          createdAt: now(),
          updatedAt: now(),
        },
        {
          familySpaceId: familySpace.id,
          slugId: "gallery-branch-2",
          title: "Cabang Kedua",
          date: "1990-01-01",
          year: "1990",
          event: null,
          familyGroup: "Cabang Kedua",
          description: "Dokumentasi cabang keluarga kedua.",
          image: "https://picsum.photos/seed/rahman-gallery-3/1200/800",
          memberId: "rahman-daughter",
          timelineEventId: null,
          uploadedById: appUser.id,
          createdAt: now(),
          updatedAt: now(),
        },
      ],
    });

    const storyDraft = await tx.story.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "asal-usul-rahman-draft",
        title: "Asal Usul Keluarga (Draft)",
        content: "Draft cerita asal usul keluarga. (Demo Sprint 3)",
        status: "draft",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const storyApproved = await tx.story.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "asal-usul-rahman",
        title: "Asal Usul Keluarga Rahman",
        content: "Cerita singkat keluarga Rahman untuk demo multi-tenant.",
        status: "approved",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const sourceNoteInterview = await tx.sourceNote.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "wawancara-rahman",
        title: "Wawancara keluarga",
        content: "Ringkasan wawancara singkat. (Demo Sprint 3)",
        type: "interview",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const sourceNoteDocument = await tx.sourceNote.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "dokumen-arsip",
        title: "Dokumen arsip",
        content: "Catatan dokumen yang mendukung cerita. (Demo Sprint 3)",
        type: "document",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const memberId = (slug: string) => {
      const id = memberIdBySlug.get(slug);
      if (!id) throw new Error(`Missing seeded member slug: ${slug}`);
      return id;
    };

    await tx.storyMember.createMany({
      data: [
        { storyId: storyDraft.id, memberId: memberId("root-member-id") },
        { storyId: storyApproved.id, memberId: memberId("root-member-id") },
        { storyId: storyApproved.id, memberId: memberId("rahman-son") },
      ],
    });

    await tx.sourceNoteMember.createMany({
      data: [
        { sourceNoteId: sourceNoteInterview.id, memberId: memberId("root-member-id") },
        { sourceNoteId: sourceNoteInterview.id, memberId: memberId("rahman-spouse") },
        { sourceNoteId: sourceNoteDocument.id, memberId: memberId("rahman-son") },
      ],
    });

    await tx.storySourceNote.createMany({
      data: [
        { storyId: storyApproved.id, sourceNoteId: sourceNoteInterview.id },
        { storyId: storyApproved.id, sourceNoteId: sourceNoteDocument.id },
      ],
    });
  }, { timeout: 30_000 });

  console.log("Seed completed:");
  console.log(`- AppUser: ${demoEmail} (platform_admin)`);
  console.log(`- FamilySpace: ${familySpace.slug}`);
  console.log(`- Membership: owner`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
