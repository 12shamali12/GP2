import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class AddSupervisionAssignmentDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  semesterLabel!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RemoveSupervisionAssignmentDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;
}

export class FreezeDoctorDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;

  @IsDateString()
  blockedUntil!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateSupervisorTaskDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;
}

export class ReviewReportDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  mark!: number;

  @IsNumber()
  @Min(0.5)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsIn(["REVIEWED", "NEEDS_EDIT", "CASE_REJECTED"])
  outcome?: "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED";
}

export class CreateClinicExamDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  clinicId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  cases?: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class GradeClinicExamDto {
  @IsString()
  @IsNotEmpty()
  supervisorIdentifier!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  mark!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
