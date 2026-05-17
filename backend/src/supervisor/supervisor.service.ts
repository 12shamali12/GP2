import { Injectable } from "@nestjs/common";
import { SupervisorAdminService } from "./supervisor-admin.service";
import { SupervisorGroupsService } from "./supervisor-groups.service";
import { SupervisorPlanningService } from "./supervisor-planning.service";
import { SupervisorWorkspaceService } from "./supervisor-workspace.service";

@Injectable()
export class SupervisorService {
  constructor(
    private readonly adminService: SupervisorAdminService,
    private readonly groupsService: SupervisorGroupsService,
    private readonly planningService: SupervisorPlanningService,
    private readonly workspaceService: SupervisorWorkspaceService,
  ) {}

  listPending(adminId: string) {
    return this.adminService.listPending(adminId);
  }

  listUsers(adminId: string) {
    return this.adminService.listUsers(adminId);
  }

  setBlocked(
    id: string,
    blocked: boolean,
    adminId: string,
  ) {
    return this.adminService.setBlocked(
      id,
      blocked,
      adminId,
    );
  }

  deleteUser(id: string, adminId: string) {
    return this.adminService.deleteUser(id, adminId);
  }

  reapproveSupervisor(
    id: string,
    adminId: string,
  ) {
    return this.adminService.reapproveSupervisor(
      id,
      adminId,
    );
  }

  reapproveDoctor(id: string, adminId: string) {
    return this.adminService.reapproveDoctor(id, adminId);
  }

  listDoctorPending(adminId: string) {
    return this.adminService.listDoctorPending(adminId);
  }

  decideDoctor(
    id: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    return this.adminService.decideDoctor(
      id,
      approve,
      note,
      adminId,
    );
  }

  decide(
    id: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    return this.adminService.decide(
      id,
      approve,
      note,
      adminId,
    );
  }

  listGroups(adminId: string) {
    return this.groupsService.listGroups(adminId);
  }

  createGroup(
    name: string,
    description: string | undefined,
    semesterLabel: string,
    adminId: string,
  ) {
    return this.groupsService.createGroup(
      name,
      description,
      semesterLabel,
      adminId,
    );
  }

  updateGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      semesterLabel?: string;
      active?: boolean;
    },
    adminId: string,
  ) {
    return this.groupsService.updateGroup(
      id,
      data,
      adminId,
    );
  }

  deleteGroup(id: string, adminId: string) {
    return this.groupsService.deleteGroup(id, adminId);
  }

  addDoctorToGroup(
    groupId: string,
    doctorId: string,
    note: string | undefined,
    adminId: string,
  ) {
    return this.groupsService.addDoctorToGroup(
      groupId,
      doctorId,
      note,
      adminId,
    );
  }

  removeDoctorFromGroup(
    groupId: string,
    doctorId: string,
    adminId: string,
  ) {
    return this.groupsService.removeDoctorFromGroup(
      groupId,
      doctorId,
      adminId,
    );
  }

  addSupervisorToGroup(
    groupId: string,
    supervisorId: string,
    adminId: string,
  ) {
    return this.groupsService.addSupervisorToGroup(
      groupId,
      supervisorId,
      adminId,
    );
  }

  removeSupervisorFromGroup(
    groupId: string,
    supervisorId: string,
    adminId: string,
  ) {
    return this.groupsService.removeSupervisorFromGroup(
      groupId,
      supervisorId,
      adminId,
    );
  }

  listGroupJoinRequests(adminId: string) {
    return this.groupsService.listGroupJoinRequests(adminId);
  }

  decideGroupJoinRequest(
    id: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    return this.groupsService.decideGroupJoinRequest(
      id,
      approve,
      note,
      adminId,
    );
  }

  planningWorkspace(adminId: string) {
    return this.planningService.planningWorkspace(adminId);
  }

  createClinic(
    name: string,
    description: string | undefined,
    adminId: string,
  ) {
    return this.planningService.createClinic(
      name,
      description,
      adminId,
    );
  }

  updateClinic(
    id: string,
    dto: { name?: string; description?: string },
    adminId: string,
  ) {
    return this.planningService.updateClinic(
      id,
      dto,
      adminId,
    );
  }

  deleteClinic(id: string, adminId: string) {
    return this.planningService.deleteClinic(id, adminId);
  }

  createShift(
    name: string,
    startsAt: string,
    endsAt: string,
    appointmentCapacity: number | undefined,
    adminId: string,
  ) {
    return this.planningService.createShift(
      name,
      startsAt,
      endsAt,
      appointmentCapacity,
      adminId,
    );
  }

  updateShift(
    id: string,
    dto: {
      name?: string;
      startsAt?: string;
      endsAt?: string;
      appointmentCapacity?: number;
    },
    adminId: string,
  ) {
    return this.planningService.updateShift(
      id,
      dto,
      adminId,
    );
  }

  deleteShift(id: string, adminId: string) {
    return this.planningService.deleteShift(id, adminId);
  }

  createRotationPlan(
    label: string,
    startsOn: string,
    shiftId: string,
    adminId: string,
  ) {
    return this.planningService.createRotationPlan(
      label,
      startsOn,
      shiftId,
      adminId,
    );
  }

  updateRotationPlan(
    id: string,
    dto: { label?: string; startsOn?: string; shiftId?: string },
    adminId: string,
  ) {
    return this.planningService.updateRotationPlan(
      id,
      dto,
      adminId,
    );
  }

  deleteRotationPlan(id: string, adminId: string) {
    return this.planningService.deleteRotationPlan(
      id,
      adminId,
    );
  }

  saveRotationPlanDays(
    planId: string,
    days: Array<{
      assignmentDate: string;
      clinicId?: string;
      isVacation?: boolean;
      vacationReason?: string;
      notes?: string;
    }>,
    adminId: string,
  ) {
    return this.planningService.saveRotationPlanDays(
      planId,
      days,
      adminId,
    );
  }

  assignPlanToGroup(
    planId: string,
    groupId: string,
    notes: string | undefined,
    adminId: string,
  ) {
    return this.planningService.assignPlanToGroup(
      planId,
      groupId,
      notes,
      adminId,
    );
  }

  assignGroupToClinicShift(
    planId: string,
    groupId: string,
    clinicId: string,
    shiftId: string,
    assignmentDate: string,
    notes: string | undefined,
    adminId: string,
  ) {
    return this.planningService.assignGroupToClinicShift(
      planId,
      groupId,
      clinicId,
      shiftId,
      assignmentDate,
      notes,
      adminId,
    );
  }

  assignSupervisorToClinic(
    clinicId: string,
    supervisorId: string,
    notes: string | undefined,
    adminId: string,
  ) {
    return this.planningService.assignSupervisorToClinic(
      clinicId,
      supervisorId,
      notes,
      adminId,
    );
  }

  removeSupervisorFromClinic(
    clinicId: string,
    supervisorId: string,
    adminId: string,
  ) {
    return this.planningService.removeSupervisorFromClinic(
      clinicId,
      supervisorId,
      adminId,
    );
  }

  createClinicTask(
    clinicId: string,
    title: string,
    description: string | undefined,
    adminId: string,
  ) {
    return this.planningService.createClinicTask(
      clinicId,
      title,
      description,
      adminId,
    );
  }

  createSemester(
    label: string,
    sortOrder: number | undefined,
    endsOn: string | undefined,
    adminId: string,
  ) {
    return this.planningService.createSemester(
      label,
      sortOrder,
      endsOn,
      adminId,
    );
  }

  updateSemester(
    id: string,
    dto: { label?: string; sortOrder?: number; endsOn?: string },
    adminId: string,
  ) {
    return this.planningService.updateSemester(
      id,
      dto,
      adminId,
    );
  }

  deleteSemester(id: string, adminId: string) {
    return this.planningService.deleteSemester(id, adminId);
  }

  createSemesterClinicCase(
    semesterId: string,
    clinicId: string,
    title: string,
    description: string | undefined,
    requiredCount: number | undefined,
    adminId: string,
  ) {
    return this.planningService.createSemesterClinicCase(
      semesterId,
      clinicId,
      title,
      description,
      requiredCount,
      adminId,
    );
  }

  updateSemesterClinicCase(
    id: string,
    dto: {
      semesterId?: string;
      clinicId?: string;
      title?: string;
      description?: string;
      requiredCount?: number;
    },
    adminId: string,
  ) {
    return this.planningService.updateSemesterClinicCase(
      id,
      dto,
      adminId,
    );
  }

  deleteSemesterClinicCase(
    id: string,
    adminId: string,
  ) {
    return this.planningService.deleteSemesterClinicCase(
      id,
      adminId,
    );
  }

  semesterProgression(adminId: string) {
    return this.planningService.semesterProgression(adminId);
  }

  advanceEligibleStudents(adminId: string) {
    return this.planningService.advanceEligibleStudents(
      adminId,
    );
  }

  updateStudentSemester(
    userId: string,
    semesterId: string | undefined,
    adminId: string,
  ) {
    return this.planningService.updateStudentSemester(
      userId,
      semesterId,
      adminId,
    );
  }

  createPartnerRequest(
    senderIdentifier: string,
    receiverIdentifier: string,
    note?: string,
  ) {
    return this.groupsService.createPartnerRequest(
      senderIdentifier,
      receiverIdentifier,
      note,
    );
  }

  decidePartnerRequestByAdmin(
    requestId: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    return this.groupsService.decidePartnerRequestByAdmin(
      requestId,
      approve,
      note,
      adminId,
    );
  }

  removePartnershipByAdmin(
    pairId: string,
    adminId: string,
  ) {
    return this.groupsService.removePartnershipByAdmin(
      pairId,
      adminId,
    );
  }

  createExam(
    supervisorIdentifier: string,
    studentId: string,
    clinicId: string,
    scheduledAt: string,
    title: string,
    cases: string | undefined,
    shiftId?: string,
    planId?: string,
    notes?: string,
  ) {
    return this.workspaceService.createExam(
      supervisorIdentifier,
      studentId,
      clinicId,
      scheduledAt,
      title,
      cases,
      shiftId,
      planId,
      notes,
    );
  }

  gradeExam(
    examId: string,
    supervisorIdentifier: string,
    mark: number,
    notes?: string,
  ) {
    return this.workspaceService.gradeExam(
      examId,
      supervisorIdentifier,
      mark,
      notes,
    );
  }

  supervisorWorkspace(identifier: string) {
    return this.workspaceService.supervisorWorkspace(identifier);
  }

  searchDoctors(identifier: string, query: string) {
    return this.workspaceService.searchDoctors(identifier, query);
  }

  addSupervisionAssignment(
    supervisorIdentifier: string,
    doctorIdentifier: string,
    semesterLabel: string,
    note?: string,
  ) {
    return this.workspaceService.addSupervisionAssignment(
      supervisorIdentifier,
      doctorIdentifier,
      semesterLabel,
      note,
    );
  }

  removeSupervisionAssignment(id: string, supervisorIdentifier: string) {
    return this.workspaceService.removeSupervisionAssignment(
      id,
      supervisorIdentifier,
    );
  }

  freezeDoctor(
    doctorId: string,
    supervisorIdentifier: string,
    blockedUntil: string,
    reason?: string,
  ) {
    return this.workspaceService.freezeDoctor(
      doctorId,
      supervisorIdentifier,
      blockedUntil,
      reason,
    );
  }

  unfreezeDoctor(doctorId: string, supervisorIdentifier: string) {
    return this.workspaceService.unfreezeDoctor(doctorId, supervisorIdentifier);
  }

  createTask(
    supervisorIdentifier: string,
    title: string,
    description: string,
    dueAt?: string,
    doctorId?: string,
    groupId?: string,
  ) {
    return this.workspaceService.createTask(
      supervisorIdentifier,
      title,
      description,
      dueAt,
      doctorId,
      groupId,
    );
  }

  listReports(identifier: string) {
    return this.workspaceService.listReports(identifier);
  }

  reviewReport(
    reportId: string,
    supervisorIdentifier: string,
    mark: number,
    rating: number,
    feedback?: string,
    outcome?: "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED",
  ) {
    return this.workspaceService.reviewReport(
      reportId,
      supervisorIdentifier,
      mark,
      rating,
      feedback,
      outcome,
    );
  }

  doctorWorkspace(identifier: string) {
    return this.workspaceService.doctorWorkspace(identifier);
  }

  createGroupJoinRequest(
    applicantIdentifier: string,
    groupId: string,
    note?: string,
  ) {
    return this.groupsService.createGroupJoinRequest(
      applicantIdentifier,
      groupId,
      note,
    );
  }

  createGroupPost(
    groupId: string,
    authorIdentifier: string,
    title: string | undefined,
    body: string,
  ) {
    return this.groupsService.createGroupPost(
      groupId,
      authorIdentifier,
      title,
      body,
    );
  }
}
