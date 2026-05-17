import { Body, Controller, Delete, Get, Param, Post, Query } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import {
  BookSlotDto,
  CancelDto,
  CancelPatientDto,
  CompleteAppointmentDto,
  CreateSlotDto,
  DecisionDto,
  RateAppointmentDto,
  DeleteSlotDto,
  ReportSubmittedDto,
} from "./dto";

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly svc: AppointmentsService) {}

  @Post("slots")
  createSlot(@Body() dto: CreateSlotDto) {
    return this.svc.createSlot(dto);
  }

  @Get("slots")
  listSlots(
    @Query("doctorId") doctorId?: string,
    @Query("patientIdentifier") patientIdentifier?: string,
    @Query("clinicId") clinicId?: string,
    @Query("clinicCaseId") clinicCaseId?: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    return this.svc.listSlots({
      doctorId,
      patientIdentifier,
      clinicId,
      clinicCaseId,
      fromDate,
      toDate,
    });
  }

  @Post("book")
  book(@Body() dto: BookSlotDto) {
    return this.svc.bookSlot(dto);
  }

  @Post(":id/decision")
  decision(@Param("id") id: string, @Body() dto: DecisionDto) {
    return this.svc.decision(id, dto);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string, @Body() dto: CancelDto) {
    return this.svc.cancel(id, dto);
  }

  @Post(":id/cancel-patient")
  cancelByPatient(@Param("id") id: string, @Body() dto: CancelPatientDto) {
    return this.svc.cancelByPatient(id, dto);
  }

  @Post(":id/report-submitted")
  reportSubmitted(@Param("id") id: string, @Body() dto: ReportSubmittedDto) {
    return this.svc.reportSubmitted(id, dto);
  }

  @Post(":id/complete")
  complete(@Param("id") id: string, @Body() dto: CompleteAppointmentDto) {
    return this.svc.completeAppointment(id, dto);
  }

  @Post(":id/patient-feedback")
  rateDoctor(@Param("id") id: string, @Body() dto: RateAppointmentDto) {
    return this.svc.rateDoctor(id, dto);
  }

  @Post(":id/doctor-feedback")
  ratePatient(@Param("id") id: string, @Body() dto: RateAppointmentDto) {
    return this.svc.ratePatient(id, dto);
  }

  @Get("performance")
  performance(
    @Query("doctorIdentifier") doctorIdentifier: string,
    @Query("weekStart") weekStart: string,
    @Query("weekEnd") weekEnd: string
  ) {
    return this.svc.performance(doctorIdentifier, weekStart, weekEnd);
  }

  @Delete("slots/:id")
  removeSlot(@Param("id") id: string, @Body() dto: DeleteSlotDto) {
    return this.svc.deleteSlot(id, dto.doctorIdentifier);
  }

  @Post("slots/batch-delete")
  removeSlotsBatch(
    @Body("slotIds") slotIds: string[],
    @Body("doctorIdentifier") doctorIdentifier: string,
    @Body("dateLabel") dateLabel?: string
  ) {
    return this.svc.deleteSlotsBatch(slotIds || [], doctorIdentifier, dateLabel);
  }

  @Get("mine")
  mine(@Query("role") role: "doctor" | "patient", @Query("identifier") identifier: string) {
    return this.svc.mine(role, identifier);
  }
}
