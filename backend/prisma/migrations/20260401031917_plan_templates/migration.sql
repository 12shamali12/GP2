-- AlterTable
ALTER TABLE "RotationPlan" ADD COLUMN     "shiftId" TEXT;

-- CreateTable
CREATE TABLE "RotationPlanDay" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "assignmentDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RotationPlanDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RotationPlanDay_assignmentDate_idx" ON "RotationPlanDay"("assignmentDate");

-- CreateIndex
CREATE INDEX "RotationPlanDay_clinicId_assignmentDate_idx" ON "RotationPlanDay"("clinicId", "assignmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "RotationPlanDay_planId_assignmentDate_key" ON "RotationPlanDay"("planId", "assignmentDate");

-- CreateIndex
CREATE INDEX "RotationPlan_shiftId_idx" ON "RotationPlan"("shiftId");

-- AddForeignKey
ALTER TABLE "RotationPlan" ADD CONSTRAINT "RotationPlan_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "ShiftTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotationPlanDay" ADD CONSTRAINT "RotationPlanDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RotationPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotationPlanDay" ADD CONSTRAINT "RotationPlanDay_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
