import { Module } from "@nestjs/common";
import { SupervisorController } from "./supervisor.controller";
import { SupervisorAdminService } from "./supervisor-admin.service";
import { SupervisorGroupsService } from "./supervisor-groups.service";
import { SupervisorPlanningService } from "./supervisor-planning.service";
import { SupervisorPlanningClinicsService } from "./supervisor-planning-clinics.service";
import { SupervisorPlanningOverviewService } from "./supervisor-planning-overview.service";
import { SupervisorPlanningPlansService } from "./supervisor-planning-plans.service";
import { SupervisorPlanningSemestersService } from "./supervisor-planning-semesters.service";
import { SupervisorService } from "./supervisor.service";
import { SupervisorWorkspaceService } from "./supervisor-workspace.service";
import { SupervisorWorkspaceDoctorService } from "./supervisor-workspace-doctor.service";
import { SupervisorWorkspaceExamsService } from "./supervisor-workspace-exams.service";
import { SupervisorWorkspaceOverviewService } from "./supervisor-workspace-overview.service";
import { SupervisorWorkspaceReportsService } from "./supervisor-workspace-reports.service";
import { SupervisorWorkspaceSupervisionService } from "./supervisor-workspace-supervision.service";
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
    SupervisorPlanningClinicsService,
    SupervisorPlanningOverviewService,
    SupervisorPlanningPlansService,
    SupervisorPlanningSemestersService,
    SupervisorWorkspaceService,
    SupervisorWorkspaceDoctorService,
    SupervisorWorkspaceExamsService,
    SupervisorWorkspaceOverviewService,
    SupervisorWorkspaceReportsService,
    SupervisorWorkspaceSupervisionService,
  ],
})
export class SupervisorModule {}
