import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PerformanceEventType, Prisma, SlotStatus } from "@prisma/client";
import { PrismaService } from "../prisma.service";

export type ListSlotsFilters = {
  doctorId?: string;
  patientIdentifier?: string;
  clinicId?: string;
  clinicCaseId?: string;
  fromDate?: string;
  toDate?: string;
};

export abstract class AppointmentsBaseService {
  constructor(protected readonly prisma: PrismaService) {}

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

  protected normalizeDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Invalid date filter.");
    }
    return parsed;
  }

  protected validateHalfStar(stars: number) {
    if (stars < 0.5 || stars > 5) {
      throw new BadRequestException("Rating must stay between 0.5 and 5.");
    }
    const doubled = stars * 2;
    if (!Number.isInteger(doubled)) {
      throw new BadRequestException("Ratings must use full or half stars.");
    }
  }

  protected async findPartnerSlotTx(
    tx: Prisma.TransactionClient,
    slot: {
      id: string;
      startTime: Date;
      rotationAssignmentId?: string | null;
    },
    partnerDoctorId?: string | null,
  ) {
    if (!partnerDoctorId || !slot.rotationAssignmentId) return null;
    return tx.availabilitySlot.findFirst({
      where: {
        doctorId: partnerDoctorId,
        rotationAssignmentId: slot.rotationAssignmentId,
        startTime: slot.startTime,
        id: { not: slot.id },
        status: { not: SlotStatus.CANCELLED },
      },
    });
  }

  protected async reopenPartnerSlotTx(
    tx: Prisma.TransactionClient,
    appointment: {
      partnerDoctorId?: string | null;
      slot: {
        id: string;
        startTime: Date;
        rotationAssignmentId?: string | null;
      };
    },
  ) {
    const partnerSlot = await this.findPartnerSlotTx(
      tx,
      appointment.slot,
      appointment.partnerDoctorId,
    );
    if (partnerSlot && partnerSlot.status === SlotStatus.PAIR_BLOCKED) {
      await tx.availabilitySlot.update({
        where: { id: partnerSlot.id },
        data: { status: SlotStatus.OPEN },
      });
    }
  }

  protected async createEvent(opts: {
    doctorId: string;
    patientId?: string;
    appointmentId?: string;
    type: PerformanceEventType;
  }) {
    await this.prisma.appointmentEvent.create({
      data: {
        doctorId: opts.doctorId,
        patientId: opts.patientId,
        appointmentId: opts.appointmentId,
        type: opts.type,
      },
    });
  }
}
