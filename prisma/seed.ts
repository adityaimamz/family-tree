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
      description: "Family Archive of Rahman",
    },
    create: {
      slug: "rahman-archive",
      name: "Rahman Archive",
      description: "Family Archive of Rahman",
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
          slugId: "main-line",
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
          slugId: "second-branch",
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
        familyBranchId: "main-line",
        fatherId: null,
        motherId: null,
        spouseIds: ["rahman-spouse"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: ["abdul-rahman-family"],
        birthDate: "1930",
        marriageDate: "1950",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Padang",
        biography: "",
        notes: "Interview fragment from grandchildren:\n- Born in Padang, 1930.\n- Calm voice, rarely angry.\n- Opened family gatherings with short advice.\n- Often reminded children to stay close after marriage.\n- Married Siti Rahmah in 1950.\n- Family remembers discipline, prayer, and togetherness.",
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
        familyBranchId: "main-line",
        fatherId: null,
        motherId: null,
        spouseIds: ["root-member-id"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: ["abdul-rahman-family"],
        birthDate: "1932",
        marriageDate: "1950",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Bukittinggi",
        biography: "",
        notes: "Raw memory note:\n- Born in Bukittinggi, 1932.\n- Patient, warm, kept family meals organized.\n- Grandchildren remember her kitchen during Eid.\n- She remembered birthdays without writing them down.\n- Often asked relatives to visit each other, not only call.",
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
        familyBranchId: "main-line",
        fatherId: "root-member-id",
        motherId: "rahman-spouse",
        spouseIds: ["son-spouse"],
        formerSpouseIds: [],
        siblingIds: ["rahman-daughter"],
        parentFamilyId: "abdul-rahman-family",
        nuclearFamilyIds: ["fahri-family"],
        birthDate: "1955",
        marriageDate: "1978",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Padang",
        biography: "First child of Abdul Rahman and Siti Rahmah. Needs a warmer family story draft.",
        notes: "Biography fragments:\n- Born in Padang, 1955.\n- First child, often helped younger sibling Alya.\n- Married Nadia in 1978.\n- Family says he was practical and steady.\n- Kept old documents in one folder.\n- Good candidate for AI biography from short notes.",
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
        familyBranchId: "main-line",
        fatherId: null,
        motherId: null,
        spouseIds: ["rahman-son"],
        formerSpouseIds: [],
        siblingIds: [],
        parentFamilyId: null,
        nuclearFamilyIds: ["fahri-family"],
        birthDate: "1958",
        marriageDate: "1978",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Jakarta",
        biography: "",
        notes: "Photo context note:\n- Joined the Rahman family after marrying Fahri in 1978.\n- Born in Jakarta, 1958.\n- Mother of Arga and Nara.\n- Helped prepare reunion food in 2005.\n- Known for remembering school stories from the children.",
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
        familyBranchId: "second-branch",
        fatherId: "root-member-id",
        motherId: "rahman-spouse",
        spouseIds: ["daughter-spouse"],
        formerSpouseIds: [],
        siblingIds: ["rahman-son"],
        parentFamilyId: "abdul-rahman-family",
        nuclearFamilyIds: [],
        birthDate: "1960",
        marriageDate: "1982",
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Padang",
        biography: "",
        notes: "Interview snippets:\n- Born in Padang, 1960.\n- Second child; moved to Bandung after marriage.\n- Married Rizky Pratama in 1982.\n- Often became the bridge between Padang/Jakarta relatives and Bandung branch.\n- Keeps family recipes in a notebook.",
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
        familyBranchId: "second-branch",
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
        biography: "Husband of Alya Rahman from the Bandung branch.",
        notes: "Short notes only:\n- Born in Bandung, 1959.\n- Married Alya in 1982.\n- Quiet personality.\n- Helped host relatives when they visited Bandung.\n- Family remembers him driving people around during reunions.",
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
        familyBranchId: "main-line",
        fatherId: "rahman-son",
        motherId: "son-spouse",
        spouseIds: [],
        formerSpouseIds: [],
        siblingIds: ["granddaughter-1"],
        parentFamilyId: "fahri-family",
        nuclearFamilyIds: [],
        birthDate: "1985",
        marriageDate: null,
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Jakarta",
        biography: "",
        notes: "Memory inbox fragment:\n- Born in Jakarta, 1985.\n- Child of Fahri and Nadia.\n- Helped scan old photos for the family archive.\n- Usually asked older relatives for names in group photos.\n- Good person to mention in digital preservation story.",
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
        familyBranchId: "main-line",
        fatherId: "rahman-son",
        motherId: "son-spouse",
        spouseIds: [],
        formerSpouseIds: [],
        siblingIds: ["grandson-1"],
        parentFamilyId: "fahri-family",
        nuclearFamilyIds: [],
        birthDate: "1988",
        marriageDate: null,
        deathDate: null,
        isDeceased: false,
        deceasedLabel: null,
        birthPlace: "Jakarta",
        biography: "",
        notes: "Small fragments:\n- Born in Jakarta, 1988.\n- Sister of Arga.\n- Keeps cousins connected through family chat.\n- Remembers childhood visits to grandparents.\n- Likes collecting small stories, not just formal dates.",
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
        familyBranchId: "second-branch",
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
        biography: "",
        notes: "Raw notes for AI:\n- Born in Bandung, 1986.\n- Daughter of Alya and Rizky.\n- Often visited Jakarta cousins during school holidays.\n- Family says she asks detailed questions about ancestors.\n- Represents second branch perspective.",
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
        familyBranchId: "second-branch",
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
        biography: "",
        notes: "Very short notes:\n- Born Bandung, 1990.\n- Youngest in second branch sample data.\n- Interested in technology.\n- Suggested using a digital archive after reunion photos were hard to find.",
        photo: "https://picsum.photos/seed/grandchild-3/640/640",
        statusLabel: "Grandchild",
        relationshipToRoot: "Grandchild",
        childrenIds: [],
      },
    ];

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
          slugId: "abdul-rahman-family",
          name: "Abdul Rahman Family",
          parentIds: ["root-member-id", "rahman-spouse"],
          childIds: ["rahman-son", "rahman-daughter"],
          childrenIds: ["rahman-son", "rahman-daughter"],
          branchId: "main-line",
          summary: "First generation nuclear family.",
        },
        {
          familySpaceId: familySpace.id,
          slugId: "fahri-family",
          name: "Fahri Rahman Family",
          parentIds: ["rahman-son", "son-spouse"],
          childIds: ["grandson-1", "granddaughter-1"],
          childrenIds: ["grandson-1", "granddaughter-1"],
          branchId: "main-line",
          summary: "Second generation nuclear family.",
        },
        {
          familySpaceId: familySpace.id,
          slugId: "alya-family",
          name: "Alya Rahman Family",
          parentIds: ["rahman-daughter", "daughter-spouse"],
          childIds: ["grandchild-2", "grandchild-3"],
          childrenIds: ["grandchild-2", "grandchild-3"],
          branchId: "second-branch",
          summary: "Second branch nuclear family.",
        },
      ],
    });

    await tx.timelineEvent.createMany({
      data: [
        {
          familySpaceId: familySpace.id,
          slugId: "rahman-1950-marriage",
          year: "1950",
          type: "Marriage",
          title: "Marriage of Abdul Rahman & Siti Rahmah",
          description: "The beginning of the nuclear family.",
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
          type: "Birth",
          title: "Birth of Fahri Rahman",
          description: "Second generation begins.",
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
          type: "Marriage",
          title: "Marriage of Fahri & Nadia",
          description: "Second generation nuclear family.",
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
          type: "Reunion",
          title: "Rahman Family Reunion",
          description: "Large gathering across family branches.",
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
          title: "2005 Reunion Photo",
          date: "2005-07-10",
          year: "2005",
          event: "Reunion",
          familyGroup: "Extended Family",
          description: "Family reunion documentation.",
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
          title: "Founders Archive",
          date: "1960-01-01",
          year: "1960",
          event: null,
          familyGroup: "Main Line",
          description: "First generation nuclear family documentation.",
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
          title: "Second Branch",
          date: "1990-01-01",
          year: "1990",
          event: null,
          familyGroup: "Second Branch",
          description: "Second family branch documentation.",
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
        slugId: "rahman-origins-draft",
        title: "Family Origins (Draft)",
        content: "Draft of family origin story. (Demo Sprint 3)",
        status: "draft",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const storyApproved = await tx.story.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "rahman-origins",
        title: "Rahman Family Origins",
        content: "Short story of the Rahman family for multi-tenant demo.",
        status: "approved",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const sourceNoteInterview = await tx.sourceNote.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "rahman-interview",
        title: "Family interview",
        content: "Brief interview summary. (Demo Sprint 3)",
        type: "interview",
        createdAt: now(),
        updatedAt: now(),
      },
    });

    const sourceNoteDocument = await tx.sourceNote.create({
      data: {
        familySpaceId: familySpace.id,
        slugId: "archive-documents",
        title: "Archive documents",
        content: "Notes on documents supporting the story. (Demo Sprint 3)",
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

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
