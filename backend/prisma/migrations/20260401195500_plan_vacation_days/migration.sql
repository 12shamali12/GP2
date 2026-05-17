ALTER TABLE "RotationPlanDay"
ALTER COLUMN "clinicId" DROP NOT NULL;

ALTER TABLE "RotationPlanDay"
ADD COLUMN "isVacation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "vacationReason" TEXT;
