import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AppointmentStatus,
  ClinicCaseProgressStatus,
  Prisma,
  Role,
  SlotStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import {
  AppointmentsBaseService,
  ListSlotsFilters,
} from "./appointments-base.service";
import { CreateSlotDto } from "./dto";

@Injectable()
export class AppointmentsSlotsService extends AppointmentsBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createSlot(dto: CreateSlotDto) {
    const doctor = await this.findUserByIdentifier(dto.doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can create slots.");
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (!(start.getTime() < end.getTime())) throw new BadRequestException("startTime must be before endTime");

    const duplicate = await this.prisma.availabilitySlot.findFirst({
      where: {
        doctorId: doctor.id,
        startTime: start,
        status: { not: SlotStatus.CANCELLED },
      },
    });
    if (duplicate) throw new BadRequestException("You already have a slot at this time.");

    const slot = await this.prisma.availabilitySlot.create({
      data: {
        doctorId: doctor.id,
        startTime: start,
        endTime: end,
        purpose: dto.purpose ?? "General",
      },
    });
    await this.prisma.notification.create({
      data: {
        title: "Slot added",
        body: `You added a slot for ${start.toISOString()}.`,
        recipientId: doctor.id,
      },
    });
    return { message: "Slot created.", slot };
  }

  async listSlots(filters: ListSlotsFilters = {}) {
    await this.prisma.availabilitySlot.deleteMany({
      where: {
        status: { in: [SlotStatus.OPEN, SlotStatus.PAIR_BLOCKED] },
        appointment: { is: null },
        startTime: { lt: new Date() },
      },
    });

    if (filters.doctorId) {
      return this.prisma.availabilitySlot.findMany({
        where: { doctorId: filters.doctorId },
        orderBy: { startTime: "asc" },
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
              clinicCase: {
                select: {
                  id: true,
                  title: true,
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
          doctor: {
            select: {
              id: true,
              name: true,
              avatar: true,
              doctorIdNumber: true,
              phone: true,
            },
          },
        },
      });
    }

    const where: Prisma.AvailabilitySlotWhereInput = {
      status: SlotStatus.OPEN,
    };

    if (filters.clinicId) {
      where.clinicId = filters.clinicId;
    }
    if (filters.fromDate || filters.toDate) {
      where.startTime = {
        ...(filters.fromDate ? { gte: this.normalizeDate(filters.fromDate) } : {}),
        ...(filters.toDate ? { lte: this.normalizeDate(filters.toDate) } : {}),
      };
    }

    const slots = await this.prisma.availabilitySlot.findMany({
      where,
      orderBy: { startTime: "asc" },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            avatar: true,
            doctorIdNumber: true,
            phone: true,
            semesterId: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!slots.length) {
      return [];
    }

    const patient = filters.patientIdentifier
      ? await this.findUserByIdentifier(filters.patientIdentifier)
      : null;
    if (patient && patient.role !== Role.PATIENT) {
      throw new UnauthorizedException("Only patients can search patient-facing slots.");
    }

    const doctorIds = Array.from(new Set(slots.map((slot) => slot.doctorId)));
    const clinicIds = Array.from(
      new Set(slots.map((slot) => slot.clinicId).filter((clinicId): clinicId is string => Boolean(clinicId))),
    );
    const semesterIds = Array.from(
      new Set(slots.map((slot) => slot.doctor.semesterId).filter((semesterId): semesterId is string => Boolean(semesterId))),
    );

    const [pairs, clinicCases, progressEntries, patientAppointments, linkedSlots] =
      await Promise.all([
        this.prisma.partnerPair.findMany({
          where: {
            OR: [
              { doctorOneId: { in: doctorIds } },
              { doctorTwoId: { in: doctorIds } },
            ],
          },
          select: {
            doctorOneId: true,
            doctorTwoId: true,
          },
        }),
        this.prisma.semesterClinicCase.findMany({
          where: {
            active: true,
            ...(filters.clinicId ? { clinicId: filters.clinicId } : clinicIds.length ? { clinicId: { in: clinicIds } } : {}),
            ...(semesterIds.length ? { semesterId: { in: semesterIds } } : { id: "__none__" }),
          },
          orderBy: [{ clinic: { name: "asc" } }, { title: "asc" }],
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
              },
            },
          },
        }),
        this.prisma.doctorClinicCaseProgress.findMany({
          where: {
            doctorId: { in: doctorIds },
            status: ClinicCaseProgressStatus.COMPLETED,
          },
          select: {
            doctorId: true,
            clinicCaseId: true,
          },
        }),
        patient
          ? this.prisma.appointment.findMany({
              where: {
                patientId: patient.id,
                status: { in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED] },
              },
              select: {
                slot: {
                  select: {
                    startTime: true,
                  },
                },
              },
            })
          : Promise.resolve([]),
        this.prisma.availabilitySlot.findMany({
          where: {
            rotationAssignmentId: {
              in: Array.from(
                new Set(
                  slots
                    .map((slot) => slot.rotationAssignmentId)
                    .filter((assignmentId): assignmentId is string => Boolean(assignmentId)),
                ),
              ),
            },
            startTime: {
              in: Array.from(new Set(slots.map((slot) => slot.startTime))),
            },
            status: { not: SlotStatus.CANCELLED },
          },
          select: {
            id: true,
            doctorId: true,
            rotationAssignmentId: true,
            startTime: true,
            status: true,
          },
        }),
      ]);

    const partnerMap = new Map<string, string>();
    pairs.forEach((pair) => {
      partnerMap.set(pair.doctorOneId, pair.doctorTwoId);
      partnerMap.set(pair.doctorTwoId, pair.doctorOneId);
    });

    const completedMap = new Set(
      progressEntries.map((entry) => `${entry.doctorId}:${entry.clinicCaseId}`),
    );
    const patientTimes = new Set(
      patientAppointments
        .map((appointment) => appointment.slot?.startTime?.toISOString?.())
        .filter((value): value is string => Boolean(value)),
    );
    const linkedSlotMap = new Map<string, typeof linkedSlots[number]>();
    linkedSlots.forEach((slot) => {
      linkedSlotMap.set(
        `${slot.rotationAssignmentId || "none"}:${slot.doctorId}:${slot.startTime.toISOString()}`,
        slot,
      );
    });

    return slots
      .map((slot) => {
        const slotTime = slot.startTime.toISOString();
        if (patientTimes.has(slotTime)) return null;

        const partnerDoctorId = partnerMap.get(slot.doctorId) || null;
        if (partnerDoctorId && slot.rotationAssignmentId) {
          const partnerSlot = linkedSlotMap.get(
            `${slot.rotationAssignmentId}:${partnerDoctorId}:${slotTime}`,
          );
          if (partnerSlot && partnerSlot.status !== SlotStatus.OPEN) {
            return null;
          }
        }

        const caseOptions = clinicCases.filter((clinicCase) => {
          if (!slot.clinicId || clinicCase.clinicId !== slot.clinicId) return false;
          if (slot.doctor.semesterId !== clinicCase.semesterId) return false;
          return !completedMap.has(`${slot.doctorId}:${clinicCase.id}`);
        });

        if (filters.clinicCaseId && !caseOptions.some((item) => item.id === filters.clinicCaseId)) {
          return null;
        }

        return {
          ...slot,
          partnerDoctorId,
          caseOptions,
        };
      })
      .filter((slot): slot is NonNullable<typeof slot> => Boolean(slot));
  }

  async deleteSlot(slotId: string, doctorIdentifier: string) {
    const doctor = await this.findUserByIdentifier(doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can delete slots.");

    return this.prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
        include: {
          appointment: {
            select: {
              id: true,
              patientId: true,
              partnerDoctorId: true,
            },
          },
        },
      });
      if (!slot) throw new NotFoundException("Slot not found.");
      if (slot.doctorId !== doctor.id) throw new UnauthorizedException("Not your slot.");

      if (slot.appointment) {
        await tx.notification.create({
          data: {
            title: "Appointment cancelled",
            body: "Doctor cancelled your reservation because the slot was removed.",
            recipientId: slot.appointment.patientId,
          },
        });
        await this.reopenPartnerSlotTx(tx, {
          partnerDoctorId: slot.appointment.partnerDoctorId,
          slot,
        });
        await tx.appointment.delete({ where: { id: slot.appointment.id } });
      }

      await tx.availabilitySlot.delete({ where: { id: slot.id } });
      await tx.notification.create({
        data: {
          title: "Slot removed",
          body: `You removed your slot for ${slot.startTime.toISOString()}.`,
          recipientId: doctor.id,
        },
      });

      return { message: "Slot removed." };
    });
  }

  async deleteSlotsBatch(slotIds: string[], doctorIdentifier: string, dateLabel?: string) {
    const doctor = await this.findUserByIdentifier(doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can delete slots.");
    if (!slotIds.length) throw new BadRequestException("No slots provided.");

    return this.prisma.$transaction(async (tx) => {
      const slots = await tx.availabilitySlot.findMany({
        where: { id: { in: slotIds }, doctorId: doctor.id },
        include: {
          appointment: {
            select: {
              id: true,
              patientId: true,
              partnerDoctorId: true,
            },
          },
        },
      });
      for (const slot of slots) {
        if (slot.appointment) {
          await tx.notification.create({
            data: {
              title: "Appointment cancelled",
              body: "Doctor cancelled your reservation because the slot was removed.",
              recipientId: slot.appointment.patientId,
            },
          });
          await this.reopenPartnerSlotTx(tx, {
            partnerDoctorId: slot.appointment.partnerDoctorId,
            slot,
          });
          await tx.appointment.delete({ where: { id: slot.appointment.id } });
        }
        await tx.availabilitySlot.delete({ where: { id: slot.id } });
      }

      await tx.notification.create({
        data: {
          title: "Day removed",
          body: dateLabel
            ? `All appointments on ${dateLabel} were removed.`
            : "All selected appointments were removed.",
          recipientId: doctor.id,
        },
      });

      return { message: "Slots removed." };
    });
  }
}
