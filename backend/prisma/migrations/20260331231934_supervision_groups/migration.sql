-- CreateEnum
CREATE TYPE "GroupJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportReviewStatus" AS ENUM ('SUBMITTED', 'REVIEWED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "blockReason" TEXT,
ADD COLUMN     "blockedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SupervisionAssignment" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "semesterLabel" TEXT NOT NULL,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "SupervisionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorFreeze" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "blockedUntil" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "semesterLabel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "note" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorGroupSupervisor" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoctorGroupSupervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupJoinRequest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "status" "GroupJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "GroupJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPost" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupervisorTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "supervisorId" TEXT NOT NULL,
    "doctorId" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupervisorTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseReport" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "reviewerSupervisorId" TEXT,
    "supervisorName" TEXT,
    "patientName" TEXT,
    "patientPhone" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ReportReviewStatus" NOT NULL DEFAULT 'SUBMITTED',
    "mark" INTEGER,
    "rating" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupervisionAssignment_supervisorId_active_idx" ON "SupervisionAssignment"("supervisorId", "active");

-- CreateIndex
CREATE INDEX "SupervisionAssignment_doctorId_active_idx" ON "SupervisionAssignment"("doctorId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "SupervisionAssignment_supervisorId_doctorId_semesterLabel_key" ON "SupervisionAssignment"("supervisorId", "doctorId", "semesterLabel");

-- CreateIndex
CREATE INDEX "DoctorFreeze_doctorId_blockedUntil_idx" ON "DoctorFreeze"("doctorId", "blockedUntil");

-- CreateIndex
CREATE INDEX "DoctorFreeze_supervisorId_createdAt_idx" ON "DoctorFreeze"("supervisorId", "createdAt");

-- CreateIndex
CREATE INDEX "DoctorGroup_semesterLabel_active_idx" ON "DoctorGroup"("semesterLabel", "active");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorGroupMember_doctorId_key" ON "DoctorGroupMember"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorGroupMember_groupId_doctorId_key" ON "DoctorGroupMember"("groupId", "doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorGroupSupervisor_groupId_supervisorId_key" ON "DoctorGroupSupervisor"("groupId", "supervisorId");

-- CreateIndex
CREATE INDEX "GroupJoinRequest_groupId_status_idx" ON "GroupJoinRequest"("groupId", "status");

-- CreateIndex
CREATE INDEX "GroupJoinRequest_applicantId_status_idx" ON "GroupJoinRequest"("applicantId", "status");

-- CreateIndex
CREATE INDEX "GroupPost_groupId_createdAt_idx" ON "GroupPost"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "SupervisorTask_supervisorId_createdAt_idx" ON "SupervisorTask"("supervisorId", "createdAt");

-- CreateIndex
CREATE INDEX "SupervisorTask_doctorId_createdAt_idx" ON "SupervisorTask"("doctorId", "createdAt");

-- CreateIndex
CREATE INDEX "SupervisorTask_groupId_createdAt_idx" ON "SupervisorTask"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseReport_appointmentId_key" ON "CaseReport"("appointmentId");

-- CreateIndex
CREATE INDEX "CaseReport_doctorId_submittedAt_idx" ON "CaseReport"("doctorId", "submittedAt");

-- CreateIndex
CREATE INDEX "CaseReport_reviewerSupervisorId_status_idx" ON "CaseReport"("reviewerSupervisorId", "status");

-- AddForeignKey
ALTER TABLE "SupervisionAssignment" ADD CONSTRAINT "SupervisionAssignment_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisionAssignment" ADD CONSTRAINT "SupervisionAssignment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFreeze" ADD CONSTRAINT "DoctorFreeze_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorFreeze" ADD CONSTRAINT "DoctorFreeze_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorGroup" ADD CONSTRAINT "DoctorGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorGroupMember" ADD CONSTRAINT "DoctorGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DoctorGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorGroupMember" ADD CONSTRAINT "DoctorGroupMember_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorGroupSupervisor" ADD CONSTRAINT "DoctorGroupSupervisor_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DoctorGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorGroupSupervisor" ADD CONSTRAINT "DoctorGroupSupervisor_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DoctorGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupJoinRequest" ADD CONSTRAINT "GroupJoinRequest_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DoctorGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPost" ADD CONSTRAINT "GroupPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorTask" ADD CONSTRAINT "SupervisorTask_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorTask" ADD CONSTRAINT "SupervisorTask_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupervisorTask" ADD CONSTRAINT "SupervisorTask_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DoctorGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseReport" ADD CONSTRAINT "CaseReport_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseReport" ADD CONSTRAINT "CaseReport_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseReport" ADD CONSTRAINT "CaseReport_reviewerSupervisorId_fkey" FOREIGN KEY ("reviewerSupervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
