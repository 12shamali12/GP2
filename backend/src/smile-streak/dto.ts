import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

/**
 * One day's check-in. The score is computed server-side from the booleans
 * so the client cannot inflate its own lifetime total.
 */
export class SmileCheckinDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "dateKey must be YYYY-MM-DD" })
  dateKey!: string;

  @IsBoolean()
  brushingPatternDone!: boolean;

  @IsBoolean()
  flossed!: boolean;

  @IsBoolean()
  mouthwash!: boolean;

  @IsBoolean()
  water!: boolean;
}

/**
 * Bulk import — used once on first login to migrate the patient's existing
 * localStorage history. Anything older than the per-day cutoff still wins
 * over an empty server record (upsert semantics).
 */
export class SmileBulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SmileCheckinDto)
  entries!: SmileCheckinDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  /** Allowed for backfill paths — server validates date format. */
  __reserved?: number;
}
