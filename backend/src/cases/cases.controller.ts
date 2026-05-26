import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ClinicCaseProgressStatus } from "@prisma/client";
import { AdminGuard } from "../auth/admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CasesService } from "./cases.service";
import { SetProgressStatusDto } from "./dto";

@ApiTags("cases")
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  // ---------- Admin surface ----------

  @Get("admin/clinic-cases")
  @UseGuards(AdminGuard)
  listClinicCases(
    @Query("semesterId") semesterId?: string,
    @Query("clinicId") clinicId?: string,
    @Query("activeOnly") activeOnly?: string,
  ) {
    return this.cases.listClinicCases({
      semesterId,
      clinicId,
      activeOnly: activeOnly === "true",
    });
  }

  @Patch("admin/clinic-cases/:id/soft-delete")
  @UseGuards(AdminGuard)
  softDelete(@Param("id") id: string) {
    return this.cases.softDeleteClinicCase(id);
  }

  @Patch("admin/clinic-cases/:id/restore")
  @UseGuards(AdminGuard)
  restore(@Param("id") id: string) {
    return this.cases.restoreClinicCase(id);
  }

  @Get("admin/doctor-case-progress")
  @UseGuards(AdminGuard)
  listDoctorProgress(@Query("doctorId") doctorId: string) {
    return this.cases.listDoctorProgress(doctorId);
  }

  @Patch("admin/doctor-case-progress/:id")
  @UseGuards(AdminGuard)
  setStatus(
    @Param("id") id: string,
    @Body() dto: SetProgressStatusDto,
  ) {
    return this.cases.setDoctorProgressStatus(
      id,
      dto.status as ClinicCaseProgressStatus,
    );
  }

  @Delete("admin/doctor-case-progress/:id")
  @UseGuards(AdminGuard)
  deleteProgress(@Param("id") id: string) {
    return this.cases.deleteDoctorProgress(id);
  }

  // ---------- Doctor self-service ----------

  @Get("doctor/case-progress")
  myCases(@Query("identifier") identifier: string) {
    return this.cases.getMyCases(identifier);
  }
}
