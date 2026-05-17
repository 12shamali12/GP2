import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { UserProfileReportStatus } from "@prisma/client";

export class CreateUserProfileReportDto {
  @IsString()
  @IsNotEmpty()
  reporterIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class ReviewUserProfileReportDto {
  @IsString()
  @IsNotEmpty()
  reviewerIdentifier!: string;

  @IsEnum(UserProfileReportStatus)
  status!: UserProfileReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;
}
