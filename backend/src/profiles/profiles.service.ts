import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  AppointmentRatingKind,
  ConversationRoomAudience,
  DoctorStatus,
  ReportReviewStatus,
  Role,
  SupervisorStatus,
  UserProfileReportStatus,
} from "@prisma/client";
import { PrismaService } from "../prisma.service";

type PublicViewer =
  | {
      id: string;
      name: string;
      role: Role;
      supervisorStatus: SupervisorStatus;
      doctorStatus: DoctorStatus;
      blocked: boolean;
      blockedUntil: Date | null;
    }
  | null;

type LeaderboardSemester = {
  id: string;
  label: string;
  sortOrder: number;
  endsOn: Date | null;
};

type LeaderboardDoctor = {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  doctorIdNumber?: string | null;
  semesterId?: string | null;
  semester?: LeaderboardSemester | null;
};

type LeaderboardEntryBase = {
  doctor: LeaderboardDoctor;
  completedCount: number;
  assistedCount: number;
  patientRatingPoints: number;
  supervisorRatingPoints: number;
  quizPoints: number;
};

const QUIZ_POINTS_CAP = 30;

type LeaderboardBoard = {
  key: string;
  label: string;
  semester: LeaderboardSemester | null;
  entries: Array<
    LeaderboardEntryBase & {
      rank: number;
      points: number;
    }
  >;
};

@Injectable()
export class ProfilesService {
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

  private async requireViewer(identifier: string): Promise<Exclude<PublicViewer, null>> {
    const user = await this.findUserByIdentifier(identifier);
    if (user.blocked || (user.blockedUntil && user.blockedUntil > new Date())) {
      throw new UnauthorizedException("Your account is blocked.");
    }
    if (user.role === Role.DOCTOR && user.doctorStatus !== DoctorStatus.APPROVED) {
      throw new UnauthorizedException("Doctor account is not approved.");
    }
    if (
      user.role === Role.SUPERVISOR &&
      user.supervisorStatus !== SupervisorStatus.APPROVED
    ) {
      throw new UnauthorizedException("Supervisor account is not approved.");
    }
    return user;
  }

  private async resolveViewer(identifier?: string): Promise<PublicViewer> {
    if (!identifier?.trim()) return null;
    return this.requireViewer(identifier);
  }

  private ensureProfileVisibility(viewer: PublicViewer, target: { id: string; role: Role }) {
    if (!viewer) {
      throw new UnauthorizedException("Viewer identifier is required.");
    }
    if (viewer.id === target.id) return;
    if (viewer.role === Role.PATIENT) {
      if (target.role !== Role.DOCTOR) {
        throw new ForbiddenException("Patients can only view doctor profiles.");
      }
      return;
    }
    if (viewer.role === Role.ADMIN || viewer.role === Role.SUPERVISOR || viewer.role === Role.DOCTOR) {
      return;
    }
    throw new ForbiddenException("You are not allowed to view this profile.");
  }

  private canReportUser(
    viewer: Exclude<PublicViewer, null>,
    target: { id: string; role: Role },
  ) {
    if (viewer.id === target.id) return false;
    if (target.role === Role.ADMIN) return false;
    if (viewer.role === Role.PATIENT) return target.role === Role.DOCTOR;
    return target.role === Role.DOCTOR || target.role === Role.PATIENT;
  }

  private async requireStaff(identifier: string) {
    const user = await this.requireViewer(identifier);
    if (user.role !== Role.ADMIN && user.role !== Role.SUPERVISOR) {
      throw new ForbiddenException("Only staff can review user reports.");
    }
    return user;
  }

