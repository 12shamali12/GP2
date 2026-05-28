import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ArcadeGameType } from "@prisma/client";
import { ArcadeService } from "./arcade.service";
import { SubmitArcadeScoreDto } from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-payload";

@ApiTags("arcade")
@ApiBearerAuth()
@Controller("arcade")
@UseGuards(JwtAuthGuard)
export class ArcadeController {
  constructor(private readonly arcadeService: ArcadeService) {}

  @Get("today")
  getTodayStatus(@CurrentUser() user: AuthUser | undefined) {
    if (!user) throw new UnauthorizedException();
    return this.arcadeService.getTodayStatus(user);
  }

  @Post("score")
  submit(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: SubmitArcadeScoreDto,
  ) {
    if (!user) throw new UnauthorizedException();
    return this.arcadeService.submitScore(user, dto);
  }

  @Get("leaderboard")
  leaderboard(
    @CurrentUser() user: AuthUser | undefined,
    @Query("game") game?: string,
    @Query("level") level?: string,
  ) {
    if (!user) throw new UnauthorizedException();
    if (!game || !(game in ArcadeGameType)) {
      throw new BadRequestException(
        "Query parameter 'game' must be one of: PLAQUE_BLASTER, TOOTH_DEFENDER, FLOSS_RUSH.",
      );
    }
    let levelFilter: number | undefined;
    if (level !== undefined && level !== "") {
      const parsed = Number(level);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 11) {
        throw new BadRequestException(
          "Query parameter 'level' must be an integer between 1 and 11.",
        );
      }
      levelFilter = parsed;
    }
    return this.arcadeService.getLeaderboard(
      game as ArcadeGameType,
      levelFilter,
    );
  }
}
