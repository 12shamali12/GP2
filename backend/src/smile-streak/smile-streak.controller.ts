import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SmileStreakService } from "./smile-streak.service";
import { SmileBulkImportDto, SmileCheckinDto } from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-payload";

@ApiTags("smile-streak")
@ApiBearerAuth()
@Controller("smile-streak")
@UseGuards(JwtAuthGuard)
export class SmileStreakController {
  constructor(private readonly smileService: SmileStreakService) {}

  @Get("me")
  getMine(@CurrentUser() user: AuthUser | undefined) {
    if (!user) throw new UnauthorizedException();
    return this.smileService.getMine(user);
  }

  @Post("checkin")
  submit(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: SmileCheckinDto,
  ) {
    if (!user) throw new UnauthorizedException();
    return this.smileService.submit(user, dto);
  }

  @Post("import")
  bulkImport(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: SmileBulkImportDto,
  ) {
    if (!user) throw new UnauthorizedException();
    return this.smileService.bulkImport(user, dto.entries);
  }

  // Public to all authenticated users — the patient leaderboard is the
  // primary consumer, but doctors / supervisors can peek too.
  @Get("leaderboard")
  leaderboard(@CurrentUser() user: AuthUser | undefined) {
    if (!user) throw new UnauthorizedException();
    return this.smileService.leaderboard();
  }
}
