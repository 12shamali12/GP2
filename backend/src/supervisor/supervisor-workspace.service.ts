import { Injectable } from "@nestjs/common";
import { SupervisorWorkspaceDoctorService } from "./supervisor-workspace-doctor.service";
import { SupervisorWorkspaceExamsService } from "./supervisor-workspace-exams.service";
import { SupervisorWorkspaceOverviewService } from "./supervisor-workspace-overview.service";
import { SupervisorWorkspaceReportsService } from "./supervisor-workspace-reports.service";
import { SupervisorWorkspaceSupervisionService } from "./supervisor-workspace-supervision.service";

@Injectable()
export class SupervisorWorkspaceService {
  constructor(
    private readonly examsService: SupervisorWorkspaceExamsService,
    private readonly supervisionService: SupervisorWorkspaceSupervisionService,
    private readonly reportsService: SupervisorWorkspaceReportsService,
    private readonly overviewService: SupervisorWorkspaceOverviewService,
    private readonly doctorService: SupervisorWorkspaceDoctorService,
  ) {}

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
    return this.examsService.createExam(
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
    return this.examsService.gradeExam(examId, supervisorIdentifier, mark, notes);
  }

  searchDoctors(identifier: string, query: string) {
    return this.supervisionService.searchDoctors(identifier, query);
  }

  addSupervisionAssignment(
    supervisorIdentifier: string,
    doctorIdentifier: string,
    semesterLabel: string,
    note?: string,
  ) {
    return this.supervisionService.addSupervisionAssignment(
      supervisorIdentifier,
      doctorIdentifier,
      semesterLabel,
      note,
    );
  }

  removeSupervisionAssignment(id: string, supervisorIdentifier: string) {
    return this.supervisionService.removeSupervisionAssignment(
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
    return this.supervisionService.freezeDoctor(
      doctorId,
      supervisorIdentifier,
      blockedUntil,
      reason,
    );
  }

  unfreezeDoctor(doctorId: string, supervisorIdentifier: string) {
    return this.supervisionService.unfreezeDoctor(doctorId, supervisorIdentifier);
  }

  createTask(
    supervisorIdentifier: string,
    title: string,
    description: string,
    dueAt?: string,
    doctorId?: string,
    groupId?: string,
  ) {
    return this.supervisionService.createTask(
      supervisorIdentifier,
      title,
      description,
      dueAt,
      doctorId,
      groupId,
    );
  }

  listReports(identifier: string) {
    return this.reportsService.listReports(identifier);
  }

  reviewReport(
    reportId: string,
    supervisorIdentifier: string,
    mark: number,
    rating: number,
    feedback?: string,
    outcome?: "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED",
  ) {
    return this.reportsService.reviewReport(
      reportId,
      supervisorIdentifier,
      mark,
      rating,
      feedback,
      outcome,
    );
  }

  supervisorWorkspace(identifier: string) {
    return this.overviewService.supervisorWorkspace(identifier);
  }

  doctorWorkspace(identifier: string) {
    return this.doctorService.doctorWorkspace(identifier);
  }
}
