import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SupervisorService } from "./supervisor.service";
import { BlockDto } from "./block.dto";
import { AdminGuard } from "../auth/admin.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthUser } from "../auth/jwt-payload";
import {
  AddSupervisionAssignmentDto,
  AssignPlanToGroupDto,
  CreateClinicDto,
  CreateClinicExamDto,
  CreateSemesterClinicCaseDto,
  CreateSemesterDto,
  CreateClinicSupervisorLinkDto,
  CreateClinicTaskDto,
  CreateGroupDto,
  CreateGroupJoinRequestDto,
  CreateGroupPostDto,
  CreatePartnerRequestDto,
  CreateRotationAssignmentDto,
  CreateRotationPlanDto,
  CreateShiftDto,
  CreateSupervisorTaskDto,
  DecidePartnerRequestDto,
  DecisionDto,
  FreezeDoctorDto,
  GradeClinicExamDto,
  GroupDoctorDto,
  GroupSupervisorDto,
  RemovePartnershipDto,
  RemoveSupervisionAssignmentDto,
  ReviewReportDto,
  SaveRotationPlanDaysDto,
  UpdateClinicDto,
  UpdateGroupDto,
  UpdateSemesterClinicCaseDto,
  UpdateSemesterDto,
  UpdateRotationPlanDto,
  UpdateStudentSemesterDto,
  UpdateShiftDto,
} from "./dto";

