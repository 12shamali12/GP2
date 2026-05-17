import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PerformanceEventType, Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { AppointmentsBaseService } from "./appointments-base.service";

@Injectable()
export class AppointmentsPerformanceService extends AppointmentsBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
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
}
