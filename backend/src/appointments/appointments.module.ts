import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { AppointmentsService } from "./appointments.service";
import { AppointmentsBookingsService } from "./appointments-bookings.service";
import { AppointmentsPerformanceService } from "./appointments-performance.service";
import { AppointmentsReportsService } from "./appointments-reports.service";
import { AppointmentsSlotsService } from "./appointments-slots.service";
import { AppointmentsController } from "./appointments.controller";

@Module({
  imports: [PrismaModule],
  providers: [
    AppointmentsService,
    AppointmentsSlotsService,
    AppointmentsBookingsService,
    AppointmentsReportsService,
    AppointmentsPerformanceService,
  ],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