@ApiTags("supervisor")
@ApiBearerAuth()
@Controller("supervisor")
@UseGuards(JwtAuthGuard)
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  // ---------- Admin-only: account approvals / user management ----------

  @Get("requests")
  @UseGuards(AdminGuard)
  listPending(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.listPending(admin.id);
  }

  @Get("users")
  @UseGuards(AdminGuard)
  listUsers(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.listUsers(admin.id);
  }

  @Post("users/:id/block")
  @UseGuards(AdminGuard)
  blockUser(
    @Param("id") id: string,
    @Body() dto: BlockDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.setBlocked(id, dto.blocked, admin.id);
  }

  @Post("users/:id/delete")
  @UseGuards(AdminGuard)
  deleteUser(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.deleteUser(id, admin.id);
  }

  @Get("doctor-requests")
  @UseGuards(AdminGuard)
  listDoctorPending(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.listDoctorPending(admin.id);
  }

  @Post("doctor-requests/:id/decision")
  @UseGuards(AdminGuard)
  decideDoctor(
    @Param("id") id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.decideDoctor(id, dto.approve, dto.note, admin.id);
  }

  @Post("users/:id/reapprove")
  @UseGuards(AdminGuard)
  reapproveUser(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.reapproveSupervisor(id, admin.id);
  }

  @Post("users/:id/reapprove-doctor")
  @UseGuards(AdminGuard)
  reapproveDoctor(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.reapproveDoctor(id, admin.id);
  }

  @Post("requests/:id/decision")
  @UseGuards(AdminGuard)
  decide(
    @Param("id") id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.decide(id, dto.approve, dto.note, admin.id);
  }

  // ---------- Admin-only: groups ----------

  @Get("groups")
  @UseGuards(AdminGuard)
  listGroups(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.listGroups(admin.id);
  }

  @Get("planning")
  @UseGuards(AdminGuard)
  planningWorkspace(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.planningWorkspace(admin.id);
  }

  @Post("groups")
  @UseGuards(AdminGuard)
  createGroup(@Body() dto: CreateGroupDto, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.createGroup(
      dto.name,
      dto.description,
      dto.semesterLabel,
      admin.id,
    );
  }

  @Post("groups/:id/update")
  @UseGuards(AdminGuard)
  updateGroup(
    @Param("id") id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateGroup(id, dto, admin.id);
  }

  @Post("groups/:id/delete")
  @UseGuards(AdminGuard)
  deleteGroup(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.deleteGroup(id, admin.id);
  }

  // ---------- Admin-only: planning ----------

  @Post("clinics")
  @UseGuards(AdminGuard)
  createClinic(@Body() dto: CreateClinicDto, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.createClinic(dto.name, dto.description, admin.id);
  }

  @Post("clinics/:id/update")
  @UseGuards(AdminGuard)
  updateClinic(
    @Param("id") id: string,
    @Body() dto: UpdateClinicDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateClinic(id, dto, admin.id);
  }

  @Post("clinics/:id/delete")
  @UseGuards(AdminGuard)
  deleteClinic(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.deleteClinic(id, admin.id);
  }

  @Post("shifts")
  @UseGuards(AdminGuard)
  createShift(@Body() dto: CreateShiftDto, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.createShift(
      dto.name,
      dto.startsAt,
      dto.endsAt,
      dto.appointmentCapacity,
      admin.id,
    );
  }

  @Post("shifts/:id/update")
  @UseGuards(AdminGuard)
  updateShift(
    @Param("id") id: string,
    @Body() dto: UpdateShiftDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateShift(id, dto, admin.id);
  }

  @Post("shifts/:id/delete")
  @UseGuards(AdminGuard)
  deleteShift(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.deleteShift(id, admin.id);
  }

  @Post("plans")
  @UseGuards(AdminGuard)
  createRotationPlan(
    @Body() dto: CreateRotationPlanDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.createRotationPlan(
      dto.label,
      dto.startsOn,
      dto.shiftId,
      admin.id,
    );
  }

  @Post("plans/:id/update")
  @UseGuards(AdminGuard)
  updateRotationPlan(
    @Param("id") id: string,
    @Body() dto: UpdateRotationPlanDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateRotationPlan(id, dto, admin.id);
  }

  @Post("plans/:id/delete")
  @UseGuards(AdminGuard)
  deleteRotationPlan(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.deleteRotationPlan(id, admin.id);
  }

  @Post("plans/:id/days")
  @UseGuards(AdminGuard)
  saveRotationPlanDays(
    @Param("id") id: string,
    @Body() dto: SaveRotationPlanDaysDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.saveRotationPlanDays(id, dto.days, admin.id);
  }

  @Post("plans/assign-group")
  @UseGuards(AdminGuard)
  assignPlanToGroup(
    @Body() dto: AssignPlanToGroupDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.assignPlanToGroup(
      dto.planId,
      dto.groupId,
      dto.notes,
      admin.id,
    );
  }

  @Post("plans/assignments")
  @UseGuards(AdminGuard)
  assignGroupToClinicShift(
    @Body() dto: CreateRotationAssignmentDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.assignGroupToClinicShift(
      dto.planId,
      dto.groupId,
      dto.clinicId,
      dto.shiftId,
      dto.assignmentDate,
      dto.notes,
      admin.id,
    );
  }

  @Post("clinics/supervisors")
  @UseGuards(AdminGuard)
  assignSupervisorToClinic(
    @Body() dto: CreateClinicSupervisorLinkDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.assignSupervisorToClinic(
      dto.clinicId,
      dto.supervisorId,
      dto.notes,
      admin.id,
    );
  }

  @Post("clinics/:clinicId/supervisors/:supervisorId/remove")
  @UseGuards(AdminGuard)
  removeSupervisorFromClinic(
    @Param("clinicId") clinicId: string,
    @Param("supervisorId") supervisorId: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.removeSupervisorFromClinic(
      clinicId,
      supervisorId,
      admin.id,
    );
  }

  @Post("clinic-tasks")
  @UseGuards(AdminGuard)
  createClinicTask(
    @Body() dto: CreateClinicTaskDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.createClinicTask(
      dto.clinicId,
      dto.title,
      dto.description,
      admin.id,
    );
  }

  @Post("semesters")
  @UseGuards(AdminGuard)
  createSemester(
    @Body() dto: CreateSemesterDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.createSemester(
      dto.label,
      dto.sortOrder,
      dto.endsOn,
      admin.id,
    );
  }

  @Post("semesters/:id/update")
  @UseGuards(AdminGuard)
  updateSemester(
    @Param("id") id: string,
    @Body() dto: UpdateSemesterDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateSemester(id, dto, admin.id);
  }

  @Post("semesters/:id/delete")
  @UseGuards(AdminGuard)
  deleteSemester(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.deleteSemester(id, admin.id);
  }

  @Post("clinic-cases")
  @UseGuards(AdminGuard)
  createSemesterClinicCase(
    @Body() dto: CreateSemesterClinicCaseDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.createSemesterClinicCase(
      dto.semesterId,
      dto.clinicId,
      dto.title,
      dto.description,
      dto.requiredCount,
      admin.id,
    );
  }

  @Post("clinic-cases/:id/update")
  @UseGuards(AdminGuard)
  updateSemesterClinicCase(
    @Param("id") id: string,
    @Body() dto: UpdateSemesterClinicCaseDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateSemesterClinicCase(id, dto, admin.id);
  }

  @Post("clinic-cases/:id/delete")
  @UseGuards(AdminGuard)
  deleteSemesterClinicCase(
    @Param("id") id: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.deleteSemesterClinicCase(id, admin.id);
  }

  @Get("semesters/progression")
  @UseGuards(AdminGuard)
  semesterProgression(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.semesterProgression(admin.id);
  }

  @Post("semesters/advance")
  @UseGuards(AdminGuard)
  advanceEligibleStudents(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.advanceEligibleStudents(admin.id);
  }

  @Post("users/:id/semester")
  @UseGuards(AdminGuard)
  updateStudentSemester(
    @Param("id") id: string,
    @Body() dto: UpdateStudentSemesterDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.updateStudentSemester(
      id,
      dto.semesterId,
      admin.id,
    );
  }

  @Post("groups/:id/doctors")
  @UseGuards(AdminGuard)
  addDoctorToGroup(
    @Param("id") id: string,
    @Body() dto: GroupDoctorDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.addDoctorToGroup(
      id,
      dto.doctorId,
      dto.note,
      admin.id,
    );
  }

  @Post("groups/:id/doctors/:doctorId/remove")
  @UseGuards(AdminGuard)
  removeDoctorFromGroup(
    @Param("id") id: string,
    @Param("doctorId") doctorId: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.removeDoctorFromGroup(id, doctorId, admin.id);
  }

  @Post("groups/:id/supervisors")
  @UseGuards(AdminGuard)
  addSupervisorToGroup(
    @Param("id") id: string,
    @Body() dto: GroupSupervisorDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.addSupervisorToGroup(
      id,
      dto.supervisorId,
      admin.id,
    );
  }

  @Post("groups/:id/supervisors/:supervisorId/remove")
  @UseGuards(AdminGuard)
  removeSupervisorFromGroup(
    @Param("id") id: string,
    @Param("supervisorId") supervisorId: string,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.removeSupervisorFromGroup(
      id,
      supervisorId,
      admin.id,
    );
  }

  @Get("group-requests")
  @UseGuards(AdminGuard)
  listGroupJoinRequests(@CurrentUser() admin: AuthUser) {
    return this.supervisorService.listGroupJoinRequests(admin.id);
  }

  @Post("group-requests/:id/decision")
  @UseGuards(AdminGuard)
  decideGroupJoinRequest(
    @Param("id") id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.decideGroupJoinRequest(
      id,
      dto.approve,
      dto.note,
      admin.id,
    );
  }

  @Post("partner-requests/:id/decision")
  @UseGuards(AdminGuard)
  decidePartnerRequest(
    @Param("id") id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.supervisorService.decidePartnerRequestByAdmin(
      id,
      dto.approve,
      dto.note,
      admin.id,
    );
  }

  @Post("partner-pairs/:id/remove")
  @UseGuards(AdminGuard)
  removePartnership(@Param("id") id: string, @CurrentUser() admin: AuthUser) {
    return this.supervisorService.removePartnershipByAdmin(id, admin.id);
  }

  // ---------- Supervisor/doctor surface (authenticated user, identifier-style) ----------

  @Get("workspace")
  supervisorWorkspace(@Query("identifier") identifier: string) {
    return this.supervisorService.supervisorWorkspace(identifier);
  }

  @Get("doctor-search")
  searchDoctors(
    @Query("identifier") identifier: string,
    @Query("q") q: string,
  ) {
    return this.supervisorService.searchDoctors(identifier, q);
  }

  @Post("assignments")
  addSupervisionAssignment(@Body() dto: AddSupervisionAssignmentDto) {
    return this.supervisorService.addSupervisionAssignment(
      dto.supervisorIdentifier,
      dto.doctorIdentifier,
      dto.semesterLabel,
      dto.note,
    );
  }

  @Post("assignments/:id/remove")
  removeSupervisionAssignment(
    @Param("id") id: string,
    @Body() dto: RemoveSupervisionAssignmentDto,
  ) {
    return this.supervisorService.removeSupervisionAssignment(
      id,
      dto.supervisorIdentifier,
    );
  }

  @Post("doctors/:id/freeze")
  freezeDoctor(@Param("id") id: string, @Body() dto: FreezeDoctorDto) {
    return this.supervisorService.freezeDoctor(
      id,
      dto.supervisorIdentifier,
      dto.blockedUntil,
      dto.reason,
    );
  }

  @Post("doctors/:id/unfreeze")
  unfreezeDoctor(
    @Param("id") id: string,
    @Body() dto: RemoveSupervisionAssignmentDto,
  ) {
    return this.supervisorService.unfreezeDoctor(id, dto.supervisorIdentifier);
  }

  @Post("tasks")
  createTask(@Body() dto: CreateSupervisorTaskDto) {
    return this.supervisorService.createTask(
      dto.supervisorIdentifier,
      dto.title,
      dto.description,
      dto.dueAt,
      dto.doctorId,
      dto.groupId,
    );
  }

  @Get("reports")
  listReports(@Query("identifier") identifier: string) {
    return this.supervisorService.listReports(identifier);
  }

  @Post("reports/:id/review")
  reviewReport(@Param("id") id: string, @Body() dto: ReviewReportDto) {
    return this.supervisorService.reviewReport(
      id,
      dto.supervisorIdentifier,
      dto.mark,
      dto.rating,
      dto.feedback,
      dto.outcome,
    );
  }

  @Get("doctor-workspace")
  doctorWorkspace(@Query("identifier") identifier: string) {
    return this.supervisorService.doctorWorkspace(identifier);
  }

  @Post("partner-requests")
  createPartnerRequest(@Body() dto: CreatePartnerRequestDto) {
    return this.supervisorService.createPartnerRequest(
      dto.senderIdentifier,
      dto.receiverIdentifier,
      dto.note,
    );
  }

  @Post("group-requests")
  createGroupJoinRequest(@Body() dto: CreateGroupJoinRequestDto) {
    return this.supervisorService.createGroupJoinRequest(
      dto.applicantIdentifier,
      dto.groupId,
      dto.note,
    );
  }

  @Post("groups/:id/posts")
  createGroupPost(@Param("id") id: string, @Body() dto: CreateGroupPostDto) {
    return this.supervisorService.createGroupPost(
      id,
      dto.authorIdentifier,
      dto.title,
      dto.body,
    );
  }

  @Post("exams")
  createClinicExam(@Body() dto: CreateClinicExamDto) {
    return this.supervisorService.createExam(
      dto.supervisorIdentifier,
      dto.studentId,
      dto.clinicId,
      dto.scheduledAt,
      dto.title,
      dto.cases,
      dto.shiftId,
      dto.planId,
      dto.notes,
    );
  }

  @Post("exams/:id/grade")
  gradeClinicExam(@Param("id") id: string, @Body() dto: GradeClinicExamDto) {
    return this.supervisorService.gradeExam(
      id,
      dto.supervisorIdentifier,
      dto.mark,
      dto.notes,
    );
  }
}
