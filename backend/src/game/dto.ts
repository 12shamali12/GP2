import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class AnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  @Max(3)
  selectedIndex!: number;

  @IsInt()
  @Min(0)
  timeMs!: number;
}

export class SubmitQuizAttemptDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}
