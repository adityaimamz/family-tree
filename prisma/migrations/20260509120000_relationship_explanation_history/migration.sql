-- CreateTable
CREATE TABLE "RelationshipExplanationHistory" (
    "id" TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "relationshipLabel" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "fallbackNote" TEXT NOT NULL,
    "pathMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "inputHash" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastViewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RelationshipExplanationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipExplanationHistory_familySpaceId_fromMemberId_toMembe_key" ON "RelationshipExplanationHistory"("familySpaceId", "fromMemberId", "toMemberId");

-- CreateIndex
CREATE INDEX "RelationshipExplanationHistory_familySpaceId_updatedAt_idx" ON "RelationshipExplanationHistory"("familySpaceId", "updatedAt");

-- CreateIndex
CREATE INDEX "RelationshipExplanationHistory_familySpaceId_fromMemberId_idx" ON "RelationshipExplanationHistory"("familySpaceId", "fromMemberId");

-- CreateIndex
CREATE INDEX "RelationshipExplanationHistory_familySpaceId_toMemberId_idx" ON "RelationshipExplanationHistory"("familySpaceId", "toMemberId");

-- AddForeignKey
ALTER TABLE "RelationshipExplanationHistory" ADD CONSTRAINT "RelationshipExplanationHistory_familySpaceId_fkey" FOREIGN KEY ("familySpaceId") REFERENCES "FamilySpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipExplanationHistory" ADD CONSTRAINT "RelationshipExplanationHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
