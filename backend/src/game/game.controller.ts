import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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

  @Get("questions")
  getQuestions() {
    return { questions: this.gameService.getQuestions() };
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
}
