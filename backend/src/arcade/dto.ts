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

  // Difficulty level the player chose for this run (1..11). Level 11 is
  // the endless "open" mode. The service clamps to their unlocked range
  // before persisting, so a tampered client can't claim a high level
  // without earning it.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(11)
  level?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60 * 60 * 1000)
  durationMs?: number;
}
