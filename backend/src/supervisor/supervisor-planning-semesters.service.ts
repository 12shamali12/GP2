import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorPlanningSemestersService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createSemester(
    label: string,
    sortOrder: number | undefined,
    endsOn: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      throw new BadRequestException("Semester name is required.");
    }

    const semester = await this.prisma.semester.create({
      data: {
        label: trimmedLabel,
        sortOrder: sortOrder ?? 0,
        endsOn: endsOn ? this.normalizeDateOnly(endsOn) : null,
      },
    });

    return { message: "Semester created.", semester };
  }

  async updateSemester(
    id: string,
    dto: { label?: string; sortOrder?: number; endsOn?: string },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const semester = await this.prisma.semester.findUnique({ where: { id } });
    if (!semester) {
      throw new NotFoundException("Semester not found.");
    }

    const updated = await this.prisma.semester.update({
      where: { id },
      data: {
        label: dto.label?.trim() || semester.label,
        sortOrder: dto.sortOrder ?? semester.sortOrder,
        endsOn:
          dto.endsOn === undefined
            ? semester.endsOn
            : dto.endsOn
              ? this.normalizeDateOnly(dto.endsOn)
              : null,
      },
    });

    return { message: "Semester updated.", semester: updated };
  }

  async deleteSemester(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        students: { select: { id: true }, take: 1 },
        clinicCases: { select: { id: true }, take: 1 },
      },
    });
    if (!semester) {
      throw new NotFoundException("Semester not found.");
    }
    if (semester.students.length || semester.clinicCases.length) {
      throw new BadRequestException("This semester is already in use and cannot be deleted.");
    }

    await this.prisma.semester.delete({ where: { id } });
    return { message: "Semester deleted." };
  }

  async createSemesterClinicCase(
    semesterId: string,
    clinicId: string,
    title: string,
    description: string | undefined,
    requiredCount: number | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new BadRequestException("Case title is required.");
    }

    const [semester, clinic] = await Promise.all([
      this.prisma.semester.findUnique({ where: { id: semesterId } }),
      this.prisma.clinic.findUnique({ where: { id: clinicId } }),
    ]);
    if (!semester) throw new NotFoundException("Semester not found.");
    if (!clinic) throw new NotFoundException("Clinic not found.");

    const item = await this.prisma.semesterClinicCase.create({
      data: {
        semesterId,
        clinicId,
        title: trimmedTitle,
        description: description ?? null,
        requiredCount: requiredCount ?? 1,
      },
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
            sortOrder: true,
            endsOn: true,
          },
        },
      },
    });

    return { message: "Clinic case saved.", clinicCase: item };
  }

  async updateSemesterClinicCase(
    id: string,
    dto: {
      semesterId?: string;
      clinicId?: string;
      title?: string;
      description?: string;
      requiredCount?: number;
    },
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const clinicCase = await this.prisma.semesterClinicCase.findUnique({ where: { id } });
    if (!clinicCase) throw new NotFoundException("Clinic case not found.");

    const updated = await this.prisma.semesterClinicCase.update({
      where: { id },
      data: {
        semesterId: dto.semesterId ?? clinicCase.semesterId,
        clinicId: dto.clinicId ?? clinicCase.clinicId,
        title: dto.title?.trim() || clinicCase.title,
        description:
          dto.description === undefined
            ? clinicCase.description
            : dto.description || null,
        requiredCount: dto.requiredCount ?? clinicCase.requiredCount,
      },
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
            sortOrder: true,
            endsOn: true,
          },
        },
      },
    });

    return { message: "Clinic case updated.", clinicCase: updated };
  }

  async deleteSemesterClinicCase(
    id: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const clinicCase = await this.prisma.semesterClinicCase.findUnique({
      where: { id },
      include: {
        appointments: { select: { id: true }, take: 1 },
        progress: { select: { id: true }, take: 1 },
      },
    });
    if (!clinicCase) throw new NotFoundException("Clinic case not found.");
    if (clinicCase.appointments.length || clinicCase.progress.length) {
      throw new BadRequestException("This clinic case is already in use and cannot be deleted.");
    }

    await this.prisma.semesterClinicCase.delete({ where: { id } });
    return { message: "Clinic case deleted." };
  }

  private async collectSemesterProgressionPreview() {
    const semesters = await this.prisma.semester.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        id: true,
        label: true,
        sortOrder: true,
        endsOn: true,
      },
    });

    const byId = new Map(semesters.map((semester) => [semester.id, semester]));
    const nextBySemesterId = new Map<string, (typeof semesters)[number] | null>();
    semesters.forEach((semester, index) => {
      nextBySemesterId.set(semester.id, semesters[index + 1] || null);
    });

    const students = await this.prisma.user.findMany({
      where: {
        role: Role.DOCTOR,
        semesterId: { not: null },
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        username: true,
        doctorIdNumber: true,
        semesterId: true,
      },
    });

    const today = this.normalizeDateOnly(new Date());
    const dueStudents = students.reduce<
      Array<{
        id: string;
        name: string;
        username: string;
        doctorIdNumber: string | null;
        currentSemester: (typeof semesters)[number];
        nextSemester: (typeof semesters)[number];
      }>
    >((accumulator, student) => {
      const currentSemester = student.semesterId
        ? byId.get(student.semesterId)
        : null;
      if (!currentSemester?.endsOn) return accumulator;
      if (this.normalizeDateOnly(currentSemester.endsOn) > today) return accumulator;
      const nextSemester = nextBySemesterId.get(currentSemester.id) || null;
      if (!nextSemester) return accumulator;
      accumulator.push({
        id: student.id,
        name: student.name,
        username: student.username,
        doctorIdNumber: student.doctorIdNumber,
        currentSemester,
        nextSemester,
      });
      return accumulator;
    }, []);

    return {
      semesters,
      dueStudents,
    };
  }

  async semesterProgression(adminId: string) {
    await this.requireAdmin(adminId);
    return this.collectSemesterProgressionPreview();
  }

  async advanceEligibleStudents(adminId: string) {
    await this.requireAdmin(adminId);
    const preview = await this.collectSemesterProgressionPreview();
    if (!preview.dueStudents.length) {
      return { message: "No students need semester progression right now.", advanced: [] };
    }

    const advanced = await this.prisma.$transaction(async (tx) => {
      const moved: Array<{
        id: string;
        name: string;
        username: string;
        doctorIdNumber?: string | null;
        fromSemester: string;
        toSemester: string;
      }> = [];

      for (const student of preview.dueStudents) {
        await tx.user.update({
          where: { id: student.id },
          data: { semesterId: student.nextSemester.id },
        });
        moved.push({
          id: student.id,
          name: student.name,
          username: student.username,
          doctorIdNumber: student.doctorIdNumber,
          fromSemester: student.currentSemester.label,
          toSemester: student.nextSemester.label,
        });
      }

      if (moved.length) {
        await tx.notification.createMany({
          data: moved.map((student) => ({
            title: "Semester updated",
            body: `You were advanced from ${student.fromSemester} to ${student.toSemester}.`,
            recipientId: student.id,
          })),
        });
      }

      return moved;
    });

    return {
      message: `${advanced.length} student${advanced.length === 1 ? "" : "s"} advanced.`,
      advanced,
    };
  }

  async updateStudentSemester(
    userId: string,
    semesterId: string | undefined,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        name: true,
        semesterId: true,
      },
    });
    if (!student || student.role !== Role.DOCTOR) {
      throw new NotFoundException("Student doctor not found.");
    }

    const semester = semesterId
      ? await this.prisma.semester.findUnique({
          where: { id: semesterId },
          select: { id: true, label: true, active: true },
        })
      : null;

    if (semesterId && (!semester || !semester.active)) {
      throw new NotFoundException("Semester not found.");
    }

    await this.prisma.user.update({
      where: { id: student.id },
      data: { semesterId: semester?.id ?? null },
    });

    await this.prisma.notification.create({
      data: {
        title: "Semester assignment updated",
        body: semester
          ? `Your semester was updated to ${semester.label}.`
          : "Your semester assignment was cleared.",
        recipientId: student.id,
      },
    });

    return {
      message: semester
        ? "Student semester updated."
        : "Student semester cleared.",
    };
  }
}
