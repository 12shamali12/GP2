import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorPlanningOverviewService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async planningWorkspace(adminId: string) {
    await this.requireAdmin(adminId);

    const [groups, clinics, shifts, rawPlans, semesters] = await Promise.all([
      this.prisma.doctorGroup.findMany({
        orderBy: [{ active: "desc" }, { name: "asc" }],
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
            orderBy: { createdAt: "desc" },
          },
          rotationAssignments: {
            orderBy: [{ assignmentDate: "asc" }, { plan: { startsOn: "asc" } }],
            include: {
              plan: {
                select: {
                  id: true,
                  label: true,
                  startsOn: true,
                  endsOn: true,
                  shift: {
                    select: {
                      id: true,
                      name: true,
                      startsAt: true,
                      endsAt: true,
                    },
                  },
                },
              },
              clinic: {
                select: {
                  id: true,
                  name: true,
                },
              },
              shift: {
                select: {
                  id: true,
                  name: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.clinic.findMany({
        orderBy: [{ active: "desc" }, { name: "asc" }],
        include: {
          tasks: {
            where: { active: true },
            orderBy: { createdAt: "desc" },
          },
          supervisorLinks: {
            orderBy: { supervisor: { name: "asc" } },
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
          },
        },
      }),
      this.prisma.shiftTemplate.findMany({
        orderBy: [{ active: "desc" }, { name: "asc" }],
      }),
      this.prisma.rotationPlan.findMany({
        orderBy: [{ active: "desc" }, { startsOn: "desc" }],
        include: {
          shift: {
            select: {
              id: true,
              name: true,
              startsAt: true,
              endsAt: true,
              appointmentCapacity: true,
              active: true,
            },
          },
          days: {
            orderBy: { assignmentDate: "asc" },
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          assignments: {
            orderBy: [{ assignmentDate: "asc" }, { clinic: { name: "asc" } }],
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  semesterLabel: true,
                },
              },
              clinic: {
                select: {
                  id: true,
                  name: true,
                },
              },
              shift: {
                select: {
                  id: true,
                  name: true,
                  startsAt: true,
                  endsAt: true,
                },
              },
            },
          },
          exams: {
            orderBy: { scheduledAt: "asc" },
            include: {
              clinic: {
                select: {
                  id: true,
                  name: true,
                },
              },
              student: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  doctorIdNumber: true,
                },
              },
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
      }),
      this.prisma.semester.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        include: {
          clinicCases: {
            where: { active: true },
            orderBy: [{ clinic: { name: "asc" } }, { title: "asc" }],
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
      }),
    ]);

    const plans = rawPlans.map((plan) => {
      const assignedGroupsMap = new Map<
        string,
        {
          group: { id: string; name: string; semesterLabel: string };
          assignments: typeof plan.assignments;
        }
      >();

      plan.assignments.forEach((assignment) => {
        const existing = assignedGroupsMap.get(assignment.group.id);
        if (existing) {
          existing.assignments.push(assignment);
          return;
        }

        assignedGroupsMap.set(assignment.group.id, {
          group: assignment.group,
          assignments: [assignment],
        });
      });

      return {
        ...plan,
        assignedGroups: Array.from(assignedGroupsMap.values()),
      };
    });

    const groupsWithPlanSummary = groups.map((group) => {
      const planSummary = this.summarizeGroupPlans(group.rotationAssignments);
      return {
        ...group,
        assignedPlans: planSummary.assignedPlans,
        currentPlan: planSummary.currentPlan,
        nextPlans: planSummary.nextPlans,
      };
    });

    return { groups: groupsWithPlanSummary, clinics, shifts, plans, semesters };
  }
}
