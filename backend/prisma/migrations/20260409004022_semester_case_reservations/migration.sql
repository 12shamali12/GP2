-- CreateEnum
CREATE TYPE "ClinicCaseProgressStatus" AS ENUM ('OPEN', 'ASSISTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AppointmentRatingKind" AS ENUM ('PATIENT_TO_DOCTOR', 'SUPERVISOR_TO_DOCTOR', 'DOCTOR_TO_PATIENT');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReportReviewStatus" ADD VALUE 'NEEDS_EDIT';
ALTER TYPE "ReportReviewStatus" ADD VALUE 'CASE_REJECTED';

-- AlterEnum
ALTER TYPE "SlotStatus" ADD VALUE 'PAIR_BLOCKED';

-- DropForeignKey
ALTER TABLE "RotationPlanDay" DROP CONSTRAINT "RotationPlanDay_clinicId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "clinicCaseId" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "doctorCompletionNotes" TEXT,
ADD COLUMN     "partnerDoctorId" TEXT;

-- AlterTable
ALTER TABLE "CaseReport" ADD COLUMN     "formData" JSONB,
ALTER COLUMN "rating" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ClinicSupervisorLink" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "semesterId" TEXT;

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "endsOn" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SemesterClinicCase" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemesterClinicCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorClinicCaseProgress" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "clinicCaseId" TEXT NOT NULL,
    "status" "ClinicCaseProgressStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "lastReportId" TEXT,
    "lastAppointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorClinicCaseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRating" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "kind" "AppointmentRatingKind" NOT NULL,
    "stars" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Semester_label_key" ON "Semester"("label");

-- CreateIndex
CREATE INDEX "Semester_sortOrder_active_idx" ON "Semester"("sortOrder", "active");

-- CreateIndex
CREATE INDEX "SemesterClinicCase_clinicId_active_idx" ON "SemesterClinicCase"("clinicId", "active");

-- CreateIndex
CREATE INDEX "SemesterClinicCase_semesterId_active_idx" ON "SemesterClinicCase"("semesterId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterClinicCase_semesterId_clinicId_title_key" ON "SemesterClinicCase"("semesterId", "clinicId", "title");

-- CreateIndex
CREATE INDEX "DoctorClinicCaseProgress_clinicCaseId_status_idx" ON "DoctorClinicCaseProgress"("clinicCaseId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorClinicCaseProgress_doctorId_clinicCaseId_key" ON "DoctorClinicCaseProgress"("doctorId", "clinicCaseId");

-- CreateIndex
CREATE INDEX "AppointmentRating_targetId_active_idx" ON "AppointmentRating"("targetId", "active");

-- CreateIndex
CREATE INDEX "AppointmentRating_appointmentId_kind_idx" ON "AppointmentRating"("appointmentId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRating_appointmentId_raterId_kind_key" ON "AppointmentRating"("appointmentId", "raterId", "kind");

-- CreateIndex
CREATE INDEX "Appointment_clinicCaseId_idx" ON "Appointment"("clinicCaseId");

-- CreateIndex
CREATE INDEX "User_semesterId_idx" ON "User"("semesterId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_partnerDoctorId_fkey" FOREIGN KEY ("partnerDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicCaseId_fkey" FOREIGN KEY ("clinicCaseId") REFERENCES "SemesterClinicCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterClinicCase" ADD CONSTRAINT "SemesterClinicCase_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterClinicCase" ADD CONSTRAINT "SemesterClinicCase_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotationPlanDay" ADD CONSTRAINT "RotationPlanDay_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinicCaseProgress" ADD CONSTRAINT "DoctorClinicCaseProgress_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorClinicCaseProgress" ADD CONSTRAINT "DoctorClinicCaseProgress_clinicCaseId_fkey" FOREIGN KEY ("clinicCaseId") REFERENCES "SemesterClinicCase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRating" ADD CONSTRAINT "AppointmentRating_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRating" ADD CONSTRAINT "AppointmentRating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRating" ADD CONSTRAINT "AppointmentRating_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
