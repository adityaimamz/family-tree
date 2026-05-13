/*
  Warnings:

  - You are about to drop the column `status` on the `Story` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StoryOrigin" AS ENUM ('manual', 'ai_biography', 'ai_timeline');

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "status",
ADD COLUMN     "origin" "StoryOrigin" NOT NULL DEFAULT 'manual';

-- DropEnum
DROP TYPE "StoryStatus";
