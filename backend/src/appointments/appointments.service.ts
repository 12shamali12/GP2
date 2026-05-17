import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  AppointmentRatingKind,
  AppointmentStatus,
  ClinicCaseProgressStatus,
  PerformanceEventType,
  Prisma,
  ReportReviewStatus,
  Role,
  SlotStatus,
} from "@prisma/client";
import {
  BookSlotDto,
  CancelDto,
  CancelPatientDto,
  CompleteAppointmentDto,
  CreateSlotDto,
  DecisionDto,
  RateAppointmentDto,
  ReportSubmittedDto,
} from "./dto";

type ListSlotsFilters = {
  doctorId?: string;
  patientIdentifier?: string;
  clinicId?: string;
  clinicCaseId?: string;
  fromDate?: string;
  toDate?: string;
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findUserByIdentifier(identifier: string) {
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

  private normalizeDate(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException("Invalid date filter.");
    }
    return parsed;
  }

  private validateHalfStar(stars: number) {
    if (stars < 0.5 || stars > 5) {
      throw new BadRequestException("Rating must stay between 0.5 and 5.");
    }
    const doubled = stars * 2;
    if (!Number.isInteger(doubled)) {
      throw new BadRequestException("Ratings must use full or half stars.");
    }
  }

  private async findPartnerSlotTx(
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

  private async reopenPartnerSlotTx(
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

  private async createEvent(opts: {
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

  async mine(role: "doctor" | "patient", identifier: string) {
    const user = await this.findUserByIdentifier(identifier);
    const where =
      role === "doctor"
        ? { doctorId: user.id }
        : role === "patient"
          ? { patientId: user.id }
          : null;
    if (!where) throw new BadRequestException("Invalid role.");
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

  async reportSubmitted(id: string, dto: ReportSubmittedDto) {
    const doctor = await this.findUserByIdentifier(dto.doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can submit reports.");
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: true,
      },
    });
    if (!appt) throw new NotFoundException("Appointment not found.");
    if (appt.doctorId !== doctor.id) throw new UnauthorizedException("Not your appointment.");

    let supervisorId: string | null = null;
    if (dto.supervisorIdentifier) {
      const supervisor = await this.prisma.user.findFirst({
        where: {
          OR: [
            { id: dto.supervisorIdentifier },
            { email: dto.supervisorIdentifier },
            { phone: dto.supervisorIdentifier },
            { username: dto.supervisorIdentifier },
          ],
        },
      });
      if (supervisor?.role === Role.SUPERVISOR) {
        supervisorId = supervisor.id;
      }
    }

    let partnerDoctorId: string | null = null;
    if (dto.partnerDoctorId) {
      const partnerDoctor = await this.prisma.user.findUnique({ where: { id: dto.partnerDoctorId } });
      if (!partnerDoctor || partnerDoctor.role !== Role.DOCTOR) {
        throw new BadRequestException("Selected partner doctor was not found.");
      }
      partnerDoctorId = partnerDoctor.id;
    }

    const submittedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: { reportSubmitted: true, reportSubmittedAt: submittedAt },
      });

      const report = await tx.caseReport.upsert({
        where: { appointmentId: id },
        update: {
          doctorId: doctor.id,
          reviewerSupervisorId: supervisorId,
          partnerDoctorId: partnerDoctorId ?? appt.partnerDoctorId ?? null,
          clinicId: dto.clinicId ?? appt.slot?.clinicId ?? null,
          rotationAssignmentId: dto.rotationAssignmentId ?? appt.slot?.rotationAssignmentId ?? null,
          supervisorName: dto.supervisorName ?? null,
          patientName: dto.patientName ?? null,
          patientPhone: dto.patientPhone ?? null,
          title: dto.title,
          description: dto.description,
          formData:
            dto.formData !== undefined
              ? (dto.formData as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          status: ReportReviewStatus.SUBMITTED,
          reviewedAt: null,
          mark: null,
          rating: null,
          feedback: null,
          submittedAt,
        },
        create: {
          appointmentId: id,
          doctorId: doctor.id,
          reviewerSupervisorId: supervisorId,
          partnerDoctorId: partnerDoctorId ?? appt.partnerDoctorId ?? null,
          clinicId: dto.clinicId ?? appt.slot?.clinicId ?? null,
          rotationAssignmentId: dto.rotationAssignmentId ?? appt.slot?.rotationAssignmentId ?? null,
          supervisorName: dto.supervisorName ?? null,
          patientName: dto.patientName ?? null,
          patientPhone: dto.patientPhone ?? null,
          title: dto.title,
          description: dto.description,
          formData:
            dto.formData !== undefined
              ? (dto.formData as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          submittedAt,
        },
      });

      await tx.caseReportTask.deleteMany({
        where: { reportId: report.id },
      });

      if (dto.taskIds?.length) {
        const uniqueTaskIds = Array.from(new Set(dto.taskIds.filter(Boolean)));
        if (uniqueTaskIds.length) {
          await tx.caseReportTask.createMany({
            data: uniqueTaskIds.map((clinicTaskId) => ({
              reportId: report.id,
              clinicTaskId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    await this.createEvent({
      doctorId: doctor.id,
      patientId: appt.patientId,
      appointmentId: appt.id,
      type: PerformanceEventType.REPORT_SUBMITTED,
    });
    await this.prisma.notification.create({
      data: {
        title: "Report submitted",
        body: "You submitted a case report.",
        recipientId: doctor.id,
      },
    });

    if (supervisorId) {
      await this.prisma.notification.create({
        data: {
          title: "Case report ready for review",
          body: `${doctor.name} submitted a report${dto.title ? `: ${dto.title}` : "."}`,
          recipientId: supervisorId,
        },
      });
    }
    return { message: "Report submitted." };
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

  async rateDoctor(id: string, dto: RateAppointmentDto) {
    const patient = await this.findUserByIdentifier(dto.identifier);
    if (patient.role !== Role.PATIENT) {
      throw new UnauthorizedException("Only patients can rate doctors here.");
    }
    this.validateHalfStar(dto.stars);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        report: true,
      },
    });
    if (!appointment) throw new NotFoundException("Appointment not found.");
    if (appointment.patientId !== patient.id) {
      throw new UnauthorizedException("Not your appointment.");
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException("Only completed appointments can be rated.");
    }
    if (appointment.report?.status === ReportReviewStatus.CASE_REJECTED) {
      throw new BadRequestException("This appointment is still under case review.");
    }

    const rating = await this.prisma.appointmentRating.upsert({
      where: {
        appointmentId_raterId_kind: {
          appointmentId: id,
          raterId: patient.id,
          kind: AppointmentRatingKind.PATIENT_TO_DOCTOR,
        },
      },
      update: {
        stars: dto.stars,
        comment: dto.comment ?? null,
        active: true,
      },
      create: {
        appointmentId: id,
        raterId: patient.id,
        targetId: appointment.doctorId,
        kind: AppointmentRatingKind.PATIENT_TO_DOCTOR,
        stars: dto.stars,
        comment: dto.comment ?? null,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Patient feedback received",
        body: `${patient.name} rated your completed appointment with ${dto.stars} stars.`,
        recipientId: appointment.doctorId,
      },
    });

    return { message: "Feedback saved.", rating };
  }

  async ratePatient(id: string, dto: RateAppointmentDto) {
    const doctor = await this.findUserByIdentifier(dto.identifier);
    if (doctor.role !== Role.DOCTOR) {
      throw new UnauthorizedException("Only doctors can rate patients here.");
    }
    this.validateHalfStar(dto.stars);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });
    if (!appointment) throw new NotFoundException("Appointment not found.");
    if (appointment.doctorId !== doctor.id) {
      throw new UnauthorizedException("Not your appointment.");
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException("Only completed appointments can be rated.");
    }

    const rating = await this.prisma.appointmentRating.upsert({
      where: {
        appointmentId_raterId_kind: {
          appointmentId: id,
          raterId: doctor.id,
          kind: AppointmentRatingKind.DOCTOR_TO_PATIENT,
        },
      },
      update: {
        stars: dto.stars,
        comment: dto.comment ?? null,
        active: true,
      },
      create: {
        appointmentId: id,
        raterId: doctor.id,
        targetId: appointment.patientId,
        kind: AppointmentRatingKind.DOCTOR_TO_PATIENT,
        stars: dto.stars,
        comment: dto.comment ?? null,
      },
    });

    return { message: "Patient feedback saved.", rating };
  }

  async performance(doctorIdentifier: string, weekStart: string, weekEnd: string) {
    const doctor = await this.findUserByIdentifier(doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) throw new UnauthorizedException("Only doctors can view performance.");
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const events = await this.prisma.appointmentEvent.findMany({
      where: { doctorId: doctor.id, createdAt: { gte: start, lt: end } },
    });
    const counts = {
      done: 0,
      rejected: 0,
      cancelledByDoctor: 0,
      cancelledByPatient: 0,
      noShow: 0,
    };
    events.forEach((e) => {
      switch (e.type) {
        case PerformanceEventType.REPORT_SUBMITTED:
          counts.done += 1;
          break;
        case PerformanceEventType.REJECTED:
          counts.rejected += 1;
          break;
        case PerformanceEventType.CANCEL_DOCTOR:
          counts.cancelledByDoctor += 1;
          break;
        case PerformanceEventType.CANCEL_PATIENT:
          counts.cancelledByPatient += 1;
          break;
        case PerformanceEventType.NO_SHOW:
          counts.noShow += 1;
          break;
      }
    });
    return counts;
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
