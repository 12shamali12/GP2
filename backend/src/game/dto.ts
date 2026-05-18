import { IsInt, Min } from "class-validator";

export class SubmitQuizAttemptDto {
  @IsInt()
  @Min(0)
  score!: number;

  @IsInt()
  @Min(1)
  total!: number;
}
