-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('user', 'platform_admin');

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('draft', 'in_review', 'approved');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('note', 'photo_context', 'interview', 'document', 'chat');

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilySpace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilySpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "familyBranchId" TEXT NOT NULL,
    "fatherId" TEXT,
    "motherId" TEXT,
    "spouseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "formerSpouseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "siblingIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parentFamilyId" TEXT,
    "nuclearFamilyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "birthDate" TEXT,
    "marriageDate" TEXT,
    "deathDate" TEXT,
    "isDeceased" BOOLEAN NOT NULL DEFAULT false,
    "deceasedLabel" TEXT,
    "birthPlace" TEXT,
    "biography" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "photo" TEXT,
    "statusLabel" TEXT NOT NULL,
    "relationshipToRoot" TEXT NOT NULL,
    "childrenIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyBranch" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "headMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "spouseId" TEXT,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "memberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color" TEXT,

    CONSTRAINT "FamilyBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NuclearFamily" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "childIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "childrenIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "branchId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "NuclearFamily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "relatedMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "memberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photo" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "event" TEXT,
    "familyGroup" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "memberId" TEXT,
    "timelineEventId" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceNote" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "slugId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "SourceType" NOT NULL DEFAULT 'note',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryMember" (
    "storyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "StoryMember_pkey" PRIMARY KEY ("storyId","memberId")
);

-- CreateTable
CREATE TABLE "SourceNoteMember" (
    "sourceNoteId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "SourceNoteMember_pkey" PRIMARY KEY ("sourceNoteId","memberId")
);

-- CreateTable
CREATE TABLE "StorySourceNote" (
    "storyId" TEXT NOT NULL,
    "sourceNoteId" TEXT NOT NULL,

    CONSTRAINT "StorySourceNote_pkey" PRIMARY KEY ("storyId","sourceNoteId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_authUserId_key" ON "AppUser"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FamilySpace_slug_key" ON "FamilySpace"("slug");

-- CreateIndex
CREATE INDEX "FamilyMembership_familySpaceId_idx" ON "FamilyMembership"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMembership_userId_familySpaceId_key" ON "FamilyMembership"("userId", "familySpaceId");

-- CreateIndex
CREATE INDEX "FamilyMember_familySpaceId_familyBranchId_idx" ON "FamilyMember"("familySpaceId", "familyBranchId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familySpaceId_slugId_key" ON "FamilyMember"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "FamilyBranch_familySpaceId_idx" ON "FamilyBranch"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyBranch_familySpaceId_slugId_key" ON "FamilyBranch"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "NuclearFamily_familySpaceId_branchId_idx" ON "NuclearFamily"("familySpaceId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "NuclearFamily_familySpaceId_slugId_key" ON "NuclearFamily"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "TimelineEvent_familySpaceId_idx" ON "TimelineEvent"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_familySpaceId_slugId_key" ON "TimelineEvent"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "GalleryItem_familySpaceId_idx" ON "GalleryItem"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "GalleryItem_familySpaceId_slugId_key" ON "GalleryItem"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "Story_familySpaceId_idx" ON "Story"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Story_familySpaceId_slugId_key" ON "Story"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "SourceNote_familySpaceId_idx" ON "SourceNote"("familySpaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceNote_familySpaceId_slugId_key" ON "SourceNote"("familySpaceId", "slugId");

-- CreateIndex
CREATE INDEX "StoryMember_memberId_idx" ON "StoryMember"("memberId");

-- CreateIndex
CREATE INDEX "SourceNoteMember_memberId_idx" ON "SourceNoteMember"("memberId");

-- CreateIndex
CREATE INDEX "StorySourceNote_sourceNoteId_idx" ON "StorySourceNote"("sourceNoteId");

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMembership" ADD CONSTRAINT "FamilyMembership_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familySpaceId_familyBranchId_fkey" FOREIGN KEY ("familySpaceId", "familyBranchId") REFERENCES "FamilyBranch"("familySpaceId", "slugId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyBranch" ADD CONSTRAINT "FamilyBranch_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NuclearFamily" ADD CONSTRAINT "NuclearFamily_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NuclearFamily" ADD CONSTRAINT "NuclearFamily_familySpaceId_branchId_fkey" FOREIGN KEY ("familySpaceId", "branchId") REFERENCES "FamilyBranch"("familySpaceId", "slugId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GalleryItem" ADD CONSTRAINT "GalleryItem_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceNote" ADD CONSTRAINT "SourceNote_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMember" ADD CONSTRAINT "StoryMember_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryMember" ADD CONSTRAINT "StoryMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceNoteMember" ADD CONSTRAINT "SourceNoteMember_sourceNoteId_fkey" FOREIGN KEY ("sourceNoteId") REFERENCES "SourceNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceNoteMember" ADD CONSTRAINT "SourceNoteMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorySourceNote" ADD CONSTRAINT "StorySourceNote_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorySourceNote" ADD CONSTRAINT "StorySourceNote_sourceNoteId_fkey" FOREIGN KEY ("sourceNoteId") REFERENCES "SourceNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
