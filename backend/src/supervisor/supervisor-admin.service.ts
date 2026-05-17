import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DoctorStatus, Role, SlotStatus, SupervisorStatus } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { SupervisorBaseService } from "./supervisor-base.service";

@Injectable()
export class SupervisorAdminService extends SupervisorBaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async listPending(adminId: string) {
    await this.requireAdmin(adminId);
    return this.prisma.supervisorRequest.findMany({
      where: { status: SupervisorStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: { applicant: true },
    });
  }

  async listUsers(adminId: string) {
    await this.requireAdmin(adminId);
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        doctorIdNumber: true,
        role: true,
        supervisorStatus: true,
        doctorStatus: true,
        blocked: true,
        blockedUntil: true,
        blockReason: true,
        createdAt: true,
        groupMembership: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                semesterLabel: true,
              },
            },
          },
        },
      },
    });
  }

  async setBlocked(
    id: string,
    blocked: boolean,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    await this.prisma.user.update({ where: { id }, data: { blocked } });
    return { message: blocked ? "User blocked" : "User unblocked" };
  }

  async deleteUser(id: string, adminId: string) {
    await this.requireAdmin(adminId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { recipientId: id } });
      await tx.supervisorRequest.deleteMany({
        where: { OR: [{ applicantId: id }, { reviewerId: id }] },
      });
      await tx.doctorRequest.deleteMany({
        where: { OR: [{ applicantId: id }, { reviewerId: id }] },
      });
      await tx.groupJoinRequest.deleteMany({
        where: { OR: [{ applicantId: id }, { reviewerId: id }] },
      });
      await tx.userProfileReport.deleteMany({
        where: {
          OR: [
            { reporterId: id },
            { reportedUserId: id },
            { reviewerId: id },
          ],
        },
      });
      await tx.partnerRequest.deleteMany({
        where: { OR: [{ senderId: id }, { receiverId: id }] },
      });
      await tx.partnerPair.deleteMany({
        where: { OR: [{ doctorOneId: id }, { doctorTwoId: id }] },
      });
      await tx.groupPost.deleteMany({ where: { authorId: id } });
      await tx.doctorGroupSupervisor.deleteMany({ where: { supervisorId: id } });
      await tx.doctorGroupMember.deleteMany({ where: { doctorId: id } });
      await tx.supervisionAssignment.deleteMany({
        where: { OR: [{ supervisorId: id }, { doctorId: id }] },
      });
      await tx.supervisorTask.deleteMany({
        where: { OR: [{ supervisorId: id }, { doctorId: id }] },
      });
      await tx.doctorFreeze.deleteMany({
        where: { OR: [{ supervisorId: id }, { doctorId: id }] },
      });
      await tx.clinicSupervisorAssignment.deleteMany({
        where: { supervisorId: id },
      });
      await tx.clinicSupervisorLink.deleteMany({
        where: { supervisorId: id },
      });
      await tx.clinicExam.deleteMany({
        where: { OR: [{ studentId: id }, { supervisorId: id }] },
      });
      await tx.doctorClinicTaskProgress.deleteMany({
        where: { doctorId: id },
      });
      await tx.caseReport.updateMany({
        where: { reviewerSupervisorId: id },
        data: { reviewerSupervisorId: null },
      });
      await tx.caseReport.updateMany({
        where: { partnerDoctorId: id },
        data: { partnerDoctorId: null },
      });
      await tx.message.deleteMany({ where: { senderId: id } });
      await tx.conversationParticipant.deleteMany({ where: { userId: id } });
      await tx.doctorGroup.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      });
      await tx.rotationPlan.updateMany({
        where: { createdById: id },
        data: { createdById: null },
      });

      const appointments = await tx.appointment.findMany({
        where: { OR: [{ doctorId: id }, { patientId: id }] },
        select: { id: true, slotId: true },
      });
      const appointmentIds = appointments.map((appt) => appt.id);
      const slotIds = appointments.map((appt) => appt.slotId);
      const directReportIds = (
        await tx.caseReport.findMany({
          where: {
            OR: [
              { doctorId: id },
              appointmentIds.length > 0
                ? { appointmentId: { in: appointmentIds } }
                : { id: "__never__" },
            ],
          },
          select: { id: true },
        })
      ).map((report) => report.id);

      if (directReportIds.length > 0) {
        await tx.caseReportTask.deleteMany({
          where: { reportId: { in: directReportIds } },
        });
        await tx.doctorClinicTaskProgress.updateMany({
          where: { lastReportId: { in: directReportIds } },
          data: { lastReportId: null },
        });
        await tx.caseReport.deleteMany({
          where: { id: { in: directReportIds } },
        });
      }

      if (appointmentIds.length > 0) {
        await tx.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
        if (user.role === Role.PATIENT && slotIds.length > 0) {
          await tx.availabilitySlot.updateMany({
            where: { id: { in: slotIds } },
            data: { status: SlotStatus.OPEN },
          });
        }
      }

      if (user.role === Role.DOCTOR) {
        await tx.availabilitySlot.deleteMany({ where: { doctorId: id } });
      }

      await tx.user.delete({ where: { id } });
    });
    return { message: "User deleted" };
  }

  async reapproveSupervisor(
    id: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    if (user.role !== Role.SUPERVISOR) {
      throw new ForbiddenException("Only supervisors can be re-approved.");
    }
    if (
      user.supervisorStatus !== SupervisorStatus.REJECTED &&
      user.supervisorStatus !== SupervisorStatus.PENDING
    ) {
      throw new ForbiddenException(
        "Only pending or rejected supervisors can be re-approved.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { supervisorStatus: SupervisorStatus.APPROVED },
      }),
      this.prisma.notification.create({
        data: {
          title: "Supervisor access approved",
          body: "Your supervisor access was approved by the admin.",
          recipientId: id,
        },
      }),
    ]);

    return { message: "Supervisor re-approved." };
  }

  async reapproveDoctor(
    id: string,
    adminId: string,
  ) {
    await this.requireAdmin(adminId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found.");
    if (user.role !== Role.DOCTOR) {
      throw new ForbiddenException("Only doctors can be re-approved.");
    }
    if (
      user.doctorStatus !== DoctorStatus.REJECTED &&
      user.doctorStatus !== DoctorStatus.PENDING
    ) {
      throw new ForbiddenException(
        "Only pending or rejected doctors can be re-approved.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { doctorStatus: DoctorStatus.APPROVED },
      }),
      this.prisma.notification.create({
        data: {
          title: "Doctor access approved",
          body: "Your doctor access was approved by the admin.",
          recipientId: id,
        },
      }),
    ]);

    return { message: "Doctor re-approved." };
  }

  async listDoctorPending(adminId: string) {
    await this.requireAdmin(adminId);
    return this.prisma.doctorRequest.findMany({
      where: { status: DoctorStatus.PENDING },
      orderBy: { createdAt: "asc" },
      include: { applicant: true },
    });
  }

  async decideDoctor(
    id: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    const admin = await this.requireAdmin(adminId);
    const request = await this.prisma.doctorRequest.findUnique({
      where: { id },
      include: { applicant: true },
    });
    if (!request) throw new NotFoundException("Request not found.");
    if (request.status !== DoctorStatus.PENDING) {
      throw new ForbiddenException("Request already processed.");
    }
    const newStatus = approve ? DoctorStatus.APPROVED : DoctorStatus.REJECTED;
    await this.prisma.$transaction([
      this.prisma.doctorRequest.update({
        where: { id },
        data: {
          status: newStatus,
          note: note ?? null,
          reviewerId: admin.id,
          decidedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: request.applicantId },
        data: { doctorStatus: newStatus },
      }),
      this.prisma.notification.create({
        data: {
          title: approve
            ? "Doctor request approved"
            : "Doctor request rejected",
          body: approve
            ? "You can now sign in as a doctor."
            : note ?? "Your doctor request was rejected.",
          recipientId: request.applicantId,
        },
      }),
    ]);
    return { message: approve ? "Approved" : "Rejected" };
  }

  async decide(
    id: string,
    approve: boolean,
    note: string | undefined,
    adminId: string,
  ) {
    const admin = await this.requireAdmin(adminId);
    const request = await this.prisma.supervisorRequest.findUnique({
      where: { id },
      include: { applicant: true },
    });
    if (!request) throw new NotFoundException("Request not found.");
    if (request.status !== SupervisorStatus.PENDING) {
      throw new ForbiddenException("Request already processed.");
    }

    const newStatus = approve
      ? SupervisorStatus.APPROVED
      : SupervisorStatus.REJECTED;
    await this.prisma.$transaction([
      this.prisma.supervisorRequest.update({
        where: { id },
        data: {
          status: newStatus,
          note: note ?? null,
          reviewerId: admin.id,
          decidedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: request.applicantId },
        data: { supervisorStatus: newStatus },
      }),
      this.prisma.notification.create({
        data: {
          title: approve
            ? "Supervisor request approved"
            : "Supervisor request rejected",
          body: approve
            ? "You can now sign in as a supervisor."
            : note ?? "Your supervisor request was rejected.",
          recipientId: request.applicantId,
        },
      }),
    ]);

    return { message: approve ? "Approved" : "Rejected" };
  }
}
