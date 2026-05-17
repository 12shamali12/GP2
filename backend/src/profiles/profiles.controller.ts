import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { UserProfileReportStatus } from "@prisma/client";
import { ProfilesService } from "./profiles.service";
import { CreateUserProfileReportDto, ReviewUserProfileReportDto } from "./dto";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get("leaderboard")
  leaderboard() {
    return this.profilesService.getLeaderboard();
  }

  @Get("reports")
  listReports(@Query("identifier") identifier: string) {
    return this.profilesService.listUserReports(identifier);
  }

  @Post("reports/:id/decision")
  decideReport(
    @Param("id") id: string,
    @Body() dto: ReviewUserProfileReportDto,
  ) {
    return this.profilesService.decideUserReport(
      id,
      dto.reviewerIdentifier,
      dto.status as UserProfileReportStatus,
      dto.resolutionNote,
    );
  }

  @Get(":id")
  publicProfile(
    @Param("id") id: string,
    @Query("viewerIdentifier") viewerIdentifier?: string,
  ) {
    return this.profilesService.getPublicProfile(id, viewerIdentifier);
  }

  @Post(":id/report")
  reportUser(@Param("id") id: string, @Body() dto: CreateUserProfileReportDto) {
    return this.profilesService.reportUser(
      id,
      dto.reporterIdentifier,
      dto.reason,
      dto.note,
    );
  }
}
