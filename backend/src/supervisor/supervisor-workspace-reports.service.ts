import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AppointmentRatingKind,
  ClinicTaskProgressStatus,
  ClinicCaseProgressStatus,
  ReportReviewStatus,
  ReportTaskRole,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorWorkspaceReportsService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async listReports(identifier: string) {
    const supervisor = await this.requireSupervisor(identifier);
    const doctorIds = await this.getSupervisorDoctorIds(supervisor.id);
    if (doctorIds.length === 0) return [];

    return this.prisma.caseReport.findMany({
      where: { doctorId: { in: doctorIds } },
      orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            username: true,
            doctorIdNumber: true,
          },
        },
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
            slot: true,
            clinicCase: {
              include: {
                clinic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        taskLinks: {
          include: {
            clinicTask: {
              select: {
                id: true,
                title: true,
                clinic: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async reviewReport(
    reportId: string,
    supervisorIdentifier: string,
    mark: number,
    rating: number,
    feedback?: string,
    outcome: "REVIEWED" | "NEEDS_EDIT" | "CASE_REJECTED" = "REVIEWED",
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const report = await this.prisma.caseReport.findUnique({
      where: { id: reportId },
      include: {
        doctor: true,
        taskLinks: true,
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!report) throw new NotFoundException("Report not found.");

    const explicitlyChosenSupervisor =
      report.reviewerSupervisorId && report.reviewerSupervisorId === supervisor.id;
    if (!explicitlyChosenSupervisor) {
      await this.ensureSupervisorManagesDoctor(supervisor.id, report.doctorId);
    }

    const reviewedAt = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.caseReport.update({
        where: { id: reportId },
        data: {
          reviewerSupervisorId: supervisor.id,
          mark,
          rating: outcome === "CASE_REJECTED" ? null : rating,
          feedback: feedback ?? null,
          status: outcome as ReportReviewStatus,
          reviewedAt,
        },
      });

      if (outcome === "REVIEWED") {
        for (const link of report.taskLinks) {
          await tx.doctorClinicTaskProgress.upsert({
            where: {
              doctorId_clinicTaskId: {
                doctorId: report.doctorId,
                clinicTaskId: link.clinicTaskId,
              },
            },
            update: {
              status:
                link.role === ReportTaskRole.ASSISTANT
                  ? ClinicTaskProgressStatus.ASSISTED
                  : ClinicTaskProgressStatus.COMPLETED,
              mark,
              notes: feedback ?? null,
              completedAt: reviewedAt,
              lastReportId: report.id,
            },
            create: {
              doctorId: report.doctorId,
              clinicTaskId: link.clinicTaskId,
              status:
                link.role === ReportTaskRole.ASSISTANT
                  ? ClinicTaskProgressStatus.ASSISTED
                  : ClinicTaskProgressStatus.COMPLETED,
              mark,
              notes: feedback ?? null,
              completedAt: reviewedAt,
              lastReportId: report.id,
            },
          });

          if (report.partnerDoctorId) {
            await tx.doctorClinicTaskProgress.upsert({
              where: {
                doctorId_clinicTaskId: {
                  doctorId: report.partnerDoctorId,
                  clinicTaskId: link.clinicTaskId,
                },
              },
              update: {
                status: ClinicTaskProgressStatus.ASSISTED,
                notes: feedback ?? null,
                completedAt: reviewedAt,
                lastReportId: report.id,
              },
              create: {
                doctorId: report.partnerDoctorId,
                clinicTaskId: link.clinicTaskId,
                status: ClinicTaskProgressStatus.ASSISTED,
                notes: feedback ?? null,
                completedAt: reviewedAt,
                lastReportId: report.id,
              },
            });
          }
        }

        if (report.appointment?.clinicCaseId) {
          await tx.doctorClinicCaseProgress.upsert({
            where: {
              doctorId_clinicCaseId: {
                doctorId: report.doctorId,
                clinicCaseId: report.appointment.clinicCaseId,
              },
            },
            update: {
              status: ClinicCaseProgressStatus.COMPLETED,
              completedAt: reviewedAt,
              lastAppointmentId: report.appointmentId,
              lastReportId: report.id,
            },
            create: {
              doctorId: report.doctorId,
              clinicCaseId: report.appointment.clinicCaseId,
              status: ClinicCaseProgressStatus.COMPLETED,
              completedAt: reviewedAt,
              lastAppointmentId: report.appointmentId,
              lastReportId: report.id,
            },
          });

          if (report.partnerDoctorId) {
            await tx.doctorClinicCaseProgress.upsert({
              where: {
                doctorId_clinicCaseId: {
                  doctorId: report.partnerDoctorId,
                  clinicCaseId: report.appointment.clinicCaseId,
                },
              },
              update: {
                status: ClinicCaseProgressStatus.ASSISTED,
                completedAt: reviewedAt,
                lastAppointmentId: report.appointmentId,
                lastReportId: report.id,
              },
              create: {
                doctorId: report.partnerDoctorId,
                clinicCaseId: report.appointment.clinicCaseId,
                status: ClinicCaseProgressStatus.ASSISTED,
                completedAt: reviewedAt,
                lastAppointmentId: report.appointmentId,
                lastReportId: report.id,
              },
            });
          }
        }

        await tx.appointmentRating.upsert({
          where: {
            appointmentId_raterId_kind: {
              appointmentId: report.appointmentId,
              raterId: supervisor.id,
              kind: AppointmentRatingKind.SUPERVISOR_TO_DOCTOR,
            },
          },
          update: {
            targetId: report.doctorId,
            stars: rating,
            comment: feedback ?? null,
            active: true,
          },
          create: {
            appointmentId: report.appointmentId,
            raterId: supervisor.id,
            targetId: report.doctorId,
            kind: AppointmentRatingKind.SUPERVISOR_TO_DOCTOR,
            stars: rating,
            comment: feedback ?? null,
          },
        });
      }

      if (outcome === "CASE_REJECTED") {
        if (report.appointment?.clinicCaseId) {
          await tx.doctorClinicCaseProgress.updateMany({
            where: {
              doctorId: report.doctorId,
              clinicCaseId: report.appointment.clinicCaseId,
              lastReportId: report.id,
            },
            data: {
              status: ClinicCaseProgressStatus.OPEN,
              completedAt: null,
              lastAppointmentId: null,
              lastReportId: null,
            },
          });

          if (report.partnerDoctorId) {
            await tx.doctorClinicCaseProgress.updateMany({
              where: {
                doctorId: report.partnerDoctorId,
                clinicCaseId: report.appointment.clinicCaseId,
                lastReportId: report.id,
              },
              data: {
                status: ClinicCaseProgressStatus.OPEN,
                completedAt: null,
                lastAppointmentId: null,
                lastReportId: null,
              },
            });
          }
        }

        await tx.appointmentRating.updateMany({
          where: {
            appointmentId: report.appointmentId,
            kind: {
              in: [
                AppointmentRatingKind.PATIENT_TO_DOCTOR,
                AppointmentRatingKind.SUPERVISOR_TO_DOCTOR,
              ],
            },
          },
          data: { active: false },
        });
      }

      return saved;
    });

    await this.prisma.notification.create({
      data: {
        title: "Report reviewed",
        body:
          outcome === "NEEDS_EDIT"
            ? `${supervisor.name} asked for report edits${feedback ? `: ${feedback}` : "."}`
            : outcome === "CASE_REJECTED"
              ? `${supervisor.name} rejected the case completion${feedback ? `: ${feedback}` : "."}`
              : `${supervisor.name} approved your report${feedback ? `: ${feedback}` : "."}`,
        recipientId: report.doctorId,
      },
    });

    return {
      message:
        outcome === "NEEDS_EDIT"
          ? "Report returned for edits."
          : outcome === "CASE_REJECTED"
            ? "Case completion rejected."
            : "Report reviewed.",
      report: updated,
    };
  }
}
