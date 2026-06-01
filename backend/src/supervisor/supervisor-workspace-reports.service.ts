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

    // Surface a report to this supervisor when ANY of the following hold:
    //   - The supervisor manages the report's doctor through the normal
    //     channels (direct SupervisionAssignment or DoctorGroupSupervisor).
    //   - The supervisor was picked as the primary reviewer on this report
    //     (reviewerSupervisorId).
    //   - The supervisor was picked as an additional reviewer by the
    //     doctor's multi-select (stored in formData.additionalSupervisorIds).
    // The OR widens visibility to every chosen supervisor regardless of
    // whether they're inside the doctor's formal supervision tree.
    return this.prisma.caseReport.findMany({
      where: {
        OR: [
          ...(doctorIds.length > 0
            ? [{ doctorId: { in: doctorIds } }]
            : []),
          { reviewerSupervisorId: supervisor.id },
          {
            formData: {
              path: ["additionalSupervisorIds"],
              array_contains: supervisor.id,
            },
          },
        ],
      },
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

    // The supervisor is authorised to action this report if ANY of the
    // following hold:
    //   - They are the primary reviewer on the report.
    //   - They are listed as an additional reviewer by the doctor's
    //     multi-select (formData.additionalSupervisorIds).
    //   - They manage the report's doctor through the normal supervision
    //     channels (kept as a fallback for legacy reports + the case where
    //     a doctor forgot to pick the supervisor explicitly).
    const explicitlyChosenAsPrimary =
      report.reviewerSupervisorId === supervisor.id;
    const explicitlyChosenAsAdditional = this.readAdditionalSupervisorIds(
      report.formData,
    ).includes(supervisor.id);
    if (!explicitlyChosenAsPrimary && !explicitlyChosenAsAdditional) {
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

    const doctorBody =
      outcome === "NEEDS_EDIT"
        ? `${supervisor.name} asked for report edits${feedback ? `: ${feedback}` : "."}`
        : outcome === "CASE_REJECTED"
          ? `${supervisor.name} rejected the case completion${feedback ? `: ${feedback}` : "."}`
          : `${supervisor.name} approved your report${feedback ? `: ${feedback}` : "."}`;

    // Notify the doctor as before.
    await this.prisma.notification.create({
      data: {
        title: "Report reviewed",
        body: doctorBody,
        recipientId: report.doctorId,
      },
    });

    // Fan-out: the other supervisors the doctor explicitly chose for this
    // report also need to know it has been actioned, so they stop seeing it
    // as pending in their queue. We pull the additional IDs out of formData
    // (where the doctor's multi-select wrote them), drop the supervisor who
    // just acted, validate they are real SUPERVISOR accounts, and notify.
    const additionalIds = this.readAdditionalSupervisorIds(report.formData);
    const cohorts = new Set<string>(additionalIds);
    // If a DIFFERENT supervisor was the originally-chosen primary (now
    // overwritten by `supervisor.id` on the update above), let them know too.
    const previousPrimaryId =
      report.reviewerSupervisorId &&
      report.reviewerSupervisorId !== supervisor.id
        ? report.reviewerSupervisorId
        : null;
    if (previousPrimaryId) cohorts.add(previousPrimaryId);
    cohorts.delete(supervisor.id);

    if (cohorts.size > 0) {
      const validated = await this.prisma.user.findMany({
        where: { id: { in: Array.from(cohorts) }, role: "SUPERVISOR" },
        select: { id: true },
      });
      const cohortBody =
        outcome === "NEEDS_EDIT"
          ? `${supervisor.name} requested edits on ${report.doctor.name}'s report.`
          : outcome === "CASE_REJECTED"
            ? `${supervisor.name} rejected ${report.doctor.name}'s case completion.`
            : `${supervisor.name} approved ${report.doctor.name}'s report.`;
      if (validated.length > 0) {
        await this.prisma.notification.createMany({
          data: validated.map((u) => ({
            title: "A report you were sent has been actioned",
            body: cohortBody,
            recipientId: u.id,
          })),
        });
      }
    }

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

  /**
   * Safely pull additionalSupervisorIds[] out of CaseReport.formData (which
   * is unknown-shape JSON). Drops anything that isn't a non-empty string.
   */
  private readAdditionalSupervisorIds(formData: unknown): string[] {
    if (!formData || typeof formData !== "object") return [];
    const value = (formData as Record<string, unknown>).additionalSupervisorIds;
    if (!Array.isArray(value)) return [];
    return value.filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
  }
}
