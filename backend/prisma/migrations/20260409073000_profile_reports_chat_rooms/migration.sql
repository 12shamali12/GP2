-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('DIRECT', 'ROOM');

-- CreateEnum
CREATE TYPE "ConversationRoomAudience" AS ENUM ('GROUP', 'ALL_USERS', 'STUDENTS_SUPERVISORS', 'SUPERVISORS_ONLY');

-- CreateEnum
CREATE TYPE "UserProfileReportStatus" AS ENUM ('PENDING', 'DISMISSED', 'ACTION_TAKEN');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "audience" "ConversationRoomAudience",
ADD COLUMN     "code" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "kind" "ConversationKind" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "UserProfileReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "status" "UserProfileReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfileReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserProfileReport_status_createdAt_idx" ON "UserProfileReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "UserProfileReport_reportedUserId_status_idx" ON "UserProfileReport"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "UserProfileReport_reporterId_createdAt_idx" ON "UserProfileReport"("reporterId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_code_key" ON "Conversation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_groupId_key" ON "Conversation"("groupId");

-- CreateIndex
CREATE INDEX "Conversation_kind_updatedAt_idx" ON "Conversation"("kind", "updatedAt");

-- CreateIndex
CREATE INDEX "Conversation_audience_idx" ON "Conversation"("audience");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DoctorGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileReport" ADD CONSTRAINT "UserProfileReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileReport" ADD CONSTRAINT "UserProfileReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileReport" ADD CONSTRAINT "UserProfileReport_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
