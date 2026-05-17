import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { GroupJoinRequestStatus, PartnerRequestStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorPlanningService extends SupervisorBaseService {
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

  async createClinic(
    name: string,
    description: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException("Clinic name is required.");
    }
    const clinic = await this.prisma.clinic.create({
      data: {
        name: trimmedName,
        description: description ?? null,
      },
    });
    return { message: "Clinic created.", clinic };
  }

  async updateClinic(
    id: string,
    dto: { name?: string; description?: string },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const clinic = await this.prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      throw new NotFoundException("Clinic not found.");
    }

    const updated = await this.prisma.clinic.update({
      where: { id },
      data: {
        name: dto.name?.trim() || clinic.name,
        description:
          dto.description === undefined ? clinic.description : dto.description || null,
      },
    });

    return { message: "Clinic updated.", clinic: updated };
  }

  async deleteClinic(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const clinic = await this.prisma.clinic.findUnique({
      where: { id },
      include: {
        planDays: { select: { id: true }, take: 1 },
        tasks: { select: { id: true }, take: 1 },
        slots: { select: { id: true }, take: 1 },
        reports: { select: { id: true }, take: 1 },
        rotationAssignments: { select: { id: true }, take: 1 },
        supervisorAssignments: { select: { id: true }, take: 1 },
        supervisorLinks: { select: { id: true }, take: 1 },
        exams: { select: { id: true }, take: 1 },
      },
    });
    if (!clinic) {
      throw new NotFoundException("Clinic not found.");
    }
    if (
      clinic.planDays.length ||
      clinic.tasks.length ||
      clinic.slots.length ||
      clinic.reports.length ||
      clinic.rotationAssignments.length ||
      clinic.supervisorAssignments.length ||
      clinic.supervisorLinks.length ||
      clinic.exams.length
    ) {
      throw new BadRequestException("This clinic is already in use and cannot be deleted.");
    }

    await this.prisma.clinic.delete({ where: { id } });
    return { message: "Clinic deleted." };
  }

  async createShift(
    name: string,
    startsAt: string,
    endsAt: string,
    appointmentCapacity: number | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new BadRequestException("Shift name is required.");
    }
    const newStart = this.timeToMinutes(startsAt);
    const newEnd = this.timeToMinutes(endsAt);
    if (Number.isNaN(newStart) || Number.isNaN(newEnd) || newEnd <= newStart) {
      throw new BadRequestException("Shift start and end times must be valid and non-overlapping.");
    }

    const existingShifts = await this.prisma.shiftTemplate.findMany({
      where: { active: true },
    });
    const overlaps = existingShifts.some((shift) => {
      const existingStart = this.timeToMinutes(shift.startsAt);
      const existingEnd = this.timeToMinutes(shift.endsAt);
      return newStart < existingEnd && existingStart < newEnd;
    });
    if (overlaps) {
      throw new BadRequestException("No two shifts can overlap in time.");
    }

    const shift = await this.prisma.shiftTemplate.create({
      data: {
        name: trimmedName,
        startsAt,
        endsAt,
        appointmentCapacity: appointmentCapacity ?? 2,
      },
    });
    return { message: "Shift created.", shift };
  }

  async updateShift(
    id: string,
    dto: { name?: string; startsAt?: string; endsAt?: string; appointmentCapacity?: number },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const shift = await this.prisma.shiftTemplate.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException("Shift not found.");
    }

    const nextName = dto.name?.trim() || shift.name;
    const nextStartsAt = dto.startsAt || shift.startsAt;
    const nextEndsAt = dto.endsAt || shift.endsAt;
    const nextCapacity = dto.appointmentCapacity ?? shift.appointmentCapacity;
    const nextStart = this.timeToMinutes(nextStartsAt);
    const nextEnd = this.timeToMinutes(nextEndsAt);

    if (Number.isNaN(nextStart) || Number.isNaN(nextEnd) || nextEnd <= nextStart) {
      throw new BadRequestException("Shift start and end times must be valid and non-overlapping.");
    }

    const existingShifts = await this.prisma.shiftTemplate.findMany({
      where: {
        active: true,
        id: { not: id },
      },
    });
    const overlaps = existingShifts.some((existing) => {
      const existingStart = this.timeToMinutes(existing.startsAt);
      const existingEnd = this.timeToMinutes(existing.endsAt);
      return nextStart < existingEnd && existingStart < nextEnd;
    });
    if (overlaps) {
      throw new BadRequestException("No two shifts can overlap in time.");
    }

    const updated = await this.prisma.shiftTemplate.update({
      where: { id },
      data: {
        name: nextName,
        startsAt: nextStartsAt,
        endsAt: nextEndsAt,
        appointmentCapacity: nextCapacity,
      },
    });

    return { message: "Shift updated.", shift: updated };
  }

  async deleteShift(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const shift = await this.prisma.shiftTemplate.findUnique({
      where: { id },
      include: {
        plans: { select: { id: true }, take: 1 },
        rotationAssignments: { select: { id: true }, take: 1 },
        supervisorAssignments: { select: { id: true }, take: 1 },
        exams: { select: { id: true }, take: 1 },
      },
    });
    if (!shift) {
      throw new NotFoundException("Shift not found.");
    }
    if (
      shift.plans.length ||
      shift.rotationAssignments.length ||
      shift.supervisorAssignments.length ||
      shift.exams.length
    ) {
      throw new BadRequestException("This shift is already in use and cannot be deleted.");
    }

    await this.prisma.shiftTemplate.delete({ where: { id } });
    return { message: "Shift deleted." };
  }

  async createRotationPlan(
    label: string,
    startsOn: string,
    shiftId: string,
    adminId: string,
  ) {
    const admin = await this.requireAdmin(adminId);
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      throw new BadRequestException("Plan name is required.");
    }
    await this.ensurePlanLabelAvailable(trimmedLabel);
    const shift = await this.prisma.shiftTemplate.findUnique({ where: { id: shiftId } });
    if (!shift || !shift.active) {
      throw new NotFoundException("Shift not found.");
    }
    const { start, end } = this.getPlanWorkingDates(startsOn);

    const plan = await this.prisma.rotationPlan.create({
      data: {
        label: trimmedLabel,
        startsOn: start,
        endsOn: end,
        shiftId,
        createdById: admin.id,
      },
      include: {
        shift: true,
      },
    });
    return { message: "Rotation plan created.", plan };
  }

  async updateRotationPlan(
    id: string,
    dto: { label?: string; startsOn?: string; shiftId?: string },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const plan = await this.prisma.rotationPlan.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { assignmentDate: { gte: this.normalizeDateOnly(new Date()) } },
          select: { id: true },
        },
      },
    });
    if (!plan) {
      throw new NotFoundException("Rotation plan not found.");
    }

    const nextLabel = dto.label?.trim() || plan.label;
    if (!nextLabel) {
      throw new BadRequestException("Plan name is required.");
    }
    await this.ensurePlanLabelAvailable(nextLabel, id);

    const changingSchedule = Boolean(dto.startsOn || dto.shiftId);
    if (changingSchedule && plan.assignments.length > 0) {
      throw new BadRequestException(
        "This plan is already assigned to a group. Clear future assignments before changing the plan shell.",
      );
    }

    const shiftId = dto.shiftId || plan.shiftId;
    if (!shiftId) {
      throw new BadRequestException("Choose a fixed shift.");
    }
    const shift = await this.prisma.shiftTemplate.findUnique({ where: { id: shiftId } });
    if (!shift || !shift.active) {
      throw new NotFoundException("Shift not found.");
    }

    const window = this.getPlanWorkingDates(dto.startsOn || plan.startsOn);
    const dayCount = await this.prisma.rotationPlanDay.count({ where: { planId: id } });
    if (dayCount > 0 && dayCount !== window.dates.length) {
      throw new BadRequestException("Existing plan days do not match the expected two-week working window.");
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.startsOn) {
        await tx.rotationPlanDay.deleteMany({
          where: { planId: id },
        });
      }

      return tx.rotationPlan.update({
        where: { id },
        data: {
          label: nextLabel,
          startsOn: window.start,
          endsOn: window.end,
          shiftId,
        },
        include: {
          shift: true,
        },
      });
    });

    return { message: "Rotation plan updated.", plan: updated };
  }

  async deleteRotationPlan(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const plan = await this.prisma.rotationPlan.findUnique({
      where: { id },
      include: {
        assignments: { select: { id: true }, take: 1 },
        supervisorAssignments: { select: { id: true }, take: 1 },
        exams: { select: { id: true }, take: 1 },
        days: { select: { id: true } },
      },
    });
    if (!plan) {
      throw new NotFoundException("Rotation plan not found.");
    }
    if (plan.assignments.length || plan.supervisorAssignments.length || plan.exams.length) {
      throw new BadRequestException("This plan is already published and cannot be deleted.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.rotationPlanDay.deleteMany({ where: { planId: id } });
      await tx.rotationPlan.delete({ where: { id } });
    });

    return { message: "Rotation plan deleted." };
  }

  async saveRotationPlanDays(
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
    await this.requireAdmin(adminId);
    const plan = await this.prisma.rotationPlan.findUnique({
      where: { id: planId },
      include: {
        assignments: {
          where: { assignmentDate: { gte: this.normalizeDateOnly(new Date()) } },
          select: { id: true },
        },
      },
    });
    if (!plan) throw new NotFoundException("Rotation plan not found.");
    if (!plan.shiftId) {
      throw new BadRequestException("Select a fixed shift before saving the clinic schedule.");
    }
    if (plan.assignments.length > 0) {
      throw new BadRequestException(
        "This plan is already assigned to a group. Reassign the group after changing the plan days.",
      );
    }

    const workingWindow = this.getPlanWorkingDates(plan.startsOn);
    if (days.length !== workingWindow.dates.length) {
      throw new BadRequestException(`A plan must include exactly ${workingWindow.dates.length} schedule days.`);
    }

    const normalizedDays = days.map((day) => ({
      assignmentDate: this.normalizeDateOnly(day.assignmentDate),
      clinicId: day.isVacation ? null : day.clinicId ?? null,
      isVacation: Boolean(day.isVacation),
      vacationReason: day.isVacation ? day.vacationReason?.trim() || day.notes?.trim() || null : null,
      notes: day.notes ?? null,
    }));

    const uniqueDates = new Set(normalizedDays.map((day) => day.assignmentDate.toISOString()));
    if (uniqueDates.size !== normalizedDays.length) {
      throw new BadRequestException("Each day can only be used once inside the plan.");
    }

    for (const day of normalizedDays) {
      if (!workingWindow.dateKeys.has(day.assignmentDate.toISOString())) {
        throw new BadRequestException("Plan days must stay inside the two-week Sunday-to-Thursday window.");
      }
      if (!day.isVacation && !day.clinicId) {
        throw new BadRequestException("Each plan day must choose a clinic or be marked as vacation.");
      }
      if (day.isVacation && !day.vacationReason) {
        throw new BadRequestException("Vacation days need a reason.");
      }
    }

    const clinicIds = Array.from(
      new Set(normalizedDays.map((day) => day.clinicId).filter((clinicId): clinicId is string => Boolean(clinicId))),
    );
    const activeClinics = await this.prisma.clinic.findMany({
      where: {
        active: true,
        id: { in: clinicIds },
      },
      select: { id: true },
    });
    if (activeClinics.length !== clinicIds.length) {
      throw new BadRequestException("One or more selected clinics are inactive or missing.");
    }

    const savedPlan = await this.prisma.$transaction(async (tx) => {
      await tx.rotationPlanDay.deleteMany({
        where: { planId },
      });

      await tx.rotationPlanDay.createMany({
        data: normalizedDays.map((day) => ({
          planId,
          clinicId: day.clinicId,
          assignmentDate: day.assignmentDate,
          isVacation: day.isVacation,
          vacationReason: day.vacationReason,
          notes: day.notes,
        })),
      });

      return tx.rotationPlan.findUnique({
        where: { id: planId },
        include: {
          shift: true,
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
        },
      });
    });

    return { message: "Plan days saved.", plan: savedPlan };
  }

  async assignPlanToGroup(
    planId: string,
    groupId: string,
    notes: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);

    const [plan, group] = await Promise.all([
      this.prisma.rotationPlan.findUnique({
        where: { id: planId },
        include: {
          shift: true,
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
        },
      }),
      this.prisma.doctorGroup.findUnique({
        where: { id: groupId },
        include: {
          members: {
            select: {
              doctorId: true,
            },
          },
        },
      }),
    ]);

    if (!plan) throw new NotFoundException("Rotation plan not found.");
    if (!group) throw new NotFoundException("Group not found.");
    if (!plan.shiftId || !plan.shift) {
      throw new BadRequestException("This plan does not have a fixed shift.");
    }
    const planShiftId = plan.shiftId;
    const planShift = plan.shift;

    const workingWindow = this.getPlanWorkingDates(plan.startsOn);
    if (plan.days.length !== workingWindow.dates.length) {
      throw new BadRequestException(
        "Finish the full two-week clinic schedule before assigning the plan to a group.",
      );
    }

    const dayKeys = new Set(
      plan.days.map((day) => this.normalizeDateOnly(day.assignmentDate).toISOString()),
    );
    if (dayKeys.size !== workingWindow.dates.length) {
      throw new BadRequestException("The plan contains duplicate or missing clinic days.");
    }

    const planStart = this.normalizeDateOnly(plan.startsOn);
    const planEnd = this.normalizeDateOnly(plan.endsOn);
    const assignments = await this.prisma.$transaction(async (tx) => {
      await this.clearFutureGroupPlanAssignmentsTx(tx, group.id, planStart, planEnd);

      for (const day of plan.days) {
        if (day.isVacation || !day.clinicId || !day.clinic) {
          continue;
        }
        const conflict = await tx.clinicRotationAssignment.findFirst({
          where: {
            assignmentDate: this.normalizeDateOnly(day.assignmentDate),
            shiftId: plan.shiftId!,
            clinicId: day.clinicId,
            NOT: { groupId: group.id },
          },
          include: {
            group: {
              select: {
                name: true,
              },
            },
          },
        });

        if (conflict) {
          throw new BadRequestException(
            `${day.clinic.name} is already assigned to ${conflict.group.name} on ${new Date(day.assignmentDate).toLocaleDateString()} during ${planShift.name}.`,
          );
        }
      }

      const createdAssignments: Array<{
        id: string;
        assignmentDate: Date;
        clinicId: string;
        clinic: { name: string };
        shift: { startsAt: string; endsAt: string; appointmentCapacity: number };
      }> = [];
      for (const day of plan.days) {
        if (day.isVacation || !day.clinicId || !day.clinic) {
          continue;
        }
        const created = await tx.clinicRotationAssignment.create({
          data: {
            planId: plan.id,
            groupId: group.id,
            clinicId: day.clinicId,
            shiftId: planShiftId,
            assignmentDate: this.normalizeDateOnly(day.assignmentDate),
            notes: notes ?? day.notes ?? undefined,
          },
        });

        for (const member of group.members) {
          await this.createDoctorSlotsForAssignmentTx(
            tx,
            {
              id: created.id,
              assignmentDate: created.assignmentDate,
              clinicId: created.clinicId,
              clinic: { name: day.clinic.name },
              shift: {
                startsAt: planShift.startsAt,
                endsAt: planShift.endsAt,
                appointmentCapacity: planShift.appointmentCapacity,
              },
            },
            member.doctorId,
          );
        }
        createdAssignments.push({
          id: created.id,
          assignmentDate: created.assignmentDate,
          clinicId: created.clinicId,
          clinic: { name: day.clinic.name },
          shift: {
            startsAt: planShift.startsAt,
            endsAt: planShift.endsAt,
            appointmentCapacity: planShift.appointmentCapacity,
          },
        });
      }

      if (group.members.length > 0) {
        await tx.notification.createMany({
          data: group.members.map((member) => ({
            title: "New clinic plan assigned",
            body: `${group.name} was assigned to ${plan.label} for the next two weeks (${planShift.name}).`,
            recipientId: member.doctorId,
          })),
        });
      }

      return createdAssignments;
    });

    return { message: "Plan assigned to group.", assignments };
  }

  async assignGroupToClinicShift(
    planId: string,
    groupId: string,
    clinicId: string,
    shiftId: string,
    assignmentDate: string,
    notes: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const date = this.normalizeDateOnly(assignmentDate);
    const [plan, group, clinic, shift] = await Promise.all([
      this.prisma.rotationPlan.findUnique({ where: { id: planId } }),
      this.prisma.doctorGroup.findUnique({
        where: { id: groupId },
        include: {
          members: {
            select: {
              doctorId: true,
            },
          },
        },
      }),
      this.prisma.clinic.findUnique({ where: { id: clinicId } }),
      this.prisma.shiftTemplate.findUnique({ where: { id: shiftId } }),
    ]);

    if (!plan) throw new NotFoundException("Rotation plan not found.");
    if (!group) throw new NotFoundException("Group not found.");
    if (!clinic) throw new NotFoundException("Clinic not found.");
    if (!shift) throw new NotFoundException("Shift not found.");
    if (date < this.normalizeDateOnly(plan.startsOn) || date > this.normalizeDateOnly(plan.endsOn)) {
      throw new BadRequestException("Assignment date must stay inside the plan range.");
    }

    const existing = await this.prisma.clinicRotationAssignment.findFirst({
      where: {
        assignmentDate: date,
        shiftId,
        groupId,
      },
    });

    const assignment = await this.prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.clinicRotationAssignment.update({
            where: { id: existing.id },
            data: {
              planId,
              clinicId,
              notes: notes ?? existing.notes ?? null,
            },
            include: {
              clinic: { select: { name: true } },
              shift: { select: { startsAt: true, endsAt: true, appointmentCapacity: true } },
            },
          })
        : await tx.clinicRotationAssignment.create({
            data: {
              planId,
              groupId,
              clinicId,
              shiftId,
              assignmentDate: date,
              notes: notes ?? null,
            },
            include: {
              clinic: { select: { name: true } },
              shift: { select: { startsAt: true, endsAt: true, appointmentCapacity: true } },
            },
          });

      for (const member of group.members) {
        await this.createDoctorSlotsForAssignmentTx(tx, saved, member.doctorId);
        await tx.notification.create({
          data: {
            title: "Clinic rotation assigned",
            body: `${group.name} is scheduled in ${clinic.name} on ${date.toLocaleDateString()} during ${shift.name}.`,
            recipientId: member.doctorId,
          },
        });
      }

      return saved;
    });

    return { message: "Clinic rotation assigned.", assignment };
  }

  async assignSupervisorToClinic(
    clinicId: string,
    supervisorId: string,
    notes: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const [clinic, supervisor] = await Promise.all([
      this.prisma.clinic.findUnique({ where: { id: clinicId } }),
      this.prisma.user.findUnique({ where: { id: supervisorId } }),
    ]);

    if (!clinic) throw new NotFoundException("Clinic not found.");
    if (!supervisor || supervisor.role !== Role.SUPERVISOR) {
      throw new BadRequestException("Supervisor not found.");
    }

    const existing = await this.prisma.clinicSupervisorLink.findFirst({
      where: {
        clinicId,
        supervisorId,
      },
    });

    const assignment = existing
      ? await this.prisma.clinicSupervisorLink.update({
          where: { id: existing.id },
          data: {
            notes: notes ?? existing.notes ?? null,
          },
        })
      : await this.prisma.clinicSupervisorLink.create({
          data: {
            clinicId,
            supervisorId,
            notes: notes ?? null,
          },
        });

    await this.prisma.notification.create({
      data: {
        title: "Clinic supervision updated",
        body: `You were linked to ${clinic.name} as one of its clinic supervisors.`,
        recipientId: supervisorId,
      },
    });

    return { message: "Supervisor linked to clinic.", assignment };
  }

  async removeSupervisorFromClinic(
    clinicId: string,
    supervisorId: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const existing = await this.prisma.clinicSupervisorLink.findFirst({
      where: { clinicId, supervisorId },
      include: {
        clinic: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException("Supervisor clinic link not found.");
    }

    await this.prisma.clinicSupervisorLink.delete({
      where: { id: existing.id },
    });

    await this.prisma.notification.create({
      data: {
        title: "Clinic supervision removed",
        body: `You were removed from ${existing.clinic.name}.`,
        recipientId: supervisorId,
      },
    });

    return { message: "Supervisor removed from clinic." };
  }

  async createClinicTask(
    clinicId: string,
    title: string,
    description: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const clinic = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new NotFoundException("Clinic not found.");

    const task = await this.prisma.clinicTask.create({
      data: {
        clinicId,
        title,
        description: description ?? null,
      },
    });
    return { message: "Clinic task created.", task };
  }

  async createSemester(
    label: string,
    sortOrder: number | undefined,
    endsOn: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      throw new BadRequestException("Semester name is required.");
    }

    const semester = await this.prisma.semester.create({
      data: {
        label: trimmedLabel,
        sortOrder: sortOrder ?? 0,
        endsOn: endsOn ? this.normalizeDateOnly(endsOn) : null,
      },
    });

    return { message: "Semester created.", semester };
  }

  async updateSemester(
    id: string,
    dto: { label?: string; sortOrder?: number; endsOn?: string },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const semester = await this.prisma.semester.findUnique({ where: { id } });
    if (!semester) {
      throw new NotFoundException("Semester not found.");
    }

    const updated = await this.prisma.semester.update({
      where: { id },
      data: {
        label: dto.label?.trim() || semester.label,
        sortOrder: dto.sortOrder ?? semester.sortOrder,
        endsOn:
          dto.endsOn === undefined
            ? semester.endsOn
            : dto.endsOn
              ? this.normalizeDateOnly(dto.endsOn)
              : null,
      },
    });

    return { message: "Semester updated.", semester: updated };
  }

  async deleteSemester(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        students: { select: { id: true }, take: 1 },
        clinicCases: { select: { id: true }, take: 1 },
      },
    });
    if (!semester) {
      throw new NotFoundException("Semester not found.");
    }
    if (semester.students.length || semester.clinicCases.length) {
      throw new BadRequestException("This semester is already in use and cannot be deleted.");
    }

    await this.prisma.semester.delete({ where: { id } });
    return { message: "Semester deleted." };
  }

  async createSemesterClinicCase(
    semesterId: string,
    clinicId: string,
    title: string,
    description: string | undefined,
    requiredCount: number | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new BadRequestException("Case title is required.");
    }

    const [semester, clinic] = await Promise.all([
      this.prisma.semester.findUnique({ where: { id: semesterId } }),
      this.prisma.clinic.findUnique({ where: { id: clinicId } }),
    ]);
    if (!semester) throw new NotFoundException("Semester not found.");
    if (!clinic) throw new NotFoundException("Clinic not found.");

    const item = await this.prisma.semesterClinicCase.create({
      data: {
        semesterId,
        clinicId,
        title: trimmedTitle,
        description: description ?? null,
        requiredCount: requiredCount ?? 1,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        semester: {
          select: {
            id: true,
            label: true,
            sortOrder: true,
            endsOn: true,
          },
        },
      },
    });

    return { message: "Clinic case saved.", clinicCase: item };
  }

  async updateSemesterClinicCase(
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
    await this.requireAdmin(adminId);
    const clinicCase = await this.prisma.semesterClinicCase.findUnique({ where: { id } });
    if (!clinicCase) throw new NotFoundException("Clinic case not found.");

    const updated = await this.prisma.semesterClinicCase.update({
      where: { id },
      data: {
        semesterId: dto.semesterId ?? clinicCase.semesterId,
        clinicId: dto.clinicId ?? clinicCase.clinicId,
        title: dto.title?.trim() || clinicCase.title,
        description:
          dto.description === undefined
            ? clinicCase.description
            : dto.description || null,
        requiredCount: dto.requiredCount ?? clinicCase.requiredCount,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        semester: {
          select: {
            id: true,
            label: true,
            sortOrder: true,
            endsOn: true,
          },
        },
      },
    });

    return { message: "Clinic case updated.", clinicCase: updated };
  }

  async deleteSemesterClinicCase(
    id: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const clinicCase = await this.prisma.semesterClinicCase.findUnique({
      where: { id },
      include: {
        appointments: { select: { id: true }, take: 1 },
        progress: { select: { id: true }, take: 1 },
      },
    });
    if (!clinicCase) throw new NotFoundException("Clinic case not found.");
    if (clinicCase.appointments.length || clinicCase.progress.length) {
      throw new BadRequestException("This clinic case is already in use and cannot be deleted.");
    }

    await this.prisma.semesterClinicCase.delete({ where: { id } });
    return { message: "Clinic case deleted." };
  }

  private async collectSemesterProgressionPreview() {
    const semesters = await this.prisma.semester.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        label: true,
        sortOrder: true,
        endsOn: true,
      },
    });

    const byId = new Map(semesters.map((semester) => [semester.id, semester]));
    const nextBySemesterId = new Map<string, (typeof semesters)[number] | null>();
    semesters.forEach((semester, index) => {
      nextBySemesterId.set(semester.id, semesters[index + 1] || null);
    });

    const students = await this.prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        semesterId: { not: null },
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        doctorIdNumber: true,
        semesterId: true,
      },
    });

    const today = this.normalizeDateOnly(new Date());
    const dueStudents = students.reduce<
      Array<{
        id: string;
        name: string;
        username: string;
        doctorIdNumber: string | null;
        currentSemester: (typeof semesters)[number];
        nextSemester: (typeof semesters)[number];
      }>
    >((accumulator, student) => {
      const currentSemester = student.semesterId
        ? byId.get(student.semesterId)
        : null;
      if (!currentSemester?.endsOn) return accumulator;
      if (this.normalizeDateOnly(currentSemester.endsOn) > today) return accumulator;
      const nextSemester = nextBySemesterId.get(currentSemester.id) || null;
      if (!nextSemester) return accumulator;
      accumulator.push({
        id: student.id,
        name: student.name,
        username: student.username,
        doctorIdNumber: student.doctorIdNumber,
        currentSemester,
        nextSemester,
      });
      return accumulator;
    }, []);

    return {
      semesters,
      dueStudents,
    };
  }

  async semesterProgression(adminId: string) {
    await this.requireAdmin(adminId);
    return this.collectSemesterProgressionPreview();
  }

  async advanceEligibleStudents(adminId: string) {
    await this.requireAdmin(adminId);
    const preview = await this.collectSemesterProgressionPreview();
    if (!preview.dueStudents.length) {
      return { message: "No students need semester progression right now.", advanced: [] };
    }

    const advanced = await this.prisma.$transaction(async (tx) => {
      const moved: Array<{
        id: string;
        name: string;
        username: string;
        doctorIdNumber?: string | null;
        fromSemester: string;
        toSemester: string;
      }> = [];

      for (const student of preview.dueStudents) {
        await tx.user.update({
          where: { id: student.id },
          data: { semesterId: student.nextSemester.id },
        });
        moved.push({
          id: student.id,
          name: student.name,
          username: student.username,
          doctorIdNumber: student.doctorIdNumber,
          fromSemester: student.currentSemester.label,
          toSemester: student.nextSemester.label,
        });
      }

      if (moved.length) {
        await tx.notification.createMany({
          data: moved.map((student) => ({
            title: "Semester updated",
            body: `You were advanced from ${student.fromSemester} to ${student.toSemester}.`,
            recipientId: student.id,
          })),
        });
      }

      return moved;
    });

    return {
      message: `${advanced.length} student${advanced.length === 1 ? "" : "s"} advanced.`,
      advanced,
    };
  }

  async updateStudentSemester(
    userId: string,
    semesterId: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        semesterId: true,
      },
    });
    if (!student || student.role !== Role.DOCTOR) {
      throw new NotFoundException("Student doctor not found.");
    }

    const semester = semesterId
      ? await this.prisma.semester.findUnique({
          where: { id: semesterId },
          select: { id: true, label: true, active: true },
        })
      : null;

    if (semesterId && (!semester || !semester.active)) {
      throw new NotFoundException("Semester not found.");
    }

    await this.prisma.user.update({
      where: { id: student.id },
      data: { semesterId: semester?.id ?? null },
    });

    await this.prisma.notification.create({
      data: {
        title: "Semester assignment updated",
        body: semester
          ? `Your semester was updated to ${semester.label}.`
          : "Your semester assignment was cleared.",
        recipientId: student.id,
      },
    });

    return {
      message: semester
        ? "Student semester updated."
        : "Student semester cleared.",
    };
  }
}
