CREATE TABLE "ClinicSupervisorLink" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicSupervisorLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClinicSupervisorLink_clinicId_supervisorId_key"
ON "ClinicSupervisorLink"("clinicId", "supervisorId");

CREATE INDEX "ClinicSupervisorLink_supervisorId_idx"
ON "ClinicSupervisorLink"("supervisorId");

CREATE INDEX "ClinicSupervisorLink_clinicId_idx"
ON "ClinicSupervisorLink"("clinicId");

ALTER TABLE "ClinicSupervisorLink"
ADD CONSTRAINT "ClinicSupervisorLink_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicSupervisorLink"
ADD CONSTRAINT "ClinicSupervisorLink_supervisorId_fkey"
FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
