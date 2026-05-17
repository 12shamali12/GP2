import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorPlanningClinicsService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
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
}
