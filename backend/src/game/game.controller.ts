import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { GameService } from "./game.service";
import { SubmitQuizAttemptDto } from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-payload";

@ApiTags("game")
@ApiBearerAuth()
@Controller("game")
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get("today")
  getToday(@CurrentUser() user: AuthUser | undefined) {
    if (!user) throw new UnauthorizedException();
    return this.gameService.getTodayState(user);
  }

  @Get("daily-questions")
  getDailyQuestions(@CurrentUser() user: AuthUser | undefined) {
    if (!user) throw new UnauthorizedException();
    return this.gameService.getDailyQuestions(user);
  }

  @Post("quiz-attempt")
  submitAttempt(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: SubmitQuizAttemptDto,
  ) {
    if (!user) throw new UnauthorizedException();
    return this.gameService.submitAttempt(user, dto);
  }

  @Get("my-attempts")
  listMyAttempts(@CurrentUser() user: AuthUser | undefined) {
    if (!user) throw new UnauthorizedException();
    return this.gameService.listMyAttempts(user);
  }

  @Get("leaderboard")
  getLeaderboard(
    @CurrentUser() user: AuthUser | undefined,
    @Query("role") role?: string,
  ) {
    if (!user) throw new UnauthorizedException();
    // Whitelist the values we actually support; default to the requester's
    // own role so the rail tab always shows their cohort first.
    let roleFilter: Role | undefined;
    if (role === "PATIENT") roleFilter = Role.PATIENT;
    else if (role === "DOCTOR") roleFilter = Role.DOCTOR;
    else if (user.role === Role.PATIENT) roleFilter = Role.PATIENT;
    return this.gameService.getLeaderboard(roleFilter);
  }
}
