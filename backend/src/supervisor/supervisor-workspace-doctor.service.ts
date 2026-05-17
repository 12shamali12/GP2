import { Injectable } from "@nestjs/common";
import { PartnerRequestStatus, ReportReviewStatus } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorWorkspaceDoctorService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
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
