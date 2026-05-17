import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateClinicDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateClinicDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  startsAt!: string;

  @IsString()
  @IsNotEmpty()
  endsAt!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  appointmentCapacity?: number;
}

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  appointmentCapacity?: number;
}

export class CreateRotationPlanDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsDateString()
  startsOn!: string;

  @IsString()
  @IsNotEmpty()
  shiftId!: string;
}

export class UpdateRotationPlanDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsDateString()
  startsOn?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  shiftId?: string;
}

export class RotationPlanDayInputDto {
  @IsDateString()
  assignmentDate!: string;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsBoolean()
  isVacation?: boolean;

  @IsOptional()
  @IsString()
  vacationReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaveRotationPlanDaysDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RotationPlanDayInputDto)
  days!: RotationPlanDayInputDto[];
}

export class AssignPlanToGroupDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRotationAssignmentDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsString()
  @IsNotEmpty()
  clinicId!: string;

  @IsString()
  @IsNotEmpty()
  shiftId!: string;

  @IsDateString()
  assignmentDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateClinicSupervisorLinkDto {
  @IsString()
  @IsNotEmpty()
  clinicId!: string;

  @IsString()
  @IsNotEmpty()
  supervisorId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateClinicTaskDto {
  @IsString()
  @IsNotEmpty()
  clinicId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSemesterDto {
  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  endsOn?: string;
}

export class UpdateSemesterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  label?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsDateString()
  endsOn?: string;
}

export class CreateSemesterClinicCaseDto {
  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @IsString()
  @IsNotEmpty()
  clinicId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requiredCount?: number;
}

export class UpdateSemesterClinicCaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  semesterId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  clinicId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requiredCount?: number;
}

export class UpdateStudentSemesterDto {
  @IsOptional()
  @IsString()
  semesterId?: string;
}
