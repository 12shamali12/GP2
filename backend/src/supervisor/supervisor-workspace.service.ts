import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AppointmentRatingKind,
  ClinicTaskProgressStatus,
  ClinicCaseProgressStatus,
  DoctorStatus,
  ExamStatus,
  GroupJoinRequestStatus,
  PartnerRequestStatus,
  Prisma,
  ReportReviewStatus,
  ReportTaskRole,
  Role,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorWorkspaceService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createExam(
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
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    const clinic = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!student || student.role !== Role.DOCTOR) {
      throw new NotFoundException("Student doctor not found.");
    }
    if (!clinic) throw new NotFoundException("Clinic not found.");

    const exam = await this.prisma.clinicExam.create({
      data: {
        clinicId,
        shiftId: shiftId ?? null,
        planId: planId ?? null,
        studentId,
        supervisorId: supervisor.id,
        scheduledAt: new Date(scheduledAt),
        title,
        cases: cases ?? null,
        notes: notes ?? null,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Clinic exam scheduled",
        body: `${supervisor.name} scheduled "${title}" for ${new Date(scheduledAt).toLocaleString()}.`,
        recipientId: student.id,
      },
    });

    return { message: "Clinic exam scheduled.", exam };
  }

  async gradeExam(
    examId: string,
    supervisorIdentifier: string,
    mark: number,
    notes?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const exam = await this.prisma.clinicExam.findUnique({
      where: { id: examId },
    });
    if (!exam) throw new NotFoundException("Exam not found.");
    if (exam.supervisorId !== supervisor.id) {
      throw new ForbiddenException(
        "Only the supervisor who scheduled the exam can grade it.",
      );
    }

    const updated = await this.prisma.clinicExam.update({
      where: { id: examId },
      data: {
        mark,
        notes: notes ?? exam.notes ?? null,
        status: ExamStatus.COMPLETED,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Exam graded",
        body: `${supervisor.name} graded your clinic exam with ${mark}.`,
        recipientId: exam.studentId,
      },
    });

    return { message: "Exam graded.", exam: updated };
  }

  async searchDoctors(identifier: string, query: string) {
    const supervisor = await this.requireSupervisor(identifier);
    const term = query?.trim();
    if (!term) return [];

    const doctors = await this.prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        doctorStatus: DoctorStatus.APPROVED,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { username: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { doctorIdNumber: { contains: term, mode: "insensitive" } },
        ],
      },
      take: 12,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        doctorIdNumber: true,
        groupMembership: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                semesterLabel: true,
              },
            },
          },
        },
      },
    });

    const directAssignments = await this.prisma.supervisionAssignment.findMany({
      where: {
        supervisorId: supervisor.id,
        doctorId: { in: doctors.map((doctor) => doctor.id) },
        active: true,
      },
      select: { doctorId: true },
    });
    const assignedIds = new Set(directAssignments.map((item) => item.doctorId));

    return doctors.map((doctor) => ({
      ...doctor,
      alreadyAssignedToSupervisor: assignedIds.has(doctor.id),
    }));
  }

  async addSupervisionAssignment(
    supervisorIdentifier: string,
    doctorIdentifier: string,
    semesterLabel: string,
    note?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const doctor = await this.findUserByIdentifier(doctorIdentifier);
    if (doctor.role !== Role.DOCTOR || doctor.doctorStatus !== DoctorStatus.APPROVED) {
      throw new BadRequestException(
        "Doctor must be approved before supervision assignment.",
      );
    }

    const existing = await this.prisma.supervisionAssignment.findFirst({
      where: {
        supervisorId: supervisor.id,
        doctorId: doctor.id,
        semesterLabel,
      },
    });

    const assignment = existing
      ? await this.prisma.supervisionAssignment.update({
          where: { id: existing.id },
          data: {
            active: true,
            note: note ?? existing.note ?? null,
            removedAt: null,
          },
        })
      : await this.prisma.supervisionAssignment.create({
          data: {
            supervisorId: supervisor.id,
            doctorId: doctor.id,
            semesterLabel,
            note: note ?? null,
          },
        });

    await this.prisma.notification.create({
      data: {
        title: "Supervisor assigned",
        body: `${supervisor.name} added you under supervision for ${semesterLabel}.`,
        recipientId: doctor.id,
      },
    });

    return { message: "Doctor added under supervision.", assignment };
  }

  async removeSupervisionAssignment(id: string, supervisorIdentifier: string) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const assignment = await this.prisma.supervisionAssignment.findUnique({
      where: { id },
    });
    if (!assignment) throw new NotFoundException("Assignment not found.");
    if (assignment.supervisorId !== supervisor.id) {
      throw new ForbiddenException("You cannot remove this assignment.");
    }

    await this.prisma.supervisionAssignment.update({
      where: { id },
      data: {
        active: false,
        removedAt: new Date(),
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Supervisor assignment removed",
        body: `${supervisor.name} removed you from direct supervision.`,
        recipientId: assignment.doctorId,
      },
    });

    return { message: "Supervision assignment removed." };
  }

  async freezeDoctor(
    doctorId: string,
    supervisorIdentifier: string,
    blockedUntil: string,
    reason?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new NotFoundException("Doctor not found.");
    }
    await this.ensureSupervisorManagesDoctor(supervisor.id, doctorId);

    const until = new Date(blockedUntil);
    if (Number.isNaN(until.getTime()) || until <= new Date()) {
      throw new BadRequestException("blockedUntil must be in the future.");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: doctorId },
        data: {
          blockedUntil: until,
          blockReason: reason ?? "Supervisor freeze applied.",
        },
      }),
      this.prisma.doctorFreeze.create({
        data: {
          doctorId,
          supervisorId: supervisor.id,
          blockedUntil: until,
          reason: reason ?? null,
        },
      }),
      this.prisma.notification.create({
        data: {
          title: "Account temporarily frozen",
          body: `Your account is frozen until ${until.toLocaleString()}${reason ? `: ${reason}` : "."}`,
          recipientId: doctorId,
        },
      }),
    ]);

    return { message: "Doctor account frozen until the selected date." };
  }

  async unfreezeDoctor(doctorId: string, supervisorIdentifier: string) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorId } });
    if (!doctor || doctor.role !== Role.DOCTOR) {
      throw new NotFoundException("Doctor not found.");
    }
    await this.ensureSupervisorManagesDoctor(supervisor.id, doctorId);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: doctorId },
        data: {
          blockedUntil: null,
          blockReason: null,
          blocked: false,
        },
      }),
      this.prisma.notification.create({
        data: {
          title: "Account unfrozen",
          body: `${supervisor.name} restored your account access.`,
          recipientId: doctorId,
        },
      }),
    ]);

    return { message: "Doctor account unfrozen." };
  }

  async createTask(
    supervisorIdentifier: string,
    title: string,
    description: string,
    dueAt?: string,
    doctorId?: string,
    groupId?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    if (!doctorId && !groupId) {
      throw new BadRequestException("A task must target a doctor or a group.");
    }
    if (doctorId && groupId) {
      throw new BadRequestException(
        "Choose either a single doctor or a group for the task.",
      );
    }

    if (doctorId) {
      await this.ensureSupervisorManagesDoctor(supervisor.id, doctorId);
    }

    if (groupId) {
      const group = await this.prisma.doctorGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        throw new NotFoundException("Group not found.");
      }
    }

    const task = await this.prisma.supervisorTask.create({
      data: {
        supervisorId: supervisor.id,
        title,
        description,
        dueAt: dueAt ? new Date(dueAt) : null,
        doctorId: doctorId ?? null,
        groupId: groupId ?? null,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            semesterLabel: true,
            members: {
              select: {
                doctorId: true,
              },
            },
          },
        },
      },
    });

    const recipientIds = new Set<string>();
    if (task.doctorId) recipientIds.add(task.doctorId);
    task.group?.members.forEach((member) => recipientIds.add(member.doctorId));
    if (recipientIds.size > 0) {
      await this.prisma.notification.createMany({
        data: Array.from(recipientIds).map((recipientId) => ({
          title: "New supervisor task",
          body: `${supervisor.name} assigned: ${title}`,
          recipientId,
        })),
      });
    }

    return { message: "Task created.", task };
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

  async supervisorWorkspace(identifier: string) {
    const supervisor = await this.requireSupervisor(identifier);
    const today = this.normalizeDateOnly(new Date());
    const upcomingEnd = new Date(today);
    upcomingEnd.setDate(today.getDate() + 13);

    const [directAssignments, supervisedGroups, groupDirectory, clinicCatalog, shiftCatalog, tasks, activeFreezes, clinicLinks, upcomingExams] =
      await Promise.all([
        this.prisma.supervisionAssignment.findMany({
          where: { supervisorId: supervisor.id, active: true },
          orderBy: { createdAt: "desc" },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
                doctorIdNumber: true,
                blocked: true,
                blockedUntil: true,
                blockReason: true,
                groupMembership: {
                  include: {
                    group: {
                      select: {
                        id: true,
                        name: true,
                        semesterLabel: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.doctorGroupSupervisor.findMany({
          where: { supervisorId: supervisor.id },
          include: {
            group: {
              include: {
                members: {
                  include: {
                    doctor: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        phone: true,
                        doctorIdNumber: true,
                      },
                    },
                  },
                },
                partnerPairs: {
                  include: {
                    doctorOne: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        doctorIdNumber: true,
                      },
                    },
                    doctorTwo: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        doctorIdNumber: true,
                      },
                    },
                  },
                },
                joinRequests: {
                  where: { status: GroupJoinRequestStatus.PENDING },
                  include: {
                    applicant: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        role: true,
                      },
                    },
                  },
                },
                posts: {
                  take: 5,
                  orderBy: { createdAt: "desc" },
                  include: {
                    author: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.doctorGroup.findMany({
          where: { active: true },
          orderBy: [{ semesterLabel: "asc" }, { name: "asc" }],
          include: {
            members: {
              include: {
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    phone: true,
                    doctorIdNumber: true,
                  },
                },
              },
            },
            partnerPairs: {
              include: {
                doctorOne: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    doctorIdNumber: true,
                  },
                },
                doctorTwo: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    doctorIdNumber: true,
                  },
                },
              },
            },
            posts: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        }),
        this.prisma.clinic.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
        }),
        this.prisma.shiftTemplate.findMany({
          where: { active: true },
          orderBy: { name: "asc" },
        }),
        this.prisma.supervisorTask.findMany({
          where: { supervisorId: supervisor.id },
          orderBy: { createdAt: "desc" },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                semesterLabel: true,
              },
            },
          },
        }),
        this.prisma.doctorFreeze.findMany({
          where: { supervisorId: supervisor.id, blockedUntil: { gt: new Date() } },
          orderBy: { blockedUntil: "asc" },
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                username: true,
                doctorIdNumber: true,
                blockedUntil: true,
              },
            },
          },
        }),
        this.prisma.clinicSupervisorLink.findMany({
          where: {
            supervisorId: supervisor.id,
          },
          orderBy: [{ clinic: { name: "asc" } }],
          include: {
            clinic: true,
            supervisor: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phone: true,
              },
            },
          },
        }),
        this.prisma.clinicExam.findMany({
          where: {
            supervisorId: supervisor.id,
            scheduledAt: {
              gte: today,
              lte: upcomingEnd,
            },
          },
          orderBy: { scheduledAt: "asc" },
          include: {
            clinic: true,
            student: {
              select: {
                id: true,
                name: true,
                username: true,
                doctorIdNumber: true,
              },
            },
            shift: true,
            plan: {
              select: {
                id: true,
                label: true,
              },
            },
          },
        }),
      ]);

    const linkedClinicIds = Array.from(new Set(clinicLinks.map((link) => link.clinicId)));

    const dutyAssignments = linkedClinicIds.length
      ? await this.prisma.clinicRotationAssignment.findMany({
          where: {
            clinicId: { in: linkedClinicIds },
            assignmentDate: {
              gte: today,
              lte: upcomingEnd,
            },
          },
          orderBy: [{ assignmentDate: "asc" }, { clinic: { name: "asc" } }],
          include: {
            clinic: true,
            shift: true,
            plan: {
              select: {
                id: true,
                label: true,
                startsOn: true,
                endsOn: true,
              },
            },
            group: {
              include: {
                members: {
                  include: {
                    doctor: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        doctorIdNumber: true,
                      },
                    },
                  },
                },
                partnerPairs: {
                  include: {
                    doctorOne: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                    doctorTwo: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
            slots: {
              include: {
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
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
                  },
                },
              },
              orderBy: { startTime: "asc" },
            },
          },
        })
      : [];

    const clinicLinksByClinic = new Map<string, typeof clinicLinks>();
    clinicLinks.forEach((link) => {
      clinicLinksByClinic.set(link.clinicId, [...(clinicLinksByClinic.get(link.clinicId) || []), link]);
    });

    const clinicOverview = dutyAssignments.map((assignment) => ({
      id: assignment.id,
      assignmentDate: assignment.assignmentDate,
      notes: assignment.notes,
      clinicId: assignment.clinicId,
      shiftId: assignment.shiftId,
      clinic: assignment.clinic,
      shift: assignment.shift,
      plan: assignment.plan,
      supervisors: (clinicLinksByClinic.get(assignment.clinicId) || []).map((link) => ({
        id: link.id,
        notes: link.notes,
        supervisor: link.supervisor,
      })),
      groupAssignments: [assignment],
    }));

    const clinicDoctorIds = new Set<string>();
    clinicOverview.forEach((duty) => {
      duty.groupAssignments.forEach((assignment) => {
        assignment.group.members.forEach((member) => clinicDoctorIds.add(member.doctor.id));
      });
    });

    const reportWhere: Prisma.CaseReportWhereInput = {
      OR: [
        { reviewerSupervisorId: supervisor.id },
        ...(clinicDoctorIds.size ? [{ doctorId: { in: Array.from(clinicDoctorIds) } }] : []),
      ],
    };

    const reports = await this.prisma.caseReport.findMany({
      where: reportWhere,
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
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return {
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        email: supervisor.email,
        phone: supervisor.phone,
        username: supervisor.username,
      },
      directAssignments,
      supervisedGroups,
      groupDirectory,
      clinics: clinicCatalog,
      shifts: shiftCatalog,
      tasks,
      activeFreezes,
      reports,
      clinicOverview,
      upcomingExams,
      stats: {
        supervisedDoctors: clinicDoctorIds.size,
        groups: clinicOverview.reduce((count, duty) => count + duty.groupAssignments.length, 0),
        pendingReports: reports.filter((report) => report.status === ReportReviewStatus.SUBMITTED).length,
        activeFreezes: activeFreezes.length,
      },
    };
  }

  async doctorWorkspace(identifier: string) {
    const doctor = await this.requireDoctor(identifier);
    const today = this.normalizeDateOnly(new Date());
    const upcomingEnd = new Date(today);
    upcomingEnd.setDate(today.getDate() + 13);

    const [
      supervisors,
      groupMembership,
      directTasks,
      reports,
      allGroupPosts,
      partnerPair,
      incomingPartnerRequests,
      outgoingPartnerRequests,
      clinicTaskCatalog,
      exams,
    ] = await Promise.all([
      this.prisma.supervisionAssignment.findMany({
        where: { doctorId: doctor.id, active: true },
        orderBy: { createdAt: "desc" },
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.doctorGroupMember.findUnique({
        where: { doctorId: doctor.id },
        include: {
          group: {
            include: {
              supervisors: {
                include: {
                  supervisor: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      email: true,
                    },
                  },
                },
              },
              members: {
                include: {
                  doctor: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                    },
                  },
                },
              },
              partnerPairs: {
                include: {
                  doctorOne: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      doctorIdNumber: true,
                    },
                  },
                  doctorTwo: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      doctorIdNumber: true,
                    },
                  },
                },
              },
              posts: {
                take: 8,
                orderBy: { createdAt: "desc" },
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.supervisorTask.findMany({
        where: { doctorId: doctor.id },
        orderBy: { createdAt: "desc" },
        include: {
          supervisor: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              semesterLabel: true,
            },
          },
        },
      }),
      this.prisma.caseReport.findMany({
        where: { doctorId: doctor.id },
        orderBy: { submittedAt: "desc" },
        include: {
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
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.groupPost.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              semesterLabel: true,
            },
          },
          author: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.partnerPair.findFirst({
        where: {
          OR: [{ doctorOneId: doctor.id }, { doctorTwoId: doctor.id }],
        },
        include: {
          doctorOne: {
            select: {
              id: true,
              name: true,
              username: true,
              doctorIdNumber: true,
            },
          },
          doctorTwo: {
            select: {
              id: true,
              name: true,
              username: true,
              doctorIdNumber: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              semesterLabel: true,
            },
          },
        },
      }),
      this.prisma.partnerRequest.findMany({
        where: {
          receiverId: doctor.id,
          status: PartnerRequestStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              doctorIdNumber: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              semesterLabel: true,
            },
          },
        },
      }),
      this.prisma.partnerRequest.findMany({
        where: {
          senderId: doctor.id,
          status: PartnerRequestStatus.PENDING,
        },
        orderBy: { createdAt: "desc" },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              doctorIdNumber: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              semesterLabel: true,
            },
          },
        },
      }),
      this.prisma.clinicTask.findMany({
        where: { active: true },
        orderBy: [{ clinic: { name: "asc" } }, { createdAt: "asc" }],
        include: {
          clinic: true,
          progress: {
            where: { doctorId: doctor.id },
            take: 1,
          },
        },
      }),
      this.prisma.clinicExam.findMany({
        where: {
          studentId: doctor.id,
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          clinic: true,
          shift: true,
          supervisor: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          plan: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      }),
    ]);

    const groupTasks = groupMembership
      ? await this.prisma.supervisorTask.findMany({
          where: { groupId: groupMembership.groupId },
          orderBy: { createdAt: "desc" },
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
                semesterLabel: true,
              },
            },
          },
        })
      : [];

    const joinableGroups = await this.prisma.doctorGroup.findMany({
      where: groupMembership ? { id: { not: groupMembership.groupId }, active: true } : { active: true },
      orderBy: { createdAt: "desc" },
      include: {
        supervisors: {
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    const scheduleAssignments = groupMembership
      ? await this.prisma.clinicRotationAssignment.findMany({
          where: {
            groupId: groupMembership.groupId,
            assignmentDate: {
              gte: today,
              lte: upcomingEnd,
            },
          },
          orderBy: [{ assignmentDate: "asc" }, { clinic: { name: "asc" } }],
          include: {
            clinic: true,
            shift: true,
            plan: {
              select: {
                id: true,
                label: true,
              },
            },
          },
        })
      : [];

    const scheduleSupervisorAssignments = scheduleAssignments.length
      ? await this.prisma.clinicSupervisorLink.findMany({
          where: {
            clinicId: { in: Array.from(new Set(scheduleAssignments.map((assignment) => assignment.clinicId))) },
          },
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
              },
            },
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: [{ clinic: { name: "asc" } }, { supervisor: { name: "asc" } }],
        })
      : [];

    const schedule = scheduleAssignments.map((assignment) => ({
      ...assignment,
      supervisors: scheduleSupervisorAssignments.filter(
        (link) => link.clinicId === assignment.clinicId,
      ),
    }));

    const clinicTasks = clinicTaskCatalog.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      clinic: task.clinic,
      progress: task.progress[0] ?? null,
    }));

    const availableReportSupervisorMap = new Map<
      string,
      {
        id: string;
        name: string;
        username: string;
        email?: string | null;
      }
    >();

    schedule
      .filter((assignment) => assignment.assignmentDate.getTime() === today.getTime())
      .forEach((assignment) => {
        assignment.supervisors.forEach((link) => {
          availableReportSupervisorMap.set(link.supervisor.id, link.supervisor);
        });
      });

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        username: doctor.username,
        blockedUntil: doctor.blockedUntil,
        blockReason: doctor.blockReason,
      },
      supervisors,
      groupMembership,
      partnerPair,
      partnerRequests: {
        incoming: incomingPartnerRequests,
        outgoing: outgoingPartnerRequests,
      },
      schedule,
      clinicTasks,
      exams,
      reportSupervisors: Array.from(availableReportSupervisorMap.values()),
      tasks: [...directTasks, ...groupTasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      reports,
      feed: allGroupPosts,
      joinableGroups,
      stats: {
        supervisors: supervisors.length + (groupMembership?.group.supervisors.length || 0),
        tasks: directTasks.length + groupTasks.length,
        reportsSubmitted: reports.length,
        reportReviews: reports.filter((report) => report.status === ReportReviewStatus.REVIEWED).length,
      },
    };
  }
}
