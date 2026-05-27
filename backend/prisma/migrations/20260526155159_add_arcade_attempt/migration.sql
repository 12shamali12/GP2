-- CreateEnum
CREATE TYPE "ArcadeGameType" AS ENUM ('PLAQUE_BLASTER', 'TOOTH_DEFENDER', 'FLOSS_RUSH');

-- CreateTable
CREATE TABLE "ArcadeAttempt" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "gameType" "ArcadeGameType" NOT NULL,
    "dateKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "streakLevel" INTEGER NOT NULL DEFAULT 1,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArcadeAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArcadeAttempt_gameType_score_idx" ON "ArcadeAttempt"("gameType", "score");

-- CreateIndex
CREATE INDEX "ArcadeAttempt_patientId_gameType_completedAt_idx" ON "ArcadeAttempt"("patientId", "gameType", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArcadeAttempt_patientId_gameType_dateKey_key" ON "ArcadeAttempt"("patientId", "gameType", "dateKey");

-- AddForeignKey
ALTER TABLE "ArcadeAttempt" ADD CONSTRAINT "ArcadeAttempt_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
