-- CreateTable
CREATE TABLE "SmileCheckin" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "brushingPatternDone" BOOLEAN NOT NULL DEFAULT false,
    "flossed" BOOLEAN NOT NULL DEFAULT false,
    "mouthwash" BOOLEAN NOT NULL DEFAULT false,
    "water" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmileCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmileCheckin_patientId_dateKey_idx" ON "SmileCheckin"("patientId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "SmileCheckin_patientId_dateKey_key" ON "SmileCheckin"("patientId", "dateKey");

-- AddForeignKey
ALTER TABLE "SmileCheckin" ADD CONSTRAINT "SmileCheckin_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
