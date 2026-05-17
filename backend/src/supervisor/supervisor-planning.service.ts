import { Injectable } from "@nestjs/common";
import { SupervisorPlanningClinicsService } from "./supervisor-planning-clinics.service";
import { SupervisorPlanningOverviewService } from "./supervisor-planning-overview.service";
import { SupervisorPlanningPlansService } from "./supervisor-planning-plans.service";
import { SupervisorPlanningSemestersService } from "./supervisor-planning-semesters.service";

@Injectable()
export class SupervisorPlanningService {
  constructor(
    private readonly overviewService: SupervisorPlanningOverviewService,
    private readonly clinicsService: SupervisorPlanningClinicsService,
    private readonly plansService: SupervisorPlanningPlansService,
    private readonly semestersService: SupervisorPlanningSemestersService,
  ) {}

  planningWorkspace(adminId: string) {
    return this.overviewService.planningWorkspace(adminId);
  }

  createClinic(
    name: string,
    description: string | undefined,
    adminId: string,
  ) {
    return this.clinicsService.createClinic(name, description, adminId);
  }

  updateClinic(
    id: string,
    dto: { name?: string; description?: string },
    adminId: string,
  ) {
    return this.clinicsService.updateClinic(id, dto, adminId);
  }

  deleteClinic(id: string, adminId: string) {
    return this.clinicsService.deleteClinic(id, adminId);
  }

  createShift(
    name: string,
    startsAt: string,
    endsAt: string,
    appointmentCapacity: number | undefined,
    adminId: string,
  ) {
    return this.clinicsService.createShift(
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
    return this.clinicsService.updateShift(id, dto, adminId);
  }

  deleteShift(id: string, adminId: string) {
    return this.clinicsService.deleteShift(id, adminId);
  }

  createRotationPlan(
    label: string,
    startsOn: string,
    shiftId: string,
    adminId: string,
  ) {
    return this.plansService.createRotationPlan(label, startsOn, shiftId, adminId);
  }

  updateRotationPlan(
    id: string,
    dto: { label?: string; startsOn?: string; shiftId?: string },
    adminId: string,
  ) {
    return this.plansService.updateRotationPlan(id, dto, adminId);
  }

  deleteRotationPlan(id: string, adminId: string) {
    return this.plansService.deleteRotationPlan(id, adminId);
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
    return this.plansService.saveRotationPlanDays(planId, days, adminId);
  }

  assignPlanToGroup(
    planId: string,
    groupId: string,
    notes: string | undefined,
    adminId: string,
  ) {
    return this.plansService.assignPlanToGroup(planId, groupId, notes, adminId);
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
    return this.plansService.assignGroupToClinicShift(
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
    return this.clinicsService.assignSupervisorToClinic(
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
    return this.clinicsService.removeSupervisorFromClinic(
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
    return this.clinicsService.createClinicTask(
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
    return this.semestersService.createSemester(label, sortOrder, endsOn, adminId);
  }

  updateSemester(
    id: string,
    dto: { label?: string; sortOrder?: number; endsOn?: string },
    adminId: string,
  ) {
    return this.semestersService.updateSemester(id, dto, adminId);
  }

  deleteSemester(id: string, adminId: string) {
    return this.semestersService.deleteSemester(id, adminId);
  }

  createSemesterClinicCase(
    semesterId: string,
    clinicId: string,
    title: string,
    description: string | undefined,
    requiredCount: number | undefined,
    adminId: string,
  ) {
    return this.semestersService.createSemesterClinicCase(
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
    return this.semestersService.updateSemesterClinicCase(id, dto, adminId);
  }

  deleteSemesterClinicCase(
    id: string,
    adminId: string,
  ) {
    return this.semestersService.deleteSemesterClinicCase(id, adminId);
  }

  semesterProgression(adminId: string) {
    return this.semestersService.semesterProgression(adminId);
  }

  advanceEligibleStudents(adminId: string) {
    return this.semestersService.advanceEligibleStudents(adminId);
  }

  updateStudentSemester(
    userId: string,
    semesterId: string | undefined,
    adminId: string,
  ) {
    return this.semestersService.updateStudentSemester(userId, semesterId, adminId);
  }
}
