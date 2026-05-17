import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ExamStatus, Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorWorkspaceExamsService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createExam(
    supervisorIdentifier: string,
    studentId: string,
    clinicId: string,
    scheduledAt: string,
    title: string,
    cases: string | undefined,
    shiftId?: string,
    planId?: string,
    notes?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    const clinic = await this.prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!student || student.role !== Role.DOCTOR) {
      throw new NotFoundException("Student doctor not found.");
    }
    if (!clinic) throw new NotFoundException("Clinic not found.");

    const exam = await this.prisma.clinicExam.create({
      data: {
        clinicId,
        shiftId: shiftId ?? null,
        planId: planId ?? null,
        studentId,
        supervisorId: supervisor.id,
        scheduledAt: new Date(scheduledAt),
        title,
        cases: cases ?? null,
        notes: notes ?? null,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Clinic exam scheduled",
        body: `${supervisor.name} scheduled "${title}" for ${new Date(scheduledAt).toLocaleString()}.`,
        recipientId: student.id,
      },
    });

    return { message: "Clinic exam scheduled.", exam };
  }

  async gradeExam(
    examId: string,
    supervisorIdentifier: string,
    mark: number,
    notes?: string,
  ) {
    const supervisor = await this.requireSupervisor(supervisorIdentifier);
    const exam = await this.prisma.clinicExam.findUnique({
      where: { id: examId },
    });
    if (!exam) throw new NotFoundException("Exam not found.");
    if (exam.supervisorId !== supervisor.id) {
      throw new ForbiddenException(
        "Only the supervisor who scheduled the exam can grade it.",
      );
    }

    const updated = await this.prisma.clinicExam.update({
      where: { id: examId },
      data: {
        mark,
        notes: notes ?? exam.notes ?? null,
        status: ExamStatus.COMPLETED,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: "Exam graded",
        body: `${supervisor.name} graded your clinic exam with ${mark}.`,
        recipientId: exam.studentId,
      },
    });

    return { message: "Exam graded.", exam: updated };
  }
}
