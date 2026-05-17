import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  semesterLabel!: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  semesterLabel?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class GroupDoctorDto {
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class GroupSupervisorDto {
  @IsString()
  @IsNotEmpty()
  supervisorId!: string;
}

export class CreateGroupJoinRequestDto {
  @IsString()
  @IsNotEmpty()
  applicantIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  groupId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateGroupPostDto {
  @IsString()
  @IsNotEmpty()
  authorIdentifier!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class CreatePartnerRequestDto {
  @IsString()
  @IsNotEmpty()
  senderIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  receiverIdentifier!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class DecidePartnerRequestDto {
  @IsString()
  @IsNotEmpty()
  receiverIdentifier!: string;

  @IsBoolean()
  approve!: boolean;
}

export class RemovePartnershipDto {
  @IsString()
  @IsNotEmpty()
  doctorIdentifier!: string;
}
