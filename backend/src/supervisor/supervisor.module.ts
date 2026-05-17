import { Module } from "@nestjs/common";
import { SupervisorController } from "./supervisor.controller";
import { SupervisorAdminService } from "./supervisor-admin.service";
import { SupervisorGroupsService } from "./supervisor-groups.service";
import { SupervisorPlanningService } from "./supervisor-planning.service";
import { SupervisorService } from "./supervisor.service";
import { SupervisorWorkspaceService } from "./supervisor-workspace.service";
import { PrismaModule } from "../prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SupervisorController],
  providers: [
    SupervisorService,
    SupervisorAdminService,
    SupervisorGroupsService,
    SupervisorPlanningService,
    SupervisorWorkspaceService,
  ],
})
export class SupervisorModule {}
