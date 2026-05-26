import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ClinicCaseProgressStatus,
  Role,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";

/**
 * One service for everything case-progress related:
 * - admin browse / soft-delete / hard-delete `SemesterClinicCase`
 * - admin browse + edit each doctor's `DoctorClinicCaseProgress`
 * - doctor "my cases" view, with lazy row creation so a doctor sees the
 *   full case list of their semester the moment they open the tab.
 */
@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

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

  /**
   * Ensures one `DoctorClinicCaseProgress` row exists for every active case in
   * the doctor's active semester. Idempotent — uses createMany skipDuplicates.
   * Returns the count of rows that were newly created.
   */
  private async ensureProgressRowsForDoctor(doctorId: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, role: true, semesterId: true },
    });
    if (!doctor || doctor.role !== Role.DOCTOR || !doctor.semesterId) return 0;

    const cases = await this.prisma.semesterClinicCase.findMany({
      where: { semesterId: doctor.semesterId, active: true },
      select: { id: true },
    });
    if (!cases.length) return 0;

    const existing = await this.prisma.doctorClinicCaseProgress.findMany({
      where: { doctorId, clinicCaseId: { in: cases.map((c) => c.id) } },
      select: { clinicCaseId: true },
    });
    const existingIds = new Set(existing.map((entry) => entry.clinicCaseId));
    const missing = cases.filter((c) => !existingIds.has(c.id));
    if (!missing.length) return 0;

    const result = await this.prisma.doctorClinicCaseProgress.createMany({
      data: missing.map((c) => ({
        doctorId,
        clinicCaseId: c.id,
        status: ClinicCaseProgressStatus.OPEN,
      })),
      skipDuplicates: true,
    });
    return result.count;
  }

  // ---------------------------------------------------------------------------
  // Admin: browse the case catalog
  // ---------------------------------------------------------------------------

  async listClinicCases(filters: {
    semesterId?: string;
    clinicId?: string;
    activeOnly?: boolean;
  }) {
    return this.prisma.semesterClinicCase.findMany({
      where: {
        ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
        ...(filters.clinicId ? { clinicId: filters.clinicId } : {}),
        ...(filters.activeOnly ? { active: true } : {}),
      },
      include: {
        semester: { select: { id: true, label: true, sortOrder: true } },
        clinic: { select: { id: true, name: true } },
        _count: { select: { appointments: true, progress: true } },
      },
      orderBy: [
        { semester: { sortOrder: "asc" } },
        { clinic: { name: "asc" } },
        { title: "asc" },
      ],
    });
  }

  /**
   * Soft delete: flip active=false. The case keeps its history (appointments,
   * progress) but disappears from the booking picker and from "active" lists.
   */
  async softDeleteClinicCase(id: string) {
    const existing = await this.prisma.semesterClinicCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Clinic case not found.");
    return this.prisma.semesterClinicCase.update({
      where: { id },
      data: { active: false },
    });
  }

  async restoreClinicCase(id: string) {
    const existing = await this.prisma.semesterClinicCase.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Clinic case not found.");
    return this.prisma.semesterClinicCase.update({
      where: { id },
      data: { active: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Admin: per-doctor case progress
  // ---------------------------------------------------------------------------

  async listDoctorProgress(doctorIdentifier: string) {
    const doctor = await this.findUserByIdentifier(doctorIdentifier);
    if (doctor.role !== Role.DOCTOR) {
      throw new BadRequestException("Target user is not a doctor.");
    }
    await this.ensureProgressRowsForDoctor(doctor.id);

    const progress = await this.prisma.doctorClinicCaseProgress.findMany({
      where: { doctorId: doctor.id },
      include: {
        clinicCase: {
          include: {
            clinic: { select: { id: true, name: true } },
            semester: { select: { id: true, label: true } },
          },
        },
      },
      orderBy: [
        { clinicCase: { clinic: { name: "asc" } } },
        { clinicCase: { title: "asc" } },
      ],
    });

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        username: doctor.username,
        doctorIdNumber: doctor.doctorIdNumber,
        semesterId: doctor.semesterId,
      },
      progress,
    };
  }

  async setDoctorProgressStatus(progressId: string, status: ClinicCaseProgressStatus) {
    const entry = await this.prisma.doctorClinicCaseProgress.findUnique({
      where: { id: progressId },
    });
    if (!entry) throw new NotFoundException("Progress record not found.");
    return this.prisma.doctorClinicCaseProgress.update({
      where: { id: progressId },
      data: {
        status,
        completedAt:
          status === ClinicCaseProgressStatus.COMPLETED ? new Date() : null,
      },
    });
  }

  async deleteDoctorProgress(progressId: string) {
    const entry = await this.prisma.doctorClinicCaseProgress.findUnique({
      where: { id: progressId },
    });
    if (!entry) throw new NotFoundException("Progress record not found.");
    await this.prisma.doctorClinicCaseProgress.delete({ where: { id: progressId } });
    return { message: "Progress record removed." };
  }

  // ---------------------------------------------------------------------------
  // Doctor: "my cases" view
  // ---------------------------------------------------------------------------

  async getMyCases(identifier: string) {
    const doctor = await this.findUserByIdentifier(identifier);
    if (doctor.role !== Role.DOCTOR) {
      throw new ForbiddenException("Only doctors have a cases view.");
    }
    await this.ensureProgressRowsForDoctor(doctor.id);

    const progress = await this.prisma.doctorClinicCaseProgress.findMany({
      where: {
        doctorId: doctor.id,
        clinicCase: { active: true },
      },
      include: {
        clinicCase: {
          include: {
            clinic: { select: { id: true, name: true } },
            semester: { select: { id: true, label: true } },
          },
        },
      },
      orderBy: [
        { clinicCase: { clinic: { name: "asc" } } },
        { clinicCase: { title: "asc" } },
      ],
    });

    // Resolve the report + patient for completed cases so the cards can deep-link.
    const completedWithReports = await Promise.all(
      progress
        .filter((entry) => entry.status === ClinicCaseProgressStatus.COMPLETED && entry.lastReportId)
        .map(async (entry) => {
          const report = entry.lastReportId
            ? await this.prisma.caseReport.findUnique({
                where: { id: entry.lastReportId },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  mark: true,
                  rating: true,
                  reviewedAt: true,
                  appointment: {
                    select: {
                      id: true,
                      patient: {
                        select: {
                          id: true,
                          name: true,
                          username: true,
                          phone: true,
                        },
                      },
                    },
                  },
                },
              })
            : null;
          return { progressId: entry.id, report };
        }),
    );

    const reportByProgressId = new Map(
      completedWithReports.map((entry) => [entry.progressId, entry.report]),
    );

    // Group rows by clinic for the doctor UI.
    const grouped = new Map<
      string,
      {
        clinic: { id: string; name: string };
        cases: Array<{
          progressId: string;
          status: ClinicCaseProgressStatus;
          completedAt: Date | null;
          case: {
            id: string;
            title: string;
            description: string | null;
            requiredCount: number;
            semester: { id: string; label: string };
          };
          report: Awaited<ReturnType<typeof this.prisma.caseReport.findUnique>> | null;
        }>;
      }
    >();
    for (const entry of progress) {
      const clinicId = entry.clinicCase.clinic.id;
      if (!grouped.has(clinicId)) {
        grouped.set(clinicId, {
          clinic: entry.clinicCase.clinic,
          cases: [],
        });
      }
      grouped.get(clinicId)!.cases.push({
        progressId: entry.id,
        status: entry.status,
        completedAt: entry.completedAt,
        case: {
          id: entry.clinicCase.id,
          title: entry.clinicCase.title,
          description: entry.clinicCase.description,
          requiredCount: entry.clinicCase.requiredCount,
          semester: entry.clinicCase.semester,
        },
        report: reportByProgressId.get(entry.id) ?? null,
      });
    }

    const summary = {
      total: progress.length,
      completed: progress.filter((p) => p.status === ClinicCaseProgressStatus.COMPLETED).length,
      assisted: progress.filter((p) => p.status === ClinicCaseProgressStatus.ASSISTED).length,
      open: progress.filter((p) => p.status === ClinicCaseProgressStatus.OPEN).length,
    };

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        semesterId: doctor.semesterId,
      },
      summary,
      groups: Array.from(grouped.values()),
    };
  }
}
