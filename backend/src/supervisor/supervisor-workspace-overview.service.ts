import { Injectable } from "@nestjs/common";
import {
  GroupJoinRequestStatus,
  Prisma,
  ReportReviewStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorWorkspaceOverviewService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
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
}
