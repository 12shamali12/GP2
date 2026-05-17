import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AppointmentRatingKind,
  AppointmentStatus,
  PerformanceEventType,
  Prisma,
  ReportReviewStatus,
  Role,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AppointmentsBaseService } from "./appointments-base.service";
import { RateAppointmentDto, ReportSubmittedDto } from "./dto";

@Injectable()
export class AppointmentsReportsService extends AppointmentsBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
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
}
