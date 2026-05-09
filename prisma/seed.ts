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
          name: "Main Line",
          headMemberIds: ["root-member-id"],
          spouseId: "rahman-spouse",
          description: "The main family branch started by H. Abdul Rahman and Hj. Siti Rahmah.",
          summary: "Beginning from the family founders, serving as the core for spreading to subsequent generations.",
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
          name: "Second Branch",
          headMemberIds: ["rahman-daughter"],
          spouseId: "daughter-spouse",
          description: "The second family branch started by Alya Rahman and Rizky Pratama in Bandung.",
          summary: "The journey of the family branch developing in Bandung, maintaining connections with the Main Line.",
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
        biography: "H. Abdul Rahman is remembered as the starting figure of the Rahman family archive. Born in Padang in 1930, he was known as a calm, responsible, and deeply respected elder in the family. Family members remember him for valuing togetherness, discipline, and care for younger generations. His marriage to Hj. Siti Rahmah in 1950 marked the beginning of the core family unit that continues to grow and be preserved in this family archive today.",
        notes: "H. Abdul Rahman is remembered as the starting figure of the Rahman family archive.\n\nBorn in Padang in 1930, known as a calm, responsible, and deeply respected elder.\n\nFamily members remember him for valuing togetherness, discipline, and care for younger generations.\n\nHis life marks the beginning of the preserved family milestones in this archive.",
        photo: "https://picsum.photos/seed/rahman-founder/640/640",
        statusLabel: "Family Founder",
        relationshipToRoot: "Family Founder",
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
        biography: "Hj. Siti Rahmah was the life partner of H. Abdul Rahman, always supporting the family's journey. Born in Bukittinggi in 1932, she was known as a compassionate, patient person who maintained family warmth. Her presence brought beautiful memories to every family gathering, and she was always the connector that united all family members. Through this archive, her story lives on and can be passed down to future generations.",
        notes: "Hj. Siti Rahmah was the life partner of H. Abdul Rahman, always supporting the family's journey.\n\nBorn in Bukittinggi in 1932, known as a compassionate, patient person who maintained family warmth.\n\nMemories of her are always associated with family gatherings and important events.\n\nHer contribution to maintaining family bonds is a cherished legacy.",
        photo: "https://picsum.photos/seed/rahman-spouse/640/640",
        statusLabel: "Spouse",
        relationshipToRoot: "Spouse",
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
        biography: "Fahri Rahman is the first child of H. Abdul Rahman and Hj. Siti Rahmah. Born in Padang in 1955, he carried forward family values with dedication. Through his marriage to Nadia, Fahri built a new family that became the bridge between the first and third generations in the Rahman family history. His career and family life were always based on the principles of harmony and mutual respect that he learned from his parents.",
        notes: "Fahri Rahman is the first child of H. Abdul Rahman and Hj. Siti Rahmah.\n\nBorn in Padang in 1955, he carried forward family values with dedication.\n\nHis marriage to Nadia in 1978 created a new family connecting the first and third generations.\n\nHis family life was always based on principles of harmony and mutual respect.",
        photo: "https://picsum.photos/seed/rahman-son/640/640",
        statusLabel: "Child",
        relationshipToRoot: "Child",
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
        biography: "Nadia is Fahri Rahman's wife who joined the family in 1978. As the mother of Arga and Nara, she played an important role in sustaining the third generation of the Rahman family. Her presence brought warmth and freshness to the family, and she always supported every family activity. Her active involvement in her children's education and character development became an inspiration to the extended family.",
        notes: "Nadia is Fahri Rahman's wife who joined the family in 1978.\n\nBorn in Jakarta in 1958, she brought warmth and freshness to the family.\n\nAs mother of Arga and Nara, she played an important role in sustaining the third generation.\n\nHer active involvement in children's education and character development inspired the family.",
        photo: "https://picsum.photos/seed/son-spouse/640/640",
        statusLabel: "In-Law",
        relationshipToRoot: "In-Law",
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
        biography: "Alya Rahman is the second child of H. Abdul Rahman and Hj. Siti Rahmah, representing the beginning of the second family branch. Through her marriage to Rizky Pratama, she built a bridge between the Main Line and the new family branch. Her family life in Bandung brought diversity and new richness to the Rahman family history, making the story of inter-branch relationships easier to understand in the family archive.",
        notes: "Alya Rahman is the second child of H. Abdul Rahman and Hj. Siti Rahmah.\n\nBorn in Padang in 1960, she represents the beginning of the second family branch.\n\nHer marriage to Rizky Pratama in 1982 became a bridge between the Main Line and the new branch.\n\nHer family life in Bandung brought diversity and new richness to family history.",
        photo: "https://picsum.photos/seed/rahman-daughter/640/640",
        statusLabel: "Child",
        relationshipToRoot: "Child",
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
        biography: "Rizky Pratama is Alya Rahman's husband who brought the family to Bandung. Through his marriage, he became an important connector between the Rahman family's Main Line and the new branch developing in Bandung. His presence in the family archive helps visualize how inter-branch relationships formed and developed. His contribution to maintaining harmony between family branches is deeply appreciated by all family members.",
        notes: "Rizky Pratama is Alya Rahman's husband who brought the family to Bandung.\n\nBorn in Bandung in 1959, he became a connector between the Main Line and the new branch.\n\nHis presence in the archive helps visualize the formation and development of inter-branch relationships.\n\nHis contribution to maintaining inter-branch harmony is deeply appreciated.",
        photo: "https://picsum.photos/seed/daughter-spouse/640/640",
        statusLabel: "In-Law",
        relationshipToRoot: "In-Law",
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
        biography: "Arga Rahman is a third-generation grandchild of H. Abdul Rahman and Hj. Siti Rahmah. As the child of Fahri and Nadia, he represents the continuation of the family's Main Line. Born in Jakarta in 1985, Arga had the opportunity to witness the development of family history across generations. His active involvement in family activities proves that the values passed down by his grandparents still live on in him.",
        notes: "Arga Rahman is a third-generation grandchild of H. Abdul Rahman and Hj. Siti Rahmah.\n\nAs child of Fahri and Nadia, he represents the continuation of the Main Line.\n\nBorn in Jakarta in 1985, he witnessed the development of family history across generations.\n\nHis active involvement in family activities proves that inherited values still live on.",
        photo: "https://picsum.photos/seed/grandson-1/640/640",
        statusLabel: "Grandchild",
        relationshipToRoot: "Grandchild",
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
        biography: "Nara Rahman is a third-generation granddaughter who brings joy to the family. As Arga's sister, she shares the same childhood memories in Jakarta. Nara is known as a warm person who always maintains communication with all family members, ensuring that intergenerational bonds remain strong and close.",
        notes: "Nara Rahman is a third-generation granddaughter of H. Abdul Rahman and Hj. Siti Rahmah.\n\nAs Arga's sister, she shares the same childhood memories in Jakarta.\n\nKnown as a warm person who always maintains communication with all family members.\n\nHer role in keeping intergenerational bonds strong is deeply valued.",
        photo: "https://picsum.photos/seed/granddaughter-1/640/640",
        statusLabel: "Grandchild",
        relationshipToRoot: "Grandchild",
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
        biography: "Tania Pratama is Alya Rahman's granddaughter who represents the family's second branch in Bandung. As a third-generation member, she serves as an emotional connector between the Main Line and the branch developing in a different city. Her life in Bandung provides a unique perspective on how Rahman family values adapt to new environments while maintaining family identity and traditions.",
        notes: "Tania Pratama is Alya Rahman's granddaughter representing the second family branch.\n\nBorn in Bandung in 1986, she connects the Main Line with the branch in another city.\n\nHer life in Bandung provides a unique perspective on family value adaptation.\n\nShe maintains communication with the Main Line family.",
        photo: "https://picsum.photos/seed/grandchild-2/640/640",
        statusLabel: "Grandchild",
        relationshipToRoot: "Grandchild",
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
        biography: "Dimas Pratama is Alya and Rizky's grandson who completes the family's second branch in Bandung. Growing up in Bandung brought fresh energy and new hope for the younger generation. Dimas has a strong interest in technology, and this interest opens new possibilities for digital family archive preservation, allowing family memories to be stored and shared with more people.",
        notes: "Dimas Pratama is Alya and Rizky's grandson who completes the second family branch.\n\nBorn in Bandung in 1990, he completes the third generation in the second branch.\n\nDimas has a strong interest in technology and digital innovation.\n\nHis interests open new possibilities for digital archive preservation and sharing.",
        photo: "https://picsum.photos/seed/grandchild-3/640/640",
        statusLabel: "Grandchild",
        relationshipToRoot: "Grandchild",
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