  async getLeaderboard() {
    const now = new Date();

    const [semesters, doctors, reviewedReports, activeRatings, quizAttempts] = await Promise.all([
      this.prisma.semester.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
        select: {
          id: true,
          label: true,
          sortOrder: true,
          endsOn: true,
        },
      }),
      this.prisma.user.findMany({
        where: {
          role: Role.DOCTOR,
          doctorStatus: DoctorStatus.APPROVED,
          blocked: false,
          OR: [{ blockedUntil: null }, { blockedUntil: { lte: now } }],
        },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          doctorIdNumber: true,
          semesterId: true,
          semester: {
            select: {
              id: true,
              label: true,
              sortOrder: true,
              endsOn: true,
            },
          },
        },
      }),
      this.prisma.caseReport.findMany({
        where: {
          status: ReportReviewStatus.REVIEWED,
        },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              doctorIdNumber: true,
              semesterId: true,
              semester: {
                select: {
                  id: true,
                  label: true,
                  sortOrder: true,
                  endsOn: true,
                },
              },
            },
          },
          partnerDoctor: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              doctorIdNumber: true,
              semesterId: true,
              semester: {
                select: {
                  id: true,
                  label: true,
                  sortOrder: true,
                  endsOn: true,
                },
              },
            },
          },
          appointment: {
            select: {
              id: true,
              clinicCase: {
                select: {
                  semesterId: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.appointmentRating.findMany({
        where: {
          active: true,
          kind: {
            in: [
              AppointmentRatingKind.PATIENT_TO_DOCTOR,
              AppointmentRatingKind.SUPERVISOR_TO_DOCTOR,
            ],
          },
        },
        include: {
          target: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              doctorIdNumber: true,
              role: true,
              semesterId: true,
              semester: {
                select: {
                  id: true,
                  label: true,
                  sortOrder: true,
                  endsOn: true,
                },
              },
            },
          },
          appointment: {
            select: {
              clinicCase: {
                select: {
                  semesterId: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.quizAttempt.findMany({
        select: {
          doctorId: true,
          score: true,
          total: true,
        },
      }),
    ]);

    const quizPointsByDoctor = new Map<string, number>();
    quizAttempts.forEach((attempt) => {
      if (!attempt.total || attempt.total <= 0) return;
      const ratio = attempt.score / attempt.total;
      const points = Math.max(0, ratio) * 3;
      const current = quizPointsByDoctor.get(attempt.doctorId) ?? 0;
      quizPointsByDoctor.set(
        attempt.doctorId,
        Math.min(QUIZ_POINTS_CAP, current + points),
      );
    });

    const doctorsById = new Map<string, LeaderboardDoctor>(
      doctors.map((doctor) => [
        doctor.id,
        {
          id: doctor.id,
          name: doctor.name,
          username: doctor.username,
          avatar: doctor.avatar,
          doctorIdNumber: doctor.doctorIdNumber,
          semesterId: doctor.semesterId,
          semester: doctor.semester
            ? {
                id: doctor.semester.id,
                label: doctor.semester.label,
                sortOrder: doctor.semester.sortOrder,
                endsOn: doctor.semester.endsOn,
              }
            : null,
        },
      ]),
    );

    const buildBoard = (
      key: string,
      label: string,
      semester: LeaderboardSemester | null,
      includeDoctor: (doctor: LeaderboardDoctor) => boolean,
      includeSemesterCase: (semesterId?: string | null) => boolean,
    ): LeaderboardBoard => {
      const board = new Map<string, LeaderboardEntryBase>();

      const ensureEntry = (doctorId: string, fallback?: LeaderboardDoctor | null) => {
        const doctor = doctorsById.get(doctorId) || fallback || null;
        if (!doctor || !includeDoctor(doctor)) return null;
        const existing = board.get(doctor.id);
        if (existing) return existing;
        const next: LeaderboardEntryBase = {
          doctor,
          completedCount: 0,
          assistedCount: 0,
          patientRatingPoints: 0,
          supervisorRatingPoints: 0,
          quizPoints: quizPointsByDoctor.get(doctor.id) ?? 0,
        };
        board.set(doctor.id, next);
        return next;
      };

      doctorsById.forEach((doctor) => {
        if (includeDoctor(doctor)) {
          ensureEntry(doctor.id, doctor);
        }
      });

      reviewedReports.forEach((report) => {
        const reportSemesterId = report.appointment.clinicCase?.semesterId;
        if (!includeSemesterCase(reportSemesterId)) return;

        const primary = ensureEntry(report.doctor.id, {
          id: report.doctor.id,
          name: report.doctor.name,
          username: report.doctor.username,
          avatar: report.doctor.avatar,
          doctorIdNumber: report.doctor.doctorIdNumber,
          semesterId: report.doctor.semesterId,
          semester: report.doctor.semester
            ? {
                id: report.doctor.semester.id,
                label: report.doctor.semester.label,
                sortOrder: report.doctor.semester.sortOrder,
                endsOn: report.doctor.semester.endsOn,
              }
            : null,
        });
        if (primary) {
          primary.completedCount += 1;
        }

        if (report.partnerDoctor) {
          const assistant = ensureEntry(report.partnerDoctor.id, {
            id: report.partnerDoctor.id,
            name: report.partnerDoctor.name,
            username: report.partnerDoctor.username,
            avatar: report.partnerDoctor.avatar,
            doctorIdNumber: report.partnerDoctor.doctorIdNumber,
            semesterId: report.partnerDoctor.semesterId,
            semester: report.partnerDoctor.semester
              ? {
                  id: report.partnerDoctor.semester.id,
                  label: report.partnerDoctor.semester.label,
                  sortOrder: report.partnerDoctor.semester.sortOrder,
                  endsOn: report.partnerDoctor.semester.endsOn,
                }
              : null,
          });
          if (assistant) {
            assistant.assistedCount += 1;
          }
        }
      });

      activeRatings.forEach((rating) => {
        if (rating.target.role !== Role.DOCTOR) return;
        const ratingSemesterId = rating.appointment.clinicCase?.semesterId;
        if (!includeSemesterCase(ratingSemesterId)) return;

        const entry = ensureEntry(rating.target.id, {
          id: rating.target.id,
          name: rating.target.name,
          username: rating.target.username,
          avatar: rating.target.avatar,
          doctorIdNumber: rating.target.doctorIdNumber,
          semesterId: rating.target.semesterId,
          semester: rating.target.semester
            ? {
                id: rating.target.semester.id,
                label: rating.target.semester.label,
                sortOrder: rating.target.semester.sortOrder,
                endsOn: rating.target.semester.endsOn,
              }
            : null,
        });
        if (!entry) return;

        if (rating.kind === AppointmentRatingKind.PATIENT_TO_DOCTOR) {
          entry.patientRatingPoints += rating.stars * 0.5;
        }
        if (rating.kind === AppointmentRatingKind.SUPERVISOR_TO_DOCTOR) {
          entry.supervisorRatingPoints += rating.stars * 1;
        }
      });

      const entries = Array.from(board.values())
        .map((entry) => {
          const points =
            entry.completedCount * 5 +
            entry.assistedCount * 2 +
            entry.patientRatingPoints +
            entry.supervisorRatingPoints +
            entry.quizPoints;
          return {
            ...entry,
            quizPoints: Number(entry.quizPoints.toFixed(2)),
            points: Number(points.toFixed(2)),
          };
        })
        .sort((left, right) => {
          if (right.points !== left.points) return right.points - left.points;
          if (right.completedCount !== left.completedCount) {
            return right.completedCount - left.completedCount;
          }
          if (right.assistedCount !== left.assistedCount) {
            return right.assistedCount - left.assistedCount;
          }
          return left.doctor.name.localeCompare(right.doctor.name);
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return {
        key,
        label,
        semester,
        entries,
      };
    };

    const overall = buildBoard(
      "overall",
      "Overall ranking",
      null,
      () => true,
      () => true,
    );

    const semesterBoards = semesters.map((semester) =>
      buildBoard(
        semester.id,
        semester.label,
        semester,
        (doctor) => doctor.semesterId === semester.id,
        (semesterId) => semesterId === semester.id,
      ),
    );

    return {
      generatedAt: new Date(),
      overall,
      semesters: semesterBoards,
    };
  }

  async getPublicProfile(targetIdentifier: string, viewerIdentifier?: string) {
    const viewer = await this.resolveViewer(viewerIdentifier);
    const target = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: targetIdentifier },
          { username: targetIdentifier },
          { doctorIdNumber: targetIdentifier },
        ],
      },
      include: {
        semester: {
          select: {
            id: true,
            label: true,
            sortOrder: true,
            endsOn: true,
          },
        },
        groupMembership: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                semesterLabel: true,
                partnerPairs: {
                  include: {
                    doctorOne: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                      },
                    },
                    doctorTwo: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        clinicLinks: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!target) throw new NotFoundException("Profile not found.");
    this.ensureProfileVisibility(viewer, target);

    const leaderboard = target.role === Role.DOCTOR ? await this.getLeaderboard() : null;

    const [recentRatings, doctorReports, assistedReports, patientAppointments, recentReviews] =
      await Promise.all([
        this.prisma.appointmentRating.findMany({
          where: {
            targetId: target.id,
            active: true,
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            rater: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
            appointment: {
              select: {
                id: true,
                clinicCase: {
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
                completedAt: true,
              },
            },
          },
        }),
        target.role === Role.DOCTOR
          ? this.prisma.caseReport.findMany({
              where: {
                doctorId: target.id,
                status: ReportReviewStatus.REVIEWED,
              },
              orderBy: { reviewedAt: "desc" },
              take: 16,
              include: {
                appointment: {
                  select: {
                    id: true,
                    completedAt: true,
                    clinicCase: {
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
            })
          : [],
        target.role === Role.DOCTOR
          ? this.prisma.caseReport.findMany({
              where: {
                partnerDoctorId: target.id,
                status: ReportReviewStatus.REVIEWED,
              },
              orderBy: { reviewedAt: "desc" },
              take: 10,
              include: {
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                  },
                },
                appointment: {
                  select: {
                    id: true,
                    completedAt: true,
                    clinicCase: {
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
            })
          : [],
        target.role === Role.PATIENT && viewer && viewer.role !== Role.PATIENT
          ? this.prisma.appointment.findMany({
              where: {
                patientId: target.id,
              },
              orderBy: { createdAt: "desc" },
              take: 14,
              include: {
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                  },
                },
                clinicCase: {
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
                ratings: {
                  where: {
                    active: true,
                    kind: AppointmentRatingKind.DOCTOR_TO_PATIENT,
                  },
                  select: {
                    stars: true,
                    comment: true,
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
            })
          : [],
        target.role === Role.SUPERVISOR
          ? this.prisma.caseReport.findMany({
              where: {
                reviewerSupervisorId: target.id,
              },
              orderBy: { reviewedAt: "desc" },
              take: 12,
              include: {
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true,
                  },
                },
                appointment: {
                  select: {
                    id: true,
                    clinicCase: {
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
            })
          : [],
      ]);

    const patientRatings = recentRatings.filter(
      (item) => item.kind === AppointmentRatingKind.PATIENT_TO_DOCTOR,
    );
    const supervisorRatings = recentRatings.filter(
      (item) => item.kind === AppointmentRatingKind.SUPERVISOR_TO_DOCTOR,
    );
    const staffRatings = recentRatings.filter(
      (item) => item.kind === AppointmentRatingKind.DOCTOR_TO_PATIENT,
    );

    const averageStars = (items: Array<{ stars: number }>) =>
      items.length
        ? Number(
            (
              items.reduce((total, item) => total + item.stars, 0) / items.length
            ).toFixed(2),
          )
        : null;

    const overallRank =
      target.role === Role.DOCTOR
        ? leaderboard?.overall.entries.find((entry) => entry.doctor.id === target.id) || null
        : null;
    const semesterBoard =
      target.role === Role.DOCTOR && target.semesterId
        ? leaderboard?.semesters.find((entry) => entry.semester?.id === target.semesterId) || null
        : null;
    const semesterRank =
      target.role === Role.DOCTOR
        ? semesterBoard?.entries.find((entry) => entry.doctor.id === target.id) || null
        : null;

    const partner =
      target.role === Role.DOCTOR && target.groupMembership?.group
        ? target.groupMembership.group.partnerPairs.find(
            (pair) => pair.doctorOne.id === target.id || pair.doctorTwo.id === target.id,
          )
        : null;

    const clinicsWorked =
      target.role === Role.DOCTOR
        ? Array.from(
            new Map(
              doctorReports
                .map((report) => report.appointment?.clinicCase?.clinic)
                .filter(Boolean)
                .map((clinic) => [clinic!.id, clinic]),
            ).values(),
          )
        : target.role === Role.SUPERVISOR
          ? target.clinicLinks.map((link) => link.clinic)
          : [];

    return {
      profile: {
        id: target.id,
        name: target.name,
        username: target.username,
        email: target.email,
        phone: target.phone,
        avatar: target.avatar,
        bio: target.bio,
        role: target.role,
        doctorIdNumber: target.doctorIdNumber,
        semester: target.semester,
        groupMembership: target.groupMembership
          ? {
              id: target.groupMembership.group.id,
              name: target.groupMembership.group.name,
              semesterLabel: target.groupMembership.group.semesterLabel,
            }
          : null,
        clinicsWorked,
        partner:
          partner && target.role === Role.DOCTOR
            ? partner.doctorOne.id === target.id
              ? partner.doctorTwo
              : partner.doctorOne
            : null,
        canReport: viewer ? this.canReportUser(viewer, target) : false,
      },
      stats: {
        patientRatingAverage: averageStars(patientRatings),
        supervisorRatingAverage: averageStars(supervisorRatings),
        patientCount: patientRatings.length,
        supervisorCount: supervisorRatings.length,
        completedCases: doctorReports.length,
        assistedCases: assistedReports.length,
        leaderboard: overallRank
          ? {
              rank: overallRank.rank,
              points: overallRank.points,
              completedCount: overallRank.completedCount,
              assistedCount: overallRank.assistedCount,
              patientRatingPoints: Number(
                overallRank.patientRatingPoints.toFixed(2),
              ),
              supervisorRatingPoints: Number(
                overallRank.supervisorRatingPoints.toFixed(2),
              ),
              quizPoints: Number(overallRank.quizPoints.toFixed(2)),
              semesterRank: semesterRank?.rank ?? null,
              semesterPoints:
                typeof semesterRank?.points === "number"
                  ? Number(semesterRank.points.toFixed(2))
                  : null,
              semester: semesterBoard?.semester
                ? {
                    id: semesterBoard.semester.id,
                    label: semesterBoard.semester.label,
                  }
                : null,
            }
          : null,
        reviewedReports: recentReviews.length,
        doctorRatings: averageStars(staffRatings),
      },
      comments: {
        patient: patientRatings
          .filter((item) => item.comment?.trim())
          .map((item) => ({
            id: item.id,
            stars: item.stars,
            comment: item.comment,
            createdAt: item.createdAt,
            rater: item.rater,
            clinicCase: item.appointment.clinicCase,
          })),
        supervisor: supervisorRatings
          .filter((item) => item.comment?.trim())
          .map((item) => ({
            id: item.id,
            stars: item.stars,
            comment: item.comment,
            createdAt: item.createdAt,
            rater: item.rater,
            clinicCase: item.appointment.clinicCase,
          })),
        staff: staffRatings
          .filter((item) => item.comment?.trim())
          .map((item) => ({
            id: item.id,
            stars: item.stars,
            comment: item.comment,
            createdAt: item.createdAt,
            rater: item.rater,
          })),
      },
      history: {
        completedReports: doctorReports.map((report) => ({
          id: report.id,
          title: report.title,
          reviewedAt: report.reviewedAt,
          clinicCase: report.appointment?.clinicCase,
        })),
        assistedReports: assistedReports.map((report) => ({
          id: report.id,
          title: report.title,
          reviewedAt: report.reviewedAt,
          doctor: report.doctor,
          clinicCase: report.appointment?.clinicCase,
        })),
        patientAppointments: patientAppointments.map((appointment) => ({
          id: appointment.id,
          status: appointment.status,
          completedAt: appointment.completedAt,
          doctor: appointment.doctor,
          clinicCase: appointment.clinicCase,
          doctorRatings: appointment.ratings,
        })),
        recentReviews: recentReviews.map((report) => ({
          id: report.id,
          title: report.title,
          status: report.status,
          reviewedAt: report.reviewedAt,
          doctor: report.doctor,
          clinicCase: report.appointment?.clinicCase,
        })),
      },
    };
  }

  async reportUser(
    targetIdentifier: string,
    reporterIdentifier: string,
    reason: string,
    note?: string,
  ) {
    const reporter = await this.requireViewer(reporterIdentifier);
    const target = await this.findUserByIdentifier(targetIdentifier);
    if (!this.canReportUser(reporter, target)) {
      throw new ForbiddenException("You cannot report this user.");
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      throw new BadRequestException("Reason is required.");
    }

    const report = await this.prisma.userProfileReport.create({
      data: {
        reporterId: reporter.id,
        reportedUserId: target.id,
        reason: trimmedReason,
        note: note?.trim() || null,
      },
      include: {
        reportedUser: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    const reviewerRole = reporter.role === Role.PATIENT ? "supervisors and admins" : "admins and supervisors";
    const reviewers = await this.prisma.user.findMany({
      where: {
        OR: [
          { role: Role.ADMIN },
          {
            role: Role.SUPERVISOR,
            supervisorStatus: SupervisorStatus.APPROVED,
          },
        ],
      },
      select: { id: true },
    });
    if (reviewers.length > 0) {
      await this.prisma.notification.createMany({
        data: reviewers.map((reviewer) => ({
          title: "New user report",
          body: `${reporter.name} reported ${target.name}. Review needed by ${reviewerRole}.`,
          recipientId: reviewer.id,
        })),
      });
    }

    return {
      message: "User report submitted.",
      report,
    };
  }

  async listUserReports(identifier: string) {
    await this.requireStaff(identifier);
    return this.prisma.userProfileReport.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            avatar: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            avatar: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });
  }

  async decideUserReport(
    reportId: string,
    reviewerIdentifier: string,
    status: UserProfileReportStatus,
    resolutionNote?: string,
  ) {
    if (status === UserProfileReportStatus.PENDING) {
      throw new BadRequestException("Pending is not a valid final decision.");
    }
    const reviewer = await this.requireStaff(reviewerIdentifier);
    const report = await this.prisma.userProfileReport.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            blocked: true,
          },
        },
      },
    });
    if (!report) {
      throw new NotFoundException("User report not found.");
    }

    const decisionNote = resolutionNote?.trim() || null;

    await this.prisma.$transaction(async (tx) => {
      await tx.userProfileReport.update({
        where: { id: reportId },
        data: {
          reviewerId: reviewer.id,
          status,
          resolutionNote: decisionNote,
          reviewedAt: new Date(),
        },
      });

      if (status === UserProfileReportStatus.ACTION_TAKEN) {
        await tx.notification.create({
          data: {
            title: "Action taken on a user report",
            body: decisionNote || "A staff member reviewed your report and took action.",
            recipientId: report.reporter.id,
          },
        });
      } else {
        await tx.notification.create({
          data: {
            title: "User report reviewed",
            body: decisionNote || `Your report about ${report.reportedUser.name} was reviewed.`,
            recipientId: report.reporter.id,
          },
        });
      }
    });

    return { message: "User report decision saved." };
  }
}
