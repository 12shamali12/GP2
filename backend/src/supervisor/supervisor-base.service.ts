import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  DoctorStatus,
  PartnerRequestStatus,
  Prisma,
  Role,
  SlotStatus,
  SupervisorStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";

export abstract class SupervisorBaseService {
  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Verifies the caller (already JWT-authenticated by AdminGuard at controller
   * level) still exists and is an admin. Returns the admin user record so call
   * sites can attribute writes (reviewerId, createdById, etc).
   */
  protected async requireAdmin(adminId: string | undefined) {
    if (!adminId) {
      throw new ForbiddenException("Authentication required.");
    }
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });
    if (!admin || admin.role !== Role.ADMIN) {
      throw new ForbiddenException("Only the admin can perform this action.");
    }
    return admin;
  }

  protected async findUserByIdentifier(identifier: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
          { phone: identifier },
          { username: identifier },
          { doctorIdNumber: identifier },
        ],
      },
    });
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  protected async requireSupervisor(identifier: string) {
    const supervisor = await this.findUserByIdentifier(identifier);
    if (supervisor.role !== Role.SUPERVISOR) {
      throw new UnauthorizedException(
        "Only supervisors can perform this action.",
      );
    }
    if (supervisor.supervisorStatus !== SupervisorStatus.APPROVED) {
      throw new UnauthorizedException("Supervisor account is not approved.");
    }
    if (
      supervisor.blocked ||
      (supervisor.blockedUntil && supervisor.blockedUntil > new Date())
    ) {
      throw new UnauthorizedException("Supervisor account is blocked.");
    }
    return supervisor;
  }

  protected async requireDoctor(identifier: string) {
    const doctor = await this.findUserByIdentifier(identifier);
    if (doctor.role !== Role.DOCTOR) {
      throw new UnauthorizedException("Only doctors can perform this action.");
    }
    if (doctor.doctorStatus !== DoctorStatus.APPROVED) {
      throw new UnauthorizedException("Doctor account is not approved.");
    }
    if (
      doctor.blocked ||
      (doctor.blockedUntil && doctor.blockedUntil > new Date())
    ) {
      throw new UnauthorizedException("Doctor account is blocked.");
    }
    return doctor;
  }

  protected async ensureSupervisorManagesDoctor(
    _supervisorId: string,
    doctorId: string,
  ) {
    const doctor = await this.prisma.user.findUnique({ where: { id: doctorId } });
    if (
      !doctor ||
      doctor.role !== Role.DOCTOR ||
      doctor.doctorStatus !== DoctorStatus.APPROVED
    ) {
      throw new ForbiddenException("Doctor not found or not approved.");
    }
  }

  protected async assignDoctorToGroupTx(
    tx: Prisma.TransactionClient,
    groupId: string,
    doctorId: string,
    note?: string | null,
  ) {
    const existingMembership = await tx.doctorGroupMember.findUnique({
      where: { doctorId },
    });

    if (existingMembership) {
      if (existingMembership.groupId === groupId) {
        const membership = await tx.doctorGroupMember.update({
          where: { id: existingMembership.id },
          data: { note: note ?? existingMembership.note ?? null },
        });
        await this.syncDoctorSlotsForGroupTx(tx, groupId, doctorId);
        return membership;
      }

      await this.clearDoctorPartneringTx(tx, doctorId);
      const membership = await tx.doctorGroupMember.update({
        where: { id: existingMembership.id },
        data: { groupId, note: note ?? null },
      });
      await this.syncDoctorSlotsForGroupTx(tx, groupId, doctorId);
      return membership;
    }

    const membership = await tx.doctorGroupMember.create({
      data: {
        groupId,
        doctorId,
        note: note ?? null,
      },
    });
    await this.syncDoctorSlotsForGroupTx(tx, groupId, doctorId);
    return membership;
  }

  protected async assignSupervisorToGroupTx(
    tx: Prisma.TransactionClient,
    groupId: string,
    supervisorId: string,
  ) {
    const existing = await tx.doctorGroupSupervisor.findFirst({
      where: { groupId, supervisorId },
    });
    if (existing) return existing;

    return tx.doctorGroupSupervisor.create({
      data: {
        groupId,
        supervisorId,
      },
    });
  }

  protected async getSupervisorDoctorIds(supervisorId: string) {
    const directAssignments = await this.prisma.supervisionAssignment.findMany({
      where: { supervisorId, active: true },
      select: { doctorId: true },
    });

    const supervisedGroups = await this.prisma.doctorGroupSupervisor.findMany({
      where: { supervisorId },
      include: {
        group: {
          select: {
            members: { select: { doctorId: true } },
          },
        },
      },
    });

    const ids = new Set<string>();
    directAssignments.forEach((item) => ids.add(item.doctorId));
    supervisedGroups.forEach((link) => {
      link.group.members.forEach((member) => ids.add(member.doctorId));
    });
    return Array.from(ids);
  }

  protected normalizeDateOnly(value: string | Date) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid date value.");
    }
    date.setHours(0, 0, 0, 0);
    return date;
  }

  protected normalizeLabel(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  protected timeToMinutes(value: string) {
    const [hourText, minuteText = "0"] = value.split(":");
    const hours = Number(hourText);
    const minutes = Number(minuteText);
    return hours * 60 + minutes;
  }

  protected async ensurePlanLabelAvailable(label: string, excludePlanId?: string) {
    const normalized = this.normalizeLabel(label);
    const plans = await this.prisma.rotationPlan.findMany({
      where: excludePlanId
        ? {
            id: { not: excludePlanId },
          }
        : undefined,
      select: {
        id: true,
        label: true,
      },
    });
    const conflict = plans.find(
      (plan) => this.normalizeLabel(plan.label) === normalized,
    );
    if (conflict) {
      throw new BadRequestException("A plan with this name already exists.");
    }
  }

  protected async notifyAdmins(
    title: string,
    body: string,
    excludeRecipientIds: string[] = [],
  ) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: Role.ADMIN,
        ...(excludeRecipientIds.length
          ? { id: { notIn: excludeRecipientIds } }
          : {}),
      },
      select: { id: true },
    });

    if (!admins.length) return;

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        title,
        body,
        recipientId: admin.id,
      })),
    });
  }

  protected summarizeGroupPlans(
    assignments: Array<{
      id: string;
      assignmentDate: Date;
      notes?: string | null;
      clinic: { id: string; name: string };
      shift: { id: string; name: string; startsAt: string; endsAt: string };
      plan: {
        id: string;
        label: string;
        startsOn: Date;
        endsOn: Date;
        shift?: {
          id: string;
          name: string;
          startsAt: string;
          endsAt: string;
        } | null;
      } | null;
    }>,
  ) {
    const today = this.normalizeDateOnly(new Date());
    const planMap = new Map<
      string,
      {
        plan: NonNullable<(typeof assignments)[number]["plan"]>;
        assignments: typeof assignments;
      }
    >();

    assignments.forEach((assignment) => {
      if (!assignment.plan) return;
      if (this.normalizeDateOnly(assignment.plan.endsOn) < today) return;

      const existing = planMap.get(assignment.plan.id);
      if (existing) {
        existing.assignments.push(assignment);
        return;
      }

      planMap.set(assignment.plan.id, {
        plan: assignment.plan,
        assignments: [assignment],
      });
    });

    const activeAndUpcomingPlans = Array.from(planMap.values()).sort(
      (left, right) =>
        this.normalizeDateOnly(left.plan.startsOn).getTime() -
        this.normalizeDateOnly(right.plan.startsOn).getTime(),
    );

    const currentPlan =
      activeAndUpcomingPlans.find((entry) => {
        const startsOn = this.normalizeDateOnly(entry.plan.startsOn);
        const endsOn = this.normalizeDateOnly(entry.plan.endsOn);
        return startsOn <= today && endsOn >= today;
      }) || null;

    const nextPlans = activeAndUpcomingPlans.filter(
      (entry) => this.normalizeDateOnly(entry.plan.startsOn) > today,
    );

    return {
      assignedPlans: activeAndUpcomingPlans,
      currentPlan,
      nextPlans,
    };
  }

  protected getPlanWorkingDates(startsOn: string | Date) {
    const start = this.normalizeDateOnly(startsOn);
    if (start.getDay() !== 0) {
      throw new BadRequestException("Plans must start on a Sunday.");
    }

    const dates: Date[] = [];
    for (let offset = 0; offset < 12; offset += 1) {
      const next = new Date(start);
      next.setDate(start.getDate() + offset);
      const day = next.getDay();
      if (day >= 0 && day <= 4) {
        dates.push(next);
      }
    }

    const end = new Date(start);
    end.setDate(start.getDate() + 11);
    end.setHours(0, 0, 0, 0);

    return {
      start,
      end,
      dates,
      dateKeys: new Set(dates.map((date) => date.toISOString())),
    };
  }

  protected combineDateAndTime(dateValue: string | Date, timeValue: string) {
    const [hourText, minuteText = "0"] = timeValue.split(":");
    const hours = Number(hourText);
    const minutes = Number(minuteText);
    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException("Shift time must use HH:mm format.");
    }

    const date = this.normalizeDateOnly(dateValue);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  protected async clearDoctorPartneringTx(
    tx: Prisma.TransactionClient,
    doctorId: string,
  ) {
    await tx.partnerRequest.updateMany({
      where: {
        OR: [{ senderId: doctorId }, { receiverId: doctorId }],
        status: PartnerRequestStatus.PENDING,
      },
      data: {
        status: PartnerRequestStatus.CANCELLED,
        decidedAt: new Date(),
      },
    });

    await tx.partnerPair.deleteMany({
      where: {
        OR: [{ doctorOneId: doctorId }, { doctorTwoId: doctorId }],
      },
    });
  }

  protected async createDoctorSlotsForAssignmentTx(
    tx: Prisma.TransactionClient,
    assignment: {
      id: string;
      assignmentDate: Date;
      clinicId: string;
      clinic: { name: string };
      shift: { startsAt: string; endsAt: string; appointmentCapacity: number };
    },
    doctorId: string,
  ) {
    const shiftStart = this.combineDateAndTime(
      assignment.assignmentDate,
      assignment.shift.startsAt,
    );
    let shiftEnd = this.combineDateAndTime(
      assignment.assignmentDate,
      assignment.shift.endsAt,
    );
    if (shiftEnd <= shiftStart) {
      shiftEnd = new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    const capacity = Math.max(1, assignment.shift.appointmentCapacity || 2);
    const slotLengthMs = Math.floor(
      (shiftEnd.getTime() - shiftStart.getTime()) / capacity,
    );

    for (let index = 0; index < capacity; index += 1) {
      const startTime = new Date(shiftStart.getTime() + slotLengthMs * index);
      const endTime =
        index === capacity - 1
          ? new Date(shiftEnd)
          : new Date(shiftStart.getTime() + slotLengthMs * (index + 1));

      const existing = await tx.availabilitySlot.findFirst({
        where: {
          doctorId,
          startTime,
          status: { not: SlotStatus.CANCELLED },
        },
      });

      if (existing) continue;

      await tx.availabilitySlot.create({
        data: {
          doctorId,
          clinicId: assignment.clinicId,
          rotationAssignmentId: assignment.id,
          startTime,
          endTime,
          purpose: assignment.clinic.name,
          autoGenerated: true,
        },
      });
    }
  }

  protected async syncDoctorSlotsForGroupTx(
    tx: Prisma.TransactionClient,
    groupId: string,
    doctorId: string,
  ) {
    const today = this.normalizeDateOnly(new Date());
    const assignments = await tx.clinicRotationAssignment.findMany({
      where: {
        groupId,
        assignmentDate: { gte: today },
      },
      include: {
        clinic: { select: { name: true } },
        shift: {
          select: { startsAt: true, endsAt: true, appointmentCapacity: true },
        },
      },
      orderBy: { assignmentDate: "asc" },
    });

    for (const assignment of assignments) {
      await this.createDoctorSlotsForAssignmentTx(tx, assignment, doctorId);
    }
  }

  protected async clearFutureGroupPlanAssignmentsTx(
    tx: Prisma.TransactionClient,
    groupId: string,
    fromDate: Date,
    toDate?: Date,
  ) {
    const futureAssignments = await tx.clinicRotationAssignment.findMany({
      where: {
        groupId,
        assignmentDate: toDate
          ? { gte: fromDate, lte: toDate }
          : { gte: fromDate },
      },
      select: {
        id: true,
      },
    });

    if (!futureAssignments.length) {
      return;
    }

    const assignmentIds = futureAssignments.map((assignment) => assignment.id);
    const bookedSlots = await tx.availabilitySlot.findFirst({
      where: {
        rotationAssignmentId: { in: assignmentIds },
        OR: [{ status: SlotStatus.BOOKED }, { appointment: { isNot: null } }],
      },
      select: { id: true },
    });

    if (bookedSlots) {
      throw new BadRequestException(
        "This group already has booked future clinic slots. Clear those reservations before reassigning the plan.",
      );
    }

    await tx.availabilitySlot.deleteMany({
      where: {
        rotationAssignmentId: { in: assignmentIds },
      },
    });

    await tx.clinicRotationAssignment.deleteMany({
      where: {
        id: { in: assignmentIds },
      },
    });
  }
}


