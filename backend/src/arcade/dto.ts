import { ArcadeGameType } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class SubmitArcadeScoreDto {
  @IsEnum(ArcadeGameType)
  gameType!: ArcadeGameType;

  // Hard upper bound stops a tampered client from posting absurd scores.
  // Each game is balanced to top out well below this.
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  score!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 1000)
  durationMs?: number;
}
