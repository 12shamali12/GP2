import { Injectable } from "@nestjs/common";
import { ListSlotsFilters } from "./appointments-base.service";
import { AppointmentsBookingsService } from "./appointments-bookings.service";
import { AppointmentsPerformanceService } from "./appointments-performance.service";
import { AppointmentsReportsService } from "./appointments-reports.service";
import { AppointmentsSlotsService } from "./appointments-slots.service";
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

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly slotsService: AppointmentsSlotsService,
    private readonly bookingsService: AppointmentsBookingsService,
    private readonly reportsService: AppointmentsReportsService,
    private readonly performanceService: AppointmentsPerformanceService,
  ) {}

  createSlot(dto: CreateSlotDto) {
    return this.slotsService.createSlot(dto);
  }

  listSlots(filters: ListSlotsFilters = {}) {
    return this.slotsService.listSlots(filters);
  }

  bookSlot(dto: BookSlotDto) {
    return this.bookingsService.bookSlot(dto);
  }

  decision(id: string, dto: DecisionDto) {
    return this.bookingsService.decision(id, dto);
  }

  cancel(id: string, dto: CancelDto) {
    return this.bookingsService.cancel(id, dto);
  }

  cancelByPatient(id: string, dto: CancelPatientDto) {
    return this.bookingsService.cancelByPatient(id, dto);
  }

  mine(role: "doctor" | "patient", identifier: string) {
    return this.bookingsService.mine(role, identifier);
  }

  reportSubmitted(id: string, dto: ReportSubmittedDto) {
    return this.reportsService.reportSubmitted(id, dto);
  }

  completeAppointment(id: string, dto: CompleteAppointmentDto) {
    return this.bookingsService.completeAppointment(id, dto);
  }

  rateDoctor(id: string, dto: RateAppointmentDto) {
    return this.reportsService.rateDoctor(id, dto);
  }

  ratePatient(id: string, dto: RateAppointmentDto) {
    return this.reportsService.ratePatient(id, dto);
  }

  performance(doctorIdentifier: string, weekStart: string, weekEnd: string) {
    return this.performanceService.performance(doctorIdentifier, weekStart, weekEnd);
  }

  deleteSlot(slotId: string, doctorIdentifier: string) {
    return this.slotsService.deleteSlot(slotId, doctorIdentifier);
  }

  deleteSlotsBatch(slotIds: string[], doctorIdentifier: string, dateLabel?: string) {
    return this.slotsService.deleteSlotsBatch(slotIds, doctorIdentifier, dateLabel);
  }
}
