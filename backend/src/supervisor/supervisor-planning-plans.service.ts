import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorPlanningPlansService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
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
}
