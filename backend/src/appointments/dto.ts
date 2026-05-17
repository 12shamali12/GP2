import { IsArray, IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSlotDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsOptional()
  @IsString()
  purpose?: string;
}

export class BookSlotDto {
  @IsString()
  @IsNotEmpty()
  patientIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  slotId!: string;

  @IsOptional()
  @IsString()
  clinicCaseId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class DecisionDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;

  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CancelDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class DeleteSlotDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;
}

export class CancelPatientDto {
  @IsString()
  @IsNotEmpty()
  patientIdentifier!: string;
}

export class CompleteAppointmentDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;

  @IsOptional()
  @IsString()
  completionNotes?: string;
}

export class RateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsNumber()
  @Min(0.5)
  @Max(5)
  stars!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReportSubmittedDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  patientPhone?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsString()
  supervisorName?: string;

  @IsOptional()
  @IsString()
  supervisorIdentifier?: string;

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @IsString()
  rotationAssignmentId?: string;

  @IsOptional()
  @IsString()
  partnerDoctorId?: string;

  @IsOptional()
  @IsArray()
  taskIds?: string[];

  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}
