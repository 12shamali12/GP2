import { IsIn, IsNotEmpty, IsString } from "class-validator";

export class SetProgressStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(["OPEN", "ASSISTED", "COMPLETED"])
  status!: "OPEN" | "ASSISTED" | "COMPLETED";
}
