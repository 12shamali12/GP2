import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AppointmentStatus,
  ClinicCaseProgressStatus,
  PerformanceEventType,
  Role,
  SlotStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AppointmentsBaseService } from "./appointments-base.service";
import {
  BookSlotDto,
  CancelDto,
  CancelPatientDto,
  CompleteAppointmentDto,
  DecisionDto,
} from "./dto";

@Injectable()
export class AppointmentsBookingsService extends AppointmentsBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async bookSlot(dto: BookSlotDto) {
    const patient = await this.findUserByIdentifier(dto.patientIdentifier);
    if (patient.role !== Role.PATIENT) throw new UnauthorizedException("Only patients can book slots.");

    return this.prisma.$transaction(async (tx) => {
      const slotToBook = await tx.availabilitySlot.findUnique({
        where: { id: dto.slotId },
        include: {
          doctor: {
            select: {
              phone: true,
              name: true,
              avatar: true,
              id: true,
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
      if (!slotToBook) throw new NotFoundException("Slot not found.");
      if (slotToBook.status !== SlotStatus.OPEN) throw new BadRequestException("Slot is not available.");

      const overlap = await tx.appointment.findFirst({
        where: {
          patientId: patient.id,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.APPROVED] },
          slot: {
            startTime: slotToBook.startTime,
          },
        },
        include: { slot: true },
      });
      if (overlap) throw new BadRequestException("You already have an appointment at this time.");

      let clinicCaseId: string | null = null;
      if (dto.clinicCaseId) {
        const clinicCase = await tx.semesterClinicCase.findUnique({
          where: { id: dto.clinicCaseId },
        });
        if (!clinicCase || !clinicCase.active) {
          throw new NotFoundException("Selected clinic case was not found.");
        }
        if (!slotToBook.clinicId || clinicCase.clinicId !== slotToBook.clinicId) {
          throw new BadRequestException("This case does not belong to the selected clinic.");
        }
        if (slotToBook.doctor.semesterId !== clinicCase.semesterId) {
          throw new BadRequestException("This student is not eligible for the selected case.");
        }
        const completedCase = await tx.doctorClinicCaseProgress.findUnique({
          where: {
            doctorId_clinicCaseId: {
              doctorId: slotToBook.doctorId,
              clinicCaseId: clinicCase.id,
            },
          },
        });
        if (completedCase?.status === ClinicCaseProgressStatus.COMPLETED) {
          throw new BadRequestException("This student already completed that case.");
        }
        clinicCaseId = clinicCase.id;
      }

      const pair = await tx.partnerPair.findFirst({
        where: {
          OR: [{ doctorOneId: slotToBook.doctorId }, { doctorTwoId: slotToBook.doctorId }],
        },
      });
      const partnerDoctorId = pair
        ? pair.doctorOneId === slotToBook.doctorId
          ? pair.doctorTwoId
          : pair.doctorOneId
        : null;
      const partnerSlot = await this.findPartnerSlotTx(tx, slotToBook, partnerDoctorId);
      if (partnerSlot && partnerSlot.status !== SlotStatus.OPEN) {
        throw new BadRequestException("This student pair is already booked for that shift.");
      }

      await tx.availabilitySlot.update({
        where: { id: slotToBook.id },
        data: { status: SlotStatus.BOOKED },
      });

      if (partnerSlot && partnerSlot.status === SlotStatus.OPEN) {
        await tx.availabilitySlot.update({
          where: { id: partnerSlot.id },
          data: { status: SlotStatus.PAIR_BLOCKED },
        });
      }

      const appointment = await tx.appointment.create({
        data: {
          slotId: slotToBook.id,
          doctorId: slotToBook.doctorId,
          partnerDoctorId,
          doctorPhone: slotToBook.doctor?.phone ?? null,
          patientId: patient.id,
          clinicCaseId,
          status: AppointmentStatus.PENDING,
          note: dto.note ?? null,
        },
      });

      // Notify doctor
      await tx.notification.create({
        data: {
          title: "New reservation request",
          body: `A patient requested ${slotToBook.startTime.toISOString()}${slotToBook.clinic ? ` in ${slotToBook.clinic.name}` : ""}.`,
          recipientId: slotToBook.doctorId,
        },
      });

      if (partnerDoctorId) {
        await tx.notification.create({
          data: {
            title: "Paired slot reserved",
            body: `${slotToBook.doctor.name}'s patient booking reserved your paired shift slot as well.`,
            recipientId: partnerDoctorId,
          },
        });
      }

      return { message: "Appointment requested.", appointment };
    });
  }

  async decision(id: string, dto: DecisionDto) {
    const doctor = await this.findUserByIdentifier(dto.doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can decide.");

    return this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id },
        include: { slot: true },
      });
      if (!appt) throw new NotFoundException("Appointment not found.");
      if (appt.doctorId !== doctor.id) throw new UnauthorizedException("Not your appointment.");
      if (appt.status !== AppointmentStatus.PENDING) throw new BadRequestException("Already decided.");

      const status = dto.approve ? AppointmentStatus.APPROVED : AppointmentStatus.REJECTED;
      const slotTime = appt.slot?.startTime?.toISOString?.();
      if (!dto.approve) {
        await this.createEvent({
          doctorId: doctor.id,
          patientId: appt.patientId,
          appointmentId: appt.id,
          type: PerformanceEventType.REJECTED,
        });
        // delete appointment so slot can be reused, but send note in notification
        await tx.appointment.delete({ where: { id } });
        await tx.availabilitySlot.update({
          where: { id: appt.slotId },
          data: { status: SlotStatus.OPEN },
        });
        await this.reopenPartnerSlotTx(tx, appt as any);
      } else {
        await tx.appointment.update({
          where: { id },
          data: { status },
        });
      }
      await tx.notification.create({
        data: {
          title: dto.approve ? "Appointment approved" : "Appointment rejected",
          body: dto.approve
            ? "Your appointment was approved."
            : `Your appointment was rejected${dto.note ? `: ${dto.note}` : "."} Please book another slot.`,
          recipientId: appt.patientId,
        },
      });
      // Notify doctor for record
      await tx.notification.create({
        data: {
          title: dto.approve ? "You approved an appointment" : "You rejected an appointment",
          body: `Decision made for ${slotTime ?? "an appointment"}${dto.note ? ` | Note: ${dto.note}` : ""}.`,
          recipientId: doctor.id,
        },
      });
      return { message: `Appointment ${dto.approve ? "approved" : "rejected"}.` };
    });
  }

  async cancel(id: string, dto: CancelDto) {
    const doctor = await this.findUserByIdentifier(dto.doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can cancel.");

    return this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id },
        include: { slot: true },
      });
      if (!appt) throw new NotFoundException("Appointment not found.");
      if (appt.doctorId !== doctor.id) throw new UnauthorizedException("Not your appointment.");

      // mark and reopen slot
      await tx.appointment.delete({ where: { id } });
      await tx.availabilitySlot.update({
        where: { id: appt.slotId },
        data: { status: SlotStatus.OPEN },
      });
      await this.reopenPartnerSlotTx(tx, appt as any);
      const isNoShow = dto.reason?.toLowerCase().includes("no-show");
      await this.createEvent({
        doctorId: doctor.id,
        patientId: appt.patientId,
        appointmentId: appt.id,
        type: isNoShow ? PerformanceEventType.NO_SHOW : PerformanceEventType.CANCEL_DOCTOR,
      });
      await tx.notification.create({
        data: {
          title: "Appointment cancelled",
          body: dto.reason ? `Doctor cancelled: ${dto.reason}` : "Doctor cancelled your appointment.",
          recipientId: appt.patientId,
        },
      });
      await tx.notification.create({
        data: {
          title: "You cancelled an appointment",
          body: `Cancelled appointment for ${appt.slotId}.`,
          recipientId: doctor.id,
        },
      });
      return { message: "Appointment cancelled." };
    });
  }

  async cancelByPatient(id: string, dto: CancelPatientDto) {
    const patient = await this.findUserByIdentifier(dto.patientIdentifier);
    if (patient.role !== Role.PATIENT) throw new UnauthorizedException("Only patients can cancel.");

    return this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.findUnique({
        where: { id },
        include: { slot: true },
      });
      if (!appt) throw new NotFoundException("Appointment not found.");
      if (appt.patientId !== patient.id) throw new UnauthorizedException("Not your appointment.");

      await tx.appointment.delete({ where: { id } });
      await tx.availabilitySlot.update({
        where: { id: appt.slotId },
        data: { status: SlotStatus.OPEN },
      });
      await this.reopenPartnerSlotTx(tx, appt as any);
      await this.createEvent({
        doctorId: appt.doctorId,
        patientId: appt.patientId,
        appointmentId: appt.id,
        type: PerformanceEventType.CANCEL_PATIENT,
      });
      await tx.notification.create({
        data: {
          title: "Appointment cancelled by patient",
          body: "Patient cancelled their reservation; slot reopened.",
          recipientId: appt.doctorId,
        },
      });
      await tx.notification.create({
        data: {
          title: "You cancelled your appointment",
          body: "Your reservation was cancelled and the slot reopened.",
          recipientId: patient.id,
        },
      });
      return { message: "Appointment cancelled." };
    });
  }

  async completeAppointment(id: string, dto: CompleteAppointmentDto) {
    const doctor = await this.findUserByIdentifier(dto.doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) {
      throw new UnauthorizedException("Only doctors can complete appointments.");
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment) throw new NotFoundException("Appointment not found.");
    if (appointment.doctorId !== doctor.id) {
      throw new UnauthorizedException("Not your appointment.");
    }
    if (appointment.status !== AppointmentStatus.APPROVED) {
      throw new BadRequestException("Only approved appointments can be completed.");
    }

    const completed = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
        doctorCompletionNotes: dto.completionNotes ?? null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Appointment completed",
        body: dto.completionNotes
          ? `${doctor.name} marked your appointment as completed. Notes: ${dto.completionNotes}`
          : `${doctor.name} marked your appointment as completed.`,
        recipientId: completed.patientId,
      },
    });

    return { message: "Appointment completed.", appointment: completed };
  }

  /**
   * Auto-reject PENDING appointments whose slot has already passed.
   *
   * If a doctor never accepted or rejected a request and the slot time is now
   * in the past, the request is treated as ignored. We delete the appointment
   * (so the slot can be re-used in the next semester rollover), reopen the
   * slot + any partner slot, log a REJECTED event for performance accounting,
   * and notify the patient that their request expired without a response.
   *
   * Called lazily from `mine()` whenever a doctor or patient fetches their
   * list, so no cron infrastructure is needed.
   */
  private async purgeStalePendingForUser(
    userId: string,
    role: "doctor" | "patient",
  ): Promise<void> {
    const now = new Date();
    const where =
      role === "doctor"
        ? { doctorId: userId, status: AppointmentStatus.PENDING, slot: { startTime: { lt: now } } }
        : { patientId: userId, status: AppointmentStatus.PENDING, slot: { startTime: { lt: now } } };

    const stale = await this.prisma.appointment.findMany({
      where,
      include: { slot: true },
    });
    if (!stale.length) return;

    for (const appt of stale) {
      await this.prisma.$transaction(async (tx) => {
        // Audit trail before delete.
        await this.createEvent({
          doctorId: appt.doctorId,
          patientId: appt.patientId,
          appointmentId: appt.id,
          type: PerformanceEventType.REJECTED,
        });
        await tx.appointment.delete({ where: { id: appt.id } });
        await tx.availabilitySlot.update({
          where: { id: appt.slotId },
          data: { status: SlotStatus.OPEN },
        });
        await this.reopenPartnerSlotTx(tx, appt as never);
        await tx.notification.create({
          data: {
            title: "Appointment request expired",
            body: "Your appointment request expired without a doctor response. Please book another slot.",
            recipientId: appt.patientId,
          },
        });
      });
    }
  }

  async mine(role: "doctor" | "patient", identifier: string) {
    const user = await this.findUserByIdentifier(identifier);
    const where =
      role === "doctor"
        ? { doctorId: user.id }
        : role === "patient"
          ? { patientId: user.id }
          : null;
    if (!where) throw new BadRequestException("Invalid role.");

    // Auto-reject any PENDING request whose slot has already passed.
    // If the doctor never decided, the request is treated as ignored — the
    // appointment is removed, the slot reopens, and the patient is told.
    await this.purgeStalePendingForUser(user.id, role);

    return this.prisma.appointment.findMany({
      where,
      include: {
        slot: {
          include: {
            doctor: true,
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        patient: true,
        doctor: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            doctorIdNumber: true,
          },
        },
        partnerDoctor: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            doctorIdNumber: true,
          },
        },
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
        report: {
          include: {
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
        },
        ratings: {
          where: { active: true },
          include: {
            rater: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
