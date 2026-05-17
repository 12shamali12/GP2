import { IsBoolean, IsOptional, IsString } from "class-validator";

export class DecisionDto {
  @IsBoolean()
  approve!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}
